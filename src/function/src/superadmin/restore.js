const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Fonction de restauration automatique des SuperAdmins
exports.restoreSuperAdmins = functions.firestore
  .document('system/superAdmins/{uid}')
  .onWrite(async (change, context) => {
    const uid = context.params.uid;
    const db = admin.firestore();
    const auth = admin.auth();

    try {
      // Si le document est supprimé
      if (!change.after.exists) {
        await auth.setCustomUserClaims(uid, null);
        functions.logger.log(`Privilèges SuperAdmin retirés pour ${uid}`);
        return;
      }

      const newData = change.after.data();
      const previousData = change.before.data();

      // Vérifie si besoin de restauration
      if (newData.isActive && (!previousData || !previousData.isActive)) {
        // Restaure les claims
        await auth.setCustomUserClaims(uid, {
          superAdmin: true,
          role: 'super-admin',
          restoredAt: Date.now()
        });

        // Met à jour le statut
        await db.doc(`system/superAdmins/${uid}`).update({
          lastRestored: admin.firestore.FieldValue.serverTimestamp(),
          restorationCount: admin.firestore.FieldValue.increment(1)
        });

        functions.logger.log(`SuperAdmin restauré: ${uid}`);
      }

    } catch (error) {
      functions.logger.error('Échec de restauration:', error);
      await db.collection('systemErrors').add({
        type: 'superadmin_restore_failed',
        uid,
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

// Helper pour restaurer manuellement
exports.manualRestoreSuperAdmin = functions.https.onCall(async (data, context) => {
  // Vérification d'identité ultra-sécurisée
  if (!context.auth || !context.auth.token.superAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Accès refusé');
  }

  try {
    const uid = data.uid;
    await admin.auth().getUser(uid);

    // Vérifie si l'utilisateur existe dans la backup collection
    const doc = await admin.firestore().doc(`system/superAdmins/${uid}`).get();

    if (!doc.exists) {
      throw new functions.https.HttpsError('not-found', 'SuperAdmin non trouvé');
    }

    // Restauration complète
    await admin.auth().setCustomUserClaims(uid, {
      superAdmin: true,
      role: 'super-admin',
      manuallyRestored: true,
      restoredBy: context.auth.uid
    });

    return { success: true, uid };
  } catch (error) {
    functions.logger.error('Restauration manuelle échouée:', error);
    throw new functions.https.HttpsError('internal', 'Échec de restauration');
  }
});