// backend/server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Resend } = require('resend');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration CORS (UNE SEULE FOIS)
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://samafact.onrender.com',
    'https://Samafact.leaderinterime.com',
    'https://www.Samafact.leaderinterime.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Autres middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration multer pour les fichiers PDF (en mémoire)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite à 5MB
  }
});

// Initialisation de Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend fonctionne !' });
});

// Route pour envoyer un email simple
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, from } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ 
        success: false, 
        error: 'Paramètres manquants: to, subject, html sont requis' 
      });
    }

    console.log(`📧 Envoi d'email à: ${to}`);
    console.log(`📝 Sujet: ${subject}`);

    const { data, error } = await resend.emails.send({
      from: from || 'Facturation <noreply@leaderinterime.com>',
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('❌ Erreur Resend:', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    console.log('✅ Email envoyé avec succès:', data);
    res.json({ success: true, data: data });

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route pour envoyer un email avec pièce jointe PDF
app.post('/api/send-email-with-pdf', upload.single('pdf'), async (req, res) => {
  try {
    const { to, subject, html, from } = req.body;
    const pdfFile = req.file;

    if (!to || !subject || !html) {
      return res.status(400).json({ 
        success: false, 
        error: 'Paramètres manquants: to, subject, html sont requis' 
      });
    }

    if (!pdfFile) {
      return res.status(400).json({ 
        success: false, 
        error: 'Fichier PDF manquant' 
      });
    }

    console.log(`📧 Envoi d'email avec PDF à: ${to}`);
    console.log(`📎 Fichier: ${pdfFile.originalname} (${pdfFile.size} bytes)`);

    const pdfBase64 = pdfFile.buffer.toString('base64');

    const { data, error } = await resend.emails.send({
      from: from || 'Facturation <noreply@leaderinterime.com>',
      to: [to],
      subject: subject,
      html: html,
      attachments: [
        {
          filename: pdfFile.originalname,
          content: pdfBase64,
        },
      ],
    });

    if (error) {
      console.error('❌ Erreur Resend:', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    console.log('✅ Email avec PDF envoyé avec succès:', data);
    res.json({ success: true, data: data });

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route pour envoyer un email avec plusieurs pièces jointes
app.post('/api/send-email-with-attachments', upload.array('attachments', 5), async (req, res) => {
  try {
    const { to, subject, html, from } = req.body;
    const attachments = req.files;

    if (!to || !subject || !html) {
      return res.status(400).json({ 
        success: false, 
        error: 'Paramètres manquants' 
      });
    }

    const attachmentsData = attachments.map(file => ({
      filename: file.originalname,
      content: file.buffer.toString('base64'),
    }));

    const { data, error } = await resend.emails.send({
      from: from || 'Facturation <noreply@leaderinterime.com>',
      to: [to],
      subject: subject,
      html: html,
      attachments: attachmentsData,
    });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, data: data });

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {  // ← Ajouter '0.0.0.0' pour Render
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📧 Service d'email prêt avec Resend`);
});