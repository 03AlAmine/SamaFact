import { db } from "../firebase";
import { collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc, getDocs, where } from "firebase/firestore";

export const clientService = {
  getClients: (companyId, callback) => {
    const q = query(collection(db, "clients"), where("companyId", "==", companyId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(clientsData);
    });
    return unsubscribe;
  },

  addClient: async (companyId, clientData) => {
    try {
      await addDoc(collection(db, "clients"), {
        ...clientData,
        companyId,
        createdAt: new Date()
      });
      return { success: true, message: "Client ajouté avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur lors de l'ajout du client." };
    }
  },

  updateClient: async (clientId, clientData) => {
    try {
      await updateDoc(doc(db, "clients", clientId), clientData);
      return { success: true, message: "Client modifié avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur lors de la modification du client." };
    }
  },

  deleteClient: async (clientId) => {
    try {
      await deleteDoc(doc(db, "clients", clientId));
      return { success: true, message: "Client supprimé avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur lors de la suppression du client." };
    }
  },

  loadClientInvoices: async (companyId, clientId) => {
    try {
      const q = query(
        collection(db, "factures"), 
        where("companyId", "==", companyId),
        where("clientId", "==", clientId)
      );
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