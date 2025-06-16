import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from '../auth/AuthContext';
import {
    FaFileInvoiceDollar, FaChartLine, FaBell, FaEdit, FaPlus, FaSearch, FaTrash,
    FaEnvelope, FaPhone, FaMapMarkerAlt, FaBuilding, FaChartBar, FaUserCircle,
    FaUsers, FaCog, FaSignOutAlt, FaChevronDown, FaChevronRight, FaCreditCard, FaUser
} from 'react-icons/fa';
import { MdDashboard } from "react-icons/md";

import logo from './assets/Logo_Mf.png';
import empty from './assets/empty.png';
import empty_client from './assets/empty_client.png';
import empty_team from './assets/empty_team.png';

import { clientService } from "../services/clientService";
import { invoiceService } from "../services/invoiceService";
import { teamService } from "../services/teamService";
import {
    InvoiceChart, ClientChart, StatusChart, MonthlyComparisonChart
} from '../components/Charts';

// Composant DocumentSection réutilisable
const DocumentSection = ({ title, items, searchTerm, setSearchTerm, navigate, onDelete, selectedClient, type }) => (
    <div className="clients-section">
        <div className="section-header">
            <h2 className="section-title">
                <FaFileInvoiceDollar style={{ marginRight: "10px" }} />
                {title} ({items.length})
            </h2>
            <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                    type="text"
                    placeholder={`Rechercher un ${title.toLowerCase().slice(0, -1)}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="invoices-actions">
                <button
                    onClick={() => navigate("/bill", { state: { type } })}
                    className={`create-invoice-btn ${type === "devis" ? "tertiary" : type === "avoir" ? "secondary" : ""}`}
                >
                    <FaPlus style={{ marginRight: "8px" }} />
                    Créer {type === "facture" ? "une Facture" : type === "devis" ? "un Devis" : "un Avoir"}
                </button>
            </div>
        </div>

        {items.length === 0 ? (
            <div className="empty-state" style={{ backgroundImage: `url(${empty})` }}>
                <p>Aucun {title.toLowerCase().slice(0, -1)} trouvé</p>
                <button onClick={() => navigate("/bill", { state: { type } })} className="primary-btn">
                    <FaPlus /> Créer {type === "facture" ? "une Facture" : type === "devis" ? "un Devis" : "un Avoir"}
                </button>
            </div>
        ) : (
            <div className="clients-grid">
                {items.map((f) => (
                    <div key={f.id} className="client-card">
                        <div className="client-header">
                            <div className="client-avatar"><FaFileInvoiceDollar /></div>
                            <div className="client-info">
                                <div className="client-name">{f.numero}</div>
                                <div className="client-company">{f.clientNom || "Sans client"}</div>
                            </div>
                            <div className="client-actions">
                                <button className="action-btn edit-btn" title="Modifier"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate("/bill", { state: { facture: f, client: selectedClient, type: f.type } });
                                    }}>
                                    <FaEdit />
                                </button>
                                <button className="action-btn delete-btn" title="Supprimer"
                                    onClick={(e) => { e.stopPropagation(); onDelete(f.id, type); }}>
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                        <div className="client-details">
                            <div className="client-detail">
                                <span className="detail-label">Client:</span>
                                <span className="detail-value">{f.clientNom || "N/A"}</span>
                            </div>
                            <div className="client-detail">
                                <span className="detail-label">Date:</span>
                                <span className="detail-value">{f.date}</span>
                            </div>
                            <div className="client-detail">
                                <span className="detail-label">Montant:</span>
                                <span className="detail-value">{f.totalTTC} FCFA</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const Dashbill = () => {
    const { currentUser, logout } = useAuth();
    const companyId = currentUser?.companyId;
    const navigate = useNavigate();

    // États communs
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("dashboard");
    const [activeTab_0, setActiveTab_0] = useState("factures");
    // eslint-disable-next-line no-unused-vars
    const [error, setError] = useState(null);

    // États clients
    const [client, setClient] = useState({
        nom: "", adresse: "", email: "", telephone: "", societe: "", type: "client", anciensNoms: []
    });
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [editingClient, setEditingClient] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [societeInput, setSocieteInput] = useState("");

    // États documents
    const [allFactures, setAllFactures] = useState([]); // Toutes les factures pour le dashboard
    const [clientFactures, setClientFactures] = useState([]); // Factures du client sélectionné
    const [allDevis, setAllDevis] = useState([]);
    const [clientDevis, setClientDevis] = useState([]);
    const [allAvoirs, setAllAvoirs] = useState([]);
    const [clientAvoirs, setClientAvoirs] = useState([]);

    // États équipes
    const [equipe, setEquipe] = useState({ nom: "", description: "", responsable: "" });
    const [equipes, setEquipes] = useState([]);
    const [editingEquipe, setEditingEquipe] = useState(null);
    const [isEditingEquipe, setIsEditingEquipe] = useState(false);

    // Statistiques
    const [stats, setStats] = useState({
        totalClients: 0, totalFactures: 0, revenusMensuels: 0,
        facturesImpayees: 0, totalEquipes: 0
    });

    // Handlers communs
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

    const cancelEdit = () => { setIsEditing(false); setEditingClient(null); };
    const cancelEquipeEdit = () => { setIsEditingEquipe(false); setEditingEquipe(null); };

    // Chargement des données
    useEffect(() => {
        if (!companyId) return;

        const unsubscribeClients = clientService.getClients(companyId, (clientsData) => {
            setClients(clientsData);
            setStats(prev => ({ ...prev, totalClients: clientsData.length }));
        });

        const unsubscribeFactures = invoiceService.getInvoices(companyId, (invoicesData) => {
            setAllFactures(invoicesData);
            setStats(prev => ({
                ...prev,
                totalFactures: invoicesData.length,
                facturesImpayees: invoicesData.filter(f => f.statut === "en attente").length,
                revenusMensuels: invoicesData
                    .filter(f => new Date(f.date).getMonth() === new Date().getMonth())
                    .reduce((sum, f) => sum + parseFloat(f.totalTTC || 0), 0)
            }));
        }, "facture");

        const unsubscribeDevis = invoiceService.getInvoices(companyId, (invoicesData) => {
            setAllDevis(invoicesData);
        }, "devis");

        const unsubscribeAvoirs = invoiceService.getInvoices(companyId, (invoicesData) => {
            setAllAvoirs(invoicesData);
        }, "avoir");

        teamService.getTeams(companyId).then(equipesData => {
            setEquipes(equipesData);
            setStats(prev => ({ ...prev, totalEquipes: equipesData.length }));
        });

        return () => {
            unsubscribeClients();
            unsubscribeFactures();
            unsubscribeDevis();
            unsubscribeAvoirs();
        };
    }, [companyId]);

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

    const getLastThreeInvoices = () => [...allFactures]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

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

    // Rendu du contenu en fonction 
    // Rendu du contenu en fonction de l'onglet actif
    const renderActiveTab = () => {
        switch (activeTab) {
            case "dashboard":
                return (
                    <>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon clients">
                                    <FaUsers />
                                </div>
                                <div className="stat-info">
                                    <h3>{stats.totalClients}</h3>
                                    <p>Clients</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon invoices">
                                    <FaFileInvoiceDollar />
                                </div>
                                <div className="stat-info">
                                    <h3>{stats.totalFactures}</h3>
                                    <p>Factures</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon revenue">
                                    <FaChartLine />
                                </div>
                                <div className="stat-info">
                                    <h3>{stats.revenusMensuels.toLocaleString()} FCFA</h3>
                                    <p>Facturations mensuels</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon pending">
                                    <FaBell />
                                </div>
                                <div className="stat-info">
                                    <h3>{stats.facturesImpayees}</h3>
                                    <p>Impayées</p>
                                </div>
                            </div>
                        </div>

                        <div className="charts-row">
                            <div className="chart-card">
                                <h3>Chiffre d'affaires mensuel</h3>
                                <div className="chart-container">
                                    <InvoiceChart invoices={allFactures} />
                                </div>
                            </div>

                            <div className="chart-card">
                                <h3>Répartition des clients</h3>
                                <div className="chart-container">
                                    <ClientChart clients={clients} />
                                </div>
                            </div>
                        </div>

                        <div className="recent-invoices">
                            <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                <h2 className="section-title" style={{ display: "flex", alignItems: "center", margin: 0 }}>
                                    <FaFileInvoiceDollar style={{ marginRight: "10px" }} />
                                    Dernières factures
                                </h2>

                                <div className="invoices-actions" style={{ display: "flex", gap: "10px" }}>
                                    <button onClick={() => navigate("/bill")} className="create-invoice-btn">
                                        <FaPlus style={{ marginRight: "8px" }} />
                                        Créer une facture
                                    </button>
                                </div>
                            </div>

                            {allFactures.length > 0 ? (
                                <div className="invoices-list">
                                    {getLastThreeInvoices().map(invoice => (
                                        <div key={invoice.id} className="invoice-card">
                                            <div className="invoice-header">
                                                <span className="invoice-number">{invoice.numero}</span>
                                                <span className={`invoice-status ${invoice.statut}`}>
                                                    {invoice.statut}
                                                </span>
                                            </div>
                                            <div className="invoice-client">{invoice.clientNom}</div>
                                            <div className="invoice-details">
                                                <span className="invoice-amount">{invoice.totalTTC} FCFA</span>
                                                <span className="invoice-date">
                                                    {invoice.date ? new Date(invoice.date).toLocaleDateString('fr-FR') : 'Date invalide'}
                                                </span>


                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <p>Aucune facture trouvée</p>
                                </div>
                            )}
                        </div>
                    </>
                );
            case "clients":
                return (
                    <>
                        {isEditing ? (
                            <form onSubmit={handleUpdate} className="client-form">
                                <h2 className="form-title">
                                    <FaEdit style={{ marginRight: "10px" }} />
                                    Modifier le client
                                </h2>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="edit-nom" className="form-label">Nom <span className="required">*</span></label>
                                        <input
                                            id="edit-nom"
                                            name="nom"
                                            value={editingClient.nom}
                                            onChange={handleEditChange}
                                            required
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="edit-societe" className="form-label">Société</label>
                                        <input
                                            id="edit-societe"
                                            name="societe"
                                            value={societeInput}
                                            onChange={(e) => setSocieteInput(e.target.value)}
                                            onBlur={handleSocieteBlur}
                                            className="form-input"
                                        />
                                        {editingClient.anciensNoms?.length > 0 && (
                                            <div className="anciens-noms">
                                                <small>Anciens noms : {editingClient.anciensNoms.map(n => n.nom).join(", ")}</small>
                                            </div>
                                        )}
                                    </div>

                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="edit-email" className="form-label">Email</label>
                                        <input
                                            id="edit-email"
                                            name="email"
                                            type="email"
                                            value={editingClient.email}
                                            onChange={handleEditChange}
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="edit-telephone" className="form-label">Téléphone</label>
                                        <input
                                            id="edit-telephone"
                                            name="telephone"
                                            value={editingClient.telephone}
                                            onChange={handleEditChange}
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">

                                    <div className="form-group">
                                        <label htmlFor="edit-adresse" className="form-label">Adresse</label>
                                        <input
                                            id="edit-adresse"
                                            name="adresse"
                                            value={editingClient.adresse}
                                            onChange={handleEditChange}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="edit-type" className="form-label">Type</label>
                                        <select
                                            id="edit-type"
                                            name="type"
                                            value={editingClient.type || "prospect"}
                                            onChange={handleEditChange}
                                            className="form-input"
                                        >
                                            <option value="client">Client</option>
                                            <option value="prospect">Prospect</option>
                                        </select>
                                    </div>
                                </div>


                                <div className="form-actions">
                                    <button type="button" onClick={cancelEdit} className="cancel-btn">
                                        Annuler
                                    </button>
                                    <button type="submit" className="update-btn">
                                        Mettre à jour
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleSubmit} className="client-form">
                                <h2 className="form-title">
                                    <FaPlus style={{ marginRight: "10px" }} />
                                    Ajouter un nouveau client
                                </h2>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="nom" className="form-label">Nom <span className="required">*</span></label>
                                        <input
                                            id="nom"
                                            name="nom"
                                            value={client.nom}
                                            onChange={handleChange}
                                            required
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="societe" className="form-label">Société</label>
                                        <input
                                            id="societe"
                                            name="societe"
                                            value={client.societe}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="email" className="form-label">Email</label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={client.email}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="telephone" className="form-label">Téléphone</label>
                                        <input
                                            id="telephone"
                                            name="telephone"
                                            value={client.telephone}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="adresse" className="form-label">Adresse</label>
                                        <input
                                            id="adresse"
                                            name="adresse"
                                            value={client.adresse}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="type" className="form-label">Type</label>
                                        <select
                                            id="type"
                                            name="type"
                                            value={client.type}
                                            onChange={handleChange}
                                            className="form-input"
                                        >
                                            <option value="client">Client</option>
                                            <option value="prospect">Prospect</option>
                                        </select>
                                    </div>
                                </div>



                                <button type="submit" className="submit-btn">
                                    Ajouter le client
                                </button>
                            </form>
                        )}

                        <div className="clients-section">
                            <div className="section-header">
                                <h2 className="section-title">
                                    <FaUsers style={{ marginRight: "10px" }} />
                                    Clients ({filteredClients.length})
                                </h2>
                                <div className="search-box">
                                    <FaSearch className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher un client..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {filteredClients.length === 0 ? (
                                <div
                                    className="empty-state"
                                    style={{
                                        backgroundImage: `url(${empty_client})`,
                                        backgroundSize: "cover",
                                        backgroundRepeat: "no-repeat",
                                        backgroundOpacity: 0.2,
                                        color: "white",
                                    }}
                                >
                                    <p>Aucun client trouvé</p>
                                    <button className="primary-btn">
                                        <FaPlus /> Ajouter un client
                                    </button>
                                </div>
                            ) : (
                                <div className="clients-grid">
                                    {filteredClients.map((c) => (
                                        <div
                                            key={c.id}
                                            className={`client-card ${selectedClient?.id === c.id ? 'active' : ''}`}
                                            onClick={() => loadClientInvoices(c.id)}
                                        >
                                            <div className="client-type-badge">
                                                {c.type === "client" ? "Client" : "Prospect"}
                                            </div>

                                            <div className="client-header">
                                                <div className="client-avatar">
                                                    {c.nom.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="client-info">
                                                    <div className="client-name">{c.nom}</div>
                                                    {c.societe && <div className="client-company">{c.societe}</div>}
                                                </div>
                                                <div className="client-actions">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(c);
                                                        }}
                                                        className="action-btn edit-btn"
                                                        title="Modifier"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(c.id);
                                                        }}
                                                        className="action-btn delete-btn"
                                                        title="Supprimer"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="client-details">
                                                {c.email && (
                                                    <div className="client-detail">
                                                        <FaEnvelope className="detail-icon" />
                                                        <span className="detail-value">{c.email}</span>
                                                    </div>
                                                )}
                                                {c.telephone && (
                                                    <div className="client-detail">
                                                        <FaPhone className="detail-icon" />
                                                        <span className="detail-value">{c.telephone}</span>
                                                    </div>
                                                )}
                                                {c.adresse && (
                                                    <div className="client-detail">
                                                        <FaMapMarkerAlt className="detail-icon" />
                                                        <span className="detail-value">{c.adresse}</span>
                                                    </div>
                                                )}
                                                {c.societe && (
                                                    <div className="client-detail">
                                                        <FaBuilding className="detail-icon" />
                                                        <span className="detail-value">{c.societe}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {c.anciensNoms?.length > 0 && (
                                                <div className="client-history">
                                                    <small>Ancien nom: {c.anciensNoms[0].nom}</small>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedClient && (() => {
                            const factures = clientFactures || [];
                            return (
                                <div className="invoices-section">
                                    <div className="invoices-header">
                                        <h2 className="section-title"><FaFileInvoiceDollar /> Factures de {selectedClient.nom} ({factures.length})</h2>
                                        <div className="invoices-actions">
                                            <button onClick={handleCreateInvoice} className="create-invoice-btn">
                                                <FaPlus /> Créer une facture
                                            </button>
                                            <button className="export-btn">Exporter</button>
                                        </div>
                                    </div>

                                    {factures.length === 0 ? (
                                        <div className="empty-state" style={{ backgroundImage: `url(${empty_team})` }}>
                                            <p>Aucune facture trouvée pour ce client</p>
                                            <button onClick={handleCreateInvoice} className="primary-btn">
                                                <FaPlus /> Créer une facture
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="invoices-table-container">
                                            <table className="invoice-table">
                                                <thead>
                                                    <tr>
                                                        <th>Numéro</th>
                                                        <th>Date</th>
                                                        <th>Montant</th>
                                                        <th>Statut</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {factures.map(f => (
                                                        <tr key={f.id}>
                                                            <td>
                                                                {f.numero}
                                                                {f.nomSocieteHistorique && <span title={`Ancien nom: ${f.nomSocieteHistorique}`}>*</span>}
                                                            </td>
                                                            <td>{f.date}</td>
                                                            <td>{f.totalTTC} FCFA </td>
                                                            <td><span className={`invoice-status ${f.statut}`}>{f.statut}</span></td>
                                                            <td>
                                                                <div className="table-actions">
                                                                    <button className="action-btn edit-btn"><FaEdit /></button>
                                                                    <button className="action-btn delete-btn" onClick={() => handleDeleteFacture(f.id)}>
                                                                        <FaTrash />
                                                                    </button>
                                                                    <button className="action-btn view-btn"><FaSearch /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </>
                );
            case "equipes":
                return (
                    <>
                        {isEditingEquipe ? (
                            <form onSubmit={handleEquipeUpdate} className="client-form">
                                <h2 className="form-title">
                                    <FaEdit style={{ marginRight: "10px" }} />
                                    Modifier l'équipe
                                </h2>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="edit-equipe-nom" className="form-label">Nom <span className="required">*</span></label>
                                        <input
                                            id="edit-equipe-nom"
                                            name="nom"
                                            value={editingEquipe.nom}
                                            onChange={handleEquipeEditChange}
                                            required
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="edit-equipe-responsable" className="form-label">Responsable</label>
                                        <input
                                            id="edit-equipe-responsable"
                                            name="responsable"
                                            value={editingEquipe.responsable}
                                            onChange={handleEquipeEditChange}
                                            className="form-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="edit-equipe-description" className="form-label">Description</label>
                                    <textarea
                                        id="edit-equipe-description"
                                        name="description"
                                        value={editingEquipe.description}
                                        onChange={handleEquipeEditChange}
                                        className="form-input"
                                        rows="3"
                                    />
                                </div>

                                <div className="form-actions">
                                    <button type="button" onClick={cancelEquipeEdit} className="cancel-btn">
                                        Annuler
                                    </button>
                                    <button type="submit" className="update-btn">
                                        Mettre à jour
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleEquipeSubmit} className="client-form">
                                <h2 className="form-title">
                                    <FaPlus style={{ marginRight: "10px" }} />
                                    Ajouter une nouvelle équipe
                                </h2>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="equipe-nom" className="form-label">Nom <span className="required">*</span></label>
                                        <input
                                            id="equipe-nom"
                                            name="nom"
                                            value={equipe.nom}
                                            onChange={handleEquipeChange}
                                            required
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="equipe-responsable" className="form-label">Responsable</label>
                                        <input
                                            id="equipe-responsable"
                                            name="responsable"
                                            value={equipe.responsable}
                                            onChange={handleEquipeChange}
                                            className="form-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="equipe-description" className="form-label">Description</label>
                                    <textarea
                                        id="equipe-description"
                                        name="description"
                                        value={equipe.description}
                                        onChange={handleEquipeChange}
                                        className="form-input"
                                        rows="3"
                                    />
                                </div>

                                <button type="submit" className="submit-btn">
                                    Ajouter l'équipe
                                </button>
                            </form>
                        )}

                        <div className="clients-section">
                            <div className="section-header">
                                <h2 className="section-title">
                                    <FaUsers style={{ marginRight: "10px" }} />
                                    Équipes ({filteredEquipes.length})
                                </h2>
                                <div className="search-box">
                                    <FaSearch className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher une équipe..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {filteredEquipes.length === 0 ? (
                                <div
                                    className="empty-state"
                                    style={{
                                        backgroundImage: `url(${empty_team})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        backgroundRepeat: "no-repeat"
                                    }}
                                >
                                    <p>Aucune équipe trouvée</p>
                                    <button className="primary-btn" onClick={() => setIsEditingEquipe(false)}>
                                        <FaPlus /> Ajouter une équipe
                                    </button>
                                </div>
                            ) : (
                                <div className="clients-grid">
                                    {filteredEquipes.map((eq) => (
                                        <div key={eq.id} className="client-card">
                                            <div className="client-header">
                                                <div className="client-avatar">
                                                    <FaUsers />
                                                </div>
                                                <div className="client-info">
                                                    <div className="client-name">{eq.nom}</div>
                                                    {eq.responsable && <div className="client-company">Responsable: {eq.responsable}</div>}
                                                </div>
                                                <div className="client-actions">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEquipeEdit(eq);
                                                        }}
                                                        className="action-btn edit-btn"
                                                        title="Modifier"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEquipeDelete(eq.id);
                                                        }}
                                                        className="action-btn delete-btn"
                                                        title="Supprimer"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="client-details">
                                                {eq.description && (
                                                    <div className="client-detail">
                                                        <span className="detail-label">Description:</span>
                                                        <span className="detail-value">{eq.description}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                );
            case "factures":
                return (
                    <>
                        <div className="navbar-tabs">
                            <button
                                className={activeTab_0 === "factures" ? "active" : ""}
                                onClick={() => setActiveTab_0("factures")}
                            >
                                Factures ({getFacturesToDisplay().length})
                            </button>
                            <button
                                className={activeTab_0 === "devis" ? "active" : ""}
                                onClick={() => setActiveTab_0("devis")}
                            >
                                Devis ({getDevisToDisplay().length})
                            </button>
                            <button
                                className={activeTab_0 === "avoirs" ? "active" : ""}
                                onClick={() => setActiveTab_0("avoirs")}
                            >
                                Avoirs ({getAvoirsToDisplay().length})
                            </button>
                        </div>

                        {activeTab_0 === "factures" && (
                            <DocumentSection
                                title="Factures"
                                items={getFacturesToDisplay()}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                navigate={navigate}
                                onDelete={handleDeleteFacture}
                                selectedClient={selectedClient}
                                type="facture"
                            />
                        )}
                        {activeTab_0 === "devis" && (
                            <DocumentSection
                                title="Devis"
                                items={getDevisToDisplay()}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                navigate={navigate}
                                onDelete={handleDeleteFacture}
                                selectedClient={selectedClient}
                                type="devis"
                            />
                        )}
                        {activeTab_0 === "avoirs" && (
                            <DocumentSection
                                title="Avoirs"
                                items={getAvoirsToDisplay()}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                navigate={navigate}
                                onDelete={handleDeleteFacture}
                                selectedClient={selectedClient}
                                type="avoir"
                            />
                        )}
                    </>
                );
            case "stats":
                return (
                    <div className="stats-section">
                        <h2 className="section-title">
                            <FaChartBar style={{ marginRight: "10px" }} />
                            Statistiques
                        </h2>

                        <div className="stats-grid">
                            <div className="stat-card large">
                                <div className="stat-icon clients">
                                    <FaUsers />
                                </div>
                                <div className="stat-info">
                                    <h3>{stats.totalClients}</h3>
                                    <p>Clients enregistrés</p>
                                    <div className="stat-trend up">
                                        +5% ce mois-ci
                                    </div>
                                </div>
                            </div>

                            <div className="stat-card large">
                                <div className="stat-icon invoices">
                                    <FaFileInvoiceDollar />
                                </div>
                                <div className="stat-info">
                                    <h3>{stats.totalFactures}</h3>
                                    <p>Factures émises</p>
                                    <div className="stat-trend up">
                                        +12% ce mois-ci
                                    </div>
                                </div>
                            </div>

                            <div className="stat-card large">
                                <div className="stat-icon revenue">
                                    <FaChartLine />
                                </div>
                                <div className="stat-info">
                                    <h3>{stats.revenusMensuels.toLocaleString()} Fcfa</h3>
                                    <p>Revenus mensuels</p>
                                    <div className="stat-trend down">
                                        -3% ce mois-ci
                                    </div>
                                </div>
                            </div>

                            <div className="stat-card large">
                                <div className="stat-icon pending">
                                    <FaBell />
                                </div>
                                <div className="stat-info">
                                    <h3>{stats.facturesImpayees}</h3>
                                    <p>Factures impayées</p>
                                    <div className="stat-trend up">
                                        +2 ce mois-ci
                                    </div>
                                </div>
                            </div>

                            <div className="stat-card large">
                                <div className="stat-icon teams">
                                    <FaUsers />
                                </div>
                                <div className="stat-info">
                                    <h3>{stats.totalEquipes}</h3>
                                    <p>Équipes actives</p>
                                    <div className="stat-trend neutral">
                                        Stable
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="charts-container">
                            <div className="chart-card">
                                <h3>Chiffre d'affaires mensuel</h3>
                                <div className="chart-container">
                                    <InvoiceChart invoices={allFactures} />
                                </div>
                            </div>

                            <div className="chart-card">
                                <h3>Comparaison annuelle</h3>
                                <div className="chart-container">
                                    <MonthlyComparisonChart invoices={allFactures} />
                                </div>
                            </div>

                            <div className="chart-card">
                                <h3>Répartition des clients</h3>
                                <div className="chart-container">
                                    <ClientChart clients={clients} />
                                </div>
                            </div>

                            <div className="chart-card">
                                <h3>Statut des factures</h3>
                                <div className="chart-container">
                                    <StatusChart invoices={allFactures} />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return <div>Sélectionnez une section</div>;
        }
    };

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <Link
                    to="/"
                    onClick={() => setActiveTab("dashboard")}
                    className="sidebar-header"
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}
                >
                    <img src={logo} alt="Logo Ment@Fact" style={{ height: '50px' }} />
                    <h2 style={{ margin: 0 }}>Ment@Fact</h2>
                </Link>

                <nav className="sidebar-nav">
                    <ul>
                        <li
                            className={activeTab === "dashboard" ? "active" : ""}
                            onClick={() => setActiveTab("dashboard")}
                        >
                            <MdDashboard className="nav-icon" />
                            {sidebarOpen && <span>Tableau de bord</span>}
                        </li>
                        <li
                            className={activeTab === "clients" ? "active" : ""}
                            onClick={() => setActiveTab("clients")}
                        >
                            <FaUsers className="nav-icon" />
                            {sidebarOpen && <span>Clients</span>}
                        </li>
                        <li
                            className={activeTab === "factures" ? "active" : ""}
                            onClick={() => setActiveTab("factures")}
                        >
                            <FaFileInvoiceDollar className="nav-icon" />



                            {sidebarOpen && <span>Ment@Fact</span>}
                        </li>

                        <li
                            className={activeTab === "stats" ? "active" : ""}
                            onClick={() => setActiveTab("stats")}
                        >
                            <FaChartBar className="nav-icon" />
                            {sidebarOpen && <span>Statistiques</span>}
                        </li>
                        <li
                            className={activeTab === "equipes" ? "active" : ""}
                            onClick={() => setActiveTab("equipes")}
                        >
                            <FaUsers className="nav-icon" />
                            {sidebarOpen && <span>Équipes</span>}
                        </li>
                    </ul>
                </nav>
                <div className="sidebar-footer">
                    <button className="toggle-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? '◄' : '►'}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Navbar Premium */}
                <header className="navbar-premium">
                    <div className="navbar-left">
                        <div className="company-brand">
                            <FaBuilding className="company-icon" />
                            <div className="company-details">
                                <span className="company-name">{currentUser?.companyName || "Mon Entreprise"}</span>
                                <span className="company-status">Premium</span>
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

export default Dashbill;