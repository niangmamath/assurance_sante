const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const Lead = require('../models/Lead');
const delaisPath = path.join(__dirname, '../config/delais.json');

// In-memory fallback
let memoryLeads = [];

const router = express.Router();

// Middleware memory
router.use((req, res, next) => {
  req.memoryLeads = memoryLeads;
  next();
});

// GET /api/leads
router.get('/', async (req, res) => {
  try {
    let dbLeads = [];
    try {
      dbLeads = await Lead.find().sort({ timestamp: -1 }).lean();
    } catch (e) {
      console.log('DB read fail, using memory');
    }
    const allLeads = [...dbLeads, ...req.memoryLeads].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    res.json(allLeads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/leads
router.post('/', async (req, res) => {
  try {
    const leadData = {
      nom: req.body.nom,
      email: req.body.email,
      telephone: req.body.telephone,
      type_besoin: req.body.type_besoin,
      message: req.body.message,
      timestamp: new Date(),
      statut: 'nouveau',
      derniere_relance: null,
      nb_relances: 0,
      historique_relances: []
    };

    let lead;
    try {
      lead = new Lead(leadData);
      await lead.save();
    } catch (e) {
      leadData._id = 'mem_' + Date.now();
      lead = leadData;
      req.memoryLeads.unshift(lead);
      console.log('Memory lead:', lead._id);
    }

    req.io.emit('new_lead', lead);
    res.json({ message: 'Lead created', lead });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/leads/:id - Update statut
router.put('/:id', async (req, res) => {
  try {
    const { statut } = req.body;
    if (!['nouveau', 'contacte', 'en_discussion', 'converti', 'perdu'].includes(statut)) {
      return res.status(400).json({ error: 'Invalid statut' });
    }
    let lead;
    try {
      lead = await Lead.findByIdAndUpdate(req.params.id, { statut }, { new: true });
    } catch (e) {
      lead = req.memoryLeads.find(l => l._id === req.params.id);
      if (lead) {
        lead.statut = statut;
      }
    }
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    req.io.emit('lead_updated', lead);
    res.json({ lead });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/config/delais
router.get('/config/delais', async (req, res) => {
  try {
    const data = await fs.readFile(delaisPath, 'utf8');
    const delais = JSON.parse(data);
    res.json(delais);
  } catch (error) {
    const defaultDelais = { nouveau: 24, contacte: 48, 'en_discussion': 72, perdu: 168 };
    res.json(defaultDelais);
  }
});

// PUT /api/config/delais
router.put('/config/delais', async (req, res) => {
  try {
    await fs.writeFile(delaisPath, JSON.stringify(req.body, null, 2));
    res.json({ message: 'Delais saved' });
  } catch (error) {
    res.status(500).json({ error: 'Save failed' });
  }
});

// POST /api/leads/:id/relance
router.post('/:id/relance', async (req, res) => {
  try {
    let lead;
    try {
      lead = await Lead.findById(req.params.id);
      if (lead) {
        lead.derniere_relance = new Date();
        lead.nb_relances += 1;
        lead.historique_relances.push({
          date: new Date(),
          statut: lead.statut,
          template_used: `relance_${lead.statut}`
        });
        await lead.save();
      }
    } catch (e) {
      lead = req.memoryLeads.find(l => l._id === req.params.id);
      if (lead) {
        lead.derniere_relance = new Date();
        lead.nb_relances += 1;
        lead.historique_relances.push({
          date: new Date(),
          statut: lead.statut,
          template_used: `relance_${lead.statut}`
        });
      }
    }

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // n8n webhook stub
    const n8nUrl = process.env.N8N_WEBHOOK_BASE_URL ? `${process.env.N8N_WEBHOOK_BASE_URL}relance-${lead.statut}` : null;
    if (n8nUrl) {
      console.log('n8n:', n8nUrl);
    }

    req.io.emit('lead_updated', lead);
    res.json({ message: 'Relance OK' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

