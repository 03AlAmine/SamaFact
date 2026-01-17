import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
    // Icônes existantes
    FaUsers, FaEdit, FaTrash, FaEnvelope, FaPhone,
    FaMapMarkerAlt, FaBuilding, FaPlus, FaSearch,
    FaFileInvoiceDollar, FaFileExcel, FaList, FaTh,
    FaSortAlphaDown, FaChevronLeft, FaChevronRight,
    // Nouvelles icônes pour le modal
    FaEye, FaTimes, FaInfoCircle, FaCalendarAlt,
    FaHistory, FaAddressBook, FaCity, FaStickyNote,
    FaComment, FaUserTie, FaHandshake, FaTruck,
    FaMapMarkedAlt
} from "react-icons/fa";
import empty_client from '../assets/empty_client.png';
import '../css/ClientPage.css';
import LoadingState from '../components/common/LoadingState';


// Composant d'état vide
const EmptyState = ({ onAddClient }) => (
    <div className="empty-state">
        <img src={empty_client} alt="Aucun client" className="empty-image" />
        <h3>Aucun client trouvé</h3>
        <p>Commencez par créer votre premier client</p>
        <button className="primary-btn" onClick={onAddClient}>
            <FaPlus /> Ajouter un client
        </button>
    </div>
);

// Composant de formulaire client
const ClientForm = ({
    isEditing,
    formData,
    onSubmit,
    onCancel,
    onChange,
    onSocieteBlur
}) => (
    <form onSubmit={onSubmit} className="client-form">
        <div className="form-header">
            <h2 className="form-title">
                {isEditing ? <FaEdit /> : <FaPlus />}
                {isEditing ? "Modifier le client" : "Ajouter un nouveau client"}
            </h2>
            {!isEditing && (
                <button type="button" className="primary-btn" onClick={onCancel}>
                    <FaPlus /> Fermer le formulaire
                </button>
            )}
        </div>

        <div className="form-row">
            <FormField
                label="Responsable"
                name="societe"
                value={formData.societe}
                onChange={onChange}
                placeholder="Monsieur Diop - Dame"
            />
            <FormField
                label="Raison sociale"
                name="nom"
                value={formData.nom}
                onChange={onChange}
                onBlur={isEditing ? onSocieteBlur : undefined}
                required
                placeholder="Leader Interim"
            />
        </div>

        <div className="form-row">
            <FormField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={onChange}
                placeholder="leader@gmail.com"
            />
            <FormField
                label="Téléphone"
                name="telephone"
                value={formData.telephone}
                onChange={onChange}
                placeholder="781234567"
            />
        </div>

        <div className="form-row">
            <FormField
                label="Adresse"
                name="adresse"
                value={formData.adresse}
                onChange={onChange}
                required
                placeholder="Ouest Foire, Route de l'Aéroport"
            />
            <FormField
                label="Ville/Pays"
                name="ville"
                value={formData.ville}
                onChange={onChange}
                placeholder="Dakar, Sénégal"
            />
            <FormSelect
                label="Type"
                name="type"
                value={formData.type || "prospect"}
                onChange={onChange}
                options={[
                    { value: "client", label: "Client" },
                    { value: "prospect", label: "Prospect" },
                    { value: "partenaire", label: "Partenaire" },
                    { value: "fournisseur", label: "Fournisseur" }
                ]}
            />
        </div>

        {isEditing && formData.anciensNoms?.length > 0 && (
            <div className="anciens-noms">
                <small>Anciens noms : {formData.anciensNoms.map(n => n.nom).join(", ")}</small>
            </div>
        )}

        {isEditing ? (
            <div className="form-actions">
                <button type="button" onClick={onCancel} className="cancel-btn">
                    Annuler
                </button>
                <button type="submit" className="update-btn">
                    Mettre à jour
                </button>
            </div>
        ) : (
            <button type="submit" className="submit-btn">
                Ajouter le client
            </button>
        )}
    </form>
);

// Composant de champ de formulaire réutilisable
const FormField = ({ label, required, ...props }) => (
    <div className="form-group">
        <label htmlFor={props.name} className="form-label">
            {label} {required && <span className="required">*</span>}
        </label>
        <input
            id={props.name}
            className="form-input"
            {...props}
        />
    </div>
);

// Composant de sélection de formulaire
const FormSelect = ({ label, options, ...props }) => (
    <div className="form-group">
        <label htmlFor={props.name} className="form-label">{label}</label>
        <select id={props.name} className="form-input" {...props}>
            {options.map(option => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </div>
);

// Composant d'en-tête
const ClientsHeader = ({
    clientsCount,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    sortBy,
    sortOrder,
    toggleSort,
    onAddClient,
    showAddForm,
    onImport,
    isMobile,
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    onItemsPerPageChange
}) => (
    <div className="section-header header-client">
        <div className="header-left">
            <h2 className="section-title">
                <FaUsers /> Clients ({clientsCount})
            </h2>
            <ViewControls
                viewMode={viewMode}
                setViewMode={setViewMode}
                isMobile={isMobile}
            />
            <SearchBox searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </div>

        <div className="header-right">
            <SortOptions
                sortBy={sortBy}
                sortOrder={sortOrder}
                toggleSort={toggleSort}
            />

            {/* Pagination controls */}
            <div className="pagination-controls">
                <div className="items-per-page-selector">
                    <select
                        value={itemsPerPage}
                        onChange={onItemsPerPageChange}
                        className="items-per-page-select"
                    >
                        <option value={10}>10/page</option>
                        <option value={20}>20/page</option>
                        <option value={50}>50/page</option>
                        <option value={100}>100/page</option>
                    </select>
                </div>

                <div className="pagination-navigation">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="pagination-btn prev-btn"
                    >
                        <FaChevronLeft />
                    </button>

                    <span className="page-info">
                        Page {currentPage} sur {totalPages}
                    </span>

                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="pagination-btn next-btn"
                    >
                        <FaChevronRight />
                    </button>
                </div>
            </div>

            <ActionButtons
                onAddClient={onAddClient}
                showAddForm={showAddForm}
                onImport={onImport}
            />
        </div>
    </div>
);

// Contrôles de vue
const ViewControls = ({ viewMode, setViewMode, isMobile }) => (
    <div className="view-controls">
        <button
            onClick={() => setViewMode('card')}
            className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
            title="Vue cartes"
            disabled={isMobile}
        >
            <FaTh />
            {isMobile && <span className="auto-badge">Auto</span>}
        </button>
        <button
            onClick={() => setViewMode('list')}
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            title="Vue liste"
            disabled={isMobile}
        >
            <FaList />
            {isMobile && <span className="auto-badge">Auto</span>}
        </button>
    </div>
);

// Barre de recherche
const SearchBox = ({ searchTerm, setSearchTerm }) => (
    <div className="search-box">
        <FaSearch className="search-icon" />
        <input
            type="text"
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
    </div>
);

// Options de tri
const SortOptions = ({ sortBy, sortOrder, toggleSort }) => (
    <div className="sort-options">
        <div className="sort-label">Trier par:</div>
        <SortButton
            field="nom"
            label="Nom"
            sortBy={sortBy}
            sortOrder={sortOrder}
            toggleSort={toggleSort}
        />
        <SortButton
            field="type"
            label="Type"
            sortBy={sortBy}
            sortOrder={sortOrder}
            toggleSort={toggleSort}
        />
    </div>
);

// Bouton de tri
const SortButton = ({ field, label, sortBy, sortOrder, toggleSort }) => (
    <button
        onClick={() => toggleSort(field)}
        className={`sort-btn ${sortBy === field ? 'active' : ''}`}
    >
        <FaSortAlphaDown /> {label}
        {sortBy === field && (
            <span className="sort-indicator">
                {sortOrder === 'asc' ? '↑' : '↓'}
            </span>
        )}
    </button>
);

// Boutons d'action
const ActionButtons = ({ onAddClient, showAddForm, onImport }) => (
    <>
        <button className="primary-btn" onClick={onAddClient}>
            <FaPlus /> {showAddForm ? "Fermer le formulaire" : "Ajouter un client"}
        </button>
        <ImportButton onImport={onImport} />
    </>
);

// Bouton d'importation
const ImportButton = ({ onImport }) => (
    <label htmlFor="file-upload" className="import-btn">
        <FaFileExcel /> Importer
        <input
            id="file-upload"
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={onImport}
            style={{ display: 'none' }}
        />
    </label>
);

// Carte client
const ClientCard = ({ client, isSelected, onSelect, onEdit, onDelete, onView }) => {
    const handleAction = (e, action) => {
        e.stopPropagation();
        if (!client || !client.id) {
            console.error("Client object or ID is undefined:", client);
            return;
        }
        action(client);
    };

    return (
        <div
            className={`client-card ${isSelected ? 'active' : ''}`}
            onClick={() => onSelect(client.id)}
        >
            <div className={`client-type-badge ${client.type}`}>
                {client.type.charAt(0).toUpperCase() + client.type.slice(1)}
            </div>

            <div className="client-header">
                <div className="client-avatar">
                    {client.nom.charAt(0).toUpperCase()}
                </div>
                <div className="client-info">
                    <div className="client-name">{client.nom}</div>
                    {client.societe && <div className="client-company">{client.societe}</div>}
                </div>
                <div className="client-actions">
                    <ActionButton
                        icon={<FaEye />}
                        title="Voir détails"
                        onClick={(e) => handleAction(e, onView)}
                        className="view-btn"
                    />
                    <ActionButton
                        icon={<FaEdit />}
                        title="Modifier"
                        onClick={(e) => handleAction(e, onEdit)}
                        className="edit-btn"
                    />
                    <ActionButton
                        icon={<FaTrash />}
                        title="Supprimer"
                        onClick={(e) => handleAction(e, onDelete)}
                        className="delete-btn"
                    />
                </div>
            </div>

            <ClientDetails client={client} />

            {client.anciensNoms?.length > 0 && (
                <div className="client-history">
                    <small>Ancien nom: {client.anciensNoms[0].nom}</small>
                </div>
            )}
        </div>
    );
};

// Détails du client
const ClientDetails = ({ client }) => (
    <div className="client-details">
        <DetailItem
            icon={<FaEnvelope />}
            value={client.email}
        />
        <DetailItem
            icon={<FaPhone />}
            value={client.telephone}
        />
        <DetailItem
            icon={<FaMapMarkerAlt />}
            value={client.adresse && `${client.adresse} - ${client.ville}`}
        />
        <DetailItem
            icon={<FaBuilding />}
            value={client.societe}
        />
    </div>
);

// Élément de détail
const DetailItem = ({ icon, value }) =>
    value ? (
        <div className="client-detail">
            {React.cloneElement(icon, { className: "detail-icon" })}
            <span className="detail-value">{value}</span>
        </div>
    ) : null;

// Bouton d'action réutilisable
const ActionButton = ({ icon, title, onClick, className }) => (
    <button
        onClick={onClick}
        className={`action-btn ${className}`}
        title={title}
    >
        {icon}
    </button>
);

// Ligne de tableau client
const ClientTableRow = ({ client, isSelected, onSelect, onView, onEdit, onDelete }) => {
    const handleAction = (e, action) => {
        e.stopPropagation();
        if (!client || !client.id) {
            console.error("Client is undefined in ClientCard");
            return;
        }
        action(client);
    };

    return (
        <tr
            className={isSelected ? 'active' : ''}
            onClick={() => onSelect(client.id)}
        >
            <td>
                <div className="cell-content">
                    <div className="client-avatar-small">
                        {client.nom.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="client-name">{client.nom}</div>
                        {client.societe && <div className="client-company">{client.societe}</div>}
                    </div>
                </div>
            </td>
            <td>
                <div className={`client-badge ${client.type}`}>
                    {client.type.charAt(0).toUpperCase() + client.type.slice(1)}
                </div>
            </td>
            <td>
                <ContactInfo client={client} />
            </td>
            <td>
                <AddressInfo client={client} />
            </td>
            <td>
                <TableActions
                    onView={(e) => handleAction(e, onView)}
                    onEdit={(e) => handleAction(e, onEdit)}
                    onDelete={(e) => handleAction(e, onDelete)}
                />
            </td>
        </tr>
    );
};

// Informations de contact
const ContactInfo = ({ client }) => (
    <div className="client-contact">
        {client.email && <div><FaEnvelope /> {client.email}</div>}
        {client.telephone && <div><FaPhone /> {client.telephone}</div>}
    </div>
);

// Informations d'adresse
const AddressInfo = ({ client }) =>
    client.adresse ? (
        <div className="client-address">
            <FaMapMarkerAlt /> {client.adresse}
            {client.ville && `, ${client.ville}`}
        </div>
    ) : null;

// Actions du tableau
const TableActions = ({ onView, onEdit, onDelete }) => (
    <div className="table-actions">
        <ActionButton
            icon={<FaEye />}
            title="Voir détails"
            onClick={onView}
            className="view-btn"
        />
        <ActionButton
            icon={<FaEdit />}
            title="Modifier"
            onClick={onEdit}
            className="edit-btn"
        />
        <ActionButton
            icon={<FaTrash />}
            title="Supprimer"
            onClick={onDelete}
            className="delete-btn"
        />
    </div>
);

// Section des factures
const ClientInvoicesSection = ({
    selectedClient,
    clientFactures,
    onCreateInvoice,
    onDeleteFacture,
    sectionRef
}) => {
    if (!selectedClient) return null;

    const factures = clientFactures || [];

    return (
        <div className="invoices-section">
            <div className="invoices-header" ref={sectionRef}>
                <h2 className="section-title">
                    <FaFileInvoiceDollar /> Factures de {selectedClient.nom} ({factures.length})
                </h2>
                <div className="invoices-actions">
                    <button onClick={onCreateInvoice} className="create-invoice-btn">
                        <FaPlus /> Créer une facture
                    </button>
                    <button className="export-btn">Exporter</button>
                </div>
            </div>

            {factures.length === 0 ? (
                <div className="empty-state">
                    <p>Aucune facture trouvée pour ce client</p>
                    <button onClick={onCreateInvoice} className="primary-btn">
                        <FaPlus /> Créer une facture
                    </button>
                </div>
            ) : (
                <InvoicesTable
                    factures={factures}
                    onDeleteFacture={onDeleteFacture}
                />
            )}
        </div>
    );
};

// Tableau des factures
const InvoicesTable = ({ factures, onDeleteFacture }) => (
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
                {factures.map(facture => (
                    <InvoiceRow
                        key={facture.id}
                        facture={facture}
                        onDeleteFacture={onDeleteFacture}
                    />
                ))}
            </tbody>
        </table>
    </div>
);

// Ligne de facture
const InvoiceRow = ({ facture, onDeleteFacture }) => (
    <tr>
        <td>
            {facture.numero}
            {facture.nomSocieteHistorique && (
                <span title={`Ancien nom: ${facture.nomSocieteHistorique}`}>*</span>
            )}
        </td>
        <td>{facture.date}</td>
        <td>{facture.totalTTC} FCFA</td>
        <td>
            <span className={`invoice-status ${facture.statut}`}>
                {facture.statut}
            </span>
        </td>
        <td>
            <div className="table-actions">
                <ActionButton
                    icon={<FaEdit />}
                    title="Modifier"
                    className="edit-btn"
                />
                <ActionButton
                    icon={<FaTrash />}
                    title="Supprimer"
                    onClick={() => onDeleteFacture(facture.id)}
                    className="delete-btn"
                />
                <ActionButton
                    icon={<FaSearch />}
                    title="Voir"
                    className="view-btn"
                />
            </div>
        </td>
    </tr>
);

// Composant Modal de visualisation client - Version refactorisée
const ClientsViewModal = ({
    client,
    isOpen,
    onClose,
    onEdit,
    onCreateInvoice
}) => {
    if (!isOpen || !client) return null;

    // Fonction pour formater la date
    const formatDate = (dateString) => {
        if (!dateString) return 'Date non spécifiée';
        try {
            return new Date(dateString).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    // Fonction pour obtenir l'icône du type
    const getTypeIcon = (type) => {
        switch (type) {
            case 'client': return <FaUsers />;
            case 'prospect': return <FaSearch />;
            case 'partenaire': return <FaHandshake />;
            case 'fournisseur': return <FaTruck />;
            default: return <FaUsers />;
        }
    };

    // Fonction pour vérifier si une valeur est vide
    const isEmptyValue = (value) => {
        return !value || value.trim() === '';
    };

    return (
        <div className="clients-modal-overlay" onClick={onClose}>
            <div className="clients-modal" onClick={e => e.stopPropagation()}>
                {/* En-tête du modal */}
                <div className="clients-modal-header">
                    <h2 className="clients-modal-title">
                        <FaEye /> Détails du Client
                    </h2>
                    <button
                        className="clients-modal-close"
                        onClick={onClose}
                        aria-label="Fermer le modal"
                    >
                        ×
                    </button>
                </div>

                {/* Contenu du modal */}
                <div className="clients-modal-content">
                    {/* En-tête client */}
                    <div className="clients-modal-client-header">
                        <div className="clients-modal-avatar">
                            {client.nom?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <div className="clients-modal-client-info">
                            <h3 className="clients-modal-client-name">
                                {client.nom || 'Nom non spécifié'}
                            </h3>
                            {!isEmptyValue(client.societe) && (
                                <div className="clients-modal-client-company">
                                    {client.societe}
                                </div>
                            )}
                            <div className={`clients-modal-type-badge ${client.type || 'prospect'}`}>
                                {getTypeIcon(client.type || 'prospect')}
                                {client.type?.charAt(0)?.toUpperCase() + client.type?.slice(1) || 'Prospect'}
                            </div>
                        </div>
                    </div>

                    {/* Sections d'informations */}
                    <div className="clients-modal-sections-grid">
                        {/* Section Informations générales */}
                        <div className="clients-modal-section">
                            <h4 className="clients-modal-section-title">
                                <FaInfoCircle /> Informations Générales
                            </h4>
                            <div className="clients-modal-details-list">
                                <div className="clients-modal-detail-item">
                                    <span className="clients-modal-detail-icon">
                                        <FaUserTie />
                                    </span>
                                    <div className="clients-modal-detail-content">
                                        <div className="clients-modal-detail-label">Responsable</div>
                                        <div className={`clients-modal-detail-value ${isEmptyValue(client.societe) ? 'empty' : ''}`}>
                                            {!isEmptyValue(client.societe) ? client.societe : 'Non spécifié'}
                                        </div>
                                    </div>
                                </div>

                                {client.dateCreation && (
                                    <div className="clients-modal-detail-item">
                                        <span className="clients-modal-detail-icon">
                                            <FaCalendarAlt />
                                        </span>
                                        <div className="clients-modal-detail-content">
                                            <div className="clients-modal-detail-label">Date de Création</div>
                                            <div className="clients-modal-detail-value">
                                                {formatDate(client.dateCreation)}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {client.dateModification && (
                                    <div className="clients-modal-detail-item">
                                        <span className="clients-modal-detail-icon">
                                            <FaHistory />
                                        </span>
                                        <div className="clients-modal-detail-content">
                                            <div className="clients-modal-detail-label">Dernière Modification</div>
                                            <div className="clients-modal-detail-value">
                                                {formatDate(client.dateModification)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section Contact */}
                        <div className="clients-modal-section">
                            <h4 className="clients-modal-section-title">
                                <FaAddressBook /> Contact
                            </h4>
                            <div className="clients-modal-details-list">
                                <div className="clients-modal-detail-item">
                                    <span className="clients-modal-detail-icon">
                                        <FaEnvelope />
                                    </span>
                                    <div className="clients-modal-detail-content">
                                        <div className="clients-modal-detail-label">Email</div>
                                        <div className={`clients-modal-detail-value ${isEmptyValue(client.email) ? 'empty' : ''}`}>
                                            {!isEmptyValue(client.email) ? client.email : 'Non spécifié'}
                                        </div>
                                    </div>
                                </div>

                                <div className="clients-modal-detail-item">
                                    <span className="clients-modal-detail-icon">
                                        <FaPhone />
                                    </span>
                                    <div className="clients-modal-detail-content">
                                        <div className="clients-modal-detail-label">Téléphone</div>
                                        <div className={`clients-modal-detail-value ${isEmptyValue(client.telephone) ? 'empty' : ''}`}>
                                            {!isEmptyValue(client.telephone) ? client.telephone : 'Non spécifié'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section Adresse */}
                        <div className="clients-modal-section">
                            <h4 className="clients-modal-section-title">
                                <FaMapMarkedAlt /> Localisation
                            </h4>
                            <div className="clients-modal-details-list">
                                <div className="clients-modal-detail-item">
                                    <span className="clients-modal-detail-icon">
                                        <FaMapMarkerAlt />
                                    </span>
                                    <div className="clients-modal-detail-content">
                                        <div className="clients-modal-detail-label">Adresse</div>
                                        <div className={`clients-modal-detail-value ${isEmptyValue(client.adresse) ? 'empty' : ''}`}>
                                            {!isEmptyValue(client.adresse) ? client.adresse : 'Non spécifié'}
                                        </div>
                                    </div>
                                </div>

                                <div className="clients-modal-detail-item">
                                    <span className="clients-modal-detail-icon">
                                        <FaCity />
                                    </span>
                                    <div className="clients-modal-detail-content">
                                        <div className="clients-modal-detail-label">Ville & Pays</div>
                                        <div className={`clients-modal-detail-value ${isEmptyValue(client.ville) ? 'empty' : ''}`}>
                                            {!isEmptyValue(client.ville) ? client.ville : 'Non spécifié'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section Historique (si disponible) */}
                        {client.anciensNoms?.length > 0 && (
                            <div className="clients-modal-section">
                                <h4 className="clients-modal-section-title">
                                    <FaHistory /> Historique des Noms
                                </h4>
                                <div className="clients-modal-history-list">
                                    {client.anciensNoms.map((ancien, index) => (
                                        <div key={index} className="clients-modal-history-item">
                                            <div className="clients-modal-history-name">
                                                {ancien.nom || 'Nom inconnu'}
                                            </div>
                                            <div className="clients-modal-history-date">
                                                {formatDate(ancien.date)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Section Notes (si disponible) */}
                        {client.notes && !isEmptyValue(client.notes) && (
                            <div className="clients-modal-section">
                                <h4 className="clients-modal-section-title">
                                    <FaStickyNote /> Notes
                                </h4>
                                <div className="clients-modal-details-list">
                                    <div className="clients-modal-detail-item">
                                        <span className="clients-modal-detail-icon">
                                            <FaComment />
                                        </span>
                                        <div className="clients-modal-detail-content">
                                            <div className="clients-modal-detail-value">
                                                {client.notes}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Barre d'actions */}
                    <div className="clients-modal-actions-bar">
                        <button
                            className="clients-modal-action-btn clients-modal-view-edit"
                            onClick={() => {
                                onClose();
                                onEdit(client);
                            }}
                            aria-label="Modifier ce client"
                        >
                            <FaEdit /> Modifier
                        </button>

                        <button
                            className="clients-modal-action-btn clients-modal-view-invoice"
                            onClick={() => {
                                onClose();
                                if (onCreateInvoice) onCreateInvoice(client);
                            }}
                            aria-label="Créer une facture pour ce client"
                        >
                            <FaFileInvoiceDollar /> Créer Facture
                        </button>

                        <button
                            className="clients-modal-action-btn clients-modal-view-close"
                            onClick={onClose}
                            aria-label="Fermer le modal"
                        >
                            <FaTimes /> Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
// COMPOSANT PRINCIPAL
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
    const [viewMode, setViewMode] = useState('card');
    const [sortBy, setSortBy] = useState('nom');
    const [sortOrder, setSortOrder] = useState('asc');
    const invoicesSectionRef = useRef(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [backgroundLoaded, setBackgroundLoaded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const [viewModalClient, setViewModalClient] = useState(null);


    // Préchargement de l'image de fond
    useEffect(() => {
        const img = new Image();
        img.src = "/bg-client.jpg";
        img.onload = img.onerror = () => setBackgroundLoaded(true);
    }, []);

    // Gestion du chargement
    useEffect(() => {
        if (backgroundLoaded) {
            const timer = setTimeout(() => setLoading(false), 500);
            return () => clearTimeout(timer);
        }
    }, [backgroundLoaded]);

    // Détection responsive
    useEffect(() => {
        const checkIsMobile = () => setIsMobile(window.innerWidth <= 992);
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    // Réinitialiser à la première page quand la recherche change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy, sortOrder]);

    // Gestion de l'upload de fichier
    const handleFileUpload = useCallback((e) => {
        if (!e.target.files?.length) return;
        handleImportClient?.(e);
    }, [handleImportClient]);

    // Tri des clients
    const toggleSort = useCallback((field) => {
        setSortBy(current => current === field ? current : field);
        setSortOrder(current =>
            sortBy === field ? (current === 'asc' ? 'desc' : 'asc') : 'asc'
        );
    }, [sortBy]);

    // Clients triés (mémoïsé)
    const sortedClients = useMemo(() => {
        return [...filteredClients].sort((a, b) => {
            let compareValue = 0;
            if (sortBy === 'nom') compareValue = a.nom.localeCompare(b.nom);
            else if (sortBy === 'type') compareValue = a.type.localeCompare(b.type);
            else if (sortBy === 'dateCreation') compareValue = new Date(a.dateCreation) - new Date(b.dateCreation);
            return sortOrder === 'asc' ? compareValue : -compareValue;
        });
    }, [filteredClients, sortBy, sortOrder]);

    // Pagination calculs
    const totalItems = sortedClients.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Calcul des clients à afficher pour la page actuelle
    const paginatedClients = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return sortedClients.slice(startIndex, endIndex);
    }, [sortedClients, currentPage, itemsPerPage]);

    // Gestion du changement de page
    const handlePageChange = useCallback((page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);

        // Scroll vers le haut quand on change de page
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [totalPages]);

    // Gestion du changement d'éléments par page
    const handleItemsPerPageChange = useCallback((e) => {
        const newItemsPerPage = parseInt(e.target.value, 10);
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Retour à la première page
    }, []);

    // Sélection du client avec défilement
    const handleClientSelect = useCallback((clientId) => {
        loadClientInvoices(clientId);
        setTimeout(() => {
            invoicesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }, [loadClientInvoices]);

    // Handler pour ouvrir le modal
    const handleViewClient = useCallback((client) => {
        console.log("Opening view modal for client:", client);
        setViewModalClient(client);
    }, []);

    // Handler pour fermer le modal
    const handleCloseModal = useCallback(() => {
        setViewModalClient(null);
    }, []);

    // Détermination du mode d'affichage
    const displayMode = isMobile ? 'card' : viewMode;

    if (loading) return <LoadingState />;

    return (
        <>
            {/* Formulaires */}
            {editingClient && (
                <ClientForm
                    isEditing={true}
                    formData={editingClient}
                    onSubmit={handleUpdate}
                    onCancel={cancelEdit}
                    onChange={handleEditChange}
                    onSocieteBlur={handleSocieteBlur}
                />
            )}

            {showAddForm && !editingClient && (
                <ClientForm
                    isEditing={false}
                    formData={client}
                    onSubmit={handleSubmit}
                    onCancel={() => setShowAddForm(false)}
                    onChange={handleChange}
                />
            )}
            <ClientsViewModal
                client={viewModalClient}
                isOpen={!!viewModalClient}
                onClose={handleCloseModal}
                onEdit={(client) => {
                    handleCloseModal();
                    handleEdit(client);
                }}
                onCreateInvoice={handleCreateInvoice}
            />

            {/* Section principale */}
            <div
                className={`clients-section ${backgroundLoaded ? 'background-loaded' : ''}`}
            >
                <ClientsHeader
                    clientsCount={totalItems}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    toggleSort={toggleSort}
                    onAddClient={() => setShowAddForm(!showAddForm)}
                    showAddForm={showAddForm}
                    onImport={handleFileUpload}
                    isMobile={isMobile}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                />

                {/* Barre de progression d'import */}
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

                {/* Liste des clients */}
                {totalItems === 0 ? (
                    <EmptyState onAddClient={() => setShowAddForm(true)} />
                ) : displayMode === 'card' ? (
                    <>
                        <div className="clients-grid">
                            {paginatedClients.map((clientItem) => (
                                <ClientCard
                                    key={clientItem.id}
                                    client={clientItem}
                                    isSelected={selectedClient?.id === clientItem.id}
                                    onSelect={handleClientSelect}
                                    onEdit={() => {
                                        handleEdit(clientItem);
                                    }}
                                    onDelete={() => {
                                        handleDelete(clientItem.id);
                                    }}
                                    onView={handleViewClient}

                                />
                            ))}
                        </div>

                        {/* Pagination en bas pour vue carte */}
                        {totalPages > 1 && (
                            <div className="pagination-footer">
                                <PaginationControls
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                    totalItems={totalItems}
                                    itemsPerPage={itemsPerPage}
                                    startIndex={(currentPage - 1) * itemsPerPage}
                                    endIndex={Math.min(currentPage * itemsPerPage, totalItems)}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <table className="clients-table">
                            <thead>
                                <tr>
                                    <th onClick={() => toggleSort('nom')} className={sortBy === 'nom' ? 'active' : ''}>
                                        <div className="th-content">
                                            Nom
                                            {sortBy === 'nom' && (
                                                <span className="sort-indicator">
                                                    {sortOrder === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                    <th onClick={() => toggleSort('type')} className={sortBy === 'type' ? 'active' : ''}>
                                        <div className="th-content">
                                            Type
                                            {sortBy === 'type' && (
                                                <span className="sort-indicator">
                                                    {sortOrder === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                    <th>Contact</th>
                                    <th>Adresse</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedClients.map((clientItem) => (
                                    <ClientTableRow
                                        key={clientItem.id}
                                        client={clientItem}
                                        isSelected={selectedClient?.id === clientItem.id}
                                        onSelect={handleClientSelect}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onView={handleViewClient}

                                    />
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination en bas pour vue tableau */}
                        {totalPages > 1 && (
                            <div className="pagination-footer">
                                <PaginationControls
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                    totalItems={totalItems}
                                    itemsPerPage={itemsPerPage}
                                    startIndex={(currentPage - 1) * itemsPerPage}
                                    endIndex={Math.min(currentPage * itemsPerPage, totalItems)}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Section des factures */}
            <ClientInvoicesSection
                selectedClient={selectedClient}
                clientFactures={clientFactures}
                onCreateInvoice={handleCreateInvoice}
                onDeleteFacture={handleDeleteFacture}
                sectionRef={invoicesSectionRef}
            />
        </>
    );
};

// Composant de pagination réutilisable
const PaginationControls = React.memo(({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
    startIndex,
    endIndex
}) => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    // Calcul des pages à afficher
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="pagination-container">
            <div className="pagination-info">
                Affichage de {startIndex + 1} à {endIndex} sur {totalItems} clients
            </div>

            <div className="pagination-buttons">
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="pagination-btn first-btn"
                    title="Première page"
                >
                    «
                </button>

                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-btn prev-btn"
                    title="Page précédente"
                >
                    <FaChevronLeft />
                </button>

                {startPage > 1 && (
                    <>
                        <button
                            onClick={() => onPageChange(1)}
                            className={`pagination-btn page-btn ${currentPage === 1 ? 'active' : ''}`}
                        >
                            1
                        </button>
                        {startPage > 2 && <span className="pagination-ellipsis">...</span>}
                    </>
                )}

                {pageNumbers.map(page => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`pagination-btn page-btn ${currentPage === page ? 'active' : ''}`}
                    >
                        {page}
                    </button>
                ))}

                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
                        <button
                            onClick={() => onPageChange(totalPages)}
                            className={`pagination-btn page-btn ${currentPage === totalPages ? 'active' : ''}`}
                        >
                            {totalPages}
                        </button>
                    </>
                )}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-btn next-btn"
                    title="Page suivante"
                >
                    <FaChevronRight />
                </button>

                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="pagination-btn last-btn"
                    title="Dernière page"
                >
                    »
                </button>
            </div>

            <div className="pagination-jump">
                <span>Aller à :</span>
                <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                        const page = parseInt(e.target.value, 10);
                        if (page >= 1 && page <= totalPages) {
                            onPageChange(page);
                        }
                    }}
                    className="page-jump-input"
                />
            </div>
        </div>
    );
});

export default React.memo(ClientsPage);