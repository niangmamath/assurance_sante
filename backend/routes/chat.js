const express = require('express');
const OpenAI = require('openai');
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// POST chat message
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Vous êtes un assistant spécialisé en assurance santé France. Répondez en français, orientez vers le formulaire de devis. FAQ: mutuelle, couverture, RGPD. Style chaleureux, professionnel.'
        },
        { role: 'user', content: message }
      ],
      max_tokens: 150
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ reply: 'Désolé, service temporairement indisponible.' });
  }
});

module.exports = router;

