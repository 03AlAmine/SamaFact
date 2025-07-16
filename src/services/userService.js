// src/services/userService.js

import {
  collection,
  doc,
  writeBatch,
  orderBy,
  query,
  where,
  getDocs,
  updateDoc
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

export const userService = {
  // Créer un nouvel utilisateur avec authentification isolée
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

      // Pseudo enregistré séparément
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

  // Obtenir les utilisateurs d'une entreprise
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

  // Mettre à jour un utilisateur
  updateUser: async (userId, updates) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  // Basculer le statut d'un utilisateur
  toggleUserStatus: async (userId, currentStatus) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        disabled: !currentStatus,
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error("Error toggling user status:", error);
      throw error;
    }
  },

  // Réinitialiser le mot de passe
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

  // Vérifier si un email existe
  checkEmailExists: async (email) => {
    try {
      const q = query(
        collection(db, 'users'),
        where('email', '==', email)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking email:", error);
      throw error;
    }
  },

  // Générer un mot de passe aléatoire
  generateRandomPassword: () => {
    return Math.random().toString(36).slice(-8) + 'A1!';
  }
};