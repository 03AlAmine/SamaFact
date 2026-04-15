import React, {
  createContext, useContext, useState, useEffect,
  useRef, useCallback,
} from "react";
import { employeeService } from "../services/employeeService";
import { payrollService } from "../services/payrollService";
import { useAudit, AUDIT_ACTIONS } from "./AuditContext";

const EmployeeContext = createContext(null);

export const EmployeeProvider = ({ children, companyId, activeTab }) => {
  const { logAction } = useAudit();

  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);

  const [employee, setEmployee] = useState({
    nom: "", prenom: "", adresse: "", categorie: "", poste: "",
    departement: "", dateEmbauche: "", typeContrat: "CDI",
    salaireBase: 0, ipm: 0, sursalaire: 0, avances: 0,
    indemniteTransport: 26000, primePanier: 0, indemniteResponsabilite: 0,
    indemniteDeplacement: 0, joursConges: 0, joursAbsence: 0,
    avanceSalaire: 0, joursCongesUtilises: 0,
  });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [nextMatricule, setNextMatricule] = useState("");
  const [importProgress, setImportProgress] = useState("");

  const loadedRef = useRef(false);
  const unsubsRef = useRef([]);

  const shouldLoad =
    activeTab === "employees" ||
    activeTab === "payrolls" ||
    activeTab === "dashboard";

  useEffect(() => {
    if (!companyId || !shouldLoad || loadedRef.current) return;
    loadedRef.current = true;

    const unsubEmployees = employeeService.getEmployees(companyId, (data) => {
      setEmployees(data);
    });
    const unsubPayrolls = payrollService.getPayrolls(companyId, (data) => {
      setPayrolls(data);
    });

    [unsubEmployees, unsubPayrolls].forEach((u) => {
      if (typeof u === "function") unsubsRef.current.push(u);
    });

    return () => {
      unsubsRef.current.forEach((u) => u());
      unsubsRef.current = [];
      loadedRef.current = false;
    };
  }, [companyId, shouldLoad]);

  const loadNextMatricule = useCallback(async () => {
    if (!companyId) return;
    try {
      const matricule = await employeeService.previewMatricule(companyId);
      setNextMatricule(matricule);
    } catch (err) {
      console.error("Erreur chargement matricule:", err);
      setNextMatricule("CODE-0001");
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId && activeTab === "employees") loadNextMatricule();
  }, [companyId, activeTab, loadNextMatricule]);

  const handleChangeemployee = useCallback(
    (e) => setEmployee((prev) => ({ ...prev, [e.target.name]: e.target.value })),
    []
  );

  const handleEditChangeemployee = useCallback(
    (e) => setEditingEmployee((prev) => ({ ...prev, [e.target.name]: e.target.value })),
    []
  );

  const handleSubmitemployee = useCallback(async (e) => {
    e.preventDefault();
    const employeeWithMatricule = { ...employee, matricule: nextMatricule };
    const result = await employeeService.addEmployee(companyId, employeeWithMatricule);
    if (result.success) {
      alert(result.message);
      
      // ✅ AUDIT: Création employé
      await logAction({
        action: AUDIT_ACTIONS.CREATE_EMPLOYEE,
        targetType: 'employe',
        targetId: result.employee?.id,
        targetLabel: `${employee.nom} ${employee.prenom}`,
        after: employeeWithMatricule,
      });
      
      setEmployee({
        nom: "", prenom: "", adresse: "", categorie: "", poste: "",
        departement: "", dateEmbauche: "", typeContrat: "CDI",
        salaireBase: 0, indemniteTransport: 26000, primePanier: 0,
        indemniteResponsabilite: 0, indemniteDeplacement: 0,
        joursConges: 0, joursAbsence: 0, avanceSalaire: 0, joursCongesUtilises: 0,
      });
      await loadNextMatricule();
    } else {
      alert(result.message);
    }
  }, [companyId, employee, nextMatricule, loadNextMatricule, logAction]);

  const handleEditEmployee = useCallback((emp) => {
    if (!emp) return;
    setEditingEmployee({ ...emp });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleDeleteEmployee = useCallback(async (employeeId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) return false;
    try {
      const employeeToDelete = employees.find(e => e.id === employeeId);
      
      const result = await employeeService.deleteEmployee(companyId, employeeId);
      if (result.success) {
        // ✅ AUDIT: Suppression employé
        await logAction({
          action: AUDIT_ACTIONS.DELETE_EMPLOYEE,
          targetType: 'employe',
          targetId: employeeId,
          targetLabel: employeeToDelete ? `${employeeToDelete.nom} ${employeeToDelete.prenom}` : employeeId,
          before: employeeToDelete,
        });
        
        if (selectedEmployee?.id === employeeId) setSelectedEmployee(null);
        alert("Employé supprimé avec succès");
        return true;
      } else {
        alert(result.message || "Échec de la suppression");
        return false;
      }
    } catch (err) {
      console.error("Erreur suppression employé:", err);
      let errorMessage = "Échec de la suppression de l'employé";
      if (err.code === "permission-denied") errorMessage = "Vous n'avez pas les droits pour supprimer cet employé";
      else if (err.code === "not-found") errorMessage = "Employé déjà supprimé ou introuvable";
      alert(errorMessage);
      return false;
    }
  }, [companyId, employees, selectedEmployee, logAction]);

  const handleUpdateEmployee = useCallback(async (e) => {
    e.preventDefault();
    const oldEmployee = employees.find(emp => emp.id === editingEmployee.id);
    
    const result = await employeeService.updateEmployee(companyId, editingEmployee.id, editingEmployee);
    if (result.success) {
      // ✅ AUDIT: Modification employé
      await logAction({
        action: AUDIT_ACTIONS.UPDATE_EMPLOYEE,
        targetType: 'employe',
        targetId: editingEmployee.id,
        targetLabel: `${editingEmployee.nom} ${editingEmployee.prenom}`,
        before: oldEmployee,
        after: editingEmployee,
      });
      
      alert(result.message);
      cancelEditEmployee();
    } else {
      alert(result.message);
    }
  }, [companyId, editingEmployee, employees, logAction]);

  const handleUpdateEmployeeSuivi = useCallback(async (employeeData) => {
    try {
      const oldEmployee = employees.find(emp => emp.id === employeeData.id);
      
      const result = await employeeService.updateEmployee(companyId, employeeData.id, employeeData);
      if (result.success) {
        // ✅ AUDIT: Modification suivi employé
        await logAction({
          action: AUDIT_ACTIONS.UPDATE_EMPLOYEE,
          targetType: 'employe',
          targetId: employeeData.id,
          targetLabel: `${employeeData.nom} ${employeeData.prenom}`,
          before: oldEmployee,
          after: employeeData,
          metadata: { source: 'suivi' },
        });
        
        alert(result.message);
        cancelEditEmployee();
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error("Erreur mise à jour employé:", err);
      alert("Erreur lors de la mise à jour");
    }
  }, [companyId, employees, logAction]);

  const cancelEditEmployee = useCallback(() => setEditingEmployee(null), []);

  const handleImportEmployee = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportProgress("Début de l'import des employés...");
    try {
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array", cellDates: true, cellNF: false, raw: false });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
      if (jsonData.length < 2) { setImportProgress("Fichier vide ou format incorrect"); return; }

      const headers = jsonData[0];
      const employeesToImport = [];
      let errorCount = 0;
      const errors = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0 || !row.some((cell) => cell && cell.toString().trim())) continue;
        try {
          const rowData = {};
          headers.forEach((header, index) => {
            if (header && header.trim()) {
              const cleanHeader = header.toString().toLowerCase().trim()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
              rowData[cleanHeader] = row[index] || "";
            }
          });
          const nom = rowData["nom"] || "";
          const prenom = rowData["prenom"] || "";
          if (!nom || !prenom) { errors.push(`Ligne ${i + 1}: Nom ou prénom manquant`); errorCount++; continue; }

          let dateEmbauche = "";
          const dateRaw = rowData["dateembauche"] || "";
          if (dateRaw) {
            try {
              const dateStr = dateRaw.toString().trim();
              const datePart = dateStr.split(" ")[0];
              if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
                dateEmbauche = datePart;
              } else {
                const parsedDate = new Date(dateStr);
                if (!isNaN(parsedDate.getTime())) {
                  dateEmbauche = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}-${String(parsedDate.getDate()).padStart(2, "0")}`;
                }
              }
            } catch (err) { console.warn("Erreur date:", err); }
          }

          employeesToImport.push({
            nom: nom.toString().trim(), prenom: prenom.toString().trim(),
            email: (rowData["email"] || "").toString().trim(),
            telephone: (rowData["telephone"] || "").toString().trim(),
            adresse: (rowData["adresse"] || "").toString().trim(),
            poste: (rowData["poste"] || "").toString().trim(),
            departement: (rowData["departement"] || "").toString().trim(),
            typeContrat: (rowData["typecontrat"] || "CDI").toString().trim(),
            salaireBase: parseFloat(rowData["salairebase"] || 0),
            sursalaire: parseFloat(rowData["sursalaire"] || 0),
            ipm: parseFloat(rowData["ipm"] || 0),
            categorie: (rowData["categorie"] || "").toString().trim(),
            nbreofParts: parseInt(rowData["nbreparts"] || 1, 10),
            indemniteTransport: parseFloat(rowData["indemnitetransport"] || 0),
            primePanier: parseFloat(rowData["primepanier"] || 0),
            indemniteResponsabilite: parseFloat(rowData["indemniteresponsabilite"] || 0),
            indemniteDeplacement: parseFloat(rowData["indemnitedeplacement"] || 0),
            dateEmbauche,
            joursConges: parseInt(rowData["joursconges"] || 0, 10),
            joursAbsence: parseInt(rowData["joursabsence"] || 0, 10),
            avanceSalaire: parseFloat(rowData["avancesalaire"] || 0),
            joursCongesUtilises: parseInt(rowData["jourscongesutilises"] || 0, 10),
          });
        } catch (err) { errors.push(`Ligne ${i + 1}: ${err.message}`); errorCount++; }
      }

      if (employeesToImport.length === 0) { setImportProgress("Aucun employé valide trouvé"); return; }
      setImportProgress(`Importation de ${employeesToImport.length} employés...`);

      let importedCount = 0;
      const importErrors = [];
      for (let i = 0; i < employeesToImport.length; i++) {
        try {
          const emp = employeesToImport[i];
          const result = await employeeService.addEmployee(companyId, emp);
          if (result.success) {
            importedCount++;
            // ✅ AUDIT: Import employé
            await logAction({
              action: AUDIT_ACTIONS.CREATE_EMPLOYEE,
              targetType: 'employe',
              targetId: result.employee?.id,
              targetLabel: `${emp.nom} ${emp.prenom}`,
              after: emp,
              metadata: { import: true },
            });
            if (i === employeesToImport.length - 1) loadNextMatricule();
          } else {
            importErrors.push(`Ligne ${i + 2}: ${result.message}`);
          }
        } catch (err) { importErrors.push(`Ligne ${i + 2}: ${err.message}`); }
        if (i % 5 === 0 || i === employeesToImport.length - 1)
          setImportProgress(`Importation... ${importedCount}/${employeesToImport.length}`);
      }

      let resultMessage = `${importedCount}/${employeesToImport.length} employés importés avec succès ✓`;
      if (errorCount > 0) resultMessage += `\n${errorCount} ligne(s) rejetée(s)`;
      if (importErrors.length > 0) { resultMessage += `\n${importErrors.length} erreur(s) d'import`; console.warn("Erreurs d'import:", importErrors); }
      setImportProgress(resultMessage);
    } catch (err) {
      console.error("Erreur import:", err);
      setImportProgress(`Erreur: ${err.message}`);
    } finally {
      if (e.target) e.target.value = "";
    }
  }, [companyId, loadNextMatricule, logAction]);

  const loadEmployeePayrolls = useCallback(async (employeeId) => {
    try {
      const employeeObj = employees.find((e) => e.id === employeeId);
      setSelectedEmployee(employeeObj);
      if (companyId && employeeId) {
        const result = await payrollService.getPayrollsByEmployee(companyId, employeeId);
        if (result.success) setPayrolls(result.data);
        else { console.error("Erreur chargement bulletins:", result.message); setPayrolls([]); }
      }
      setTimeout(() => {
        const el = document.querySelector(".payrolls-section");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    } catch (err) {
      console.error("Erreur loadEmployeePayrolls:", err);
      setPayrolls([]);
    }
  }, [companyId, employees]);

  // ✅ Fonctions pour les opérations sur les bulletins de paie
  const logPayrollCreate = useCallback(async (payrollData, payrollId) => {
    await logAction({
      action: AUDIT_ACTIONS.CREATE_PAYROLL,
      targetType: 'bulletin',
      targetId: payrollId,
      targetLabel: `${payrollData.employeNom} - ${payrollData.periode}`,
      after: payrollData,
    });
  }, [logAction]);

  const logPayrollUpdate = useCallback(async (oldPayroll, newPayrollData) => {
    await logAction({
      action: AUDIT_ACTIONS.UPDATE_PAYROLL,
      targetType: 'bulletin',
      targetId: oldPayroll.id,
      targetLabel: oldPayroll.numero,
      before: oldPayroll,
      after: newPayrollData,
    });
  }, [logAction]);

  const logPayrollValidate = useCallback(async (payroll, oldStatus) => {
    await logAction({
      action: AUDIT_ACTIONS.VALIDATE_PAYROLL,
      targetType: 'bulletin',
      targetId: payroll.id,
      targetLabel: payroll.numero,
      before: { status: oldStatus },
      after: { status: 'valide', dateValidation: new Date() },
    });
  }, [logAction]);

  const logPayrollPay = useCallback(async (payroll, paymentData) => {
    await logAction({
      action: AUDIT_ACTIONS.PAY_PAYROLL,
      targetType: 'bulletin',
      targetId: payroll.id,
      targetLabel: payroll.numero,
      before: { status: payroll.statut },
      after: { status: 'payé', montantVerse: paymentData.montantVerse, datePaiement: paymentData.datePaiement },
    });
  }, [logAction]);

  const logPayrollCancel = useCallback(async (payroll, oldStatus) => {
    await logAction({
      action: AUDIT_ACTIONS.CANCEL_PAYROLL,
      targetType: 'bulletin',
      targetId: payroll.id,
      targetLabel: payroll.numero,
      before: { status: oldStatus },
      after: { status: 'annulé' },
    });
  }, [logAction]);

  const value = {
    employees,
    payrolls,
    employee,
    editingEmployee,
    selectedEmployee,
    nextMatricule,
    importProgress,
    loadEmployeePayrolls,
    handleChangeemployee,
    handleEditChangeemployee,
    handleSubmitemployee,
    handleEditEmployee,
    handleDeleteEmployee,
    handleUpdateEmployee,
    handleUpdateEmployeeSuivi,
    cancelEditEmployee,
    handleImportEmployee,
    logPayrollCreate,
    logPayrollUpdate,
    logPayrollValidate,
    logPayrollPay,
    logPayrollCancel,
  };

  return <EmployeeContext.Provider value={value}>{children}</EmployeeContext.Provider>;
};

export const useEmployeeContext = () => {
  const ctx = useContext(EmployeeContext);
  if (!ctx) throw new Error("useEmployeeContext must be used inside EmployeeProvider");
  return ctx;
};