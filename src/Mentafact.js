/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from './auth/AuthContext';
import { FaBell, FaUserCircle, FaCog, FaSignOutAlt, FaChevronDown, FaCreditCard, FaUser, FaSearch, FaChevronRight, FaMoneyBillWave, FaFileInvoiceDollar } from 'react-icons/fa';
import { clientService } from "./services/clientService";
import { employeeService } from "./services/employeeService";
import { invoiceService } from "./services/invoiceService";
import { payrollService } from "./services/payrollService";
import { teamService } from "./services/teamService";
import { getDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

// Import pages and components
import DashboardPage from "./pages/DashboardPage";
import ClientsPage from "./pages/ClientsPage";
import EmployeesPage from "./pages/EmployeePage";
import InvoicesPage from "./pages/InvoicesPage";
import PayrollsPage from "./pages/PayrollsPage";
import StatsPage from "./pages/StatsPage";
import TeamsPage from "./pages/TeamsPage";
import Sidebar from "./pages/Sidebare";
import Preloader from './components/Preloader';
import CompanyNameDisplay from './components/CompanyNameDisplay';

import { useAppContext } from './contexts/AppContext';
import { useUi } from './contexts/uiContext'; // Ajoutez cette importation


import logo from './assets/Logo_Mf.png';
import "./css/Mentafact.css";
import * as XLSX from 'xlsx';

const Mentafact = () => {
    const {
        currentUser,
        logout,
        canToggleModules, // Ajoutez cette ligne
        shouldDefaultToPayroll
    } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [companyId, setCompanyId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { activeTab, setActiveTab } = useUi(); // Remplacer l'ancien useState
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab_0, setActiveTab_0] = useState("factures");
    // eslint-disable-next-line no-unused-vars
    const [error, setError] = useState(null);
    const [importProgress, setImportProgress] = useState(""); // Ajouté pour l'import de clients

    // States for data
    const [client, setClient] = useState({ nom: "", adresse: "", email: "", telephone: "", societe: "", type: "client", anciensNoms: [] });
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [editingClient, setEditingClient] = useState(null);
    // eslint-disable-next-line no-unused-vars
    const [isEditing, setIsEditing] = useState(false);
    const [societeInput, setSocieteInput] = useState("");

    const [allFactures, setAllFactures] = useState([]);
    const [clientFactures, setClientFactures] = useState([]);
    const [allDevis, setAllDevis] = useState([]);
    const [clientDevis, setClientDevis] = useState([]);
    const [allAvoirs, setAllAvoirs] = useState([]);
    const [clientAvoirs, setClientAvoirs] = useState([]);

    const [equipe, setEquipe] = useState({ nom: "", description: "", responsable: "" });
    const [equipes, setEquipes] = useState([]);
    const [editingEquipe, setEditingEquipe] = useState(null);
    const [isEditingEquipe, setIsEditingEquipe] = useState(false);
    const { createSubUser, checkPermission } = useAuth();

    const [employee, setEmployee] = useState({
        nom: "",
        prenom: "",
        adresse: "",
        categorie: "",
        poste: "",
        departement: "",
        matricule: "",
        dateEmbauche: "",
        typeContrat: "CDI",
        salaireBase: 0,
        indemniteTransport: 26000,
        primePanier: 0,
        indemniteResponsabilite: 0,
        indemniteDeplacement: 0,
        joursConges: 0,
        joursAbsence: 0,
        avanceSalaire: 0,
        joursCongesUtilises: 0
    });
    const [employees, setEmployees] = useState([]);

    const [editingEmployee, setEditingEmployee] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [payrolls, setPayrolls] = useState([]);


    const [stats, setStats] = useState({
        totalClients: 0,
        totalFactures: 0,
        revenusMensuels: 0,
        facturesImpayees: 0,
        facturesPayees: 0,
        totalEquipes: 0,
        totalemployees: 0,
        totalpayrolls: 0,
    });

    const roleLabels = {
        superadmin: "Super Administrateur",
        admin: "Administrateur",
        comptable: "Comptable",
        charge_compte: "Chargé de compte",
        lecteur: "Lecteur",
        user: "Utilisateur",
        rh_daf: "RH_DAF"
    };
    useEffect(() => {
        const fetchCompanyId = async () => {
            if (!currentUser) return;

            try {
                let companyIdToSet = currentUser.companyId;
                if (!companyIdToSet) {
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userDoc.exists()) {
                        companyIdToSet = userDoc.data().companyId;
                    }
                }
                setCompanyId(companyIdToSet);
                return companyIdToSet;
            } catch (error) {
                console.error("Error fetching companyId:", error);
                setError("Erreur de chargement des informations de l'entreprise");
                return null;
            }
        };

        // Cette fonction gère les abonnements aux données
        const setupDataSubscriptions = async (companyId) => {
            if (!companyId) return;

            const unsubscribers = [];

            const clientsUnsub = clientService.getClients(companyId, (clientsData) => {
                setClients(clientsData);
                setStats(prev => ({
                    ...prev,
                    totalClients: clientsData.length
                }));
            });
            if (typeof clientsUnsub === "function") unsubscribers.push(clientsUnsub);

            const employeesUnsub = employeeService.getEmployees(companyId, (employeesData) => {
                setEmployees(employeesData);
                setStats(prev => ({
                    ...prev,
                    totalEmployees: employeesData.length
                }));
            });
            if (typeof employeesUnsub === "function") unsubscribers.push(employeesUnsub);

            const payrollsUnsub = payrollService.getPayrolls(companyId, (payrollsData) => {
                setPayrolls(payrollsData); // Correction ici - utiliser setPayrolls au lieu de setEmployees
                setStats(prev => ({
                    ...prev,
                    totalPayrolls: payrollsData.length
                }));
            });
            if (typeof payrollsUnsub === "function") unsubscribers.push(payrollsUnsub);

            const invoicesUnsub = invoiceService.getInvoices(companyId, "facture", (invoicesData) => {
                let filteredFactures = invoicesData;
                if (currentUser?.role === "charge_compte") {
                    filteredFactures = invoicesData.filter(f => f.userId === currentUser.uid);
                }
                setAllFactures(filteredFactures);
                setStats(prev => ({
                    ...prev,
                    totalFactures: filteredFactures.length,
                    revenusMensuels: filteredFactures
                        .filter(f => f?.date && new Date(f.date).getMonth() === new Date().getMonth())
                        .reduce((sum, f) => sum + (parseFloat(f?.totalTTC) || 0), 0),
                    facturesImpayees: filteredFactures.filter(f => f.statut === "en attente").length,
                    facturesPayees: filteredFactures.filter(f => f.statut === "payé").length
                }));
            });
            if (typeof invoicesUnsub === "function") unsubscribers.push(invoicesUnsub);

            // Devis
            const devisUnsub = invoiceService.getInvoices(companyId, "devis", (devisData) => {
                let filteredDevis = devisData;
                if (currentUser?.role === "charge_compte") {
                    filteredDevis = devisData.filter(d => d.userId === currentUser.uid);
                }
                setAllDevis(filteredDevis);
                setStats(prev => ({
                    ...prev,
                    totalDevis: filteredDevis.length
                }));
            });
            if (typeof devisUnsub === "function") unsubscribers.push(devisUnsub);

            // Avoirs
            const avoirsUnsub = invoiceService.getInvoices(companyId, "avoir", (avoirsData) => {
                let filteredAvoirs = avoirsData;
                if (currentUser?.role === "charge_compte") {
                    filteredAvoirs = avoirsData.filter(a => a.userId === currentUser.uid);
                }
                setAllAvoirs(filteredAvoirs);
                setStats(prev => ({
                    ...prev,
                    totalAvoirs: filteredAvoirs.length
                }));
            });
            if (typeof avoirsUnsub === "function") unsubscribers.push(avoirsUnsub);

            // Equipes
            const equipesUnsub = teamService.getTeams(companyId, (equipesData) => {
                setEquipes(equipesData);
                setStats(prev => ({
                    ...prev,
                    totalEquipes: equipesData.length
                }));
            });
            if (typeof equipesUnsub === "function") unsubscribers.push(equipesUnsub);

            return () => {
                unsubscribers.forEach(unsub => unsub());
            };
        };


        const loadData = async () => {
            setIsLoading(true);
            try {
                const companyId = await fetchCompanyId();
                if (!companyId) return;

                const unsubscribe = await setupDataSubscriptions(companyId);
                setInitialLoadComplete(true);
                setIsLoading(false);

                return unsubscribe;
            } catch (error) {
                console.error("Error loading data:", error);
                setError("Erreur de chargement des données");
                setIsLoading(false);
            }
        };

        const unsubscribePromise = loadData();

        return () => {
            // Cleanup function
            unsubscribePromise.then(unsubscribe => unsubscribe?.());
        };
    }, [currentUser]);


    const handleSocieteBlur = () => {
        const currentName = (editingClient.societe || "").trim();
        const newName = societeInput.trim();
        if (!newName || currentName === newName) return;

        const updatedClient = {
            ...editingClient,
            societe: newName,
            anciensNoms: [...(editingClient.anciensNoms || []), { nom: currentName, dateChangement: new Date().toISOString() }]
        };
        setEditingClient(updatedClient);
    };
    // Handlers et fonctions utilitaires...
    // Handlers clients
    const handleChange = (e) => setClient({ ...client, [e.target.name]: e.target.value });
    const handleEditChange = (e) => setEditingClient({ ...editingClient, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await clientService.addClient(companyId, client);
        if (result.success) {
            alert(result.message);
            setClient({ nom: "", adresse: "", email: "", telephone: "", societe: "", type: "client", anciensNoms: [] });

            // SUPPRIMEZ cette partie qui cause le double comptage
            // setClients(prevClients => [...prevClients, {
            //    id: result.client.id,
            //    ...client,
            //    createdAt: new Date()
            // }]);
        } else {
            alert(result.message);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const result = await clientService.updateClient(companyId, editingClient.id, editingClient);
        if (result.success) {
            alert(result.message);
            cancelEdit();
        } else {
            alert(result.message);
        }
    };

    const handleDeleteClient = async (clientId) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
            return false;
        }

        try {
            // 1. Suppression dans Firestore
            await deleteDoc(doc(db, `companies/${currentUser.companyId}/clients`, clientId));

            // 2. Mise à jour de tous les états concernés
            setClients(prev => prev.filter(client => client.id !== clientId));

            // 3. Réinitialiser le client sélectionné si c'est celui supprimé
            if (selectedClient?.id === clientId) {
                setSelectedClient(null);
                setClientFactures([]);
                setClientDevis([]);
                setClientAvoirs([]);
            }

            // 4. Feedback utilisateur
            alert("Client supprimé avec succès");
            return true;

        } catch (error) {
            console.error("Erreur suppression client:", error);

            // Gestion d'erreur plus détaillée
            let errorMessage = "Échec de la suppression du client";
            if (error.code === "permission-denied") {
                errorMessage = "Vous n'avez pas les droits pour supprimer ce client";
            } else if (error.code === "not-found") {
                errorMessage = "Client déjà supprimé ou introuvable";
            }

            alert(errorMessage);
            return false;
        }
    };

    const handleEdit = (client) => {
        setEditingClient({ ...client });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Annuler l'édition d'un client
    const cancelEdit = () => {
        setEditingClient(null);
        setIsEditing(false);
    };



    // Handlers employés
    const loadEmployeePayrolls = (employeeId) => {
        const employeeObj = employees.find(e => e.id === employeeId);
        setSelectedEmployee(employeeObj);
        // Chargez les bulletins de paie ici
    };
    const handleChangeemployee = (e) => setEmployee({ ...employee, [e.target.name]: e.target.value });
    const handleEditChangeemployee = (e) => setEditingEmployee({ ...editingEmployee, [e.target.name]: e.target.value });

    const handleSubmitemployee = async (e) => {
        e.preventDefault();
        const result = await employeeService.addEmployee(companyId, employee);
        if (result.success) {
            alert(result.message);
            setEmployee({
                nom: "",
                prenom: "",
                matricule: "",
                poste: "",
                departement: "",
                dateEmbauche: "",
                typeContrat: "CDI",
                salaireBase: 0
            });
        } else {
            alert(result.message);
        }
    };
    const handleEditEmployee = (employee) => {
        setEditingEmployee({ ...employee });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteEmployee = async (employeeId) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) {
            return false;
        }

        try {
            const result = await employeeService.deleteEmployee(companyId, employeeId);
            if (result.success) {
                setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
                alert(result.message);
                return true;
            }
        } catch (error) {
            console.error("Erreur suppression employé:", error);
            alert("Échec de la suppression");
            return false;
        }
    };

    const handleUpdateEmployee = async (e) => {
        e.preventDefault();
        const result = await employeeService.updateEmployee(companyId, editingEmployee.id, editingEmployee);
        if (result.success) {
            alert(result.message);
            cancelEditEmployee();
        } else {
            alert(result.message);
        }
    };

    const handleUpdateEmployeeSuivi = async (employeeData) => {  // Ne plus s'attendre à un événement
        try {
            const result = await employeeService.updateEmployee(
                companyId,
                employeeData.id,
                employeeData
            );

            if (result.success) {
                // Mettre à jour l'état local
                setEmployees(employees.map(emp =>
                    emp.id === employeeData.id ? employeeData : emp
                ));
                alert(result.message);
                cancelEditEmployee();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Erreur mise à jour employé:", error);
            alert("Erreur lors de la mise à jour");
        }
    };


    // Annuler l'édition d'un client
    const cancelEditEmployee = () => {
        setEditingEmployee(null);
        setIsEditing(false);
    };

    // Handlers équipes
    const handleEquipeChange = (e) => setEquipe({ ...equipe, [e.target.name]: e.target.value });
    const handleEquipeEditChange = (e) => setEditingEquipe({ ...editingEquipe, [e.target.name]: e.target.value });

    const handleEquipeSubmit = async (e) => {
        e.preventDefault();
        try {
            const result = await teamService.addTeam(companyId, equipe);
            if (result.success) {
                setEquipes([...equipes, { ...equipe, id: result.id }]);
                setStats(prev => ({ ...prev, totalEquipes: prev.totalEquipes + 1 }));
                alert(result.message);
                setEquipe({ nom: "", description: "", responsable: "" });
            }
        } catch (error) {
            console.error("Erreur:", error);
            alert("Erreur lors de l'ajout de l'équipe.");
        }
    };

    const handleEquipeUpdate = async (e) => {
        e.preventDefault();
        try {
            const result = await teamService.updateTeam(editingEquipe.id, editingEquipe);
            if (result.success) {
                setEquipes(equipes.map(eq => eq.id === editingEquipe.id ? editingEquipe : eq));
                alert(result.message);
                cancelEquipeEdit();
            }
        } catch (error) {
            console.error("Erreur:", error);
            alert("Erreur lors de la modification de l'équipe.");
        }
    };

    const handleEquipeDelete = async (equipeId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette équipe ?")) {
            try {
                const result = await teamService.deleteTeam(equipeId);
                if (result.success) {
                    setEquipes(equipes.filter(eq => eq.id !== equipeId));
                    setStats(prev => ({ ...prev, totalEquipes: prev.totalEquipes - 1 }));
                    alert(result.message);
                }
            } catch (error) {
                console.error("Erreur:", error);
                alert("Erreur lors de la suppression de l'équipe.");
            }
        }
    };

    const handleEquipeEdit = (equipe) => {
        setEditingEquipe({ ...equipe });
        setIsEditingEquipe(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Annuler l'édition d'une équipe
    const cancelEquipeEdit = () => {
        setEditingEquipe(null);
        setIsEditingEquipe(false);
    };

    // Handlers factures

    const handleDeleteFacture = async (docId, type) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer ce ${type} ?`)) {
            try {
                // Supprimer la facture complète
                await deleteDoc(doc(db, `companies/${currentUser.companyId}/factures`, docId));

                // Supprimer le résumé aussi
                await deleteDoc(doc(db, `companies/${currentUser.companyId}/factures_resume`, docId));

                // Mettre à jour l’état local
                setAllFactures(prev => prev.filter(doc => doc.id !== docId));

                alert(`${type} supprimé avec succès`);
                return true;
            } catch (error) {
                console.error("Erreur suppression:", error);
                alert("Échec de la suppression");
                return false;
            }
        }
    };


    const handleCreateInvoice = () => {
        if (!selectedClient) {
            alert("Veuillez sélectionner un client d'abord");
            return;
        }
        navigate("/bill", { state: { client: selectedClient } });
    };

    /*  const getLastThreeInvoices = () => [...allFactures]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 3); */

    // Filtres
    const filteredClients = (clients || []).filter(client =>
        client.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.societe?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredEmployees = (employees || []).filter(employee =>
        employee.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.societe?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredEquipes = equipes.filter(equipe =>
        equipe.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipe.responsable?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Déterminer quelles factures afficher selon l'onglet
    const getFacturesToDisplay = () => {
        if (activeTab === "clients" && selectedClient) {
            return clientFactures;
        }
        return allFactures;
    };

    // Fonction pour charger les factures d'un client sélectionné
    const loadClientInvoices = (clientId) => {
        const clientObj = clients.find(c => c.id === clientId);
        setSelectedClient(clientObj);

        // Filtrer les factures, devis et avoirs du client sélectionné
        setClientFactures(allFactures.filter(f => f.clientId === clientId));
        setClientDevis(allDevis.filter(d => d.clientId === clientId));
        setClientAvoirs(allAvoirs.filter(a => a.clientId === clientId));

    };

    const getDevisToDisplay = () => {
        if (activeTab === "clients" && selectedClient) {
            return clientDevis;
        }
        return allDevis;
    };

    const getAvoirsToDisplay = () => {
        if (activeTab === "clients" && selectedClient) {
            return clientAvoirs;
        }
        return allAvoirs;
    };
    const handleImportClient = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImportProgress("Début de l'import...");

        try {
            // 1. Lire le fichier Excel
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            setImportProgress("Conversion des données...");

            // 2. Transformer les données
            const clientsToImport = jsonData.map(row => ({
                societe: row['Responsable'] || row['Nom'] || '',
                nom: row['Raison sociale'] || row['Société'] || '',
                email: row['Email'] || row['E-mail'] || '',
                telephone: row['Téléphone'] || row['Phone'] || '',
                adresse: row['Adresse'] || row['Address'] || '',
                ville: row['Ville'] || row['City'] || '',
                type: (row['Type'] || 'client').toLowerCase()
            })).filter(client => client.nom.trim() !== '');

            if (clientsToImport.length === 0) {
                setImportProgress("Aucun client valide trouvé dans le fichier");
                return;
            }

            setImportProgress(`Importation de ${clientsToImport.length} clients...`);

            // 3. Importer les clients
            let importedCount = 0;
            for (const client of clientsToImport) {
                try {
                    const result = await clientService.addClient(companyId, client);
                    if (result.success) {
                        importedCount++;
                    }
                } catch (error) {
                    console.error("Erreur lors de l'import d'un client:", error);
                }
            }

            // 4. Mettre à jour la liste des clients
            //   const updatedClients = await clientService.getClients(companyId);
            // setClients(updatedClients);

            setImportProgress(`${importedCount}/${clientsToImport.length} clients importés avec succès`);

        } catch (error) {
            console.error("Erreur lors de l'import:", error);
            setImportProgress("Erreur lors de l'import: " + error.message);
        } finally {
            // Réinitialiser le champ de fichier
            e.target.value = '';
        }
    };
    const { activeModule, setActiveModule } = useAppContext();


    useEffect(() => {
        // Synchronise le module actif avec les permissions au chargement
        if (shouldDefaultToPayroll() && activeModule !== 'payroll') {
            setActiveModule('payroll');
        }
    }, [currentUser]); // Se déclenche quand currentUser change

    useEffect(() => {
        // Puis on gère la synchronisation des tabs
        if (activeModule === 'payroll') {
            if (activeTab === 'clients') setActiveTab('employees');
            if (activeTab === 'factures') setActiveTab('payrolls');
        } else {
            if (activeTab === 'employees') setActiveTab('clients');
            if (activeTab === 'payrolls') setActiveTab('factures');
        }
    }, [activeModule, activeTab]);


    const renderActiveTab = () => {
        switch (activeTab) {
            case "dashboard":
                return <DashboardPage
                    stats={stats}
                    allFactures={allFactures}
                    allDevis={allDevis}
                    allAvoirs={allAvoirs}
                    navigate={navigate}
                    clients={clients}
                    currentUser={currentUser} // 👈 Ajoute ça
                    employees={employees}
                    payrolls={payrolls}
                />;
            case "clients":
                return <ClientsPage
                    clients={clients}
                    filteredClients={filteredClients}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedClient={selectedClient}
                    loadClientInvoices={loadClientInvoices}
                    handleEdit={handleEdit}
                    handleDelete={handleDeleteClient}
                    client={client}
                    handleChange={handleChange}
                    handleSubmit={handleSubmit}
                    editingClient={editingClient}
                    handleEditChange={handleEditChange}
                    handleUpdate={handleUpdate}
                    cancelEdit={cancelEdit}
                    societeInput={societeInput}
                    setSocieteInput={setSocieteInput}
                    handleSocieteBlur={handleSocieteBlur}
                    clientFactures={clientFactures}
                    handleCreateInvoice={handleCreateInvoice}
                    handleImportClient={handleImportClient} // <-- Ajoutez cette ligne
                    importProgress={importProgress}
                />;
            case "employees":
                return <EmployeesPage
                    employees={employees}
                    filteredEmployees={filteredEmployees}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedEmployee={selectedEmployee}
                    loadEmployeePayrolls={loadEmployeePayrolls}
                    handleEdit={handleEditEmployee}
                    handleDelete={handleDeleteEmployee}
                    employee={employee}
                    handleChange={handleChangeemployee}
                    handleSubmit={handleSubmitemployee}
                    editingEmployee={editingEmployee}
                    handleEditChange={handleEditChangeemployee}
                    handleUpdate={handleUpdateEmployee}
                    handleUpdateSuivi={handleUpdateEmployeeSuivi}
                    cancelEdit={cancelEditEmployee}
                />;
            case "factures":
                return <InvoicesPage
                    activeTab_0={activeTab_0}
                    setActiveTab_0={setActiveTab_0}
                    getFacturesToDisplay={getFacturesToDisplay}
                    getDevisToDisplay={getDevisToDisplay}
                    getAvoirsToDisplay={getAvoirsToDisplay}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    navigate={navigate}
                    handleDeleteFacture={handleDeleteFacture}
                    selectedClient={selectedClient}
                    companyId={companyId}

                />;
            case "payrolls":
                return <PayrollsPage
                    payrolls={payrolls}
                    employees={employees}
                    selectedEmployee={selectedEmployee}
                    companyId={companyId}
                />;
            case "stats":
                return <StatsPage
                    stats={stats}
                    allFactures={allFactures}
                    clients={clients}
                    allDevis={allDevis}
                    allAvoirs={allAvoirs}
                    employees={employees}
                    payrolls={payrolls}

                />;
            case "equipes":
                return <TeamsPage
                    filteredEquipes={filteredEquipes}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    isEditingEquipe={isEditingEquipe}
                    editingEquipe={editingEquipe}
                    handleEquipeEditChange={handleEquipeEditChange}
                    handleEquipeUpdate={handleEquipeUpdate}
                    cancelEquipeEdit={cancelEquipeEdit}
                    equipe={equipe}
                    handleEquipeChange={handleEquipeChange}
                    handleEquipeSubmit={handleEquipeSubmit}
                    handleEquipeEdit={handleEquipeEdit}
                    handleEquipeDelete={handleEquipeDelete}
                    checkPermission={checkPermission}
                    createSubUser={createSubUser}
                />;
            default:
                return <div>Sélectionnez une section</div>;
        }
    };
    // Ajoutez cette vérification au début du return
    if (isLoading || !initialLoadComplete) {
        return <Preloader message="Sam@Fact ..." />;
    }
    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                logo={logo}

            />


            {/* Main Content */}
            <div className="main-content">
                {/* Navbar Premium */}
                <header className="navbar-premium">
                    <div className="navbar-left">
                        <div className="company-brand">
                            <div className="navbar-left">
                                <CompanyNameDisplay companyId={companyId} currentUser={currentUser} />
                            </div>
                        </div>

                        <div className="search-container">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher employees, factures..."
                                className="search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="search-shortcut">⌘K</div>
                        </div>
                    </div>

                    <div className="navbar-right">
                        <div className="module-toggle">
                            <button
                                className={`toggle-btn ${activeModule === 'mentafact' ? 'mentafact' : 'payroll'} clignote`}
                                onClick={() => setActiveModule(activeModule === 'mentafact' ? 'payroll' : 'mentafact')}
                                disabled={!canToggleModules()} // Utilisez la nouvelle fonction ici
                                title={!canToggleModules() ? "Changement de module réservé aux administrateurs et comptables" : ""}
                            >
                                {activeModule === 'mentafact' ? (
                                    <>
                                        <FaMoneyBillWave className="toggle-icon" />
                                        <span>Payroll</span>
                                    </>
                                ) : (
                                    <>
                                        <FaFileInvoiceDollar className="toggle-icon" />
                                        <span>Mentafact</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <button className="notification-btn">
                            <FaBell />
                            <span className="notification-badge pulse">3</span>
                        </button>

                        <div className="user-profile-dropdown">
                            <div className="user-profile-trigger">
                                <div className="user-avatar-wrapper">
                                    <FaUserCircle className="user-avatar" />
                                    <div className="user-status"></div>
                                </div>
                                <div className="user-info">
                                    <span className="user-name">{currentUser?.name || "Admin"}</span>
                                    <span className="user-role">{roleLabels[currentUser?.role] || "Rôle inconnu"}</span>
                                </div>
                                <FaChevronDown className="dropdown-arrow" />
                            </div>

                            <div className="dropdown-menu">
                                <div className="dropdown-header">
                                    <div className="user-avatar-wrapper large">
                                        <FaUserCircle className="user-avatar" />
                                    </div>
                                    <div className="user-info">
                                        <span className="user-name">{currentUser?.name || "Admin"}</span>
                                        <span className="user-email">{currentUser?.email || "admin@entreprise.com"}</span>
                                    </div>
                                </div>

                                <Link to="/profile" className="dropdown-item">
                                    <FaUser className="dropdown-icon" />
                                    <span>Mon Profil</span>
                                    <FaChevronRight className="dropdown-arrow-right" />
                                </Link>
                                <Link to="/settings" className="dropdown-item">
                                    <FaCog className="dropdown-icon" />
                                    <span>Paramètres</span>
                                    <FaChevronRight className="dropdown-arrow-right" />
                                </Link>
                                <Link to="/billing" className="dropdown-item">
                                    <FaCreditCard className="dropdown-icon" />
                                    <span>Abonnement</span>
                                    <FaChevronRight className="dropdown-arrow-right" />
                                </Link>

                                <div className="dropdown-divider"></div>

                                <button className="dropdown-item logout-btn" onClick={() => logout()}>
                                    <FaSignOutAlt className="dropdown-icon" />
                                    <span>Déconnexion</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="dashboard-container">
                    {renderActiveTab()}
                </div>
            </div>
        </div>
    );
};

export default Mentafact;