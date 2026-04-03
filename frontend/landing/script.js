// FORMULAIRE 6 ÉTAPES - FIXED SYNTAX ERROR
let currentStep = 1;

function showStep(n) {
  // Cache toutes les étapes
  const steps = document.querySelectorAll('.step');
  steps.forEach((step, index) => {
    step.style.display = 'none';
  });
  
  // Montre l'étape n
  document.querySelector('[data-step="' + n + '"]').style.display = 'block';
  
  // Progress bar
  const progressSteps = document.querySelectorAll('.progress-step');
  progressSteps.forEach((p, index) => {
    if (index < n) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });
  
  currentStep = n;
}

function nextStep(n) {
  if (n < 6) {
    showStep(n + 1);
  }
}

function prevStep(n) {
  if (n > 1) {
    showStep(n - 1);
  }
}

// Ouvrir formulaire
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('openForm').addEventListener('click', function() {
    document.getElementById('formSection').style.display = 'block';
    document.querySelector('.hero').style.display = 'none';
    showStep(1);
  });

  // Submit form
  document.getElementById('leadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const data = Object.fromEntries(formData);
    
    // Fix arrays
    const beneficiaires = formData.getAll('beneficiaires[]');
    const postes = formData.getAll('postes_prioritaires[]');
    
    data.beneficiaires = beneficiaires;
    data.postes_prioritaires = postes;
    
    data.nb_personnes = parseInt(data.nb_personnes) || 1;
    
    console.log('Envoi:', data);
    
    try {
      const API_URL = window.location.origin + '/api/leads';
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        alert('Devis envoyé !');
        document.getElementById('formSection').style.display = 'none';
        document.querySelector('.hero').style.display = 'block';
      } else {
        alert('Erreur backend');
      }
    } catch (e) {
      alert('Backend non démarré');
    }
  });
  
  // Chatbot demo
  const sendBtn = document.getElementById('sendMessage');
  if (sendBtn) {
    sendBtn.onclick = async function() {
      const input = document.getElementById('chatInput');
      const message = input.value.trim();
      if (!message) return;
      
      const messages = document.getElementById('chatMessages');
      messages.innerHTML += `<div style="text-align:right;margin:5px 0;"><div style="background:#2c5aa0;color:white;padding:8px 12px;border-radius:18px;max-width:80%;display:inline-block;">${escapeHtml(message)}</div></div>`;
      input.value = '';
      
      // Show typing
      const typing = document.createElement('div');
      typing.innerHTML = '<div style="background:#e3f2fd;padding:8px 12px;border-radius:18px;margin:5px 0;">IA tape...</div>';
      messages.appendChild(typing);
      
      try {
        const response = await fetch(window.location.origin + '/api/chat', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({message})
        });
        const data = await response.json();
        messages.removeChild(typing);
        messages.innerHTML += `<div style="text-align:left;margin:5px 0;"><div style="background:#e3f2fd;padding:8px 12px;border-radius:18px;max-width:80%;display:inline-block;">${escapeHtml(data.reply)}</div></div>`;
      } catch(e) {
        messages.removeChild(typing);
        messages.innerHTML += '<div style="text-align:left;margin:5px 0;"><div style="background:#e3f2fd;padding:8px 12px;border-radius:18px;">Erreur connexion IA</div></div>';
      }
    };
  }
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

