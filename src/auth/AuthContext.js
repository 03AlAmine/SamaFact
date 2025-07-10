import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, writeBatch,  query, where, getDocs } from 'firebase/firestore';
// Constants
const AuthContext = createContext();
const ROLES = {
  SUPERADMIN: 'superadmin',      // Créateur / plateforme
  ADMIN: 'admin',                // Admin entreprise
  COMPTABLE: 'comptable',        // Peut gérer devis/factures/avoirs
  CHARGE_COMPTE: 'charge_compte',// Assistant / Secrétaire
  LECTEUR: 'lecteur'             // Lecture seule
};

// ✅ Permissions associées à chaque rôle
const PERMISSIONS = {

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



export function AuthProvider({ children }) {

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dans votre AuthProvider
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Récupère à la fois les claims ET les données Firestore
        const [idTokenResult, userDoc] = await Promise.all([
          user.getIdTokenResult(),
          getDoc(doc(db, 'users', user.uid))
        ]);

        if (!userDoc.exists()) {
          console.warn('⚠️ Le document utilisateur n’existe pas encore.');
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        setCurrentUser({
          uid: user.uid,
          email: user.email,
          // Gestion complète des rôles
          isSuperAdmin: idTokenResult.claims.superAdmin ||
            idTokenResult.claims.role === 'super-admin' ||
            userDoc.data()?.role === 'super-admin',
          // Fusion des données
          ...userDoc.data(),
          ...idTokenResult.claims
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // State


  // Auth functions
async function signup(email, password, companyName, userName, username) {
  try {
    if (!companyName || !userName || !username) {
      throw new Error("Company name, user name and username are required");
    }

    // Vérifier si le username existe déjà
    const usernameCheck = await getDocs(
      query(collection(db, 'users'), where('username', '==', username)
    )
  );
    
    if (!usernameCheck.empty) {
      throw new Error("Ce nom d'utilisateur est déjà pris");
    }

    // 1. Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

      // 2. Create company
      const companyRef = doc(collection(db, 'companies'));
      const companyId = companyRef.id;

      // 3. Create user profile and company in a batch
      const batch = writeBatch(db);

      // Company document
      batch.set(companyRef, {
        name: companyName,
        createdAt: new Date(),
        createdBy: userId,
        status: 'active'
      });

      // User profile in company
      const profileRef = doc(db, `companies/${companyId}/profiles`, userId);
      batch.set(profileRef, {
        firstName: userName.split(' ')[0] || '',
        lastName: userName.split(' ').slice(1).join(' ') || '',
        email,
        companyName,
        createdAt: new Date(),
        companyLogo: '',
        rib: '',
        companyStatus: '',
        address: '',
        phone: '',
        website: '',
        rcNumber: '',
        ninea: '',
        invoiceColor: '#3a86ff',
        invoiceFont: 'Arial',
        invoiceTemplate: 'classic',
        pdfQuality: 'high'
      });

      // Main user document
      const userRef = doc(db, 'users', userId);
      batch.set(userRef, {
        email,
        name: userName,
        companyId,
              username, // Ajout du nom d'utilisateur

        role: 'admin',
        createdAt: new Date(),
        lastLogin: new Date()
      });

      await batch.commit();
      return userCredential;
    } catch (error) {
      console.error("Signup error:", error);
      throw new Error(error.message || "Failed to create account");
    }
  }

async function login(identifier, password) {
  try {
    // Vérifier si l'identifiant est un email ou un username
    let email = identifier;
    
    // Si ce n'est pas un email (ne contient pas @), chercher le username dans Firestore
    if (!identifier.includes('@')) {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(
        query(usersRef, where('username', '==', identifier))
      );
      
      if (querySnapshot.empty) {
        throw new Error("Nom d'utilisateur non trouvé");
      }
      
      // Prend le premier utilisateur trouvé (les usernames doivent être uniques)
      email = querySnapshot.docs[0].data().email;
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get additional user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      throw new Error("User document not found");
    }

    const userData = userDoc.data();

    // Update last login time
    await setDoc(doc(db, 'users', user.uid), {
      lastLogin: new Date()
    }, { merge: true });

    return {
      ...user,
      role: userData.role,
      companyId: userData.companyId
    };
  } catch (error) {
    throw error;
  }
}

  function logout() {
    return signOut(auth);
  }

  // User management functions
  async function createSubUser(email, password, userName, role = ROLES.VIEWER) {
    if (!currentUser || (currentUser.role !== ROLES.ADMIN && !isSuperAdmin())) {
      throw new Error("Unauthorized: Only admins or superadmins can create sub-users");
    }


    try {
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Send password reset email
      await sendPasswordResetEmail(auth, email);

      // Create profile
      const batch = writeBatch(db);
      const companyId = currentUser.companyId;

      // Profile in company
      const profileRef = doc(db, `companies/${companyId}/profiles`, userId);
      batch.set(profileRef, {
        firstName: userName.split(' ')[0] || '',
        lastName: userName.split(' ').slice(1).join(' ') || '',
        email,
        createdAt: new Date(),
        role,
        permissions: PERMISSIONS[role],
        createdBy: currentUser.uid,
        tempPassword: true
      });

      // Global user entry
      const userRef = doc(db, 'users', userId);
      batch.set(userRef, {
        email,
        name: userName,
        companyId,
        role,
        createdAt: new Date(),
        isActive: true,
        permissions: PERMISSIONS[role],
        tempPassword: true
      });

      await batch.commit();
      return userCredential;
    } catch (error) {
      console.error("Sub-user creation error:", error);
      throw error;
    }
  }

  async function updateUserRole(userId, newRole) {
    if (!currentUser || currentUser.role !== ROLES.ADMIN) {
      throw new Error("Unauthorized: Only admins can update roles");
    }

    try {
      const batch = writeBatch(db);
      const companyId = currentUser.companyId;

      // Update in profiles subcollection
      const profileRef = doc(db, `companies/${companyId}/profiles`, userId);
      batch.update(profileRef, {
        role: newRole,
        permissions: PERMISSIONS[newRole]
      });

      // Update in global users collection
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        role: newRole,
        permissions: PERMISSIONS[newRole]
      });

      await batch.commit();
    } catch (error) {
      console.error("Role update error:", error);
      throw error;
    }
  }

  // Permission check
  function checkPermission(requiredPermission) {
    if (!currentUser) return false;

    const userRole = currentUser.role?.toLowerCase();
    const normalizedPermissions = PERMISSIONS[userRole] || {};

    return normalizedPermissions[requiredPermission] ?? false;
  }
  // Dans votre AuthContext
  function isSuperAdmin() {
    if (!currentUser) return false;

    // Vérification à 3 niveaux
    return (
      currentUser.isSuperAdmin || // Firestore
      currentUser.customClaims?.superAdmin || // Claims JWT
      currentUser.role === 'super-admin' // Alternative
    );
  }

  // Context value
  const value = {
    currentUser,
    signup,
    login,
    logout,
    loading,
    createSubUser,
    updateUserRole,
    checkPermission,
    ROLES,
    isSuperAdmin, // Nouvelle fonction exportée

  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook
export function useAuth() {
  return useContext(AuthContext);
}

// Export constants
export { ROLES };