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

export const payrollService = {
  // 🔄 Lecture en temps réel des bulletins de paie
  getPayrolls: (companyId, callback) => {
    if (!companyId) return () => {};

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
        ipm: parseFloat(formData.retenues.ipm) || 0,
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
        salaireNet: calculations.salaireNet || 0,
        salaireNetAPayer: calculations.salaireNetAPayer || 0
      },
      statut: "draft", // draft, validated, paid, cancelled
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  // ➕ Création d'un bulletin de paie
  addPayroll: async (companyId, payrollData) => {
    try {
      const payrollsRef = collection(db, `companies/${companyId}/payrolls`);
      const docRef = await addDoc(payrollsRef, payrollData);

      // Créer une entrée dans la collection résumée
      const resumeRef = doc(db, `companies/${companyId}/payrolls_resume/${docRef.id}`);
      await setDoc(resumeRef, {
        numero: payrollData.numero,
        employeeName: payrollData.employeeName,
        employeeMatricule: payrollData.employeeMatricule,
        periode: payrollData.periode,
        salaireNetAPayer: payrollData.calculations.salaireNetAPayer,
        statut: payrollData.statut,
        createdAt: payrollData.createdAt
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

  // 💰 Marquer comme payé
  markAsPaid: async (companyId, payrollId, paymentDetails) => {
    try {
      const payrollRef = doc(db, `companies/${companyId}/payrolls/${payrollId}`);
      const resumeRef = doc(db, `companies/${companyId}/payrolls_resume/${payrollId}`);

      const paymentData = {
        statut: "paid",
        paymentDate: new Date().toISOString(),
        paymentMethod: paymentDetails.method || "virement",
        paymentReference: paymentDetails.reference || "",
        paymentNote: paymentDetails.note || "",
        updatedAt: new Date().toISOString()
      };

      await updateDoc(payrollRef, paymentData);
      await updateDoc(resumeRef, paymentData);

      return {
        success: true,
        message: "Bulletin marqué comme payé avec succès"
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

      await updateDoc(payrollRef, {
        statut: "cancelled",
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      await updateDoc(resumeRef, {
        statut: "cancelled",
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return { success: true, message: "Bulletin annulé avec succès !" };
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