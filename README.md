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

3. **n8n**:
   - Create workflows for `/webhook/relance-nouveau`, etc.
   - POST data: {lead: {...}}

4. **Test Flow**:
   - Submit landing form → Dashboard updates real-time 🟢
   - Click Relancer → n8n triggers email

## Structure
- Backend: Node/Express/MongoDB/Socket.io/OpenAI
- Frontend: HTML/CSS/JS responsive

MVP complet ! Scalable pour multi-cabinets.

