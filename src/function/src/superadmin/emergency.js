const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const EMERGENCY_SECRET = process.env.EMERGENCY_SECRET || 'change-me-123';

// Fonction d'urgence HTTP
exports.emergencyRestore = functions.https.onRequest(async (req, res) => {
  try {
    // Vérification du secret
    if (req.query.secret !== EMERGENCY_SECRET) {
      res.status(403).json({ error: 'Accès non autorisé' });
      return;
    }

    // 1. Restauration depuis backup externe
    const backupSnapshot = await admin.firestore()
      .collection('system/superAdmins')
      .where('isActive', '==', true)
      .get();

    // 2. Restauration de chaque SuperAdmin
    const results = await Promise.all(
      backupSnapshot.docs.map(async doc => {
        const uid = doc.id;
        try {
          await admin.auth().setCustomUserClaims(uid, {
            superAdmin: true,
            role: 'super-admin',
            emergencyRestored: true
          });
          return { uid, status: 'success' };
        } catch (error) {
          return { uid, status: 'failed', error: error.message };
        }
      })
    );

    // 3. Journalisation
    await admin.firestore().collection('systemEmergencyLogs').add({
      action: 'full_restore',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      results,
      initiatedBy: req.ip
    });

    res.status(200).json({
      success: true,
      restored: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length
    });

  } catch (error) {
    functions.logger.error('ERREUR CRITIQUE:', error);
    res.status(500).json({ error: 'Échec de la procédure d\'urgence' });
  }
});

// Fonction pour créer un SuperAdmin d'urgence
exports.emergencyCreateSuperAdmin = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Méthode non autorisée');
    return;
  }

  if (req.body.secret !== EMERGENCY_SECRET) {
    res.status(403).json({ error: 'Secret invalide' });
    return;
  }

  try {
    // Création de l'utilisateur
    const user = await admin.auth().createUser({
      email: req.body.email,
      password: req.body.password
    });

    // Définition des claims
    await admin.auth().setCustomUserClaims(user.uid, {
      superAdmin: true,
      role: 'super-admin',
      emergencyCreated: true
    });

    // Sauvegarde
    await admin.firestore().doc(`system/superAdmins/${user.uid}`).set({
      email: user.email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      emergencyCreated: true,
      creatorIP: req.ip
    });

    res.status(201).json({
      success: true,
      uid: user.uid,
      email: user.email
    });

  } catch (error) {
    functions.logger.error('ERREUR création emergency:', error);
    res.status(500).json({ error: error.message });
  }
});