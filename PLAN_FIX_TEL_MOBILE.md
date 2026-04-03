# Plan Correction Tél Mobile + Persistance

## Diagnostic
```
Log: telephone_mobile: undefined 
DB SAVE OK mais donnée vide
```
**Cause** : `frontend/landing/script.js` `submitForm()` utilise `document.getElementById('telephone').value` mais **VIEUX code** ou **formData vide**

## Fix 1 : Corriger Frontend Landing
**Fichier** : `frontend/landing/script.js`
**Problème** : Code ancien `FormData` sans `telephone`
**Solution** : Utiliser `submitForm()` moderne avec `telephone_mobile: document.getElementById('telephone').value`

## Fix 2 : Persistance MongoDB
**Problème** : Restart → memoryLeads reset (DB OK mais fallback)
**Solution** : Supprimer memory fallback OU prioriser DB

## Test
1. Fix script.js
2. Nouveau lead
3. Dashboard 👁️ → Tél OK
4. Restart server → Leads persistants
