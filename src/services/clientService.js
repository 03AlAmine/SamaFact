import { db } from "../firebase";
import { collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc, getDocs, where } from "firebase/firestore";

export const clientService = {
  // Récupérer tous les clients
  getClients: (callback) => {
    const q = query(collection(db, "clients"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(clientsData);
    });
    return unsubscribe;
  },

  // Ajouter un nouveau client
  addClient: async (clientData) => {
    try {
      await addDoc(collection(db, "clients"), clientData);
      return { success: true, message: "Client ajouté avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur lors de l'ajout du client." };
    }
  },

  // Mettre à jour un client
  updateClient: async (clientId, clientData) => {
    try {
      await updateDoc(doc(db, "clients", clientId), clientData);
      return { success: true, message: "Client modifié avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur lors de la modification du client." };
    }
  },

  // Supprimer un client
  deleteClient: async (clientId) => {
    try {
      await deleteDoc(doc(db, "clients", clientId));
      return { success: true, message: "Client supprimé avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur lors de la suppression du client." };
    }
  },

  // Charger les factures d'un client
  loadClientInvoices: async (clientId) => {
    try {
      const q = query(collection(db, "factures"), where("clientId", "==", clientId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Erreur lors du chargement des factures:", error);
      throw error;
    }
  }
};