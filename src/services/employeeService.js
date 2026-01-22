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
  orderBy,
  deleteDoc,
  limit,
  getDoc
} from "firebase/firestore";

export const employeeService = {
  generateMatricule: async (companyId) => {
    try {
      // Récupérer le code de l'entreprise depuis la collection companies
      const companyDoc = await getDoc(doc(db, "companies", companyId));
      if (!companyDoc.exists()) {
        throw new Error("Entreprise non trouvée");
      }

      const companyData = companyDoc.data();
      const companyCode = companyData.code || companyData.name.substring(0, 3).toUpperCase();

      // Chercher le dernier matricule pour cette entreprise
      const employeesRef = collection(db, `companies/${companyId}/employees`);
      const q = query(
        employeesRef,
        where("matricule", ">=", `${companyCode}-`),
        where("matricule", "<=", `${companyCode}-\uf8ff`),
        orderBy("matricule", "desc"),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      let lastNumber = 0;

      if (!querySnapshot.empty) {
        const lastMatricule = querySnapshot.docs[0].data().matricule;
        const match = lastMatricule.match(/-(\d+)$/);
        if (match) {
          lastNumber = parseInt(match[1], 10);
        }
      }

      // Générer le prochain numéro séquentiel
      const nextNumber = lastNumber + 1;
      const formattedNumber = nextNumber.toString().padStart(4, '0');

      return `${companyCode}-${formattedNumber}`;
    } catch (error) {
      console.error("Erreur génération matricule:", error);
      throw error;
    }
  },
  // Récupère tous les employés avec écoute en temps réel
  getEmployees: (companyId, callback) => {
    if (!companyId) return () => { };

    const employeesRef = collection(db, `companies/${companyId}/employees`);
    const q = query(employeesRef, orderBy("nom", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const employeesData = snapshot.docs.map(doc => {
        const data = doc.data();

        // Gestion robuste de la date d'embauche
        let dateEmbauche = null;

        if (data.dateEmbauche) {
          // Si c'est un Timestamp Firebase
          if (typeof data.dateEmbauche.toDate === 'function') {
            dateEmbauche = data.dateEmbauche.toDate().toISOString().split('T')[0];
          }
          // Si c'est déjà un objet Date
          else if (data.dateEmbauche instanceof Date) {
            dateEmbauche = data.dateEmbauche.toISOString().split('T')[0];
          }
          // Si c'est une string au format ISO
          else if (typeof data.dateEmbauche === 'string') {
            dateEmbauche = data.dateEmbauche.split('T')[0];
          }
        }

        return {
          id: doc.id,
          ...data,
          dateEmbauche: dateEmbauche,
          createdAt: data.createdAt?.toDate?.() || null
        };
      });

      callback(employeesData);
    });

    return unsubscribe;
  },
  // Dans employeeService.js, vérifiez que previewMatricule est bien définie
  previewMatricule: async (companyId) => {
    try {
      // Récupérer le code de l'entreprise
      const companyDoc = await getDoc(doc(db, "companies", companyId));
      if (!companyDoc.exists()) {
        throw new Error("Entreprise non trouvée");
      }

      const companyData = companyDoc.data();
      const companyCode = companyData.code || companyData.name.substring(0, 3).toUpperCase();

      // Chercher le dernier matricule
      const employeesRef = collection(db, `companies/${companyId}/employees`);
      const q = query(
        employeesRef,
        where("matricule", ">=", `${companyCode}-`),
        where("matricule", "<=", `${companyCode}-\uf8ff`),
        orderBy("matricule", "desc"),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      let lastNumber = 0;

      if (!querySnapshot.empty) {
        const lastMatricule = querySnapshot.docs[0].data().matricule;
        const match = lastMatricule.match(/-(\d+)$/);
        if (match) {
          lastNumber = parseInt(match[1], 10);
        }
      }

      // Générer le prochain numéro
      const nextNumber = lastNumber + 1;
      const formattedNumber = nextNumber.toString().padStart(4, '0');

      return `${companyCode}-${formattedNumber}`;
    } catch (error) {
      console.error("Erreur prévisualisation matricule:", error);
      return `${companyId.substring(0, 3).toUpperCase()}-0001`; // Fallback
    }
  },
  // Ajoute un nouvel employé
  addEmployee: async (companyId, employeeData) => {
    try {
      // Validation des données requises
      if (!employeeData.nom || !employeeData.prenom) {
        throw new Error("Nom et prénom sont obligatoires");
      }

      // Validation de la catégorie (doit être un nombre entre 1 et 10)
      const categorie = parseInt(employeeData.categorie, 10);
      if (isNaN(categorie) || categorie < 1 || categorie > 10) {
        throw new Error("La catégorie doit être un nombre entre 1 et 10");
      }

      // Générer le matricule automatiquement
      const matricule = await employeeService.generateMatricule(companyId);

      // S'assurer que les valeurs numériques sont correctement converties
      const validatedEmployeeData = {
        ...employeeData,
        categorie: categorie,
        matricule: matricule,
        dateEmbauche: employeeData.dateEmbauche ? new Date(employeeData.dateEmbauche) : null,
        fullName: `${employeeData.prenom} ${employeeData.nom}`.toLowerCase(),
        createdAt: new Date(),
        status: 'active',
        companyCode: matricule.split('-')[0],
        // Conversion des nouveaux champs
        ipm: parseFloat(employeeData.ipm || 0),
        sursalaire: parseFloat(employeeData.sursalaire || 0)
      };

      const employeesRef = collection(db, `companies/${companyId}/employees`);
      const docRef = await addDoc(employeesRef, validatedEmployeeData);

      return {
        success: true,
        message: "Employé ajouté avec succès !",
        employee: {
          id: docRef.id,
          ...validatedEmployeeData,
          dateEmbauche: employeeData.dateEmbauche
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

  // Mettez aussi à jour updateEmployee pour inclure ces champs
  updateEmployee: async (companyId, employeeId, employeeData) => {
    try {
      const employeeRef = doc(db, `companies/${companyId}/employees/${employeeId}`);

      // Mise à jour avec les nouveaux champs
      const updatedData = {
        ...employeeData,
        dateEmbauche: employeeData.dateEmbauche ? new Date(employeeData.dateEmbauche) : null,
        updatedAt: new Date(),
        fullName: `${employeeData.prenom} ${employeeData.nom}`.toLowerCase(),
        // Assurez-vous que les valeurs sont numériques
        ipm: typeof employeeData.ipm === 'number' ? employeeData.ipm : parseFloat(employeeData.ipm || 0),
        sursalaire: typeof employeeData.sursalaire === 'number' ? employeeData.sursalaire : parseFloat(employeeData.sursalaire || 0)
      };

      await updateDoc(employeeRef, updatedData);

      return {
        success: true,
        message: "Employé modifié avec succès !",
        updatedFields: Object.keys(employeeData),
        updatedEmployee: {
          ...employeeData,
          dateEmbauche: employeeData.dateEmbauche
        }
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
  statusEmployee: async (companyId, employeeId) => {
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

  deleteEmployee: async (companyId, employeeId) => {
    try {
      if (!companyId || !employeeId) {
        throw new Error("companyId et employeeId sont requis");
      }

      const employeeRef = doc(db, "companies", companyId, "employees", employeeId);
      await deleteDoc(employeeRef);

      return {
        success: true,
        message: "Employé supprimé avec succès !"
      };

    } catch (error) {
      console.error("Erreur suppression employé:", error);

      let errorMessage = "Erreur lors de la suppression de l'employé";

      if (error.code === 'permission-denied') {
        errorMessage = "Permission refusée. Vérifiez vos droits d'accès.";
      } else if (error.code === 'not-found') {
        errorMessage = "Employé introuvable.";
      }

      return {
        success: false,
        message: errorMessage
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