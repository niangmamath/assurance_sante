# Plateforme Leads Assurance Santé v2.0

## Setup

1. **Backend**:
   ```
   cd backend
   copy .env.example .env
   # Edit .env: MONGO_URI, OPENAI_API_KEY, N8N_WEBHOOK_BASE_URL, JWT_SECRET
   npm install
   npm start
   ```
   - Test: `curl http://localhost:3000/`

2. **Frontend** (static):
   - Landing: `frontend/landing/index.html`
   - Dashboard: `frontend/dashboard/index.html`

3. **n8n** (Automatisation complète):
   ```
   Import workflows depuis n8n-workflows/
   - confirmation-immediat.json → Email immédiat post-submit
   - relance1.json → 24-72h (1ère relance)
   - relance2.json → 72-168h (2nde)
   - relance3.json, relance4.json → Finale (max 4)

   Set WEBHOOK_BASE_URL dans .env → ex: http://localhost:5678/webhook/
   Test: Backend POST → n8n auto-triggers
   ```

4. **Test Flow complet**:
   ```
   1. npm start (backend)
   2. Submit landing → Email confirm immédiat + dashboard live
   3. Dashboard "Relance #1/4" → Vérif délai → Email relance1
   4. Attend 24h simu → Relance #2/4, etc. (max 4)
   5. Config délais: /dashboard → Sauvegarde delais.json
   ```

## Structure
- Backend: Node/Express/MongoDB/Socket.io/OpenAI
- Frontend: HTML/CSS/JS responsive

MVP complet ! Scalable pour multi-cabinets.

