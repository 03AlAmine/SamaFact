import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  doc,
  deleteDoc,
  updateDoc,
  where,
} from "firebase/firestore";

/*const convertIfTimestamp = (value) => {
  return value && typeof value.toDate === 'function' ? value.toDate() : value;
};
*/
export const invoiceService = {
getInvoices: (companyId, type, callback) => {
    if (!companyId) return () => {};
    
    const invoicesRef = collection(db, `companies/${companyId}/factures`);
    
    // Vérifiez que 'type' est une string valide
    if (typeof type !== 'string') {
        console.error("Type must be a string");
        return () => {};
    }
    
    // Construisez la query correctement
    const q = query(
        invoicesRef,
        where("type", "==", type) // 'type' doit être une string
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const invoicesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate?.() || null
        }));
        callback(invoicesData);
    });
    
    return unsubscribe;
},

  addInvoice: async (companyId, invoiceData, type = "facture") => {
    try {
      const invoiceToSave = {
        ...invoiceData,
        type,
        createdAt: new Date(),
        clientType: invoiceData.client?.type || 'client',
        originalClientName: invoiceData.client?.nom,
        originalCompanyName: invoiceData.client?.societe,
        hasCompanyNameChanged: invoiceData.client?.anciensNoms?.length > 0 || false,
        previousCompanyNames: invoiceData.client?.anciensNoms || []
      };

      const invoicesRef = collection(db, `companies/${companyId}/invoices`);
      const docRef = await addDoc(invoicesRef, invoiceToSave);

      return {
        success: true,
        id: docRef.id,
        message: "Facture créée avec succès !"
      };
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur lors de la création de la facture." };
    }
  },

  updateInvoice: async (companyId, invoiceId, invoiceData, type = "facture") => {
    try {
      const updatedData = {
        ...invoiceData,
        type,
        clientType: invoiceData.client?.type || 'client',
        originalClientName: invoiceData.client?.nom,
        originalCompanyName: invoiceData.client?.societe,
        hasCompanyNameChanged: invoiceData.client?.anciensNoms?.length > 0 || false,
        previousCompanyNames: invoiceData.client?.anciensNoms || []
      };

      const invoiceRef = doc(db, `companies/${companyId}/invoices/${invoiceId}`);
      await updateDoc(invoiceRef, updatedData);
      return { success: true, message: "Facture mise à jour avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur lors de la mise à jour de la facture." };
    }
  },

  deleteInvoice: async (companyId, invoiceId) => {
    try {
      const invoiceRef = doc(db, `companies/${companyId}/invoices/${invoiceId}`);
      await deleteDoc(invoiceRef);
      return { success: true, message: "Facture supprimée avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur lors de la suppression de la facture." };
    }
  },


};