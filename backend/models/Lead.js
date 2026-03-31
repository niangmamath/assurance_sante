const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  telephone: {
    type: String,
    required: true
  },
  type_besoin: {
    type: String,
    required: true,
    enum: ['Assurance sante individuelle', 'Mutuelle familiale', 'Complementaire sante', 'Autre']
  },
  message: {
    type: String,
    required: true
  },
  statut: {
    type: String,
    enum: ['nouveau', 'contacte', 'en_discussion', 'converti', 'perdu'],
    default: 'nouveau'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  derniere_relance: {
    type: Date,
    default: null
  },
  nb_relances: {
    type: Number,
    default: 0
  },
  historique_relances: [{
    date: Date,
    statut: String,
    template_used: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Lead', leadSchema);

