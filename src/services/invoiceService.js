import { db } from "../firebase";
import { collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc } from "firebase/firestore";

export const invoiceService = {
  // Récupérer toutes les factures
  getInvoices: (callback) => {
    const q = query(collection(db, "factures"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(invoicesData);
    });
    return unsubscribe;
  },

  // Supprimer une facture
  deleteInvoice: async (invoiceId) => {
    try {
      await deleteDoc(doc(db, "factures", invoiceId));
      return { success: true, message: "Facture supprimée avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur lors de la suppression de la facture." };
    }
  },

  // Ajouter une facture
  addInvoice: async (invoiceData) => {
    try {
      const docRef = await addDoc(collection(db, "factures"), invoiceData);
      return { success: true, id: docRef.id, message: "Facture créée avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur lors de la création de la facture." };
    }
  },

  // Mettre à jour une facture
  updateInvoice: async (invoiceId, invoiceData) => {
    try {
      await updateDoc(doc(db, "factures", invoiceId), invoiceData);
      return { success: true, message: "Facture mise à jour avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur lors de la mise à jour de la facture." };
    }
  }
};