import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, writeBatch, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

const ROLES = {
  SUPERADMIN: 'superadmin',
  SUPADMIN: 'supadmin',
  ADMIN: 'admin',
  RH_DAF: 'rh_daf',
  COMPTABLE: 'comptable',
  CHARGE_COMPTE: 'charge_compte',
  EMPLOYE: 'employe',
  LECTEUR: 'lecteur'
};

const PERMISSIONS = {
  [ROLES.SUPERADMIN]: {
    manageCompany: true,
    manageUsers: true,
    managePayroll: true,
    manageDocuments: true,
    viewAll: true,
    isSuperAdmin: true,
    isSupAdmin: true
  },
  [ROLES.SUPADMIN]: {
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
    isSupAdmin: false
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

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const checkIntervalRef = useRef(null);
  const lastUpdateRef = useRef(Number(localStorage.getItem("lastUpdate") || 0));

  const updateLastActivity = async (userId) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 10 * 60 * 1000) return;

    lastUpdateRef.current = now;
    localStorage.setItem("lastUpdate", now);

    await setDoc(
      doc(db, 'users', userId),
      { lastActivity: serverTimestamp() },
      { merge: true }
    );
  };

  const handleLogout = async () => {
    try {
      if (currentUser) {
        await updateLastActivity(currentUser.uid);
      }
      await signOut(auth);
      setCurrentUser(null);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    } catch (error) {
      throw error;
    }
  };

  const checkInactivity = async (user) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const lastActivity = userData.lastActivity?.toDate();
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

        if (lastActivity && lastActivity < oneDayAgo) {
          await handleLogout();
          window.location.href = '/login?reason=inactivity';
          return false;
        }
        return true;
      }
      return true;
    } catch (error) {
      return true;
    }
  };

  const startInactivityChecking = (user) => {
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    checkIntervalRef.current = setInterval(() => {
      checkInactivity(user);
    }, 2 * 60 * 60 * 1000);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const [idTokenResult, userDoc] = await Promise.all([
          user.getIdTokenResult(),
          getDoc(doc(db, 'users', user.uid))
        ]);

        if (!userDoc.exists()) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        await updateLastActivity(user.uid);

        setCurrentUser({
          uid: user.uid,
          email: user.email,
          isSuperAdmin: idTokenResult.claims.superAdmin || idTokenResult.claims.role === 'super-admin' || userData?.role === 'super-admin',
          ...userData,
          ...idTokenResult.claims
        });

        startInactivityChecking(user);
      } else {
        setCurrentUser(null);
        if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        updateLastActivity(currentUser.uid);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [currentUser]);

  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, []);

  async function signup(email, password, companyName, userName, username) {
    try {
      if (!companyName || !userName || !username) throw new Error("Company name, user name and username are required");

      const usernameCheck = await getDocs(query(collection(db, 'pseudos'), where('__name__', '==', username)));
      if (!usernameCheck.empty) throw new Error("Ce nom d'utilisateur est déjà pris");

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      const companyRef = doc(collection(db, 'companies'));
      const companyId = companyRef.id;

      const batch = writeBatch(db);

      batch.set(companyRef, {
        name: companyName,
        createdAt: new Date(),
        createdBy: userId,
        status: 'active',
        supadmin: userId
      });

      batch.set(doc(db, `companies/${companyId}/profiles`, userId), {
        firstName: userName.split(' ')[0],
        lastName: userName.split(' ').slice(1).join(' '),
        email,
        companyName,
        createdAt: new Date(),
        role: ROLES.SUPADMIN
      });

      batch.set(doc(db, 'users', userId), {
        email,
        name: userName,
        companyId,
        username,
        role: ROLES.SUPADMIN,
        createdAt: new Date(),
        lastLogin: new Date(),
        lastActivity: serverTimestamp()
      });

      batch.set(doc(db, 'pseudos', username), {
        email,
        createdAt: new Date()
      });

      await batch.commit();
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  async function login(identifier, password) {
    try {
      let email = identifier;
      if (!identifier.includes('@')) {
        const pseudoSnap = await getDoc(doc(db, 'pseudos', identifier));
        if (!pseudoSnap.exists()) throw new Error("Nom d'utilisateur non trouvé");
        email = pseudoSnap.data().email;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) throw new Error("Compte non trouvé");

      const userData = userDoc.data();
      if (userData.disabled === true) {
        await signOut(auth);
        throw new Error("Votre compte a été désactivé. Contactez votre administrateur.");
      }

      // Mettre à jour lastLogin uniquement pour les rôles avec permission d'écriture
      if (['superadmin', 'supadmin', 'admin', 'rh_daf'].includes(userData.role)) {
        await setDoc(doc(db, 'users', user.uid), {
          lastLogin: serverTimestamp(),
          lastActivity: serverTimestamp()
        }, { merge: true });
      }

      return {
        uid: user.uid,
        email: user.email,
        ...userData,
        role: userData.role,
        companyId: userData.companyId,
        name: userData.name || userData.username || email.split('@')[0]
      };
    } catch (error) {
      // Déconnexion en cas d'erreur
      try {
        await signOut(auth);
      } catch {}
      throw error;
    }
  }

  function logout() { return handleLogout(); }

  async function createSubUser(email, password, userName, role = ROLES.LECTEUR) {
    if (!currentUser ||
      (currentUser.role !== ROLES.ADMIN &&
        currentUser.role !== ROLES.SUPADMIN &&
        !isSuperAdmin())) {
      throw new Error("Unauthorized");
    }

    if (currentUser.role === ROLES.ADMIN && role === ROLES.SUPADMIN) {
      throw new Error("Vous ne pouvez pas créer un supadmin");
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      await sendPasswordResetEmail(auth, email);

      const batch = writeBatch(db);
      const companyId = currentUser.companyId;

      batch.set(doc(db, `companies/${companyId}/profiles`, userId), {
        firstName: userName.split(' ')[0],
        lastName: userName.split(' ').slice(1).join(' '),
        email,
        createdAt: new Date(),
        role,
        permissions: PERMISSIONS[role],
        createdBy: currentUser.uid,
        tempPassword: true
      });

      batch.set(doc(db, 'users', userId), {
        email,
        name: userName,
        companyId,
        role,
        createdAt: new Date(),
        isActive: true,
        permissions: PERMISSIONS[role],
        tempPassword: true,
        lastActivity: serverTimestamp()
      });

      await batch.commit();
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  async function updateUserRole(userId, newRole) {
    if (!currentUser ||
      (currentUser.role !== ROLES.ADMIN &&
        currentUser.role !== ROLES.SUPADMIN &&
        !isSuperAdmin())) {
      throw new Error("Unauthorized");
    }

    if (currentUser.role === ROLES.ADMIN && newRole === ROLES.SUPADMIN) {
      throw new Error("Vous ne pouvez pas attribuer le rôle supadmin");
    }

    try {
      const batch = writeBatch(db);
      const companyId = currentUser.companyId;
      batch.update(doc(db, `companies/${companyId}/profiles`, userId), {
        role: newRole,
        permissions: PERMISSIONS[newRole]
      });
      batch.update(doc(db, 'users', userId), {
        role: newRole,
        permissions: PERMISSIONS[newRole]
      });
      await batch.commit();
    } catch (error) {
      throw error;
    }
  }

  function checkPermission(permission) {
    if (!currentUser) return false;
    return PERMISSIONS[currentUser.role]?.[permission] ?? false;
  }

  function isSuperAdmin() {
    return currentUser?.isSuperAdmin || currentUser?.customClaims?.superAdmin || currentUser?.role === ROLES.SUPERADMIN;
  }

  function isSupAdmin() {
    return currentUser?.role === ROLES.SUPADMIN;
  }

  function resetPassword(email) { return sendPasswordResetEmail(auth, email); }

  function shouldDefaultToPayroll() {
    return [ROLES.RH_DAF, ROLES.SUPADMIN, ROLES.ADMIN].includes(currentUser?.role);
  }

  function canToggleModules() {
    return [ROLES.ADMIN, ROLES.COMPTABLE, ROLES.SUPERADMIN, ROLES.SUPADMIN].includes(currentUser?.role);
  }

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
    isSuperAdmin,
    isSupAdmin,
    resetPassword,
    shouldDefaultToPayroll,
    canToggleModules
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
export { ROLES };