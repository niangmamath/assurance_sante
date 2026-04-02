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
 
  message: {
    type: String,
    // Rétrocompatibilité : anciens leads l'exigent
  },
  // NOUVEAUX CHAMPS (optionnels sauf consents validés backend)
  date_naissance: {
    type: String
  },
  adresse: {
    type: String
  },
  telephone_fixe: {
    type: String
  },
  nb_personnes: {
    type: Number
  },
  beneficiaires: [String],
  situation_familiale: {
    type: String
  },
  regime: {
    type: String
  },
  madelin_flag: {
    type: Boolean,
    default: false
  },
  postes_prioritaires: [String],
  mutuelle_actuelle: {
    type: String
  },
  tarif_mensuel: {
    type: Number
  },
  motivation: {
    type: String
  },
  creneau_rappel: {
    type: String
  },
  commentaire: {
    type: String
  },
  consentement_optin: {
    type: Boolean,
    default: false
  },
  consentement_rgpd: {
    type: Boolean,
    default: false
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

