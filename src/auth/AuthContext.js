import { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  db,

} from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, companyName, userName) {
    try {
      // 1. Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Create company document
      const companyRef = doc(db, 'companies', userCredential.user.uid);
      await setDoc(companyRef, {
        name: companyName,
        createdAt: new Date(),
        createdBy: userCredential.user.uid,
        status: 'active'
      });

      // 3. Create user profile
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        email,
        name: userName,
        companyId: userCredential.user.uid, // Same as company ID for first user
        role: 'admin',
        createdAt: new Date(),
        lastLogin: new Date()
      });

      // 4. Create empty profile settings
      const profileRef = doc(db, 'profiles', userCredential.user.uid);
      await setDoc(profileRef, {
        firstName: userName.split(' ')[0] || '',
        lastName: userName.split(' ').slice(1).join(' ') || '',
        companyName,
        email,
        companyStatus: '',
        phone: '',
        invoiceColor: '#3a86ff'
      });

      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Update last login time
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, { lastLogin: new Date() }, { merge: true });

      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUser({
            ...user,
            ...userDoc.data()
          });
        } else {
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}