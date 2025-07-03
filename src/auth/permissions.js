// permissions.js
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

export const PERMISSIONS = {
  [ROLES.SUPERADMIN]: {
    manageCompany: true,
    manageUsers: true,
    manageDocuments: true,
    viewAll: true,
    isSuperAdmin: true
  },
  [ROLES.ADMIN]: {
    manageCompany: true,
    manageUsers: true,
    manageDocuments: true,
    viewAll: true,
    isSuperAdmin: false
  },
  [ROLES.MANAGER]: {
    manageCompany: false,
    manageUsers: false,
    manageDocuments: true,
    viewAll: true,
    isSuperAdmin: false
  },
  [ROLES.EDITOR]: {
    manageCompany: false,
    manageUsers: false,
    manageDocuments: true,
    viewAll: false,
    isSuperAdmin: false
  },
  [ROLES.VIEWER]: {
    manageCompany: false,
    manageUsers: false,
    manageDocuments: false,
    viewAll: true,
    isSuperAdmin: false
  }
};

// Fonction utilitaire pour obtenir les permissions d'un rôle
export const getPermissionsForRole = (role) => {
  return PERMISSIONS[role] || PERMISSIONS[ROLES.VIEWER];
};