import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
    FaFileInvoiceDollar, FaChartLine, FaBell, FaEdit, FaPlus,
    FaSearch, FaTrash, FaEnvelope, FaPhone, FaMapMarkerAlt,
    FaBuilding, FaChartBar, FaUserCircle, FaUsers
} from 'react-icons/fa';
import { MdDashboard } from "react-icons/md";

// Import des services
import { ClientService } from "../services/client.service";
import { FactureService } from "../services/facture.service";
import { EquipeService } from "../services/equipe.service";
import { StatistiquesService } from "../services/statistiques.service";

import "./css/Dashbill.css";
import logo from './assets/logo.png';

const Dashbill = () => {
    // États principaux
    const [clients, setClients] = useState([]);
    const [factures, setFactures] = useState([]);
    const [equipes, setEquipes] = useState([]);
    const [stats, setStats] = useState({
        totalClients: 0,
        totalFactures: 0,
        revenusMensuels: 0,
        facturesImpayees: 0,
        totalEquipes: 0
    });

    // États UI
    const [selectedClient, setSelectedClient] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const navigate = useNavigate();

    // Formulaires
    const [clientForm, setClientForm] = useState({
        nom: "", adresse: "", email: "", telephone: "", societe: ""
    });

    const [equipeForm, setEquipeForm] = useState({
        nom: "", description: "", responsable: ""
    });

    // Éditions
    const [editingClient, setEditingClient] = useState(null);
    const [editingEquipe, setEditingEquipe] = useState(null);

    // Chargement des données
    useEffect(() => {
        // Clients
        const unsubscribeClients = ClientService.subscribeToClients(setClients);

        // Factures
        const unsubscribeFactures = FactureService.subscribeToAllFactures((facturesData) => {
            setFactures(facturesData);

            // Calcul des stats quand les factures changent
            const factureStats = FactureService.calculateStats(facturesData);
            setStats(prev => ({
                ...prev,
                totalFactures: factureStats.totalFactures,
                facturesImpayees: factureStats.facturesImpayees,
                revenusMensuels: factureStats.revenusMensuels
            }));
        });

        // Équipes (simulé)
        const loadEquipes = async () => {
            const equipesData = await EquipeService.getEquipes();
            setEquipes(equipesData);
            setStats(prev => ({ ...prev, totalEquipes: equipesData.length }));
        };
        loadEquipes();

        return () => {
            unsubscribeClients();
            unsubscribeFactures();
        };
    }, []);

    // Mise à jour des stats globales quand clients ou équipes changent
    useEffect(() => {
        setStats(prev => ({
            ...prev,
            totalClients: clients.length,
            totalEquipes: equipes.length
        }));
    }, [clients, equipes]);

    // Gestion des clients
    const handleClientSubmit = async (e) => {
        e.preventDefault();
        const { success } = await ClientService.addClient(clientForm);
        if (success) {
            setClientForm({ nom: "", adresse: "", email: "", telephone: "", societe: "" });
        }
    };

    const handleClientUpdate = async (e) => {
        e.preventDefault();
        await ClientService.updateClient(editingClient.id, editingClient);
        setEditingClient(null);
    };

    const handleClientDelete = async (clientId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
            await ClientService.deleteClient(clientId);
            if (selectedClient?.id === clientId) {
                setSelectedClient(null);
            }
        }
    };

    const loadClientFactures = async (clientId) => {
        const facturesData = await FactureService.getFacturesByClient(clientId);
        setFactures(facturesData);
        setSelectedClient(clients.find(c => c.id === clientId));
    };

    // Gestion des équipes
    const handleEquipeSubmit = async (e) => {
        e.preventDefault();
        const newEquipe = await EquipeService.addEquipe(equipeForm);
        setEquipes([...equipes, newEquipe]);
        setEquipeForm({ nom: "", description: "", responsable: "" });
    };

    const handleEquipeUpdate = async (e) => {
        e.preventDefault();
        const updatedEquipe = await EquipeService.updateEquipe(editingEquipe.id, editingEquipe);
        setEquipes(equipes.map(eq => eq.id === updatedEquipe.id ? updatedEquipe : eq));
        setEditingEquipe(null);
    };

    const handleEquipeDelete = async (equipeId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette équipe ?")) {
            await EquipeService.deleteEquipe(equipeId);
            setEquipes(equipes.filter(eq => eq.id !== equipeId));
        }
    };

    // Gestion des factures
    const handleDeleteFacture = async (factureId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
            await FactureService.deleteFacture(factureId);
            setFactures(factures.filter(f => f.id !== factureId));
        }
    };

    const handleCreateInvoice = () => {
        if (!selectedClient) {
            alert("Veuillez sélectionner un client d'abord");
            return;
        }
        navigate("/bill", { state: { client: selectedClient } });
    };

    // Filtres
    const filteredClients = ClientService.searchClients(clients, searchTerm);
    const filteredEquipes = EquipeService.searchEquipes(equipes, searchTerm);
    const lastInvoices = FactureService.getLastInvoices(factures, 3);

    // Rendu des onglets (comme avant, mais plus simple car la logique est dans les services)
    const renderActiveTab = () => {
        switch (activeTab) {
            case "dashboard":
                return <DashboardTab setClientForm
                    stats={stats}
                    lastInvoices={lastInvoices}
                    onCreateInvoice={() => navigate("/bill")}
                />;
            case "clients":
                return <ClientsTab
                    clients={filteredClients}
                    factures={factures}
                    selectedClient={selectedClient}
                    clientForm={clientForm}
                    editingClient={editingClient}
                    onClientFormChange={(e) => ({ ...clientForm, [e.target.name]: e.target.value })}
                    onClientSubmit={handleClientSubmit}
                    onClientUpdate={handleClientUpdate}
                    onClientEdit={(client) => setEditingClient(client)}
                    onCancelEdit={() => setEditingClient(null)}
                    onClientDelete={handleClientDelete}
                    onClientSelect={loadClientFactures}
                    onCreateInvoice={handleCreateInvoice}
                    onDeleteFacture={handleDeleteFacture}
                    searchTerm={searchTerm}
                    onSearchChange={(e) => setSearchTerm(e.target.value)}
                />;
            case "equipes":
                return <EquipesTab
                    equipes={filteredEquipes}
                    equipeForm={equipeForm}
                    editingEquipe={editingEquipe}
                    onEquipeFormChange={(e) => setEquipeForm({ ...equipeForm, [e.target.name]: e.target.value })}
                    onEquipeEditChange={(e) => setEditingEquipe({ ...editingEquipe, [e.target.name]: e.target.value })}
                    onEquipeSubmit={handleEquipeSubmit}
                    onEquipeUpdate={handleEquipeUpdate}
                    onEquipeEdit={(equipe) => setEditingEquipe(equipe)}
                    onCancelEquipeEdit={() => setEditingEquipe(null)}
                    onEquipeDelete={handleEquipeDelete}
                    searchTerm={searchTerm}
                    onSearchChange={(e) => setSearchTerm(e.target.value)}
                />;
            case "factures":
                return <FacturesTab
                    factures={factures}
                    onDeleteFacture={handleDeleteFacture}
                    onCreateInvoice={() => navigate("/bill")}
                    searchTerm={searchTerm}
                    onSearchChange={(e) => setSearchTerm(e.target.value)}
                />;
            case "stats":
                return <StatsTab stats={stats} />;
            default:
                return <div>Sélectionnez une section </div>;
        }
    };

    return (
        <div className="dashboard-layout" >
            {/* Sidebar */}
            < Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                logo={logo}
            />

            {/* Main Content */}
            < div className="main-content" >
                <Header
                    searchTerm={searchTerm}
                    onSearchChange={(e) => setSearchTerm(e.target.value)}
                />

                < div className="dashboard-container" >
                    {renderActiveTab()}
                </>
            </div>
        </div>
    );
};

// Composants séparés pour chaque onglet (à extraire dans des fichiers séparés)
const DashboardTab = ({ stats, lastInvoices, onCreateInvoice }) => {
    return (
        <>
            <div className="stats-grid" >
                <div className="stat-card" >
                    <div className="stat-icon clients" >
                        <FaUsers />
                    </div>
                    < div className="stat-info" >
                        <h3>{stats.totalClients} </h3>
                        < p > Clients </>
                    </div>
                </div>
                < div className="stat-card" >
                    <div className="stat-icon invoices" >
                        <FaFileInvoiceDollar />
                    </div>
                    < div className="stat-info" >
                        <h3>{stats.totalFactures} </h3>
                        < p > Factures </>
                    </div>
                </div>
                < div className="stat-card" >
                    <div className="stat-icon revenue" >
                        <FaChartLine />
                    </div>
                    < div className="stat-info" >
                        <h3>{stats.revenusMensuels.toLocaleString()} FCFA </h3>
                        < p > Facturations mensuels </>
                    </div>
                </div>
                < div className="stat-card" >
                    <div className="stat-icon pending" >
                        <FaBell />
                    </div>
                    < div className="stat-info" >
                        <h3>{stats.facturesImpayees} </h3>
                        < p > Impayées </>
                    </div>
                </div>
            </div>

            < div className="recent-invoices" >
                <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }
                }>
                    <h2 className="section-title" style={{ display: "flex", alignItems: "center", margin: 0 }}>
                        <FaFileInvoiceDollar style={{ marginRight: "10px" }} />
                        Dernières factures
                    </h2>

                    < div className="invoices-actions" style={{ display: "flex", gap: "10px" }}>
                        <button onClick={() => navigate("/bill")} className="create-invoice-btn" >
                            <FaPlus style={{ marginRight: "8px" }} />
                            Créer une facture
                        </button>
                    </div>
                </div>


                {
                    factures.length > 0 ? (
                        <div className="invoices-list" >
                            {
                                getLastThreeInvoices().map(invoice => (
                                    <div key={invoice.id} className="invoice-card" >
                                        <div className="invoice-header" >
                                            <span className="invoice-number" > {invoice.numero} </span>
                                            < span className={`invoice-status ${invoice.statut}`} >
                                                {invoice.statut}
                                            </span>
                                        </div>
                                        < div className="invoice-client" > {invoice.clientNom} </div>
                                        < div className="invoice-details" >
                                            <span className="invoice-amount" > {invoice.totalTTC} FCFA </span>
                                            < span className="invoice-date" >
                                                {new Date(invoice.date).toLocaleDateString('fr-FR')}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    ) : (
                        <div className="empty-state" >
                            <p>Aucune facture trouvée </p>
                        </div>
                    )}
            </div>
        </>
    );
};

const ClientsTab = ({ /* props */ }) => {
    return (
        <>
            {/* ... (votre code existant pour la gestion des clients) ... */}
        </>
    );
};

const EquipesTab = ({ /* props */ }) => {
    return (
        <>
            {/* ... (votre code existant pour la gestion des équipes) ... */}
        </>
    );
};

const FacturesTab = ({ /* props */ }) => {
    return (
        <>
            {/* ... (votre code existant pour la gestion des factures) ... */}
        </>
    );
};

const StatsTab = ({ stats }) => {
    return (
        <div className="stats-section" >
            {/* ... (votre code existant pour les statistiques) ... */}
        </div>
    );
};

const Sidebar = ({ activeTab, onTabChange, sidebarOpen, onToggleSidebar, logo }) => {
    return (
        <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`
        }>
            {/* ... (votre code existant pour la sidebar) ... */}
        </div>
    );
};

const Header = ({ searchTerm, onSearchChange }) => {
    return (
        <header className="navbar" >
            {/* ... (votre code existant pour le header) ... */}
        </header>
    );
};

export default Dashbill;