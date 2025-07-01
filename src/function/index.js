const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Import des fonctions SuperAdmin
const superAdminFunctions = require('./superadmin/create');
const restoreFunctions = require('./superadmin/restore');
const emergencyFunctions = require('./superadmin/emergency');

// Export des fonctions principales
exports.createSuperAdmin = superAdminFunctions.createSuperAdmin;
exports.manualRestoreSuperAdmin = superAdminFunctions.manualRestoreSuperAdmin;

// Export des fonctions de restauration
exports.restoreSuperAdmins = restoreFunctions.restoreSuperAdmins;

// Export des fonctions d'urgence
exports.emergencyRestore = emergencyFunctions.emergencyRestore;
exports.emergencyCreateSuperAdmin = emergencyFunctions.emergencyCreateSuperAdmin;

// Fonction de vérification de santé
exports.healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    features: {
      superAdmin: true,
      emergency: true,
      restore: true
    }
  });
});