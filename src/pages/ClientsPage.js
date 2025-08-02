import React, { useState, useRef } from "react";
import {
    FaUsers, FaEdit, FaTrash, FaEnvelope, FaPhone,
    FaMapMarkerAlt, FaBuilding, FaPlus, FaSearch,
    FaFileInvoiceDollar, FaFileExcel, FaList, FaTh,
    FaSortAlphaDown
} from "react-icons/fa";
import empty_client from '../assets/empty_client.png';
import '../css/ClientPage.css'; // Assurez-vous d'avoir ce fichier CSS pour le style

const ClientsPage = ({
    clients,
    filteredClients,
    searchTerm,
    setSearchTerm,
    selectedClient,
    loadClientInvoices,
    handleEdit,
    handleDelete,
    client,
    handleChange,
    handleSubmit,
    editingClient,
    handleEditChange,
    handleUpdate,
    cancelEdit,
    societeInput,
    setSocieteInput,
    handleSocieteBlur,
    clientFactures,
    handleCreateInvoice,
    handleDeleteFacture,
    handleImportClient,
    importProgress,
    setImportProgress
}) => {
    const [viewMode, setViewMode] = useState('list'); // 'card' ou 'list'
    const [sortBy, setSortBy] = useState('nom'); // 'nom', 'type', 'dateCreation'
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' ou 'desc'
    const invoicesSectionRef = useRef(null);
    const [showAddForm, setShowAddForm] = useState(false);


    const handleFileUpload = (e) => {
        if (!e.target.files || e.target.files.length === 0) return;
        if (handleImportClient) handleImportClient(e);
    };

    // Fonction pour trier les clients
    const toggleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    // Clients triés
    const sortedClients = [...filteredClients].sort((a, b) => {
        let compareValue;
        if (sortBy === 'nom') {
            compareValue = a.nom.localeCompare(b.nom);
        } else if (sortBy === 'type') {
            compareValue = a.type.localeCompare(b.type);
        } else if (sortBy === 'dateCreation') {
            compareValue = new Date(a.dateCreation) - new Date(b.dateCreation);
        }
        return sortOrder === 'asc' ? compareValue : -compareValue;
    });
    // Fonction modifiée pour inclure le défilement
    const handleClientClick = (clientId) => {
        loadClientInvoices(clientId);

        // Défilement vers la section des factures
        setTimeout(() => {
            invoicesSectionRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    };

    return (
        <>
            {editingClient ? (
                <form onSubmit={handleUpdate} className="client-form">
                    <h2 className="form-title">
                        <FaEdit style={{ marginRight: "10px" }} />
                        Modifier le client
                    </h2>

                    {/* Formulaire d'édition... */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="edit-societe" className="form-label">Responsable </label>
                            <input
                                id="edit-societe"
                                name="societe"
                                value={editingClient.societe}
                                onChange={handleEditChange}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="edit-nom" className="form-label">Raison sociale <span className="required">*</span></label>
                            <input
                                id="edit-nom"
                                name="nom"
                                value={editingClient.nom}
                                onChange={handleEditChange}
                                onBlur={handleSocieteBlur}
                                required
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
                            <label htmlFor="edit-adresse" className="form-label">Adresse <span className="required">*</span></label>
                            <input
                                id="edit-adresse"
                                name="adresse"
                                value={editingClient.adresse}
                                onChange={handleEditChange}
                                required
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="ville" className="form-label">Ville/Pays</label>
                            <input
                                id="ville"
                                name="ville"
                                value={editingClient.ville}
                                onChange={handleEditChange}
                                className="form-input"
                                placeholder="Ex: Dakar, Sénégal"
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
                                <option value="partenaire">Partenaire</option>
                                <option value="fournisseur">Fournisseur</option>
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
                showAddForm && (
                    <form onSubmit={handleSubmit} className="client-form">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 className="form-title">
                                <FaPlus style={{ marginRight: "10px" }} />
                                Ajouter un nouveau client
                            </h2>

                            <button
                                className="primary-btn"
                                onClick={() => setShowAddForm(!showAddForm)}
                            >
                                <FaPlus /> {showAddForm ? "Fermer le formulaire" : "Ajouter un client"}
                            </button>
                        </div>

                        {/* Formulaire d'ajout... */}
                        <div className="form-row">

                            <div className="form-group">
                                <label htmlFor="societe" className="form-label">Responsable</label>
                                <input
                                    id="societe"
                                    name="societe"
                                    value={client.societe}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Monsieur Diop - Dame"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="nom" className="form-label">Raison sociale <span className="required">*</span></label>
                                <input
                                    id="nom"
                                    name="nom"
                                    value={client.nom}
                                    onChange={handleChange}
                                    required
                                    className="form-input"
                                    placeholder="Leader Interim"
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
                                    placeholder="leader@gmail.com"
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
                                    placeholder="781234567"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="adresse" className="form-label">Adresse <span className="required">*</span></label>
                                <input
                                    id="adresse"
                                    name="adresse"
                                    value={client.adresse}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Ouest Foire, Route de l'Aéroport"

                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="ville" className="form-label">Ville/Pays</label>
                                <input
                                    id="ville"
                                    name="ville"
                                    value={client.ville}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Dakar, Sénégal"
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
                                    <option value="partenaire">Partenaire</option>
                                    <option value="fournisseur">Fournisseur</option>

                                </select>
                            </div>
                        </div>
                        <button type="submit" className="submit-btn">
                            Ajouter le client
                        </button>
                    </form>
                ))}
            <div className="clients-section">
                <div className="section-header">
                    <div className="header-left">
                        <h2 className="section-title">
                            <FaUsers style={{ marginRight: "10px" }} />
                            Clients ({sortedClients.length})
                        </h2>

                        <div className="view-controls">
                            <button
                                onClick={() => setViewMode('card')}
                                className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
                                title="Vue cartes"
                            >
                                <FaTh />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                title="Vue liste"
                            >
                                <FaList />
                            </button>
                        </div>
                    </div>

                    <div className="header-right">
                        <div className="search-box">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher un client..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="sort-options">
                            <div className="sort-label">Trier par:</div>
                            <button
                                onClick={() => toggleSort('nom')}
                                className={`sort-btn ${sortBy === 'nom' ? 'active' : ''}`}
                            >
                                <FaSortAlphaDown /> Nom
                                {sortBy === 'nom' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                            </button>
                            <button
                                onClick={() => toggleSort('type')}
                                className={`sort-btn ${sortBy === 'type' ? 'active' : ''}`}
                            >
                                <FaSortAlphaDown /> Type
                                {sortBy === 'type' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                            </button>
                        </div>


                        <button
                            className="primary-btn"
                            onClick={() => setShowAddForm(!showAddForm)}
                        >
                            <FaPlus /> {showAddForm ? "Fermer le formulaire" : "Ajouter un client"}
                        </button>

                        <label htmlFor="file-upload" className="import-btn">
                            <FaFileExcel /> Importer
                            <input
                                id="file-upload"
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                </div>

                {importProgress && (
                    <div className="import-progress">
                        <div>{importProgress}</div>
                        {importProgress.includes("réussis") && (
                            <button onClick={() => setImportProgress(null)} className="close-btn">
                                Fermer
                            </button>
                        )}
                    </div>
                )}

                {sortedClients.length === 0 ? (
                    <div className="empty-state">
                        <img src={empty_client} alt="Aucun client" className="empty-image" />
                        <h3>Aucun client trouvé</h3>
                        <p>Commencez par créer votre premier client</p>
                        <button
                            className="primary-btn"
                            onClick={() => setShowAddForm(!showAddForm)}
                        >
                            <FaPlus /> Ajouter un client
                        </button>
                    </div>
                ) : viewMode === 'card' ? (
                    <div className="clients-grid">
                        {sortedClients.map((c) => (
                            <div
                                key={c.id}
                                className={`client-card ${selectedClient?.id === c.id ? 'active' : ''}`}
                                onClick={() => handleClientClick(c.id)}  // Utilisation de la nouvelle fonction
                            >
                                <div className="client-type-badge">
                                    {c.type === "client" ? "Client" : c.type === "prospect" ? "Prospect" : c.type === "fournisseur" ? "Fournisseur" : "Partenaire"}
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
                                            <span className="detail-value">{c.adresse} - {c.ville}</span>
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
                ) : (
                    <div className="clients-table-container">
                        <table className="clients-table">
                            <thead>
                                <tr>
                                    <th
                                        onClick={() => toggleSort('nom')}
                                        className={sortBy === 'nom' ? 'active' : ''}
                                    >
                                        <div className="th-content">
                                            Nom
                                            {sortBy === 'nom' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => toggleSort('type')}
                                        className={sortBy === 'type' ? 'active' : ''}
                                    >
                                        <div className="th-content">
                                            Type
                                            {sortBy === 'type' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                        </div>
                                    </th>

                                    <th>Contact</th>
                                    <th>Adresse</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedClients.map((c) => (
                                    <tr
                                        key={c.id}
                                        className={selectedClient?.id === c.id ? 'active' : ''}
                                        onClick={() => handleClientClick(c.id)}  // Ajoutez cette ligne
                                        style={{ cursor: 'pointer' }}  // Change le curseur pour indiquer que c'est cliquable
                                    >
                                        <td>
                                            <div className="cell-content">
                                                <div className="client-avatar-small">
                                                    {c.nom.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="client-name">{c.nom}</div>
                                                    {c.societe && <div className="client-company">{c.societe}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                {c.type}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="client-contact">
                                                {c.email && <div><FaEnvelope /> {c.email}</div>}
                                                {c.telephone && <div><FaPhone /> {c.telephone}</div>}
                                            </div>
                                        </td>
                                        <td>
                                            {c.adresse && (
                                                <div className="client-address">
                                                    <FaMapMarkerAlt /> {c.adresse}
                                                    {c.ville && `, ${c.ville}`}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="table-actions">
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
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedClient && (() => {
                const factures = clientFactures || [];
                return (
                    <div className="invoices-section" >
                        <div className="invoices-header" ref={invoicesSectionRef}>
                            <h2 className="section-title"><FaFileInvoiceDollar /> Factures de {selectedClient.nom} ({factures.length})</h2>
                            <div className="invoices-actions">
                                <button onClick={handleCreateInvoice} className="create-invoice-btn">
                                    <FaPlus /> Créer une facture
                                </button>
                                <button className="export-btn">Exporter</button>
                            </div>
                        </div>

                        {factures.length === 0 ? (
                            <div className="empty-state" style={{ backgroundImage: `url(${empty_client})` }}>
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
};

export default ClientsPage;