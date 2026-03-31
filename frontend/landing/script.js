// API Base URL
const API_BASE = 'http://localhost:3000/api';

// Chatbot config (proxy endpoint needed)
const OPENAI_PROXY = `${API_BASE}/chat`; // Backend endpoint to add

// Open form
document.getElementById('openForm').addEventListener('click', () => {
  document.getElementById('formSection').style.display = 'block';
  document.getElementById('hero').style.display = 'none'; // Hide hero
});

// Toggle chatbot
document.getElementById('openForm').addEventListener('click', () => {
  document.getElementById('chatbotContainer').style.display = 'flex';
});

document.getElementById('closeChatbot').addEventListener('click', () => {
  document.getElementById('chatbotContainer').style.display = 'none';
});

// Chatbot functionality
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessage');

sendMessageBtn.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendChatMessage();
});

async function sendChatMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  addMessage(message, 'user');
  chatInput.value = '';

  try {
    const response = await fetch(OPENAI_PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    const data = await response.json();
    addMessage(data.reply || 'Désolé, je n\'ai pas compris.', 'bot');
  } catch (error) {
    addMessage('Erreur connexion. Vérifiez le backend.', 'bot');
  }
}

function addMessage(text, sender) {
  const div = document.createElement('div');
  div.className = `chat-message ${sender}-message`;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Initial bot message
addMessage('Bonjour ! Je suis votre assistant assurance santé. Comment puis-je vous aider ? FAQ: mutuelle, devis, couverture...', 'bot');

// Form submit
document.getElementById('leadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);

  try {
    const response = await fetch(`${API_BASE}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      alert('Demande envoyée ! Un courtier vous contacte bientôt.');
      e.target.reset();
      document.getElementById('formSection').style.display = 'none';
    } else {
      alert('Erreur envoi. Réessayez.');
    }
  } catch (error) {
    alert('Erreur connexion backend: ' + error.message);
  }
});

