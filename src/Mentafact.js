/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from './auth/AuthContext';
import { FaBell, FaUserCircle, FaCog, FaSignOutAlt, FaChevronDown, FaCreditCard, FaUser, FaSearch, FaChevronRight } from 'react-icons/fa';
import { clientService } from "./services/clientService";
import { invoiceService } from "./services/invoiceService";
import { teamService } from "./services/teamService";
import { getDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

// Import pages and components
import DashboardPage from "./pages/DashboardPage";
import ClientsPage from "./pages/ClientsPage";
import InvoicesPage from "./pages/InvoicesPage";
import StatsPage from "./pages/StatsPage";
import TeamsPage from "./pages/TeamsPage";
import Sidebar from "./pages/Sidebare";
import Preloader from './components/Preloader';
import CompanyNameDisplay from './components/CompanyNameDisplay';

import logo from './assets/Logo_Mf.png';
import "./css/Mentafact.css";

const Mentafact = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [companyId, setCompanyId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab_0, setActiveTab_0] = useState("factures");
    // eslint-disable-next-line no-unused-vars
    const [error, setError] = useState(null);

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

    const [stats, setStats] = useState({
        totalClients: 0,
        totalFactures: 0,
        revenusMensuels: 0,
        facturesImpayees: 0,
        totalEquipes: 0
    });

    useEffect(() => {
        const fetchCompanyId = async () => {
            if (!currentUser) return;

            try {
                let companyIdToSet = currentUser.companyId;

                if (!companyIdToSet) {
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userDoc.exists()) {
                        companyIdToSet = userDoc.data().companyId;
                    } else {
                        throw new Error("Profil utilisateur incomplet");
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

        const loadAllData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const resolvedCompanyId = await fetchCompanyId();
                if (!resolvedCompanyId) return;

                // Unified data loader
                const loadServiceData = async (service, ...args) => {
                    try {
                        if (typeof service === 'function') {
                            if (service === teamService.getTeams) {
                                return await service(resolvedCompanyId);
                            }
                            return await new Promise((resolve) => {
                                const unsubscribe = service(resolvedCompanyId, resolve, ...args);
                                return () => unsubscribe?.();
                            });
                        }
                        return [];
                    } catch (error) {
                        console.error(`Error loading ${service.name}:`, error);
                        return [];
                    }
                };

                const [clientsData, invoicesData, devisData, avoirsData, equipesData] = await Promise.all([
                    loadServiceData(clientService.getClients),
                    loadServiceData(invoiceService.getInvoices, "facture"),
                    loadServiceData(invoiceService.getInvoices, "devis"),
                    loadServiceData(invoiceService.getInvoices, "avoir"),
                    loadServiceData(teamService.getTeams)
                ]);

                // Validate and set data
                setClients(Array.isArray(clientsData) ? clientsData : []);
                setAllFactures(Array.isArray(invoicesData) ? invoicesData : []);
                setAllDevis(Array.isArray(devisData) ? devisData : []);
                setAllAvoirs(Array.isArray(avoirsData) ? avoirsData : []);
                setEquipes(Array.isArray(equipesData) ? equipesData : []);

                // Calculate stats
                const now = new Date();
                setStats({
                    totalClients: clientsData?.length || 0,
                    totalFactures: invoicesData?.length || 0,
                    revenusMensuels: (invoicesData || [])
                        .filter(f => f?.date && new Date(f.date).getMonth() === now.getMonth())
                        .reduce((sum, f) => sum + (parseFloat(f?.totalTTC) || 0), 0),
                    facturesImpayees: (invoicesData || []).filter(f => f?.statut === "en attente").length,
                    totalEquipes: equipesData?.length || 0
                });

            } catch (err) {
                console.error("Critical error:", {
                    message: err.message,
                    stack: err.stack,
                    user: currentUser?.uid
                });
                setError(err.message.includes("permissions")
                    ? "Accès refusé - Droits insuffisants"
                    : "Erreur de chargement des données");
            } finally {
                setInitialLoadComplete(true);
                setIsLoading(false);
            }
        };

        loadAllData();
        // Gestion du rechargement de page
        const handleBeforeUnload = () => {
            if (!isLoading) setIsLoading(true);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);


        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
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

    const handleDelete = async (clientId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
            const result = await clientService.deleteClient(clientId);
            if (result.success) {
                alert(result.message);
                if (selectedClient?.id === clientId) {
                    setSelectedClient(null);
                    setClientFactures([]);
                }
            } else {
                alert(result.message);
            }
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


    const handleDeleteFacture = async (factureId, type = "facture") => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer ce ${type} ?`)) {
            try {
                await invoiceService.deleteInvoice(factureId);
                alert(`${type.charAt(0).toUpperCase() + type.slice(1)} supprimé(e) avec succès !`);

                if (type === "facture") {
                    setAllFactures(allFactures.filter(f => f.id !== factureId));
                    setClientFactures(clientFactures.filter(f => f.id !== factureId));
                } else if (type === "devis") {
                    setAllDevis(allDevis.filter(d => d.id !== factureId));
                    setClientDevis(clientDevis.filter(d => d.id !== factureId));
                } else if (type === "avoir") {
                    setAllAvoirs(allAvoirs.filter(a => a.id !== factureId));
                    setClientAvoirs(clientAvoirs.filter(a => a.id !== factureId));
                }
            } catch (error) {
                console.error("Erreur:", error);
                alert(`Erreur lors de la suppression du ${type}.`);
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
    const filteredClients = clients.filter(client =>
        client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.societe?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
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

    const renderActiveTab = () => {
        switch (activeTab) {
            case "dashboard":
                return <DashboardPage
                    stats={stats}
                    allFactures={allFactures}
                    navigate={navigate}
                    clients={clients}
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
                    handleDelete={handleDelete}
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
                />;
            case "stats":
                return <StatsPage
                    stats={stats}
                    allFactures={allFactures}
                    clients={clients}
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
                                placeholder="Rechercher clients, factures..."
                                className="search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="search-shortcut">⌘K</div>
                        </div>
                    </div>

                    <div className="navbar-right">
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
                                    <span className="user-role">Administrateur</span>
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