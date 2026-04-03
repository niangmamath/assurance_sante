# Fix Production Hostinger - /landing & /dashboard
✅ **Plan Approuvé** (local + prod compatible)

## **Étapes (5)**

### 1. **Edit backend/server.js** (SPA fallback)
- Ajouter routes catch-all après API: /landing, /dashboard → index.html correspondant
- Local OK (déjà express.static), prod OK (strict routing)

### 2. **Edit frontend/landing/script.js** 
- `fetch` → window.location.origin + '/api/leads' (local: localhost:3000, prod: domaine)

### 3. **Edit frontend/dashboard/script.js**
- `API_BASE = window.location.origin + '/api'`
- Socket.io → window.location.origin

### 4. **Test Local**
```
cd backend && npm start
→ http://localhost:3000/landing → submit → dashboard live + relance
```

### 5. **Deploy & Test Prod**
- Copie fichiers Hostinger
- Restart app (`npm start` ou PM2)
- Test https://assurance.ubuntudigit.com/landing → /dashboard

**Progression**: [✅] 1 [✅] 2 [✅] 3 [🔄] 4 [ ] 5

**🚀 Test Local en cours**:
```
npx kill-port 3000 → OK
cd backend; npm start → Serveur v2.0 démarré
```
Testez maintenant:
- http://localhost:3000/landing (form + chat IA)
- Submit → http://localhost:3000/dashboard (live + relance)

**✅ si OK** → Étape 5 deploy Hostinger.

**✅ Étape 1**: server.js → Routes SPA fallback OK
**✅ Étape 2-3**: landing + dashboard scripts → window.location.origin OK
**✅ Chat landing**: OpenAI fonctionnel

**🚀 PROCHAIN**: Test local `cd backend; npm start` puis Étape 4.
