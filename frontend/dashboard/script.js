const API_BASE = window.location.origin + '/api';
const socket = io(window.location.origin);

// DOM
const leadsBody = document.getElementById('leadsBody');
const newLeadsCount = document.getElementById('newLeadsCount');
const liveIndicator = document.getElementById('liveIndicator');
const leadDetailPanel = document.getElementById('leadDetailPanel');
const panelBody = document.getElementById('panelBody');
const leadIdDisplay = document.getElementById('leadIdDisplay');
const closeLeadPanel = document.getElementById('closeLeadPanel');
const panelOverlay = document.getElementById('panelOverlay');

// Delais global
let delaisConfig = { nouveau: 24, contacte: 48, 'en_discussion': 72, perdu: 168 };
let currentLead = null;

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

    // ✅ CORRIGÉ — 8 colonnes propres, sans corruption
    row.innerHTML = `
      <td>${new Date(lead.timestamp).toLocaleString('fr-FR')}</td>
      <td>${lead.nom || ''}</td>
      <td>${lead.telephone_mobile || lead.telephone || ''}<br><small>${lead.email || ''}</small></td>
      <td>
        ${lead.regime || 'Non spécifié'}
        ${lead.madelin_flag ? '<br><span style="background:#f97316;color:white;font-size:.68rem;padding:2px 7px;border-radius:4px;font-weight:600">MADELIN</span>' : ''}
      </td>
      <td title="${lead.commentaire || lead.message || ''}">${(lead.commentaire || lead.message || 'Aucun commentaire').substring(0, 50)}...</td>
      <td>
        <select onchange="updateStatut('${lead._id}', this.value)" class="status-select">
          <option value="nouveau"       ${lead.statut === 'nouveau'       ? 'selected' : ''}>Nouveau</option>
          <option value="contacte"      ${lead.statut === 'contacte'      ? 'selected' : ''}>Contacté</option>
          <option value="en_discussion" ${lead.statut === 'en_discussion' ? 'selected' : ''}>En discussion</option>
          <option value="converti"      ${lead.statut === 'converti'      ? 'selected' : ''}>Converti</option>
          <option value="perdu"         ${lead.statut === 'perdu'         ? 'selected' : ''}>Perdu</option>
        </select>
      </td>
      <td>${lead.nb_relances || 0}</td>
      <td>
        ${showRelance ? `<button class="relance-btn" onclick="relanceLead('${lead._id}')">Relancer</button>` : '<span style="color:green">✓</span>'}
        <button class="detail-btn" onclick="showLeadDetail('${lead._id}')" title="Détail">👁️</button>
        <button class="delete-btn" onclick="deleteLead('${lead._id}')" title="Supprimer">🗑️</button>
      </td>
    `;

    leadsBody.appendChild(row);
  });
}

// PANEL DÉTAIL LEAD
async function showLeadDetail(id) {
  try {
    const response = await fetch(`${API_BASE}/leads/${id}`);
    const lead = await response.json();
    currentLead = lead;

    leadIdDisplay.textContent = lead.nom || lead._id;
    populatePanel(lead);
    leadDetailPanel.classList.add('show');
    panelOverlay.classList.add('show');
  } catch (error) {
    console.error('Lead detail error:', error);
    alert('Erreur chargement détail');
  }
}

function populatePanel(lead) {
  const commentText = lead.commentaire || lead.message || 'Aucun commentaire';

  panelBody.innerHTML = `
    <div class="panel-section">
      <h4>1. Identité</h4>
      <p><strong>Nom :</strong> ${lead.nom || 'Non renseigné'}</p>
      <p><strong>Date naissance :</strong> ${lead.date_naissance || 'Non renseigné'}</p>
      <p><strong>Adresse :</strong> ${lead.adresse || 'Non renseigné'}</p>
      <p><strong>Email :</strong> ${lead.email || 'Non renseigné'}</p>
      
      <p><strong>Tél mobile :</strong> ${lead.telephone_fixe || 'Non renseigné'}</p>
    </div>

    <div class="panel-section">
      <h4>2. Composition foyer</h4>
      <p><strong>Nombre personnes :</strong> ${lead.nb_personnes || 'Non renseigné'}</p>
      <p><strong>Bénéficiaires :</strong> ${lead.beneficiaires?.join(', ') || 'Non renseigné'}</p>
      <p><strong>Situation familiale :</strong> ${lead.situation_familiale || 'Non renseigné'}</p>
    </div>

    <div class="panel-section">
      <h4>3. Régime & Profil</h4>
      <p><strong>Régime :</strong> ${lead.regime || 'Non renseigné'}</p>
      ${lead.madelin_flag ? '<span class="madelin-badge">LOI MADELIN</span>' : ''}
    </div>

    <div class="panel-section">
      <h4>4. Besoins actuels</h4>
      <p><strong>Postes prioritaires :</strong> ${lead.postes_prioritaires?.join(', ') || 'Non renseigné'}</p>
      <p><strong>Mutuelle actuelle :</strong> ${lead.mutuelle_actuelle || 'Non renseigné'}</p>
      <p><strong>Tarif mensuel :</strong> ${lead.tarif_mensuel ? lead.tarif_mensuel + ' €' : 'Non renseigné'}</p>
      <p><strong>Motivation :</strong> ${lead.motivation || 'Non renseigné'}</p>
    </div>

    <div class="panel-section">
      <h4>5. Joignabilité</h4>
      <p><strong>Créneau rappel :</strong> <span class="highlight">🕐 ${lead.creneau_rappel || 'Non renseigné'}</span></p>
      <p><strong>Date réception :</strong> ${new Date(lead.timestamp).toLocaleString('fr-FR')}</p>
    </div>

    <div class="panel-section">
      <h4>6. Commentaire</h4>
      <p>${commentText}</p>
    </div>

    <div class="panel-section">
      <h4>7. Conformité</h4>
      <p><strong>OPT-IN :</strong> ${lead.consentement_optin ? 'Oui ✓' : 'Non ✗'}</p>
      <p><strong>RGPD :</strong> ${lead.consentement_rgpd ? 'Oui ✓' : 'Non ✗'}</p>
    </div>

    <!-- ACTIONS -->
    <div class="panel-actions">
      <div class="status-action">
        <label>Statut : </label>
        <select id="panelStatusSelect">
          <option value="nouveau"       ${lead.statut === 'nouveau'       ? 'selected' : ''}>Nouveau</option>
          <option value="contacte"      ${lead.statut === 'contacte'      ? 'selected' : ''}>Contacté</option>
          <option value="en_discussion" ${lead.statut === 'en_discussion' ? 'selected' : ''}>En discussion</option>
          <option value="converti"      ${lead.statut === 'converti'      ? 'selected' : ''}>Converti</option>
          <option value="perdu"         ${lead.statut === 'perdu'         ? 'selected' : ''}>Perdu</option>
        </select>
        <button onclick="updatePanelStatus()">Mettre à jour</button>
      </div>
      <button id="panelRelanceBtn" class="relance-btn" style="display:none" onclick="relancePanelLead()">Relancer</button>
    </div>

    <!-- HISTORIQUE RELANCES -->
    <div class="panel-section">
      <h4>Historique Relances</h4>
      <div id="historiqueList">
        ${lead.historique_relances?.length > 0
          ? lead.historique_relances.map(h => `
              <div class="historique-item">
                <span>${new Date(h.date).toLocaleString('fr-FR')}</span> — <strong>${h.statut}</strong>
              </div>
            `).join('')
          : 'Aucune relance effectuée'}
      </div>
    </div>
  `;

  if (isRelanceDue(lead)) {
    document.getElementById('panelRelanceBtn').style.display = 'block';
  }
}

window.updatePanelStatus = async () => {
  const newStatut = document.getElementById('panelStatusSelect').value;
  try {
    const response = await fetch(`${API_BASE}/leads/${currentLead._id}/statut`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: newStatut })
    });
    if (response.ok) {
      showToast('Statut mis à jour');
      loadLeads();
      if (currentLead) showLeadDetail(currentLead._id);
    }
  } catch (error) {
    console.error('Panel status error:', error);
  }
};

window.relancePanelLead = async () => {
  try {
    document.getElementById('panelRelanceBtn').disabled = true;
    document.getElementById('panelRelanceBtn').textContent = 'Relance envoyée ✓';
    const response = await fetch(`${API_BASE}/leads/${currentLead._id}/relance`, { method: 'POST' });
    if (response.ok) {
      showToast('Relance envoyée');
      showLeadDetail(currentLead._id);
    }
  } catch (error) {
    console.error('Panel relance error:', error);
  }
};

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
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
  delaisConfig.nouveau        = parseInt(document.getElementById('delayNouveau').value);
  delaisConfig.contacte       = parseInt(document.getElementById('delayContacte').value);
  delaisConfig['en_discussion'] = parseInt(document.getElementById('delayDiscussion').value);
  delaisConfig.perdu          = parseInt(document.getElementById('delayPerdu').value);
  try {
    await fetch(`${API_BASE}/leads/config/delais`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(delaisConfig)
    });
    alert('Délais sauvegardés !');
    loadLeads();
  } catch (e) {
    alert('Erreur sauvegarde');
  }
}

async function loadDelaisConfig() {
  try {
    const response = await fetch(`${API_BASE}/leads/config/delais`);
    delaisConfig = await response.json();
  } catch (e) {
    console.log('Delais load failed, using legacy');
  }
}

function isRelanceDue(lead) {
  // TOUJOURS AFFICHER BOUTON RELANCER (pour tests manuels)
  console.log('Bouton relancer toujours visible');
  return true;
}

window.relanceLead = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/leads/${id}/relance`, { method: 'POST' });
    const data = await response.json();
    console.log('Status:', response.status, 'Data:', data); // ← ajoute ça
    if (response.ok) {
      showToast('Relance envoyée ✓');
      loadLeads();
    } else {
      alert('Erreur : ' + data.error);
    }
  } catch (error) {
    console.error('Relance error:', error);
  }
};
let pieChart = null;

function updateStats(leads) {
  const counts = {
    nouveau:        leads.filter(l => l.statut === 'nouveau').length,
    contacte:       leads.filter(l => l.statut === 'contacte').length,
    'en_discussion':leads.filter(l => l.statut === 'en_discussion').length,
    converti:       leads.filter(l => l.statut === 'converti').length,
    perdu:          leads.filter(l => l.statut === 'perdu').length
  };
  document.getElementById('statsNouveau').textContent      = counts.nouveau;
  document.getElementById('statsContacte').textContent     = counts.contacte;
  document.getElementById('statsEnDiscussion').textContent = counts['en_discussion'];
  document.getElementById('statsConverti').textContent     = counts.converti;
  document.getElementById('statsPerdu').textContent        = counts.perdu;
  document.getElementById('statsTotal').textContent        = leads.length;
  newLeadsCount.textContent = counts.nouveau;
  updatePieChart(counts);
}

function updatePieChart(counts) {
  const ctx = document.getElementById('statusPieChart')?.getContext('2d');
  if (!ctx) return;
  if (pieChart) pieChart.destroy();

  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Nouveau', 'Contacté', 'Discussion', 'Converti', 'Perdu'],
      datasets: [{
        data: [counts.nouveau, counts.contacte, counts['en_discussion'], counts.converti, counts.perdu],
        backgroundColor: ['#4caf50', '#2196f3', '#ff9800', '#8bc34a', '#f44336']
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

window.deleteLead = async (id) => {
  if (!confirm('Supprimer définitivement ce lead ?')) return;
  try {
    const response = await fetch(`${API_BASE}/leads/${id}`, { method: 'DELETE' });
    if (response.ok) {
      showToast('Lead supprimé');
      loadLeads();
      if (currentLead && currentLead._id === id) {
        leadDetailPanel.classList.remove('show');
        panelOverlay.classList.remove('show');
      }
    } else {
      alert('Erreur suppression');
    }
  } catch (error) {
    console.error('Delete error:', error);
    alert('Erreur réseau');
  }
};

// Socket events
socket.on('new_lead', () => {
  liveIndicator.textContent = '🟢 Nouveau lead !';
  setTimeout(() => liveIndicator.textContent = '🟢 Live', 3000);
  loadLeads();
});

socket.on('lead_updated', loadLeads);

// Panel events
closeLeadPanel.onclick = () => {
  leadDetailPanel.classList.remove('show');
  panelOverlay.classList.remove('show');
};

panelOverlay.onclick = () => {
  leadDetailPanel.classList.remove('show');
  panelOverlay.classList.remove('show');
};

// Admin events
document.getElementById('saveDelais').onclick = saveDelais;
document.getElementById('loadDelais').onclick = loadDelais;

// Init
loadDelais();
loadLeads();
setInterval(loadLeads, 30000);
console.log('Dashboard ready - Panel détail OK');