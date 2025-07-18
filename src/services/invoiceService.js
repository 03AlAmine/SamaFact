import { db } from "../firebase";
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  setDoc
} from "firebase/firestore";

const convertIfTimestamp = (value) =>
  value && typeof value.toDate === "function" ? value.toDate() : value;

export const invoiceService = {
  // 🔄 Lecture en temps réel
  getInvoices: (companyId, type, callback) => {
    if (!companyId || typeof type !== "string") return () => { };

    const facturesRef = collection(db, `companies/${companyId}/factures`);
    const q = query(facturesRef, where("type", "==", type));

    return onSnapshot(q, (snapshot) => {
      const invoicesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: convertIfTimestamp(doc.data().date)
      }));
      callback(invoicesData);
    });
  },

  // 🔢 Génération d’un numéro unique de facture
  generateInvoiceNumber: async (companyId, date = new Date(), type = "facture") => {
    if (!companyId) return `${type}-TEMP`;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const prefixMap = { avoir: "AV", devis: "D", facture: "F" };
    const prefix = `${prefixMap[type] || "F"}-${year}${month}`;

    try {
      const facturesRef = collection(db, `companies/${companyId}/factures_resume`);
      const q = query(
        facturesRef,
        where("type", "==", type),
        orderBy("numero", "desc"),
        limit(10)
      );
      const snapshot = await getDocs(q);

      let maxNumber = 0;
      snapshot.forEach((doc) => {
        const numero = doc.data().numero;
        const match = numero?.match(/-(\d+)$/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNumber) maxNumber = num;
        }
      });

      return `${prefix}-${maxNumber + 1}`;
    } catch (error) {
      console.error("Erreur génération numéro :", error);
      return `${prefix}-1`;
    }
  },

  // 📝 Préparer les données de facture
  prepareInvoiceData: (formData) => {
    return {
      numero: formData.facture.Numéro[0],
      date: formData.facture.Date[0],
      dateEcheance:
        formData.facture.DateEcheance?.[0] ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      type: formData.facture.Type[0],
      clientNom: formData.client.Nom[0],
      clientAdresse: formData.client.Adresse[0],
      clientId: formData.clientId || null,
      ribs: formData.ribs || ["CBAO"],
      items: formData.items.Designation.map((_, index) => ({
        designation: formData.items.Designation[index],
        quantite: formData.items.Quantite[index],
        prixUnitaire: formData.items["Prix Unitaire"][index],
        tva: formData.items.TVA[index],
        montantHT: formData.items["Montant HT"]?.[index] || "0,00",
        montantTVA: formData.items["Montant TVA"]?.[index] || "0,00",
        prixTotal: formData.items["Prix Total"][index]
      })),
      totalHT: formData.totals["Total HT"][0],
      totalTVA: formData.totals["Total TVA"][0],
      totalTTC: formData.totals["Total TTC"][0]
    };
  },

  // 🔄 Transformer une facture Firestore → formulaire
  transformFactureData: (facture) => {
    if (!facture) return null;

    const items = {
      Designation: [],
      Quantite: [],
      "Prix Unitaire": [],
      TVA: [],
      "Montant HT": [],
      "Montant TVA": [],
      "Prix Total": []
    };

    facture.items?.forEach((item) => {
      items.Designation.push(item.designation);
      items.Quantite.push(item.quantite);
      items["Prix Unitaire"].push(item.prixUnitaire);
      items.TVA.push(item.tva);
      items["Montant HT"].push(item.montantHT);
      items["Montant TVA"].push(item.montantTVA);
      items["Prix Total"].push(item.prixTotal);
    });

    return {
      facture: {
        Numéro: [facture.numero || ""],
        Date: [facture.date || new Date().toISOString().split("T")[0]],
        DateEcheance: [facture.dateEcheance || ""],
        Type: [facture.type || "facture"]
      },
      client: {
        Nom: [facture.clientNom || ""],
        Adresse: [facture.clientAdresse || ""]
      },
      items,
      totals: {
        "Total HT": [facture.totalHT || "0,00"],
        "Total TVA": [facture.totalTVA || "0,00"],
        "Total TTC": [facture.totalTTC || "0,00"]
      },
      ribs: facture.ribs || ["CBAO"]
    };
  },

  // ➕ Création de facture
  addInvoice: async (companyId, userId, invoiceData) => {
    try {
      const invoiceToSave = {
        ...invoiceData,
        createdAt: new Date().toISOString(),
        statut: "en attente",
        userId,
        companyId
      };

      const facturesRef = collection(db, `companies/${companyId}/factures`);
      const docRef = await addDoc(facturesRef, invoiceToSave);

      const resumeRef = doc(db, `companies/${companyId}/factures_resume/${docRef.id}`);
      await setDoc(resumeRef, {
        numero: invoiceToSave.numero,
        type: invoiceToSave.type || "facture",
        date: invoiceToSave.date || new Date(),
        userId: userId,
        statut: invoiceToSave.statut,
        createdAt: invoiceToSave.createdAt
      });

      return {
        success: true,
        id: docRef.id,
        message: "Facture enregistrée avec succès !"
      };
    } catch (error) {
      console.error("Erreur ajout facture :", error);
      return { success: false, message: "Erreur lors de la création de la facture." };
    }
  },

  // ✏️ Mise à jour de facture
  updateInvoice: async (companyId, invoiceId, invoiceData) => {
    try {
      const invoiceRef = doc(db, `companies/${companyId}/factures/${invoiceId}`);
      await updateDoc(invoiceRef, invoiceData);

      const resumeRef = doc(db, `companies/${companyId}/factures_resume/${invoiceId}`);
      await setDoc(resumeRef, {
        numero: invoiceData.numero,
        type: invoiceData.type || "facture",
        date: invoiceData.date || new Date(),
        statut: invoiceData.statut || "en attente",
        createdAt: invoiceData.createdAt || new Date().toISOString()
      });

      return { success: true, message: "Facture mise à jour avec succès !" };
    } catch (error) {
      console.error("Erreur mise à jour facture :", error);
      return { success: false, message: "Erreur lors de la mise à jour de la facture." };
    }
  },

  // ❌ Suppression
  deleteInvoice: async (companyId, invoiceId) => {
    try {
      const invoiceRef = doc(db, `companies/${companyId}/factures/${invoiceId}`);
      const resumeRef = doc(db, `companies/${companyId}/factures_resume/${invoiceId}`);
      await deleteDoc(invoiceRef);
      await deleteDoc(resumeRef);

      return { success: true, message: "Facture supprimée avec succès !" };
    } catch (error) {
      console.error("Erreur suppression facture :", error);
      return { success: false, message: "Erreur lors de la suppression de la facture." };
    }
  },

  // 🔍 Récupérer une facture par ID
  getInvoiceById: async (companyId, invoiceId) => {
    try {
      const ref = doc(db, `companies/${companyId}/factures/${invoiceId}`);
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        return { success: true, data: snapshot.data() };
      } else {
        return { success: false, message: "Facture introuvable." };
      }
    } catch (error) {
      console.error("Erreur getInvoiceById :", error);
      return { success: false, message: "Erreur récupération facture." };
    }
  }
};
