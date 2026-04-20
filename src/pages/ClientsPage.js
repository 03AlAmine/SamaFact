import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
    FaUsers, FaEdit, FaTrash, FaEnvelope, FaPhone,
    FaMapMarkerAlt, FaPlus, FaSearch,
    FaFileInvoiceDollar, FaFileExcel, FaList, FaTh,
    FaSortAlphaDown, FaChevronLeft, FaChevronRight,
    FaEye, FaTimes, FaInfoCircle, FaCalendarAlt,
    FaHistory, FaAddressBook, FaCity,
    FaUserTie, FaHandshake, FaTruck,
    FaMapMarkedAlt
} from "react-icons/fa";
import empty_client from '../assets/empty_client.png';
import "../css/ClientPage.css";
import "../css/ClientModal.css";
// Composant d'état vide
const EmptyState = ({ onAddClient }) => (
    <div className="empty-state">
        <img src={empty_client} alt="Aucun client" className="empty-image" />
        <h3>Aucun client trouvé</h3>
        <p>Commencez par créer votre premier client</p>
        <button className="primary-btn" onClick={onAddClient}>
            <FaPlus className="btn-icon" /> Ajouter un client
        </button>
    </div>
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

// Composant de formulaire client
const ClientForm = ({
    isEditing,
    formData,
    onSubmit,
    onCancel,
    onChange,
    onSocieteBlur
}) => (
    <form onSubmit={onSubmit} className="form-panel">
        <div className="form-header">
            <h2 className="form-title">
                {isEditing ? <FaEdit /> : <FaPlus />}
                {isEditing ? "Modifier le client" : "Ajouter un nouveau client"}
            </h2>
            {!isEditing && (
                <button type="button" className="primary-btn" onClick={onCancel}>
                    <FaPlus className="btn-icon" /> Fermer
                </button>
            )}
        </div>

        <div className="form-row">
            <FormField
                label="Responsable"
                name="societe"
                value={formData.societe || ""}
                onChange={onChange}
                placeholder="Monsieur Diop - Dame"
            />
            <FormField
                label="Raison sociale"
                name="nom"
                value={formData.nom || ""}
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
                value={formData.email || ""}
                onChange={onChange}
                placeholder="leader@gmail.com"
            />
            <FormField
                label="Téléphone"
                name="telephone"
                value={formData.telephone || ""}
                onChange={onChange}
                placeholder="781234567"
            />
        </div>

        <div className="form-row">
            <FormField
                label="Adresse"
                name="adresse"
                value={formData.adresse || ""}
                onChange={onChange}
                required
                placeholder="Ouest Foire, Route de l'Aéroport"
            />
            <FormField
                label="Ville/Pays"
                name="ville"
                value={formData.ville || ""}
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
            className="search-input"
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

// Options de tri
const SortOptions = ({ sortBy, sortOrder, toggleSort }) => (
    <div className="sort-options">
        <span className="sort-label">Trier par:</span>
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

// Boutons d'action
const ActionButtons = ({ onAddClient, showAddForm, onImport }) => (
    <>
        <button className="primary-btn" onClick={onAddClient}>
            <FaPlus className="btn-icon" /> {showAddForm ? "Fermer" : "Ajouter"}
        </button>
        <ImportButton onImport={onImport} />
    </>
);

// En-tête clients
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
    <div className="page-header">
        <div className="header-left">
            <h2 className="section-title">
                <FaUsers className="section-icon" /> Clients
                <span className="count-badge">{clientsCount}</span>
            </h2>
            <ViewControls viewMode={viewMode} setViewMode={setViewMode} isMobile={isMobile} />
            <SearchBox searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </div>

        <div className="header-right">
            <SortOptions sortBy={sortBy} sortOrder={sortOrder} toggleSort={toggleSort} />

            <div className="pagination-controls">
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

                <div className="pagination-navigation">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="pagination-btn"
                        title="Page précédente"
                    >
                        <FaChevronLeft />
                    </button>

                    <span className="page-info">
                        Page {currentPage} sur {totalPages}
                    </span>

                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                        title="Page suivante"
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

// Élément de détail
const DetailItem = ({ icon, value }) => {
    if (!value) return null;
    return (
        <div className="client-detail-item">
            {React.cloneElement(icon, { className: "detail-icon" })}
            <span className="detail-value">{value}</span>
        </div>
    );
};

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
                {client.type?.charAt(0).toUpperCase() + client.type?.slice(1) || 'Prospect'}
            </div>

            <div className="client-card-header">
                <div className="client-card-sous-header">
                    <div className="client-avatar">
                        {client.nom?.charAt(0).toUpperCase() || 'C'}
                    </div>
                    <div className="client-info">
                        <h3 className="client-name">{client.nom}</h3>
                        {client.societe && <div className="client-company">{client.societe}</div>}
                    </div>
                </div>
                <div className="client-card-actions">
                    <ActionButton
                        icon={<FaEye />}
                        title="Voir détails"
                        onClick={(e) => handleAction(e, onView)}
                        className="view"
                    />
                    <ActionButton
                        icon={<FaEdit />}
                        title="Modifier"
                        onClick={(e) => handleAction(e, onEdit)}
                        className="edit"
                    />
                    <ActionButton
                        icon={<FaTrash />}
                        title="Supprimer"
                        onClick={(e) => { e.stopPropagation(); onDelete(client.id); }}
                        className="delete"
                    />
                </div>
            </div>

            <div className="client-details">
                <DetailItem icon={<FaEnvelope />} value={client.email} />
                <DetailItem icon={<FaPhone />} value={client.telephone} />
                <DetailItem icon={<FaMapMarkerAlt />} value={client.adresse} />
                <DetailItem icon={<FaCity />} value={client.ville} />
            </div>

            {client.anciensNoms?.length > 0 && (
                <div className="client-history">
                    <FaHistory /> Ancien nom: {client.anciensNoms[0].nom}
                </div>
            )}
        </div>
    );
};

// Ligne de tableau client
const ClientTableRow = ({ client, isSelected, onSelect, onView, onEdit, onDelete }) => {
    const handleAction = (e, action) => {
        e.stopPropagation();
        if (!client || !client.id) {
            console.error("Client is undefined");
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
                        {client.nom?.charAt(0).toUpperCase() || 'C'}
                    </div>
                    <div>
                        <div className="employee-name-cell">{client.nom}</div>
                        {client.societe && <div className="employee-department">{client.societe}</div>}
                    </div>
                </div>
            </td>
            <td>
                <span className={`client-badge ${client.type}`}>
                    {client.type?.charAt(0).toUpperCase() + client.type?.slice(1) || 'Prospect'}
                </span>
            </td>
            <td>
                <div className="client-contact">
                    {client.email && <div><FaEnvelope /> {client.email}</div>}
                    {client.telephone && <div><FaPhone /> {client.telephone}</div>}
                </div>
            </td>
            <td>
                {client.adresse && (
                    <div className="client-address">
                        <FaMapMarkerAlt /> {client.adresse}
                        {client.ville && `, ${client.ville}`}
                    </div>
                )}
            </td>
            <td>
                <div className="table-actions">
                    <ActionButton
                        icon={<FaEye />}
                        title="Voir détails"
                        onClick={(e) => handleAction(e, onView)}
                        className="view"
                    />
                    <ActionButton
                        icon={<FaEdit />}
                        title="Modifier"
                        onClick={(e) => handleAction(e, onEdit)}
                        className="edit"
                    />
                    <ActionButton
                        icon={<FaTrash />}
                        title="Supprimer"
                        onClick={(e) => { e.stopPropagation(); onDelete(client.id); }}
                        className="delete"
                    />
                </div>
            </td>
        </tr>
    );
};

// Composant Modal de visualisation client
const ClientsViewModal = ({
    client,
    isOpen,
    onClose,
    onEdit,
    onCreateInvoice
}) => {
    if (!isOpen || !client) return null;

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

    const getTypeIcon = (type) => {
        switch (type) {
            case 'client': return <FaUsers />;
            case 'prospect': return <FaSearch />;
            case 'partenaire': return <FaHandshake />;
            case 'fournisseur': return <FaTruck />;
            default: return <FaUsers />;
        }
    };

    return (
        <div className="clients-modal-overlay" onClick={onClose}>
            <div className="clients-modal" onClick={e => e.stopPropagation()}>
                <div className="clients-modal-header">
                    <h2 className="clients-modal-title">
                        <FaEye /> Détails du Client
                    </h2>
                    <button className="clients-modal-close" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="clients-modal-content">
                    <div className="clients-modal-client-header">
                        <div className="clients-modal-avatar">
                            {client.nom?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <div className="clients-modal-client-info">
                            <h3 className="clients-modal-client-name">{client.nom}</h3>
                            {client.societe && (
                                <div className="clients-modal-client-company">{client.societe}</div>
                            )}
                            <div className={`clients-modal-type-badge ${client.type || 'prospect'}`}>
                                {getTypeIcon(client.type || 'prospect')}
                                {client.type?.charAt(0)?.toUpperCase() + client.type?.slice(1) || 'Prospect'}
                            </div>
                        </div>
                    </div>

                    <div className="clients-modal-sections-grid">
                        <div className="clients-modal-section">
                            <h4 className="clients-modal-section-title">
                                <FaInfoCircle /> Informations Générales
                            </h4>
                            <div className="clients-modal-details-list">
                                <div className="clients-modal-detail-item">
                                    <span className="clients-modal-detail-icon"><FaUserTie /></span>
                                    <div className="clients-modal-detail-content">
                                        <div className="clients-modal-detail-label">Responsable</div>
                                        <div className="clients-modal-detail-value">
                                            {client.societe || 'Non spécifié'}
                                        </div>
                                    </div>
                                </div>
                                {client.dateCreation && (
                                    <div className="clients-modal-detail-item">
                                        <span className="clients-modal-detail-icon"><FaCalendarAlt /></span>
                                        <div className="clients-modal-detail-content">
                                            <div className="clients-modal-detail-label">Date de Création</div>
                                            <div className="clients-modal-detail-value">{formatDate(client.dateCreation)}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="clients-modal-section">
                            <h4 className="clients-modal-section-title">
                                <FaAddressBook /> Contact
                            </h4>
                            <div className="clients-modal-details-list">
                                <div className="clients-modal-detail-item">
                                    <span className="clients-modal-detail-icon"><FaEnvelope /></span>
                                    <div className="clients-modal-detail-content">
                                        <div className="clients-modal-detail-label">Email</div>
                                        <div className="clients-modal-detail-value">
                                            {client.email || 'Non spécifié'}
                                        </div>
                                    </div>
                                </div>
                                <div className="clients-modal-detail-item">
                                    <span className="clients-modal-detail-icon"><FaPhone /></span>
                                    <div className="clients-modal-detail-content">
                                        <div className="clients-modal-detail-label">Téléphone</div>
                                        <div className="clients-modal-detail-value">
                                            {client.telephone || 'Non spécifié'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="clients-modal-section">
                            <h4 className="clients-modal-section-title">
                                <FaMapMarkedAlt /> Localisation
                            </h4>
                            <div className="clients-modal-details-list">
                                <div className="clients-modal-detail-item">
                                    <span className="clients-modal-detail-icon"><FaMapMarkerAlt /></span>
                                    <div className="clients-modal-detail-content">
                                        <div className="clients-modal-detail-label">Adresse</div>
                                        <div className="clients-modal-detail-value">
                                            {client.adresse || 'Non spécifié'}
                                        </div>
                                    </div>
                                </div>
                                <div className="clients-modal-detail-item">
                                    <span className="clients-modal-detail-icon"><FaCity /></span>
                                    <div className="clients-modal-detail-content">
                                        <div className="clients-modal-detail-label">Ville & Pays</div>
                                        <div className="clients-modal-detail-value">
                                            {client.ville || 'Non spécifié'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {client.anciensNoms?.length > 0 && (
                            <div className="clients-modal-section">
                                <h4 className="clients-modal-section-title">
                                    <FaHistory /> Historique des Noms
                                </h4>
                                <div className="clients-modal-history-list">
                                    {client.anciensNoms.map((ancien, index) => (
                                        <div key={index} className="clients-modal-history-item">
                                            <div className="clients-modal-history-name">{ancien.nom}</div>
                                            <div className="clients-modal-history-date">{formatDate(ancien.date)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="clients-modal-actions-bar">
                        <button
                            className="clients-modal-action-btn clients-modal-view-edit"
                            onClick={() => {
                                onClose();
                                onEdit(client);
                            }}
                        >
                            <FaEdit /> Modifier
                        </button>
                        <button
                            className="clients-modal-action-btn clients-modal-view-invoice"
                            onClick={() => {
                                onClose();
                                if (onCreateInvoice) onCreateInvoice(client);
                            }}
                        >
                            <FaFileInvoiceDollar /> Créer Facture
                        </button>
                        <button
                            className="clients-modal-action-btn clients-modal-view-close"
                            onClick={onClose}
                        >
                            <FaTimes /> Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Composant de pagination
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

    const [isMobile, setIsMobile] = useState(false);

    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const [viewModalClient, setViewModalClient] = useState(null);

    useEffect(() => {
        const img = new Image();
        img.src = "/bg-client.jpg";
        img.onload = img.onerror = () => setBackgroundLoaded(true);
    }, []);


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
        // Scroll le conteneur de la liste, pas la window
        document.querySelector('.clients-grid, .employees-list')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [totalPages]);

    // Gestion du changement d'éléments par page
    const handleItemsPerPageChange = useCallback((e) => {
        setItemsPerPage(parseInt(e.target.value, 10));
        setCurrentPage(1); // ← remet toujours sur la page 1
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
        setViewModalClient(client);
    }, []);

    // Handler pour fermer le modal
    const handleCloseModal = useCallback(() => {
        setViewModalClient(null);
    }, []);

    // Détermination du mode d'affichage
    const displayMode = isMobile ? 'card' : viewMode;

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
            <div className={`page-container ${backgroundLoaded ? 'background-loaded' : ''}`}>
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
                    <div className={`import-progress ${importProgress.includes("Erreur") ? 'error' : ''}`}>
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
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onView={handleViewClient}
                                />
                            ))}
                        </div>

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
                        <div className="clients-table-container">
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
                        </div>

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
            {selectedClient && (
                <div className="invoices-section" ref={invoicesSectionRef}>
                    <div className="invoices-header">
                        <h2 className="section-title">
                            <FaFileInvoiceDollar className="section-icon" /> Factures
                            <span className="count-badge">{clientFactures?.length || 0}</span>
                        </h2>
                        <div className="invoices-actions">
                            <button onClick={handleCreateInvoice} className="create-invoice-btn">
                                <FaPlus /> Créer une facture
                            </button>
                            <button className="export-btn">Exporter</button>
                        </div>
                    </div>

                    {clientFactures?.length === 0 ? (
                        <div className="empty-state">
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
                                    {clientFactures?.map(facture => (
                                        <tr key={facture.id}>
                                            <td>{facture.numero}</td>
                                            <td>{facture.date}</td>
                                            <td className="amount">{facture.totalTTC?.toLocaleString()} FCFA</td>
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
                                                        className="edit"
                                                    />
                                                    <ActionButton
                                                        icon={<FaTrash />}
                                                        title="Supprimer"
                                                        onClick={() => handleDeleteFacture(facture.id, facture.type || 'facture')}
                                                        className="delete"
                                                    />
                                                    <ActionButton
                                                        icon={<FaEye />}
                                                        title="Voir"
                                                        className="view"
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default React.memo(ClientsPage);