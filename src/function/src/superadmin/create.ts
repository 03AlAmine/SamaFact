const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodeCrypto = require('crypto');
admin.initializeApp();

// Configuration
const SUPERADMIN_SECRET = process.env.SUPERADMIN_SECRET;
const REQUIRED_PASSWORD_STRENGTH = 12;

exports.createSuperAdmin = functions.https.onCall(async (data, context) => {
  // 1. Vérification de sécurité multicouche
  if (!validateRequest(context, data.secret)) {
    throw new functions.https.HttpsError('permission-denied', 'Accès refusé');
  }

  // 2. Validation des entrées
  validateInput(data);

  try {
    // 3. Création de l'utilisateur Auth
    const user = await createAuthUser(data);

    // 4. Génération des credentials de backup
    const backupCredentials = await generateBackupCredentials();

    // 5. Configuration des claims admin
    await setAdminClaims(user.uid);

    // 6. Sauvegarde dans Firestore
    await createFirestoreRecord(user, backupCredentials, context);

    // 7. Journalisation
    await logCreation(user.uid, context);

    return {
      success: true,
      uid: user.uid,
      backupCode: backupCredentials.code,
      backupKey: backupCredentials.keyId,
      warning: "Conservez ces informations de manière sécurisée"
    };

  } catch (error) {
    await handleCreationError(error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Helpers
function validateRequest(context, secret) {
  return (
    context.auth &&
    context.auth.token.superAdmin === true &&
    secret === SUPERADMIN_SECRET &&
    context.auth.token.ipWhitelisted === true
  );
}

function validateInput(data) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error("Email invalide");
  }

  if (data.password.length < REQUIRED_PASSWORD_STRENGTH) {
    throw new Error(`Le mot de passe doit contenir au moins ${REQUIRED_PASSWORD_STRENGTH} caractères`);
  }
}

async function createAuthUser(data) {
  return admin.auth().createUser({
    email: data.email,
    password: data.password,
    emailVerified: true,
    disabled: false
  });
}

async function generateBackupCredentials() {
  function getRandomHex(bytes: number) {
    if (typeof window === 'undefined' && nodeCrypto && nodeCrypto.randomBytes) {
      // Node.js environment
      return nodeCrypto.randomBytes(bytes).toString('hex');
    } else {
      // Browser/Cloud Functions environment
      const buffer = new Uint8Array(bytes);
      (crypto as any).getRandomValues(buffer);
      return Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  }

  async function sha256Hex(str: string): Promise<string> {
    if (typeof window === 'undefined' && nodeCrypto && nodeCrypto.createHash) {
      // Node.js environment
      return nodeCrypto.createHash('sha256').update(str).digest('hex');
    } else {
      // Browser/Cloud Functions environment
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await (crypto.subtle || (crypto as any).webcrypto.subtle).digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  }

  const code = getRandomHex(16);
  const keyId = getRandomHex(8);
  const hashedCode = await sha256Hex(code);
  return {
    code,
    keyId,
    hashedCode
  };
}

async function setAdminClaims(uid) {
  await admin.auth().setCustomUserClaims(uid, {
    superAdmin: true,
    role: 'super-admin',
    securityLevel: 'maximum',
    creationTime: Date.now(),
    canElevate: true
  });
}

async function createFirestoreRecord(user, backup, context) {
  const db = admin.firestore();
  const batch = db.batch();

  // Document principal
  const adminRef = db.doc(`system/superAdmins/${user.uid}`);
  batch.set(adminRef, {
    email: user.email,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    backupCodeHash: backup.hashedCode,
    backupKeyId: backup.keyId,
    isActive: true,
    createdBy: context.auth.uid,
    ipAddress: context.rawRequest.ip,
    status: 'active'
  });

  // Document de backup
  const backupRef = db.doc(`system/backups/superAdmins/${backup.keyId}`);
  batch.set(backupRef, {
    uid: user.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    hashedCode: backup.hashedCode,
    used: false,
    purpose: 'initial_creation'
  });

  await batch.commit();
}

async function logCreation(uid, context) {
  await admin.firestore().collection('system/audit/logs').add({
    action: 'superadmin_creation',
    uid,
    performer: context.auth.uid,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    metadata: {
      ip: context.rawRequest.ip,
      userAgent: context.rawRequest.get('user-agent')
    }
  });
}

async function handleCreationError(error) {
  await admin.firestore().collection('system/audit/errors').add({
    type: 'superadmin_creation_failed',
    error: error.message,
    stack: error.stack,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
  functions.logger.error('Échec création SuperAdmin:', error);
}

// Export pour les tests
module.exports = {
  validateRequest,
  validateInput,
  createAuthUser,
  generateBackupCredentials,
  setAdminClaims,
  createFirestoreRecord
};