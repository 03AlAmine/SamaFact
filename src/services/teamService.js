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
import { onSnapshot } from "firebase/firestore";

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
  getTeamsRealtime: (companyId, callback) => {
    try {
      const q = query(
        collection(db, "teams"),
        where("companyId", "==", companyId),
        orderBy("createdAt", "desc")
      );

      return onSnapshot(q, (snapshot) => {
        const teams = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        callback(teams);
      });
    } catch (error) {
      console.error("Erreur realtime teams:", error);
      return null;
    }
  },

  getTeamMembers: async (teamId) => {
    try {
      const teamDoc = await getDoc(doc(db, "teams", teamId));
      if (!teamDoc.exists()) {
        throw new Error("Équipe non trouvée");
      }

      const teamData = teamDoc.data();
      const members = teamData.members || [];

      // Récupérer les données des utilisateurs membres
      const memberPromises = members.map(async (userId) => {
        try {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            return {
              id: userDoc.id,
              ...userDoc.data()
            };
          }
          return null;
        } catch (error) {
          console.error(`Erreur récupération utilisateur ${userId}:`, error);
          return null;
        }
      });

      const memberUsers = await Promise.all(memberPromises);
      return memberUsers.filter(user => user !== null);
    } catch (error) {
      console.error("Erreur récupération membres équipe:", error);
      throw error;
    }
  },

  addTeam: async (companyId, teamData) => {
    try {
      // S'assurer que les membres sont un tableau
      const teamWithMembers = {
        ...teamData,
        members: teamData.members || [], // Garantir que members existe
        companyId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, "teams"), teamWithMembers);

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
      const updateData = {
        ...teamData,
        updatedAt: new Date()
      };

      // S'assurer que members est toujours défini
      if (!updateData.members) {
        updateData.members = [];
      }

      await updateDoc(doc(db, "teams", teamId), updateData);
      return { success: true, message: "Équipe modifiée avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      throw error;
    }
  },

  checkTeamNameExists: async (companyId, teamName, excludeTeamId = null) => {
    try {
      let q = query(
        collection(db, "teams"),
        where("companyId", "==", companyId),
        where("nom", "==", teamName)
      );

      const querySnapshot = await getDocs(q);

      // Si on exclut une équipe (pour l'édition)
      if (excludeTeamId) {
        return querySnapshot.docs.some(doc => doc.id !== excludeTeamId);
      }

      return !querySnapshot.empty;
    } catch (error) {
      console.error("Erreur vérification nom équipe:", error);
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

  // ✅ Lecture unique des utilisateurs (pour cache — pas de listener permanent)
  getUsersOnce: async (companyId) => {
    try {
      const q = query(
        collection(db, 'users'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Erreur chargement users (once):", error);
      return [];
    }
  },

  // 🔥 GESTION TEMPS RÉEL DES UTILISATEURS
  getUsersRealtime: (companyId, callback) => {
    try {
      const q = query(
        collection(db, 'users'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );

      // Listener temps réel
      return onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        callback(users);
      });
    } catch (error) {
      console.error("Erreur realtime users:", error);
      return null;
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

  // Dans teamService.js
  updateUser: async (userId, updates) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date()
      });

      // Mettre à jour aussi le profil si nécessaire
      if (updates.companyId) {
        const profileRef = doc(db, `companies/${updates.companyId}/profiles`, userId);
        await updateDoc(profileRef, {
          ...updates,
          updatedAt: new Date()
        });
      }

      return { success: true, message: "Utilisateur modifié avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      throw error;
    }
  },


  // Dans teamService.js - CORRECTION
  toggleUserStatus: async (companyId, userId, currentStatus) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) throw new Error('Utilisateur non trouvé');

      const userData = userDoc.data();
      const auth = getAuth();
      const currentUser = auth.currentUser;

      // Vérifier que l'utilisateur cible appartient à la même compagnie
      if (userData.companyId !== companyId) {
        throw new Error('Permission refusée : utilisateur ne fait pas partie de votre compagnie');
      }

      // Empêcher l'auto-désactivation
      if (currentUser && currentUser.uid === userId) {
        throw new Error('Vous ne pouvez pas désactiver votre propre compte');
      }

      // 🔥 NOUVELLE LOGIQUE : Vérifier le rôle de l'utilisateur connecté
      const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const currentUserData = currentUserDoc.data();

      if (!currentUserData) {
        throw new Error('Impossible de vérifier vos permissions');
      }

      const currentUserRole = currentUserData.role;
      const targetUserRole = userData.role;

      // HIÉRARCHIE DES PERMISSIONS
      if (currentUserRole === 'admin') {
        // Admin ne peut pas désactiver admin, supadmin ou superadmin
        if (['admin', 'supadmin', 'superadmin'].includes(targetUserRole)) {
          throw new Error('Vous ne pouvez pas désactiver un administrateur');
        }
      }
      else if (currentUserRole === 'supadmin') {
        // Supadmin peut désactiver admin mais pas supadmin ou superadmin
        if (['supadmin', 'superadmin'].includes(targetUserRole)) {
          throw new Error('Vous ne pouvez pas désactiver un supadmin ou superadmin');
        }
        // ✅ Supadmin PEUT désactiver un admin (c'est nouveau !)
      }
      else if (currentUserRole === 'superadmin') {
        // Superadmin peut tout faire
        // ✅ Pas de restriction
      }
      else {
        // Autres rôles ne peuvent pas désactiver
        throw new Error('Vous n\'avez pas les permissions pour cette action');
      }

      // Si toutes les vérifications passent, procéder à la désactivation
      await updateDoc(userRef, {
        disabled: !currentStatus,
        updatedAt: new Date()
      });

      return {
        success: true,
        message: `Utilisateur ${!currentStatus ? 'désactivé' : 'activé'} avec succès`
      };
    } catch (error) {
      console.error('Erreur toggleUserStatus:', error);
      throw new Error(`Erreur lors de la ${!currentStatus ? 'désactivation' : 'activation'}: ${error.message}`);
    }
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
      // Validation des données requises
      if (!userData.email || !userData.role || !userData.companyId) {
        throw new Error("Données utilisateur incomplètes");
      }

      // 1. Vérification de l'email
      const methods = await fetchSignInMethodsForEmail(getAuth(), userData.email);
      if (methods.length > 0) {
        throw new Error("Cet email est déjà utilisé");
      }

      // 2. Vérification du nom d'utilisateur si fourni
      if (userData.username) {
        const pseudoDoc = await getDoc(doc(db, 'pseudos', userData.username));
        if (pseudoDoc.exists()) {
          throw new Error("Ce nom d'utilisateur est déjà pris");
        }
      }

      // 3. Création d'une instance auth isolée
      const tempApp = initializeApp(firebaseConfig, "TempUserCreation");
      const tempAuth = getAuth(tempApp);

      // 4. Création de l'utilisateur
      const userCredential = await createUserWithEmailAndPassword(
        tempAuth,
        userData.email,
        userData.password
      );
      const userId = userCredential.user.uid;

      // 5. Envoi d'email de réinitialisation
      await sendPasswordResetEmail(tempAuth, userData.email);

      // 6. Déconnexion de l'instance temporaire
      await signOut(tempAuth);

      // 7. Création des documents utilisateur
      const batch = writeBatch(db);

      // Document principal utilisateur
      const userRef = doc(db, "users", userId);
      batch.set(userRef, {
        email: userData.email,
        name: userData.name || '',
        username: userData.username || '',
        role: userData.role,
        companyId: userData.companyId,
        createdAt: new Date(),
        createdBy: currentUserId,
        disabled: false,
        lastLoginAt: null
      });

      // Document profil dans la sous-collection company
      const profileRef = doc(db, `companies/${userData.companyId}/profiles`, userId);
      batch.set(profileRef, {
        firstName: userData.name ? userData.name.split(' ')[0] || '' : '',
        lastName: userData.name ? userData.name.split(' ').slice(1).join(' ') || '' : '',
        username: userData.username || '',
        email: userData.email,
        role: userData.role,
        createdAt: new Date(),
        createdBy: currentUserId
      });

      // Enregistrement du pseudo si fourni
      if (userData.username) {
        const pseudoRef = doc(db, 'pseudos', userData.username);
        batch.set(pseudoRef, {
          email: userData.email,
          userId: userId,
          companyId: userData.companyId,
          createdAt: new Date()
        });
      }

      await batch.commit();

      // 8. Nettoyage
      await deleteApp(tempApp);

      return {
        success: true,
        userId,
        email: userData.email
      };

    } catch (error) {
      console.error("Erreur création utilisateur:", error);

      // Messages d'erreur plus explicites
      let errorMessage = "Erreur lors de la création de l'utilisateur";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Cet email est déjà utilisé";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Email invalide";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Mot de passe trop faible";
      }

      throw new Error(errorMessage);
    }
  },
  getTeamStats: async (companyId) => {
    try {
      const teams = await teamService.getTeams(companyId);

      const stats = {
        totalTeams: teams.length,
        teamsWithMembers: teams.filter(team => team.members && team.members.length > 0).length,
        totalMembers: teams.reduce((acc, team) => acc + (team.members ? team.members.length : 0), 0),
        teamsWithoutResponsable: teams.filter(team => !team.responsableId).length
      };

      return stats;
    } catch (error) {
      console.error("Erreur calcul statistiques équipes:", error);
      throw error;
    }
  },
  deleteUser: async (companyId, userId) => {
    try {
      const batch = writeBatch(db);

      // Supprimer l'utilisateur principal
      batch.delete(doc(db, 'users', userId));

      // Supprimer le profil
      batch.delete(doc(db, 'companies', companyId, 'profiles', userId));

      // Supprimer l'entrée pseudo si elle existe
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.username) {
          batch.delete(doc(db, 'pseudos', userData.username));
        }
      }

      await batch.commit();

      return { success: true, message: "Utilisateur supprimé avec succès" };
    } catch (error) {
      console.error("Erreur suppression utilisateur:", error);
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


};