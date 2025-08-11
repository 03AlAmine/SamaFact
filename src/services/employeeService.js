import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  doc,
  updateDoc,
  where,
  getDocs,
  orderBy
} from "firebase/firestore";

export const employeeService = {
  // Récupère tous les employés avec écoute en temps réel
  getEmployees: (companyId, callback) => {
    if (!companyId) return () => {};

    const employeesRef = collection(db, `companies/${companyId}/employees`);
    const q = query(employeesRef, orderBy("nom", "asc")); // Tri par nom par défaut

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const employeesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateEmbauche: doc.data().dateEmbauche?.toDate?.() || null,
        createdAt: doc.data().createdAt?.toDate?.() || null
      }));
      callback(employeesData);
    });

    return unsubscribe;
  },

  // Ajoute un nouvel employé
  addEmployee: async (companyId, employeeData) => {
    try {
      // Validation des données requises
      if (!employeeData.nom || !employeeData.prenom || !employeeData.matricule) {
        throw new Error("Nom, prénom et matricule sont obligatoires");
      }

      const employeesRef = collection(db, `companies/${companyId}/employees`);
      const docRef = await addDoc(employeesRef, {
        ...employeeData,
        fullName: `${employeeData.prenom} ${employeeData.nom}`.toLowerCase(), // Pour la recherche
        createdAt: new Date(),
        status: 'active' // Statut par défaut
      });

      return {
        success: true,
        message: "Employé ajouté avec succès !",
        employee: {
          id: docRef.id,
          ...employeeData
        }
      };
    } catch (error) {
      console.error("Erreur:", error);
      return { 
        success: false, 
        message: error.message || "Erreur lors de l'ajout de l'employé." 
      };
    }
  },

  // Met à jour un employé existant
  updateEmployee: async (companyId, employeeId, employeeData) => {
    try {
      const employeeRef = doc(db, `companies/${companyId}/employees/${employeeId}`);
      
      // Mise à jour avec timestamp
      await updateDoc(employeeRef, {
        ...employeeData,
        updatedAt: new Date(),
        fullName: `${employeeData.prenom} ${employeeData.nom}`.toLowerCase()
      });

      return { 
        success: true, 
        message: "Employé modifié avec succès !",
        updatedFields: Object.keys(employeeData) 
      };
    } catch (error) {
      console.error("Erreur:", error);
      return { 
        success: false, 
        message: "Erreur lors de la modification de l'employé." 
      };
    }
  },

  // Supprime un employé
  deleteEmployee: async (companyId, employeeId) => {
    try {
      const employeeRef = doc(db, `companies/${companyId}/employees/${employeeId}`);
      
      // On ne supprime pas physiquement mais on marque comme inactif (soft delete)
      await updateDoc(employeeRef, {
        status: 'inactive',
        deletedAt: new Date()
      });

      return { 
        success: true, 
        message: "Employé désactivé avec succès !" 
      };
    } catch (error) {
      console.error("Erreur:", error);
      return { 
        success: false, 
        message: "Erreur lors de la suppression de l'employé." 
      };
    }
  },

  // Charge les bulletins de paie d'un employé
  loadEmployeePayrolls: async (companyId, employeeId) => {
    try {
      if (!companyId || !employeeId) {
        throw new Error("companyId et employeeId sont requis");
      }

      const payrollsRef = collection(db, `companies/${companyId}/payrolls`);
      const q = query(
        payrollsRef,
        where("employeeId", "==", employeeId),
        orderBy("periodEnd", "desc") // Tri par période décroissante
      );

      const querySnapshot = await getDocs(q);

      const payrolls = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          periodStart: data.periodStart?.toDate()?.toISOString().split('T')[0],
          periodEnd: data.periodEnd?.toDate()?.toISOString().split('T')[0],
          createdAt: data.createdAt?.toDate()?.toISOString()
        };
      });

      return payrolls;
    } catch (error) {
      console.error("Erreur lors du chargement des bulletins:", {
        errorCode: error.code,
        errorMessage: error.message,
        companyId,
        employeeId
      });
      throw new Error(`Impossible de charger les bulletins: ${error.message}`);
    }
  },

  // Recherche avancée d'employés
  searchEmployees: async (companyId, criteria) => {
    try {
      const employeesRef = collection(db, `companies/${companyId}/employees`);
      const queries = [];
      
      // Construction dynamique des requêtes
      if (criteria.nom) {
        queries.push(where("nom", ">=", criteria.nom));
        queries.push(where("nom", "<=", criteria.nom + '\uf8ff'));
      }
      
      if (criteria.departement) {
        queries.push(where("departement", "==", criteria.departement));
      }
      
      if (criteria.typeContrat) {
        queries.push(where("typeContrat", "==", criteria.typeContrat));
      }

      const q = query(employeesRef, ...queries);
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Erreur de recherche:", error);
      throw error;
    }
  }
};