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
  getDocs
} from "firebase/firestore";

export const clientService = {
  getClients: (companyId, callback) => {
    if (!companyId) return () => { };

    const clientsRef = collection(db, `companies/${companyId}/clients`);
    const q = query(clientsRef);

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
      const clientsRef = collection(db, `companies/${companyId}/clients`);
      await addDoc(clientsRef, {
        ...clientData,
        createdAt: new Date()
      });
      return { success: true, message: "Client ajouté avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur lors de l'ajout du client." };
    }
  },

  updateClient: async (companyId, clientId, clientData) => {
    try {
      const clientRef = doc(db, `companies/${companyId}/clients/${clientId}`);
      await updateDoc(clientRef, clientData);
      return { success: true, message: "Client modifié avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur lors de la modification du client." };
    }
  },


  deleteClient: async (companyId, clientId) => {
    try {
      const clientRef = doc(db, `companies/${companyId}/clients/${clientId}`);
      await deleteDoc(clientRef);
      return { success: true, message: "Client supprimé avec succès !" };
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "Erreur lors de la suppression du client." };
    }
  },

loadClientInvoices: async (companyId, clientId, type) => {
  
  try {
    const chemin = `companies/${companyId}/factures`;

    const invoicesRef = collection(db, chemin);
    const q = query(
      invoicesRef,
      where("clientId", "==", clientId),
      where("type", "==", type)
    );

    
    const querySnapshot = await getDocs(q);

  /*  if (querySnapshot.empty) {
      console.warn("Aucun document trouvé pour cette requête");
      return [];
    }*/

    const resultats = querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate?.() || null
      };
    });

    return resultats;
  } catch (error) {
    console.error("❌ Erreur complète:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
}

};