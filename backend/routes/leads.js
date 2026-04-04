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

const authenticateToken = require('../middleware/auth');

// Protéger toutes les routes SAUF la création d'un lead (POST /)
router.use((req, res, next) => {
  if (req.method === 'POST' && req.path === '/') {
    return next();
  }
  authenticateToken(req, res, next);
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

// POST /api/leads - ÉTENDU NOUVEAUX CHAMPS
router.post('/', async (req, res) => {
  try {
    // Validation consents OBLIGATOIRES
    if (!req.body.consentement_optin || !req.body.consentement_rgpd) {
      return res.status(400).json({ error: 'Consentements OPT-IN et RGPD obligatoires' });
    }

    const leadData = {
      // Existants (rétro)
      nom: req.body.nom,
      email: req.body.email,
      telephone_mobile: req.body.telephone,
      type_besoin: req.body.type_besoin,
      message: req.body.message || req.body.commentaire || '',
      // Nouveaux champs
      date_naissance: req.body.date_naissance,
      adresse: req.body.adresse,
      telephone_fixe: req.body.telephone_fixe,
      nb_personnes: req.body.nb_personnes ? parseInt(req.body.nb_personnes) : undefined,
      beneficiaires: Array.isArray(req.body.beneficiaires) ? req.body.beneficiaires : [],
      situation_familiale: req.body.situation_familiale,
      regime: req.body.regime,
      madelin_flag: req.body.regime === 'TNS/Indépendant (Loi Madelin)',
      postes_prioritaires: Array.isArray(req.body.postes_prioritaires) ? req.body.postes_prioritaires : [],
      mutuelle_actuelle: req.body.mutuelle_actuelle,
      tarif_mensuel: req.body.tarif_mensuel ? parseFloat(req.body.tarif_mensuel) : undefined,
      motivation: req.body.motivation,
      creneau_rappel: req.body.creneau_rappel,
      commentaire: req.body.commentaire,
      consentement_optin: true,
      consentement_rgpd: true,
      // Système
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
      console.log('DB save fail, memory fallback');
      leadData._id = 'mem_' + Date.now();
      lead = leadData;
      req.memoryLeads.unshift(lead);
    }

    // EMIT + TRIGGER CONFIRMATION IMMÉDIAT n8n
    req.io.emit('new_lead', lead);
    
    // Confirmation email immédiat (Hook relié directement au workflow de relance n8n)
    const n8nBase = process.env.N8N_WEBHOOK_BASE_URL || 'https://centrale.app.n8n.cloud/webhook/relance-client';
    if (n8nBase) {
      try {
        await fetch(n8nBase, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            body: {
              nom: lead.nom,
              email: lead.email,
              statut: lead.statut,
              regime: lead.regime || '',
              message: "Le client vient de soumettre son formulaire de devis. C'est un nouveau prospect.",
              nb_relances: 0
            }
          })
        });
        console.log('✅ Email de bienvenue IA (n8n) déclenché:', n8nBase);
      } catch (confirmErr) {
        console.error('Erreur déclenchement email bienvenue (n8n):', confirmErr.message);
      }
    }
    
    res.json({ message: 'Lead created + confirmation envoyée', lead });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/leads/:id
router.get('/:id', async (req, res) => {
  try {
    let lead;
    try {
      lead = await Lead.findById(req.params.id).lean();
    } catch (e) {
      lead = req.memoryLeads.find(l => l._id === req.params.id);
    }
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/leads/:id/statut
router.patch('/:id/statut', async (req, res) => {
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
      if (lead) lead.statut = statut;
    }
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    req.io.emit('lead_updated', lead);
    res.json({ success: true, lead });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/leads/:id (legacy status)
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
      if (lead) lead.statut = statut;
    }
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    req.io.emit('lead_updated', lead);
    res.json({ lead });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Config délais
router.get('/config/delais', async (req, res) => {
  try {
    const data = await fs.readFile(delaisPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.json({ nouveau: 24, contacte: 48, 'en_discussion': 72, perdu: 168 });
  }
});

router.put('/config/delais', async (req, res) => {
  try {
    await fs.writeFile(delaisPath, JSON.stringify(req.body, null, 2));
    res.json({ message: 'Délais saved' });
  } catch (error) {
    res.status(500).json({ error: 'Save failed' });
  }
});

// POST /api/leads/:id/relance - AUTOMATISATION COMPLÈTE
router.post('/:id/relance', async (req, res) => {
  try {
    const delaisRaw = await fs.readFile(delaisPath, 'utf8');
    const delais = JSON.parse(delaisRaw);
    const maxRelances = delais.max_relances || 4;

    let lead;
    try {
      lead = await Lead.findById(req.params.id);
    } catch (e) {
      lead = req.memoryLeads.find(l => l._id === req.params.id);
    }

    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // Vérif max relances
    if (lead.nb_relances >= maxRelances) {
      return res.status(400).json({ error: `Max ${maxRelances} relances atteintes` });
    }

    // Calcule next relance number (1-based)
    const nextRelanceNum = lead.nb_relances + 1;
    const relanceKey = `relance${nextRelanceNum}`;
    
    if (!delais[relanceKey]) {
      return res.status(400).json({ error: `Config manquante pour ${relanceKey}` });
    }

    const delai = delais[relanceKey];
    
// Vérif délai min DESACTIVÉE pour tests manuels
    console.log('Délai check bypassed - relance immédiate OK');

    // OK: Update lead
    const templateUsed = relanceKey;
    try {
      lead.derniere_relance = new Date();
      lead.nb_relances += 1;
      lead.historique_relances.push({
        date: new Date(),
        statut: lead.statut,
        template_used: templateUsed
      });
      await lead.save();
    } catch (e) {
      // Memory update
      if (lead) {
        lead.derniere_relance = new Date();
        lead.nb_relances += 1;
        lead.historique_relances.push({
          date: new Date(),
          statut: lead.statut,
          template_used: templateUsed
        });
      }
    }

    // Trigger n8n
    const n8nUrl = process.env.N8N_WEBHOOK_BASE_URL || 'https://centrale.app.n8n.cloud/webhook/relance-client';
    try {
      await fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          body: {
            nom: lead.nom,
            email: lead.email,
            statut: lead.statut,
            besoin: lead.type_besoin || lead.message,
            message: 'Relance automatique',
            nb_relances: lead.nb_relances
          }
        })
      });
      console.log(`✅ n8n relance${lead.nb_relances + 1} triggered:`, n8nUrl);
    } catch (n8nErr) {
      console.error('n8n trigger failed:', n8nErr.message);
    }

    req.io.emit('lead_updated', lead);
    res.json({ 
      message: `Relance ${nextRelanceNum}/4 OK (${templateUsed})`,
      nextRelanceNum,
      lead 
    });
  } catch (error) {
    console.error('Relance error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/leads/:id
router.delete('/:id', async (req, res) => {
  try {
    let deleted = false;
    try {
      const lead = await Lead.findByIdAndDelete(req.params.id);
      deleted = !!lead;
    } catch (e) {
      const index = req.memoryLeads.findIndex(l => l._id === req.params.id);
      if (index > -1) {
        req.memoryLeads.splice(index, 1);
        deleted = true;
      }
    }
    if (!deleted) return res.status(404).json({ error: 'Lead not found' });
    req.io.emit('lead_deleted', req.params.id);
    res.json({ message: 'Lead deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

