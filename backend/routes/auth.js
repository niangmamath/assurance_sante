const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Récupération des identifiants depuis le fichier .env
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  if (email === adminEmail && password === adminPassword) {
    // Génération du token JWT valide 24 heures
    const token = jwt.sign(
      { email: adminEmail, role: 'admin' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Identifiants incorrects.' });
  }
});

module.exports = router;
