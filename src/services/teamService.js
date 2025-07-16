import {
  collection,
  addDoc,
  query,
  doc,
  deleteDoc,
  updateDoc,
  where,
  getDocs,
  getDoc,
  orderBy,
  setDoc
} from "firebase/firestore";
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { db, firebaseConfig } from '../firebase';
import { writeBatch } from 'firebase/firestore';

export const teamService = {
  // SECTION GESTION DES ÉQUIPES

  getTeams: async (companyId) => {
    const q = query(
      collection(db, "teams"),
      where("companyId", "==", companyId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  addTeam: async (companyId, teamData) => {
    try {
      const docRef = await addDoc(collection(db, "teams"), {
        ...teamData,
        companyId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return {
        success: true,
        message: "Équipe ajoutée avec succès !",
        teamId: docRef.id
      };
    } catch (error) {
      console.error("Erreur:", error);
      throw error;
    }
  },

  updateTeam: async (teamId, teamData) => {
    try {
      await updateDoc(doc(db, "teams", teamId), {
        ...teamData,
        updatedAt: new Date()
      });
      return { success: true, message: "Équipe modifiée avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      throw error;
    }
  },

  deleteTeam: async (teamId) => {
    try {
      await deleteDoc(doc(db, "teams", teamId));
      return { success: true, message: "Équipe supprimée avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      throw error;
    }
  },

  checkTeamNameExists: async (companyId, name) => {
    const q = query(
      collection(db, "teams"),
      where("companyId", "==", companyId),
      where("nom", "==", name)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  },

  // SECTION GESTION DES UTILISATEURS

  getCompanyUsers: async (companyId) => {
    try {

      const q = query(
        collection(db, 'users'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error getting company users:", error);
      throw error;
    }
  },

  createCompanyUser: async (companyId, userId, userData) => {
    const companyRef = doc(db, 'companies', companyId);
    const userRef = doc(collection(companyRef, 'users'), userId);

    await setDoc(userRef, {
      ...userData,
      createdAt: new Date(),
      lastLoginAt: null,
      disabled: false
    });

    return userRef.id;
  },

  updateUser: async (companyId, userId, updates) => {
    const companyRef = doc(db, 'companies', companyId);
    const userRef = doc(companyRef, 'users', userId);

    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date()
    });
  },

  toggleUserStatus: async (companyId, userId, currentStatus) => {
    const companyRef = doc(db, 'companies', companyId);
    const userRef = doc(companyRef, 'users', userId);

    await updateDoc(userRef, {
      disabled: !currentStatus,
      updatedAt: new Date()
    });
  },

  checkEmailExists: async (companyId, email) => {
    const companyRef = doc(db, 'companies', companyId);
    const q = query(
      collection(companyRef, 'users'),
      where('email', '==', email)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  },

  getUser: async (companyId, userId) => {
    const companyRef = doc(db, 'companies', companyId);
    const userRef = doc(companyRef, 'users', userId);

    const docSnap = await getDoc(userRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },

  createUserWithIsolatedAuth: async (userData, currentUserId) => {
    try {
      // 1. Vérification de l'email
      const methods = await fetchSignInMethodsForEmail(getAuth(), userData.email);
      if (methods.length > 0) {
        throw new Error("Cet email est déjà utilisé");
      }

      // 2. Création d'une instance auth isolée
      const tempApp = initializeApp(firebaseConfig, "TempUserCreation");
      const tempAuth = getAuth(tempApp);


      // 3. Création de l'utilisateur
      const userCredential = await createUserWithEmailAndPassword(
        tempAuth,
        userData.email,
        userData.password
      );
      const userId = userCredential.user.uid;

      // 4. Envoi d'email de réinitialisation
      await sendPasswordResetEmail(tempAuth, userData.email);

      // 5. Déconnexion de l'instance temporaire
      await signOut(tempAuth);

      // 6. Création des documents utilisateur
      const batch = writeBatch(db);

      // Document principal
      const userRef = doc(db, "users", userId);
      batch.set(userRef, {
        email: userData.email,
        name: userData.name,
        username: userData.username,
        role: userData.role,
        companyId: userData.companyId,
        createdAt: new Date(),
        createdBy: currentUserId,
        isActive: true
      });

      // Document profil
      const profileRef = doc(db, `companies/${userData.companyId}/profiles`, userId);
      batch.set(profileRef, {
        firstName: userData.name.split(' ')[0] || '',
        lastName: userData.name.split(' ').slice(1).join(' ') || '',
        username: userData.username,
        email: userData.email,
        role: userData.role,
        createdAt: new Date(),
        createdBy: currentUserId
      });

      // 🔥 Nouveau : pseudo enregistré séparément
      const pseudoRef = doc(db, 'pseudos', userData.username);
      batch.set(pseudoRef, {
        email: userData.email,
        createdAt: new Date()
      });

      await batch.commit();


      // 7. Nettoyage
      await deleteApp(tempApp);

      return {
        success: true,
        userId,
        email: userData.email
      };

    } catch (error) {
      console.error("Erreur création utilisateur:", error);
      throw error;
    }

  },

  resetUserPassword: async (email) => {
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: "Email de réinitialisation envoyé" };
    } catch (error) {
      console.error("Erreur réinitialisation mot de passe:", error);
      throw error;
    }
  },

  deleteUser: async (companyId, userId) => {
    await deleteDoc(doc(db, 'users', userId));
    await deleteDoc(doc(db, 'companies', companyId, 'profiles', userId));
  },

};