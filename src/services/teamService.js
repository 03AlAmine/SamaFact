import { db } from "../firebase";
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

export const teamService = {
  // ==============================================
  // SECTION GESTION DES ÉQUIPES
  // ==============================================
  
  /**
   * Récupère toutes les équipes d'une entreprise
   * @param {string} companyId - ID de l'entreprise
   * @returns {Promise<Array>} Liste des équipes
   */
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

  /**
   * Ajoute une nouvelle équipe
   * @param {string} companyId - ID de l'entreprise
   * @param {object} teamData - Données de l'équipe
   * @returns {Promise<object>} Résultat de l'opération
   */
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

  /**
   * Met à jour une équipe existante
   * @param {string} teamId - ID de l'équipe
   * @param {object} teamData - Nouvelles données de l'équipe
   * @returns {Promise<object>} Résultat de l'opération
   */
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

  /**
   * Supprime une équipe
   * @param {string} teamId - ID de l'équipe
   * @returns {Promise<object>} Résultat de l'opération
   */
  deleteTeam: async (teamId) => {
    try {
      await deleteDoc(doc(db, "teams", teamId));
      return { success: true, message: "Équipe supprimée avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      throw error;
    }
  },

  /**
   * Vérifie si un nom d'équipe existe déjà dans l'entreprise
   * @param {string} companyId - ID de l'entreprise
   * @param {string} name - Nom à vérifier
   * @returns {Promise<boolean>} True si le nom existe déjà
   */
  checkTeamNameExists: async (companyId, name) => {
    const q = query(
      collection(db, "teams"),
      where("companyId", "==", companyId),
      where("nom", "==", name)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  },

  // ==============================================
  // SECTION GESTION DES UTILISATEURS
  // ==============================================

  /**
   * Récupère tous les utilisateurs d'une entreprise
   * @param {string} companyId - ID de l'entreprise
   * @returns {Promise<Array>} Liste des utilisateurs
   */
  getCompanyUsers: async (companyId) => {
    const companyRef = doc(db, 'companies', companyId);
    const q = query(
      collection(companyRef, 'users'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  /**
   * Crée un nouvel utilisateur dans l'entreprise
   * @param {string} companyId - ID de l'entreprise
   * @param {string} userId - ID de l'utilisateur
   * @param {object} userData - Données de l'utilisateur
   * @returns {Promise<string>} ID de l'utilisateur créé
   */
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

  /**
   * Met à jour les informations d'un utilisateur
   * @param {string} companyId - ID de l'entreprise
   * @param {string} userId - ID de l'utilisateur
   * @param {object} updates - Données à mettre à jour
   * @returns {Promise<void>}
   */
  updateUser: async (companyId, userId, updates) => {
    const companyRef = doc(db, 'companies', companyId);
    const userRef = doc(companyRef, 'users', userId);
    
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date()
    });
  },

  /**
   * Bascule le statut actif/désactivé d'un utilisateur
   * @param {string} companyId - ID de l'entreprise
   * @param {string} userId - ID de l'utilisateur
   * @param {boolean} currentStatus - Statut actuel
   * @returns {Promise<void>}
   */
  toggleUserStatus: async (companyId, userId, currentStatus) => {
    const companyRef = doc(db, 'companies', companyId);
    const userRef = doc(companyRef, 'users', userId);
    
    await updateDoc(userRef, {
      disabled: !currentStatus,
      updatedAt: new Date()
    });
  },

  /**
   * Vérifie si un email existe déjà dans l'entreprise
   * @param {string} companyId - ID de l'entreprise
   * @param {string} email - Email à vérifier
   * @returns {Promise<boolean>} True si l'email existe déjà
   */
  checkEmailExists: async (companyId, email) => {
    const companyRef = doc(db, 'companies', companyId);
    const q = query(
      collection(companyRef, 'users'),
      where('email', '==', email)
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  },

  /**
   * Récupère les informations d'un utilisateur spécifique
   * @param {string} companyId - ID de l'entreprise
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<object|null>} Données de l'utilisateur ou null
   */
  getUser: async (companyId, userId) => {
    const companyRef = doc(db, 'companies', companyId);
    const userRef = doc(companyRef, 'users', userId);
    
    const docSnap = await getDoc(userRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }
};