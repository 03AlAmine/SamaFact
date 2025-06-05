import { db } from "../firebase";
import { collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc, where, getDocs } from "firebase/firestore";

const convertIfTimestamp = (value) => {
  return value && typeof value.toDate === 'function' ? value.toDate() : value;
};

export const invoiceService = {
  getInvoices: (companyId, callback, type = "facture") => {
    const q = query(
      collection(db, "factures"),
      where("companyId", "==", companyId),
      where("type", "==", type) // 👈 filtre par type
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoicesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: convertIfTimestamp(data.date),
          createdAt: convertIfTimestamp(data.createdAt),
        };
      });
      callback(invoicesData);
    });

    return unsubscribe;
  },




  deleteInvoice: async (invoiceId) => {
    try {
      await deleteDoc(doc(db, "factures", invoiceId));
      return { success: true, message: "Facture supprimée avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur lors de la suppression de la facture." };
    }
  },

  addInvoice: async (companyId, invoiceData, type = "facture") => {
    try {
      const invoiceToSave = {
        ...invoiceData,
        companyId,
        type, // <--- ICI
        createdAt: new Date(),
        clientType: invoiceData.client?.type || 'client',
        originalClientName: invoiceData.client?.nom,
        originalCompanyName: invoiceData.client?.societe,
        hasCompanyNameChanged: invoiceData.client?.anciensNoms?.length > 0 || false,
        previousCompanyNames: invoiceData.client?.anciensNoms || []
      };

      const docRef = await addDoc(collection(db, "factures"), invoiceToSave);

      return {
        success: true,
        id: docRef.id,
        message: "Facture créée avec succès !"
      };
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur lors de la création de la facture." };
    }
  }
  ,

  updateInvoice: async (invoiceId, invoiceData, type = "facture") => {
    try {
      const updatedData = {
        ...invoiceData,
        type, // <--- s'assure que le type reste correct
        clientType: invoiceData.client?.type || 'client',
        originalClientName: invoiceData.client?.nom,
        originalCompanyName: invoiceData.client?.societe,
        hasCompanyNameChanged: invoiceData.client?.anciensNoms?.length > 0 || false,
        previousCompanyNames: invoiceData.client?.anciensNoms || []
      };

      await updateDoc(doc(db, "factures", invoiceId), updatedData);
      return { success: true, message: "Facture mise à jour avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur lors de la mise à jour de la facture." };
    }
  }
  ,

  loadClientInvoices: async (clientId, companyId, type = "facture") => {
    try {
      const q = query(
        collection(db, "factures"),
        where("companyId", "==", companyId),
        where("clientId", "==", clientId),
        where("type", "==", type)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || doc.data().date
      }));
    } catch (error) {
      console.error("Erreur:", error);
      throw error;
    }
  }

};