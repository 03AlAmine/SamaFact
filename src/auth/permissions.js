// permissions.js

// 🔐 Rôles disponibles
export const ROLES = {
  SUPERADMIN: 'superadmin',      // Créateur / plateforme
  ADMIN: 'admin',                // Admin entreprise
  RH_DAF: 'rh_daf',             // Directeur Administratif et Financier
  COMPTABLE: 'comptable',        // Peut gérer devis/factures/avoirs
  CHARGE_COMPTE: 'charge_compte',// Assistant / Secrétaire
  LECTEUR: 'lecteur'             // Lecture seule
};

// ✅ Permissions associées à chaque rôle
export const PERMISSIONS = {
  [ROLES.SUPERADMIN]: {
    manageCompany: true,         // Gérer l’entreprise (logo, mentions, etc.)
    manageUsers: true,           // Gérer les utilisateurs
    manageDocuments: true,       // Gérer devis/factures/avoirs
    viewAll: true,               // Tout voir
    isSuperAdmin: true
  },
  [ROLES.ADMIN]: {
    manageCompany: true,
    manageUsers: true,
    manageDocuments: true,
    viewAll: true,
    isSuperAdmin: false
  },
  [ROLES.RH_DAF]: {
    managePayroll: true,        // Gestion complète de la paie
    viewAllPayroll: true,       // Voir toutes les fiches de paie
    manageEmployees: true,      // Gérer les employés
    isSuperAdmin: false
  },
  [ROLES.COMPTABLE]: {
    manageCompany: false,
    manageUsers: false,
    manageDocuments: true,       // Peut créer, modifier, supprimer les documents
    viewAll: true,
    isSuperAdmin: false
  },
  [ROLES.CHARGE_COMPTE]: {
    manageCompany: false,
    manageUsers: false,
    manageDocuments: true,       // Peut créer/modifier mais avec des restrictions si besoin
    viewAll: false,              // Peut ne voir que ce qui le concerne
    isSuperAdmin: false
  },
  [ROLES.LECTEUR]: {
    manageCompany: false,
    manageUsers: false,
    manageDocuments: false,
    viewAll: true,
    isSuperAdmin: false
  }
};

// 🔧 Fonction utilitaire pour récupérer les permissions selon le rôle
export const getPermissionsForRole = (role) => {
  return PERMISSIONS[role] || PERMISSIONS[ROLES.LECTEUR];
};
