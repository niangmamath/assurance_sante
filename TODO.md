# Implémentation Système Automatisation n8n - Relances Complètes

## Plan approuvé - Progression

### 1. ✅ Créer TODO.md (fait)

### 2. ✅ Mettre à jour backend/config/delais.json (fait)

### 3. ✅ Éditer backend/routes/leads.js
- ✅ POST /leads: Trigger n8n confirmation immédiat  
- ✅ POST /relance: Vérif délais/nb/max, sélection template, trigger n8n correspondant

### 4. ✅ Éditer frontend/dashboard/script.js
- ✅ isRelanceDue(): Ajouter check nb_relances < 4
- ✅ UI: Afficher \"Relance #X/4\" + cacher si max atteint

### 5. ✅ Créer n8n workflows
- ✅ confirmation-immediat.json
- ✅ relance1.json
- ✅ relance2.json  
- ✅ relance3.json, relance4.json

### 6. ✅ Mettre à jour README.md (fait)

### 7. ✅ Test & Completion
- Backend démarré → Lead submit → Confirmation n8n
- Dashboard → Bouton "Relance #1/4" → Vérif délais → relance1 n8n
- Séquence complète 1→4 relances (max)

**✅ IMPLEMENTATION TERMINÉE**
