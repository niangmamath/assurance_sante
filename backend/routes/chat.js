const express = require('express');
const OpenAI = require('openai');
const router = express.Router();

// ✅ Pas de fallback sur une vraie clé
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;

    // ✅ Validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ reply: 'Message invalide.' });
    }
    if (message.length > 500) {
      return res.status(400).json({ reply: 'Message trop long (500 caractères max).' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `A&M COURTAGE - Cabinet indépendant ORIAS enregistré. 
Étude gratuite mutuelle santé (individuelle, familiale, TNS Loi Madelin). 
Économies 40%, rappel 24h créneau choisi, 1200+ clients 98% satisfaits. 
Répondez en français, ton chaleureux et professionnel. 
FAQ mutuelle/RGPD/Madelin. 
Motivez toujours à remplir le formulaire #formulaire : 
"Remplissez en 2 min pour votre étude gratuite !"`
        },
        { role: 'user', content: message.trim() }
      ],
      max_tokens: 150
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });

  } catch (error) {
    console.error('OpenAI error:', error.message);

    // ✅ Distinguer les erreurs OpenAI des erreurs serveur
    if (error.status === 429) {
      return res.status(429).json({ reply: 'Service momentanément surchargé, réessayez dans quelques secondes.' });
    }
    res.status(500).json({ reply: 'Désolé, service temporairement indisponible.' });
  }
});

module.exports = router;