const API_BASE = 'http://localhost:3000/api';
const socket = io('http://localhost:3000'); // Socket direct

// DOM
const leadsBody = document.getElementById('leadsBody');
const newLeadsCount = document.getElementById('newLeadsCount');
const liveIndicator = document.getElementById('liveIndicator');

// Delais global
let delaisConfig = { nouveau: 24, contacte: 48, 'en_discussion': 72, perdu: 168 };

async function loadLeads() {
  try {
    const response = await fetch(`${API_BASE}/leads`);
    const leads = await response.json();
    console.log('Loaded leads:', leads);
    displayLeads(leads);
    updateStats(leads);
  } catch (error) {
    console.error('Load error:', error);
  }
}

function displayLeads(leads) {
  leadsBody.innerHTML = '';
  leads.forEach(lead => {
    const row = document.createElement('tr');
    if (lead.statut === 'nouveau') row.classList.add('new-lead');
    const showRelance = isRelanceDue(lead);
    row.innerHTML = `
      <td>${new Date(lead.timestamp).toLocaleString('fr-FR')}</td>
      <td>${lead.nom}</td>
      <td>${lead.telephone || ''}<br>${lead.email}</td>
      <td>${lead.type_besoin}</td>
      <td title="${lead.message}">${lead.message}</td>

      <td>
        <select onchange="updateStatut('${lead._id}', this.value)" class="status-select">
          <option value="nouveau" ${lead.statut === 'nouveau' ? 'selected' : ''}>Nouveau</option>
          <option value="contacte" ${lead.statut === 'contacte' ? 'selected' : ''}>Contacté</option>
          <option value="en_discussion" ${lead.statut === 'en_discussion' ? 'selected' : ''}>En discussion</option>
          <option value="converti" ${lead.statut === 'converti' ? 'selected' : ''}>Converti</option>
          <option value="perdu" ${lead.statut === 'perdu' ? 'selected' : ''}>Perdu</option>
        </select>
      </td>
      <td>${lead.nb_relances || 0}</td>
      <td>
        ${showRelance ? `<button class="relance-btn" onclick="relanceLead('${lead._id}')">Relancer</button>` : '<span style="color:green">OK</span>'}
      </td>
    `;
    leadsBody.appendChild(row);
  });
}

window.updateStatut = async (id, statut) => {
  try {
    const response = await fetch(`${API_BASE}/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut })
    });
    if (response.ok) loadLeads();
  } catch (error) {
    console.error('Update error:', error);
  }
};

async function loadDelais() {
  try {
    const response = await fetch(`${API_BASE}/leads/config/delais`);
    delaisConfig = await response.json();
    document.getElementById('delayNouveau').value = delaisConfig.nouveau;
    document.getElementById('delayContacte').value = delaisConfig.contacte || 48;
    document.getElementById('delayDiscussion').value = delaisConfig['en_discussion'] || 72;
    document.getElementById('delayPerdu').value = delaisConfig.perdu || 168;
    console.log('Delais loaded');
  } catch (e) {
    console.log('Default delais used');
  }
}

async function saveDelais() {
  delaisConfig.nouveau = parseInt(document.getElementById('delayNouveau').value);
  delaisConfig.contacte = parseInt(document.getElementById('delayContacte').value);
  delaisConfig['en_discussion'] = parseInt(document.getElementById('delayDiscussion').value);
  delaisConfig.perdu = parseInt(document.getElementById('delayPerdu').value);
  try {
    await fetch(`${API_BASE}/leads/config/delais`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(delaisConfig)
    });
    alert('Délais sauvegardés !');
    loadLeads(); // Refresh buttons
  } catch (e) {
    alert('Erreur sauvegarde');
  }
}

function isRelanceDue(lead) {
  if (!lead.derniere_relance || !lead.derniere_relance) return true;
  const delaiHours = delaisConfig[lead.statut] || 24;
  const dueTime = new Date(lead.derniere_relance);
  dueTime.setHours(dueTime.getHours() + delaiHours);
  return new Date() > dueTime;
}

window.relanceLead = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/leads/${id}/relance`, { method: 'POST' });
    if (response.ok) {
      loadLeads();
    }
  } catch (error) {
    console.error('Relance error:', error);
  }
};

let pieChart = null;

function updateStats(leads) {
  const counts = {
    nouveau: leads.filter(l => l.statut === 'nouveau').length,
    contacte: leads.filter(l => l.statut === 'contacte').length,
    'en_discussion': leads.filter(l => l.statut === 'en_discussion').length,
    converti: leads.filter(l => l.statut === 'converti').length,
    perdu: leads.filter(l => l.statut === 'perdu').length
  };
  document.getElementById('statsNouveau').textContent = counts.nouveau;
  document.getElementById('statsContacte').textContent = counts.contacte;
  document.getElementById('statsEnDiscussion').textContent = counts['en_discussion'];
  document.getElementById('statsConverti').textContent = counts.converti;
  document.getElementById('statsPerdu').textContent = counts.perdu;
  document.getElementById('statsTotal').textContent = leads.length;
  newLeadsCount.textContent = counts.nouveau;
  updatePieChart(counts);
}

function updatePieChart(counts) {
  const ctx = document.getElementById('statusPieChart')?.getContext('2d');
  if (!ctx || pieChart) pieChart?.destroy();

  const labels = ['Nouveau', 'Contacté', 'Discussion', 'Converti', 'Perdu'];
  const data = [counts.nouveau, counts.contacte, counts['en_discussion'], counts.converti, counts.perdu];
  const colors = ['#4caf50', '#2196f3', '#ff9800', '#8bc34a', '#f44336'];

  pieChart = new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ data, backgroundColor: colors }] },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

// Socket events
socket.on('new_lead', (data) => {
  liveIndicator.textContent = '🟢 Nouveau lead !';
  setTimeout(() => liveIndicator.textContent = '🟢 Live', 3000);
  loadLeads();
});

socket.on('lead_updated', loadLeads);

// Admin events
document.getElementById('saveDelais').onclick = saveDelais;
document.getElementById('loadDelais').onclick = loadDelais;

// Init
loadDelais();
loadLeads();
setInterval(loadLeads, 30000); // 30s
console.log('Dashboard ready - Délais relance OK');

