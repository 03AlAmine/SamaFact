// backend/server.js - Version complète avec WhatsApp
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Resend } = require('resend');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ========== CONFIGURATION ==========
const DOCUMENTS_DIR = process.env.DOCUMENTS_DIR || path.join(__dirname, 'documents');
const LINK_EXPIRY_DAYS = parseInt(process.env.LINK_EXPIRY_DAYS) || 7;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Créer le répertoire des documents s'il n'existe pas
if (!fs.existsSync(DOCUMENTS_DIR)) {
  fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
  console.log(`📁 Répertoire des documents créé: ${DOCUMENTS_DIR}`);
}

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (pour les PDFs)
app.use('/docs', express.static(DOCUMENTS_DIR));

// Configuration multer pour les fichiers PDF
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Initialisation de Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Stockage en mémoire des liens (en production, utilisez Firestore)
// Mais on va utiliser Firestore comme vous l'avez déjà
const linkStore = new Map(); // Fallback en mémoire

// ========== FONCTIONS UTILITAIRES ==========

/**
 * Génère un ID unique pour un document
 */
function generateDocumentId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Sauvegarde un PDF sur le disque
 */
async function savePdfToDisk(pdfBlob, documentId, filename) {
  const safeFilename = `${documentId}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const filePath = path.join(DOCUMENTS_DIR, safeFilename);
  
  // Convertir le buffer en fichier
  const buffer = Buffer.from(pdfBlob);
  fs.writeFileSync(filePath, buffer);
  
  return {
    filePath,
    filename: safeFilename,
    url: `${BASE_URL}/docs/${safeFilename}`
  };
}

/**
 * Supprime un PDF du disque (pour nettoyage)
 */
function deletePdfFromDisk(filename) {
  const filePath = path.join(DOCUMENTS_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

/**
 * Nettoie les fichiers expirés (à exécuter périodiquement)
 */
function cleanupExpiredFiles() {
  // À implémenter avec un cron job
  console.log('🧹 Nettoyage des fichiers expirés...');
}

// ========== ROUTES EXISTANTES (EMAIL) ==========

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend fonctionne !' });
});

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

app.post('/api/send-email-with-pdf', upload.single('pdf'), async (req, res) => {
  try {
    const { to, subject, html, from } = req.body;
    const pdfFile = req.file;

    if (!to || !subject || !html || !pdfFile) {
      return res.status(400).json({ 
        success: false, 
        error: 'Paramètres manquants' 
      });
    }

    const pdfBase64 = pdfFile.buffer.toString('base64');

    const { data, error } = await resend.emails.send({
      from: from || 'Facturation <noreply@leaderinterime.com>',
      to: [to],
      subject: subject,
      html: html,
      attachments: [{ filename: pdfFile.originalname, content: pdfBase64 }],
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

// ========== NOUVELLES ROUTES POUR WHATSAPP ==========

/**
 * Route pour générer un lien WhatsApp
 * 1. Reçoit le PDF
 * 2. Sauvegarde sur le disque
 * 3. Crée un lien unique
 * 4. Retourne le lien et le message WhatsApp
 */
app.post('/api/generate-whatsapp-link', upload.single('pdf'), async (req, res) => {
  try {
    const { 
      documentType,    // 'facture', 'devis', 'avoir', 'payroll'
      documentNumber,
      recipientName,
      recipientPhone,
      companyName,
      amount,
      expiryDays = LINK_EXPIRY_DAYS
    } = req.body;
    
    const pdfFile = req.file;

    if (!pdfFile) {
      return res.status(400).json({ 
        success: false, 
        error: 'Fichier PDF manquant' 
      });
    }

    // Générer un ID unique pour le document
    const documentId = generateDocumentId();
    
    // Sauvegarder le PDF sur le disque
    const { url, filename } = await savePdfToDisk(pdfFile.buffer, documentId, pdfFile.originalname);
    
    // Date d'expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);
    
    // Créer l'entrée dans Firestore (vous pouvez aussi utiliser un stockage mémoire)
    // Pour l'instant, on stocke en mémoire, mais vous devriez utiliser Firestore
    const linkData = {
      id: documentId,
      filename,
      url,
      documentType,
      documentNumber,
      recipientName,
      recipientPhone: recipientPhone || null,
      companyName,
      amount: amount || null,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      viewCount: 0,
      downloadCount: 0
    };
    
    // Stocker en mémoire (à remplacer par Firestore)
    linkStore.set(documentId, linkData);
    
    // Générer le message WhatsApp
    const message = buildWhatsAppMessage(linkData);
    
    // Construire l'URL WhatsApp
    let whatsappUrl = '';
    if (recipientPhone) {
      // Nettoyer le numéro de téléphone
      const cleanPhone = recipientPhone.replace(/[^0-9+]/g, '');
      const encodedMessage = encodeURIComponent(message);
      whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    } else {
      // Sans numéro, juste le lien à copier
      const encodedMessage = encodeURIComponent(message);
      whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    }
    
    console.log(`📱 Lien WhatsApp généré: ${whatsappUrl.substring(0, 100)}...`);
    
    res.json({
      success: true,
      data: {
        documentId,
        url,
        whatsappUrl,
        message,
        expiresAt: expiresAt.toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur génération lien WhatsApp:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Route pour servir un document (affichage dans le navigateur)
 * GET /api/doc/:id
 */
app.get('/api/doc/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer les infos du document
    const linkInfo = linkStore.get(id);
    
    if (!linkInfo) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Document introuvable</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>📄 Document introuvable</h1>
          <p>Le lien que vous avez utilisé est invalide ou a expiré.</p>
          <p>Veuillez contacter l'émetteur du document.</p>
        </body>
        </html>
      `);
    }
    
    // Vérifier l'expiration
    const expiresAt = new Date(linkInfo.expiresAt);
    if (expiresAt < new Date()) {
      linkStore.delete(id);
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Document expiré</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>⏰ Document expiré</h1>
          <p>Ce lien a expiré le ${expiresAt.toLocaleDateString('fr-FR')}.</p>
          <p>Veuillez contacter l'émetteur pour obtenir un nouveau lien.</p>
        </body>
        </html>
      `);
    }
    
    // Incrémenter le compteur de vues
    linkInfo.viewCount++;
    linkStore.set(id, linkInfo);
    
    // Servir le fichier PDF
    const filePath = path.join(DOCUMENTS_DIR, linkInfo.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Fichier non trouvé');
    }
    
    // Définir les headers pour l'affichage dans le navigateur
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
    
    fs.createReadStream(filePath).pipe(res);
    
  } catch (error) {
    console.error('❌ Erreur serveur document:', error);
    res.status(500).send('Erreur serveur');
  }
});

/**
 * Route pour télécharger un document
 * GET /api/doc/:id/download
 */
app.get('/api/doc/:id/download', (req, res) => {
  try {
    const { id } = req.params;
    
    const linkInfo = linkStore.get(id);
    
    if (!linkInfo) {
      return res.status(404).json({ success: false, error: 'Document introuvable' });
    }
    
    // Vérifier l'expiration
    if (new Date(linkInfo.expiresAt) < new Date()) {
      linkStore.delete(id);
      return res.status(410).json({ success: false, error: 'Lien expiré' });
    }
    
    // Incrémenter le compteur de téléchargements
    linkInfo.downloadCount++;
    linkStore.set(id, linkInfo);
    
    const filePath = path.join(DOCUMENTS_DIR, linkInfo.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Fichier non trouvé' });
    }
    
    res.download(filePath, `${linkInfo.documentType}_${linkInfo.documentNumber}.pdf`);
    
  } catch (error) {
    console.error('❌ Erreur téléchargement:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Route pour obtenir les statistiques d'un document
 * GET /api/doc/:id/stats
 */
app.get('/api/doc/:id/stats', (req, res) => {
  try {
    const { id } = req.params;
    const linkInfo = linkStore.get(id);
    
    if (!linkInfo) {
      return res.status(404).json({ success: false, error: 'Document introuvable' });
    }
    
    res.json({
      success: true,
      data: {
        viewCount: linkInfo.viewCount,
        downloadCount: linkInfo.downloadCount,
        createdAt: linkInfo.createdAt,
        expiresAt: linkInfo.expiresAt
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Construit le message WhatsApp
 */
function buildWhatsAppMessage(linkData) {
  const typeNames = {
    facture: '📄 FACTURE',
    devis: '📋 DEVIS',
    avoir: '💰 AVOIR',
    payroll: '📑 BULLETIN DE PAIE'
  };
  
  const typeName = typeNames[linkData.documentType] || 'DOCUMENT';
  
  let message = `🏢 ${linkData.companyName || 'Notre société'}\n\n`;
  message += `${typeName} N° ${linkData.documentNumber}\n\n`;
  
  if (linkData.recipientName) {
    message += `Bonjour ${linkData.recipientName},\n\n`;
  }
  
  message += `Votre document est disponible en cliquant sur le lien ci-dessous :\n\n`;
  message += `🔗 ${linkData.url}\n\n`;
  
  if (linkData.amount) {
    message += `💰 Montant: ${linkData.amount} FCFA\n\n`;
  }
  
  const expiryDate = new Date(linkData.expiresAt).toLocaleDateString('fr-FR');
  message += `⏰ Ce lien est valable jusqu'au ${expiryDate}\n\n`;
  message += `📎 Vous pouvez visualiser ou télécharger le document.\n\n`;
  message += `Merci de votre confiance ! 🙏`;
  
  return message;
}

// ========== NETTOYAGE PÉRIODIQUE ==========
// Toutes les heures, nettoyer les fichiers expirés
setInterval(() => {
  const now = new Date();
  let deletedCount = 0;
  
  for (const [id, data] of linkStore) {
    if (new Date(data.expiresAt) < now) {
      // Supprimer le fichier physique
      deletePdfFromDisk(data.filename);
      // Supprimer de la mémoire
      linkStore.delete(id);
      deletedCount++;
    }
  }
  
  if (deletedCount > 0) {
    console.log(`🧹 Nettoyage: ${deletedCount} documents expirés supprimés`);
  }
}, 60 * 60 * 1000); // Toutes les heures

// ========== DÉMARRAGE ==========
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📧 Service d'email prêt avec Resend`);
  console.log(`📱 Service WhatsApp prêt (liens valables ${LINK_EXPIRY_DAYS} jours)`);
  console.log(`📁 Répertoire des documents: ${DOCUMENTS_DIR}`);
});