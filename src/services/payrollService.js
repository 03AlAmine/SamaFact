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
  setDoc,
  deleteField
} from "firebase/firestore";

const convertIfTimestamp = (value) =>
  value && typeof value.toDate === "function" ? value.toDate() : value;

// Fonction utilitaire pour nettoyer les objets des valeurs undefined
const cleanObject = (obj) => {
  const cleaned = { ...obj };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    } else if (typeof cleaned[key] === 'object' && cleaned[key] !== null) {
      cleaned[key] = cleanObject(cleaned[key]); // Nettoyer récursivement les objets imbriqués
    }
  });
  return cleaned;
};
export const payrollService = {
  // 🔄 Lecture en temps réel des bulletins de paie
  getPayrolls: (companyId, callback) => {
    if (!companyId) return () => { };

    const payrollsRef = collection(db, `companies/${companyId}/payrolls`);
    const q = query(payrollsRef, orderBy("periode.au", "desc"));

    return onSnapshot(q, (snapshot) => {
      const payrollsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        "periode.du": convertIfTimestamp(doc.data().periode.du),
        "periode.au": convertIfTimestamp(doc.data().periode.au)
      }));
      callback(payrollsData);
    });
  },

  // 🔢 Génération d'un numéro de bulletin unique
  generatePayrollNumber: async (companyId) => {
    if (!companyId) return "PAY-TEMP";

    try {
      const payrollsRef = collection(db, `companies/${companyId}/payrolls`);
      const q = query(payrollsRef, orderBy("numero", "desc"), limit(1));
      const snapshot = await getDocs(q);

      let lastNumber = 0;
      if (!snapshot.empty) {
        const lastPayroll = snapshot.docs[0].data();
        const match = lastPayroll.numero?.match(/-(\d+)$/);
        if (match) lastNumber = parseInt(match[1]);
      }

      const year = new Date().getFullYear();
      return `PAY-${year}-${lastNumber + 1}`;
    } catch (error) {
      console.error("Erreur génération numéro paie:", error);
      return `PAY-${new Date().getFullYear()}-1`;
    }
  },

  // 📝 Préparer les données de paie pour Firestore
  preparePayrollData: (formData, calculations, employee) => {
    return {
      numero: formData.numero || "",
      employeeId: employee.id,
      employeeName: `${employee.nom} ${employee.prenom}`,
      employeeMatricule: employee.matricule,
      employeePosition: employee.poste,
      employeeAddresse: employee.adresse,
      employeeCategorie: employee.categorie,
      nbreofParts: employee.nbreofParts || 1,
      periode: {
        du: formData.periode.du,
        au: formData.periode.au
      },
      remuneration: {
        tauxHoraire: parseFloat(formData.remuneration.tauxHoraire) || 0,
        salaireBase: parseFloat(formData.remuneration.salaireBase) || 0,
        sursalaire: parseFloat(formData.remuneration.sursalaire) || 0,
        indemniteDeplacement: parseFloat(formData.remuneration.indemniteDeplacement) || 0,
        autresIndemnites: parseFloat(formData.remuneration.autresIndemnites) || 0,
        avantagesNature: parseFloat(formData.remuneration.avantagesNature) || 0
      },
      primes: {
        transport: parseFloat(formData.primes.transport) || 0,
        panier: parseFloat(formData.primes.panier) || 0,
        responsabilite: parseFloat(formData.primes.responsabilite) || 0,
        autresPrimes: parseFloat(formData.primes.autresPrimes) || 0
      },
      retenues: {
        retenueSalaire: parseFloat(formData.retenues.retenueSalaire) || 0,
        qpartipm: parseFloat(formData.retenues.qpartipm) || 0,
        avances: parseFloat(formData.retenues.avances) || 0,
        trimf: parseFloat(formData.retenues.trimf) || 0,
        cfce: parseFloat(formData.retenues.cfce) || 0,
        ir: parseFloat(formData.retenues.ir) || 0
      },
      calculations: {
        brutSocial: calculations.brutSocial || 0,
        brutFiscal: calculations.brutFiscal || 0,
        cotisationsSalariales: calculations.cotisationsSalariales || 0,
        cotisationsPatronales: calculations.cotisationsPatronales || 0,
        cotisationsEmployeur: calculations.cotisationsEmployeur || 0,
        cotisationsEmp: calculations.cotisationsEmp || 0,
        cotisationsTotales: calculations.cotisationsTotales || 0,
        tooqpartipm: calculations.tooqpartipm || 0,
        totalRetnues: calculations.totalRetnues || 0,
        totalRetenuesPris: calculations.totalRetenuesPris || 0,
        totalPrimes: calculations.totalPrimes || 0,
        totalfiscales: calculations.totalfiscales || 0,
        salaireNet: calculations.salaireNet || 0,
        salaireNetAPayer: calculations.salaireNetAPayer || 0,
      },
      statut: "draft", // draft, validated, paid
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  // ➕ Création d'un bulletin de paie
  addPayroll: async (companyId, userId, payrollData) => {
    try {
      // Vérifier si un bulletin avec le même numéro existe déjà
      const payrollsRef = collection(db, `companies/${companyId}/payrolls`);
      const q = query(payrollsRef, where("numero", "==", payrollData.numero));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        return {
          success: false,
          message: "Un bulletin avec ce numéro existe déjà."
        };
      }

      const payrollToSave = {
        ...payrollData,
        companyId,
        userId,
        createdAt: new Date().toISOString(),
        statut: "draft"
      };

      const docRef = await addDoc(payrollsRef, payrollToSave);

      // Créer la collection résumée
      const resumeRef = doc(db, `companies/${companyId}/payrolls_resume/${docRef.id}`);
      await setDoc(resumeRef, {
        numero: payrollToSave.numero,
        employeeName: payrollToSave.employeeName,
        employeeMatricule: payrollToSave.employeeMatricule,
        periode: payrollToSave.periode,
        salaireNetAPayer: payrollToSave.calculations.salaireNetAPayer,
        statut: payrollToSave.statut,
        userId,
        companyId,
        createdAt: payrollToSave.createdAt
      });

      return {
        success: true,
        id: docRef.id,
        message: "Bulletin de paie enregistré avec succès !"
      };
    } catch (error) {
      console.error("Erreur ajout bulletin:", error);
      return { success: false, message: "Erreur lors de la création du bulletin." };
    }
  },


  // ✏️ Mise à jour d'un bulletin de paie
  updatePayroll: async (companyId, payrollId, payrollData) => {
    try {
      const payrollRef = doc(db, `companies/${companyId}/payrolls/${payrollId}`);
      await updateDoc(payrollRef, {
        ...payrollData,
        updatedAt: new Date().toISOString()
      });

      // Mettre à jour le résumé
      const resumeRef = doc(db, `companies/${companyId}/payrolls_resume/${payrollId}`);
      await updateDoc(resumeRef, {
        numero: payrollData.numero,
        salaireNetAPayer: payrollData.calculations.salaireNetAPayer,
        statut: payrollData.statut,
        updatedAt: new Date().toISOString()
      });

      return { success: true, message: "Bulletin mis à jour avec succès !" };
    } catch (error) {
      console.error("Erreur mise à jour bulletin:", error);
      return { success: false, message: "Erreur lors de la mise à jour du bulletin." };
    }
  },

  // ❌ Suppression d'un bulletin
  deletePayroll: async (companyId, payrollId) => {
    try {
      const payrollRef = doc(db, `companies/${companyId}/payrolls/${payrollId}`);
      const resumeRef = doc(db, `companies/${companyId}/payrolls_resume/${payrollId}`);
      await deleteDoc(payrollRef);
      await deleteDoc(resumeRef);

      return { success: true, message: "Bulletin supprimé avec succès !" };
    } catch (error) {
      console.error("Erreur suppression bulletin:", error);
      return { success: false, message: "Erreur lors de la suppression du bulletin." };
    }
  },

  // 🔍 Récupérer un bulletin par ID
  getPayrollById: async (companyId, payrollId) => {
    try {
      const ref = doc(db, `companies/${companyId}/payrolls/${payrollId}`);
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        return { success: true, data: snapshot.data() };
      } else {
        return { success: false, message: "Bulletin introuvable." };
      }
    } catch (error) {
      console.error("Erreur getPayrollById:", error);
      return { success: false, message: "Erreur récupération bulletin." };
    }
  },

  // 📊 Récupérer les bulletins par employé
  getPayrollsByEmployee: async (companyId, employeeId) => {
    try {
      const payrollsRef = collection(db, `companies/${companyId}/payrolls`);
      const q = query(payrollsRef, where("employeeId", "==", employeeId), orderBy("periode.au", "desc"));
      const snapshot = await getDocs(q);

      const payrolls = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        periode: {
          du: convertIfTimestamp(doc.data().periode.du),
          au: convertIfTimestamp(doc.data().periode.au)
        }
      }));

      return { success: true, data: payrolls };
    } catch (error) {
      console.error("Erreur getPayrollsByEmployee:", error);
      return { success: false, message: "Erreur récupération bulletins employé." };
    }
  },

  // ✅ Marquer comme validé
  validatePayroll: async (companyId, payrollId) => {
    try {
      const payrollRef = doc(db, `companies/${companyId}/payrolls/${payrollId}`);
      const resumeRef = doc(db, `companies/${companyId}/payrolls_resume/${payrollId}`);

      await updateDoc(payrollRef, {
        statut: "validated",
        validatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      await updateDoc(resumeRef, {
        statut: "validated",
        validatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return { success: true, message: "Bulletin validé avec succès !" };
    } catch (error) {
      console.error("Erreur validation bulletin:", error);
      return { success: false, message: "Erreur lors de la validation du bulletin." };
    }
  },

  // 💰 Marquer comme payé - VERSION CORRIGÉE
  markAsPaid: async (companyId, payrollId, paymentDetails) => {
    try {
      const payrollRef = doc(db, `companies/${companyId}/payrolls/${payrollId}`);
      const resumeRef = doc(db, `companies/${companyId}/payrolls_resume/${payrollId}`);

      // Récupérer le bulletin actuel pour connaître le montant déjà payé
      const currentPayroll = await getDoc(payrollRef);

      if (!currentPayroll.exists()) {
        return { success: false, message: "Bulletin introuvable." };
      }

      const currentData = currentPayroll.data();
      const alreadyPaid = currentData.montantPaye || 0;
      const newAmountPaid = alreadyPaid + (paymentDetails.montantPaye || 0);

      // Déterminer le statut en fonction du montant payé
      const netAPayer = currentData.calculations?.salaireNetAPayer || 0;
      const newStatus = newAmountPaid >= netAPayer ? "paid" : "partially_paid";

      // Gérer paymentDetails - s'assurer que c'est un tableau
      let existingPaymentDetails = [];

      if (Array.isArray(currentData.paymentDetails)) {
        existingPaymentDetails = currentData.paymentDetails;
      } else if (currentData.paymentDetails && typeof currentData.paymentDetails === 'object') {
        // Si paymentDetails existe mais n'est pas un tableau, le convertir en tableau
        existingPaymentDetails = [currentData.paymentDetails];
      }

      // Préparer les données de paiement en nettoyant les valeurs undefined
      const paymentData = cleanObject({
        statut: newStatus,
        montantPaye: newAmountPaid,
        paymentDetails: [
          ...existingPaymentDetails,
          cleanObject({
            datePaiement: paymentDetails.datePaiement || new Date().toISOString(),
            modePaiement: paymentDetails.modePaiement || "virement",
            reference: paymentDetails.reference || "",
            montantPaye: paymentDetails.montantPaye || 0,
            note: paymentDetails.note || "",
            timestamp: new Date().toISOString()
          })
        ],
        updatedAt: new Date().toISOString()
      });

      await updateDoc(payrollRef, paymentData);

      // Mettre à jour le résumé
      await updateDoc(resumeRef, cleanObject({
        statut: newStatus,
        montantPaye: newAmountPaid,
        updatedAt: new Date().toISOString()
      }));

      return {
        success: true,
        message: newStatus === "paid"
          ? "Bulletin marqué comme payé avec succès"
          : "Paiement partiel enregistré avec succès"
      };
    } catch (error) {
      console.error("Erreur marquage payé:", error);
      return {
        success: false,
        message: "Erreur technique lors de l'enregistrement du paiement"
      };
    }
  },

  // ↩️ Annuler un bulletin
  cancelPayroll: async (companyId, payrollId) => {
    try {
      const payrollRef = doc(db, `companies/${companyId}/payrolls/${payrollId}`);
      const resumeRef = doc(db, `companies/${companyId}/payrolls_resume/${payrollId}`);

      // Récupérer le bulletin actuel pour connaître son statut actuel
      const currentPayroll = await getDoc(payrollRef);

      if (!currentPayroll.exists()) {
        return { success: false, message: "Bulletin introuvable." };
      }

      const currentData = currentPayroll.data();

      // Déterminer le statut de retour selon le statut actuel
      let newStatus = "draft";

      if (currentData.statut === "paid" || currentData.statut === "partially_paid") {
        // Si le bulletin était payé, le remettre à "validated"
        newStatus = "validated";
      } else if (currentData.statut === "validated") {
        // Si le bulletin était validé, le remettre à "draft"
        newStatus = "draft";
      }
      // Si c'était déjà un brouillon, il reste en brouillon

      const updateData = {
        statut: newStatus,
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await updateDoc(payrollRef, updateData);
      await updateDoc(resumeRef, updateData);

      return {
        success: true,
        message: `Bulletin ${newStatus === "validated" ? "dé-payé et remis en validé" : "annulé"} avec succès !`
      };
    } catch (error) {
      console.error("Erreur annulation bulletin:", error);
      return { success: false, message: "Erreur lors de l'annulation du bulletin." };
    }
  },

  // 🔄 Rétablir un bulletin annulé
  restorePayroll: async (companyId, payrollId) => {
    try {
      const payrollRef = doc(db, `companies/${companyId}/payrolls/${payrollId}`);
      const resumeRef = doc(db, `companies/${companyId}/payrolls_resume/${payrollId}`);

      await updateDoc(payrollRef, {
        statut: "validated",
        cancelledAt: deleteField(),
        updatedAt: new Date().toISOString()
      });

      await updateDoc(resumeRef, {
        statut: "validated",
        cancelledAt: deleteField(),
        updatedAt: new Date().toISOString()
      });

      return { success: true, message: "Bulletin rétabli avec succès !" };
    } catch (error) {
      console.error("Erreur rétablissement bulletin:", error);
      return { success: false, message: "Erreur lors du rétablissement du bulletin." };
    }
  },

  // 📅 Récupérer les bulletins par période
  getPayrollsByPeriod: async (companyId, startDate, endDate) => {
    try {
      const payrollsRef = collection(db, `companies/${companyId}/payrolls`);
      const q = query(
        payrollsRef,
        where("periode.du", ">=", startDate),
        where("periode.au", "<=", endDate),
        orderBy("periode.du", "asc")
      );
      const snapshot = await getDocs(q);

      const payrolls = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        periode: {
          du: convertIfTimestamp(doc.data().periode.du),
          au: convertIfTimestamp(doc.data().periode.au)
        }
      }));

      return { success: true, data: payrolls };
    } catch (error) {
      console.error("Erreur getPayrollsByPeriod:", error);
      return { success: false, message: "Erreur récupération bulletins par période." };
    }
  }
};