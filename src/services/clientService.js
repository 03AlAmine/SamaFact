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
  getDocs,
  orderBy
} from "firebase/firestore";

export const clientService = {
  getClients: (companyId, callback) => {
    if (!companyId) return () => { };

    const clientsRef = collection(db, `companies/${companyId}/clients`);
    const q = query(clientsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || null
      }));
      callback(clientsData);
    });

    return unsubscribe;
  },


  addClient: async (companyId, clientData) => {
    try {
      const clientsRef = collection(db, `companies/${companyId}/clients`);
      const docRef = await addDoc(clientsRef, {
        ...clientData,
        createdAt: new Date()
      });

      // Récupérer le document nouvellement créé
      const newClient = {
        id: docRef.id,
        ...clientData,
        createdAt: new Date()
      };

      return {
        success: true,
        message: "Client ajouté avec succès !",
        client: newClient
      };
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
      // Vérification des paramètres obligatoires
      if (!companyId || !clientId || !type) {
        throw new Error("Paramètres manquants : companyId, clientId et type sont requis");
      }

      // Construction du chemin de collection
      const invoicesRef = collection(db, `companies/${companyId}/factures`);

      // Création de la requête avec tri par date décroissante
      const q = query(
        invoicesRef,
        where("clientId", "==", clientId),
        where("type", "==", type),
        orderBy("date", "desc") // Tri par date décroissante
      );

      const querySnapshot = await getDocs(q);

      // Transformation des documents avec gestion robuste des dates
      const invoices = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const date = data.date ? convertIfTimestamp(data.date) : null;

        return {
          id: doc.id,
          ...data,
          date: date instanceof Date ? date.toISOString().split('T')[0] : null
        };
      });

      // Helper pour convertir Firestore Timestamp ou Date
      function convertIfTimestamp(value) {
        // Firestore Timestamp a une méthode toDate()
        if (value && typeof value.toDate === 'function') {
          return value.toDate();
        }
        // Si c'est déjà un objet Date
        if (value instanceof Date) {
          return value;
        }
        // Sinon, essayer de parser
        const parsed = new Date(value);
        return isNaN(parsed) ? null : parsed;
      }

      return invoices;

    } catch (error) {
      console.error("❌ Erreur lors du chargement des factures:", {
        errorCode: error.code,
        errorMessage: error.message,
        companyId,
        clientId,
        type
      });

      // Relancer une erreur plus descriptive
      throw new Error(`Impossible de charger les factures: ${error.message}`);
    }
  }

};