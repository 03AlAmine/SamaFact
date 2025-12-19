// permissions.js

// 🔐 Rôles disponibles
export const ROLES = {
  SUPERADMIN: 'superadmin',      // Créateur / plateforme
  SUPADMIN: 'supadmin',          // Superadmin limité à l'entreprise
  EMPLOYE: 'employe',            // Employé standard
  ADMIN: 'admin',                // Admin entreprise
  RH_DAF: 'rh_daf',             // Directeur Administratif et Financier
  COMPTABLE: 'comptable',        // Peut gérer devis/factures/avoirs
  CHARGE_COMPTE: 'charge_compte',// Assistant / Secrétaire
  LECTEUR: 'lecteur'             // Lecture seule
};

// ✅ Permissions associées à chaque rôle
export const PERMISSIONS = {
   [ROLES.SUPERADMIN]: {
     manageCompany: true,
     manageUsers: true,
     managePayroll: true,
     manageDocuments: true,
     viewAll: true,
     isSuperAdmin: true,
     isSupAdmin: true  // 👈 NOUVEAU
   },
   [ROLES.SUPADMIN]: {  // 👈 NOUVEAU - Mêmes droits que superadmin mais limité à l'entreprise
     manageCompany: true,
     manageUsers: true,
     managePayroll: true,
     manageDocuments: true,
     viewAll: true,
     isSuperAdmin: false,
     isSupAdmin: true
   },
   [ROLES.ADMIN]: {
     manageCompany: true,
     manageUsers: true,
     manageDocuments: true,
     managePayroll: true,
     viewAll: true,
     isSuperAdmin: false,
     isSupAdmin: false  // 👈 NOUVEAU
   },
   [ROLES.RH_DAF]: {
     managePayroll: true,
     viewAllPayroll: true,
     manageEmployees: true,
     isSuperAdmin: false,
     isSupAdmin: false
   },
   [ROLES.COMPTABLE]: {
     manageCompany: false,
     manageUsers: false,
     manageDocuments: true,
     viewAll: true,
     isSuperAdmin: false,
     isSupAdmin: false
   },
   [ROLES.CHARGE_COMPTE]: {
     manageCompany: false,
     manageUsers: false,
     manageDocuments: true,
     viewAll: false,
     isSuperAdmin: false,
     isSupAdmin: false
   },
   [ROLES.EMPLOYE]: {
     viewOwnPayroll: true,
     editOwnInfo: true,
     isSuperAdmin: false,
     isSupAdmin: false
   },
   [ROLES.LECTEUR]: {
     manageCompany: false,
     manageUsers: false,
     manageDocuments: false,
     viewAll: true,
     isSuperAdmin: false,
     isSupAdmin: false
   }
 };

// 🔧 Fonction utilitaire pour récupérer les permissions selon le rôle
export const getPermissionsForRole = (role) => {
  return PERMISSIONS[role] || PERMISSIONS[ROLES.LECTEUR];
};
