import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
    FaUsers, FaEdit, FaTrash, FaBuilding, FaPlus, FaSearch,
    FaFileAlt, FaFileExcel, FaList, FaTh,
    FaSortAlphaDown, FaIdCard, FaMoneyBillWave, FaCalendarAlt, FaEye,
    FaChevronLeft, FaChevronRight, FaDownload
} from "react-icons/fa";
import empty_employee from '../assets/empty_employe.png';
import '../css/EmployeePage.css';
import '../css/EmployeeModal.css';  
import '../css/TrackingModal.css';   
import { EmployeeDetailsModal } from '../components/dialogs/EmployeeModal';
import { Modal, Button } from "antd";
import LoadingState from '../components/common/LoadingState';

// Composant d'état vide
const EmptyState = ({ onAddEmployee }) => (
    <div className="empty-state">
        <img src={empty_employee} alt="Aucun employé" className="empty-image" />
        <h3>Aucun employé trouvé</h3>
        <p>Commencez par créer votre premier employé</p>
        <button className="primary-btn" onClick={onAddEmployee}>
            <FaPlus className="btn-icon" /> Ajouter un employé
        </button>
    </div>
);

// Composant de champ de formulaire réutilisable
const FormField = ({ label, required, type = "text", min, max, ...props }) => (
    <div className="form-group">
        <label htmlFor={props.name} className="form-label">
            {label} {required && <span className="required">*</span>}
        </label>
        <input
            id={props.name}
            className="form-input"
            type={type}
            min={min}
            max={max}
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

// Formulaire employé
const EmployeeForm = ({
    isEditing,
    formData,
    onSubmit,
    onCancel,
    onChange,
    onEditChange,
    nextMatricule
}) => {
    const primesFields = [
        { name: "indemniteTransport", label: "Indemnité transport", value: formData.indemniteTransport || 26000 },
        { name: "primePanier", label: "Prime panier", value: formData.primePanier || 0 },
        { name: "indemniteResponsabilite", label: "Ind. responsabilité", value: formData.indemniteResponsabilite || 0 },
        { name: "indemniteDeplacement", label: "Ind. déplacement", value: formData.indemniteDeplacement || 0 }
    ];

    return (
        <form onSubmit={onSubmit} className="employee-form">
            <div className="form-header">
                <h2 className="form-title">
                    {isEditing ? <FaEdit /> : <FaPlus />}
                    {isEditing ? "Modifier l'employé" : "Ajouter un nouvel employé"}
                </h2>
                <div className="form-group">
                    <label className="form-label">
                        Matricule <span className="required">*</span>
                    </label>
                    <div className="matricule-display">
                        <div className="matricule-value">
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="matricule"
                                    value={formData.matricule || ""}
                                    onChange={onEditChange}
                                    className="form-input"
                                    required
                                    placeholder="Matricule"
                                    readOnly
                                />
                            ) : (
                                <div className="matricule-preview">
                                    <span className="matricule-code">
                                        {nextMatricule || "Chargement..."}
                                    </span>
                                    <input
                                        type="hidden"
                                        name="matricule"
                                        value={nextMatricule || ""}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {!isEditing && (
                    <button type="button" className="primary-btn" onClick={onCancel}>
                        <FaPlus className="btn-icon" /> Fermer
                    </button>
                )}
            </div>

            <div className="form-row">
                <FormField
                    label="Nom"
                    name="nom"
                    value={formData.nom || ""}
                    onChange={isEditing ? onEditChange : onChange}
                    required
                    placeholder="Diop"
                />
                <FormField
                    label="Prénom"
                    name="prenom"
                    value={formData.prenom || ""}
                    onChange={isEditing ? onEditChange : onChange}
                    required
                    placeholder="Moussa"
                />
                <FormField
                    label="Adresse"
                    name="adresse"
                    value={formData.adresse || ""}
                    onChange={isEditing ? onEditChange : onChange}
                    required
                    placeholder="Dakar, Sénégal"
                />
            </div>

            <div className="form-row">
                <FormField
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={isEditing ? onEditChange : onChange}
                    required
                    placeholder="moussa@entreprise.com"
                />
                <FormField
                    label="Poste"
                    name="poste"
                    value={formData.poste || ""}
                    onChange={isEditing ? onEditChange : onChange}
                    required
                    placeholder="Développeur"
                />
                <FormField
                    label="Département"
                    name="departement"
                    value={formData.departement || ""}
                    onChange={isEditing ? onEditChange : onChange}
                    placeholder="IT"
                />
            </div>

            <div className="form-row">
                <FormSelect
                    label="Contrat"
                    name="typeContrat"
                    value={formData.typeContrat || "CDI"}
                    onChange={isEditing ? onEditChange : onChange}
                    options={[
                        { value: "CDI", label: "CDI" },
                        { value: "CDD", label: "CDD" },
                        { value: "CTT", label: "CTT" },
                        { value: "Stage", label: "Stage" },
                        { value: "Freelance", label: "Freelance" }
                    ]}
                />
                <FormField
                    label="Date embauche"
                    name="dateEmbauche"
                    type="date"
                    value={formData.dateEmbauche || ""}
                    onChange={isEditing ? onEditChange : onChange}
                    required
                />
            </div>

            <div className="form-row">
                <FormField
                    label="Salaire brut"
                    name="salaireBase"
                    type="number"
                    value={formData.salaireBase || ""}
                    onChange={isEditing ? onEditChange : onChange}
                    required
                />
                <FormField
                    label="IPM"
                    name="ipm"
                    type="number"
                    value={formData.ipm || 0}
                    onChange={isEditing ? onEditChange : onChange}
                    min="0"
                    step="0.01"
                    placeholder="Impôt sur le revenu"
                />
                <FormField
                    label="Sursalaire"
                    name="sursalaire"
                    type="number"
                    value={formData.sursalaire || 0}
                    onChange={isEditing ? onEditChange : onChange}
                    min="0"
                    step="0.01"
                    placeholder="Sursalaire additionnel"
                />
            </div>

            <div className="form-row">
                <FormField
                    label="Catégorie"
                    name="categorie"
                    value={formData.categorie || ""}
                    onChange={isEditing ? onEditChange : onChange}
                    required
                    placeholder="1, 2, 3..."
                    type="number"
                    min="1"
                    max="10"
                />
                <FormField
                    label="Nbre parts"
                    name="nbreofParts"
                    type="number"
                    value={formData.nbreofParts || 1}
                    onChange={isEditing ? onEditChange : onChange}
                    min="1"
                />
            </div>

            <div className="form-section-title">
                <FaMoneyBillWave /> Primes et Indemnités
            </div>

            <div className="form-row">
                {primesFields.slice(0, 2).map(field => (
                    <FormField
                        key={field.name}
                        label={field.label}
                        name={field.name}
                        type="number"
                        value={field.value}
                        onChange={isEditing ? onEditChange : onChange}
                    />
                ))}
            </div>

            <div className="form-row">
                {primesFields.slice(2).map(field => (
                    <FormField
                        key={field.name}
                        label={field.label}
                        name={field.name}
                        type="number"
                        value={field.value}
                        onChange={isEditing ? onEditChange : onChange}
                    />
                ))}
            </div>

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
                    Ajouter l'employé
                </button>
            )}
        </form>
    );
};

// Contrôles de vue
const ViewControls = ({ viewMode, setViewMode, isMobile }) => (
    <div className="view-controls">
        <button
            onClick={() => setViewMode('card')}
            className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
            disabled={isMobile}
        >
            <FaTh />
        </button>
        <button
            onClick={() => setViewMode('list')}
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            disabled={isMobile}
        >
            <FaList />
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
            placeholder="Rechercher un employé..."
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
            field="poste"
            label="Poste"
            sortBy={sortBy}
            sortOrder={sortOrder}
            toggleSort={toggleSort}
        />
        <SortButton
            field="dateEmbauche"
            label="Embauche"
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
const ActionButtons = ({ onAddEmployee, showAddForm, onImport }) => (
    <>
        <button className="primary-btn" onClick={onAddEmployee}>
            <FaPlus className="btn-icon" /> {showAddForm ? "Fermer" : "Ajouter"}
        </button>
        <ImportButton onImport={onImport} />
    </>
);

// En-tête employés
const EmployeesHeader = ({
    employeesCount,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    sortBy,
    sortOrder,
    toggleSort,
    onAddEmployee,
    showAddForm,
    onImport,
    isMobile,
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    onItemsPerPageChange
}) => (
    <div className="employees-header">
        <div className="header-left">
            <h2 className="section-title">
                <FaUsers className="section-icon" /> Employés
                <span className="count-badge">{employeesCount}</span>
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
                onAddEmployee={onAddEmployee}
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
        <div className="employee-detail-item">
            {React.cloneElement(icon, { className: "detail-icon" })}
            <span className="detail-value">{value}</span>
        </div>
    );
};

// Carte employé
const EmployeeCard = ({ employee, isSelected, onSelect, onEdit, onDelete, onView, onTracking }) => {
    const handleDeleteAction = (e) => {
        e.stopPropagation();
        onDelete(employee.id);
    };

    const handleViewAction = (e) => {
        e.stopPropagation();
        onView(employee);
    };

    const handleEditAction = (e) => {
        e.stopPropagation();
        onEdit(employee);
    };

    const handleTrackingAction = (e) => {
        e.stopPropagation();
        onTracking(employee);
    };

    return (
        <div
            className={`employee-card ${isSelected ? 'active' : ''}`}
            onClick={() => onSelect(employee.id)}
        >
            <div className={`employee-type-badge ${employee.typeContrat}`}>
                {employee.typeContrat}
            </div>

            <div className="employee-card-header">
                <div className="employee-avatar">
                    {employee.prenom?.charAt(0).toUpperCase()}{employee.nom?.charAt(0).toUpperCase()}
                </div>
                <div className="employee-info">
                    <h3 className="employee-name">{employee.prenom} {employee.nom}</h3>
                    <div className="employee-position">{employee.poste}</div>
                </div>
                <div className="employee-card-actions">
                    <ActionButton
                        icon={<FaEye />}
                        title="Voir détails"
                        onClick={handleViewAction}
                        className="view-btn"
                    />
                    <ActionButton
                        icon={<FaEdit />}
                        title="Modifier"
                        onClick={handleEditAction}
                        className="edit-btn"
                    />
                    <ActionButton
                        icon={<FaTrash />}
                        title="Supprimer"
                        onClick={handleDeleteAction}
                        className="delete-btn"
                    />
                    <ActionButton
                        icon={<FaCalendarAlt />}
                        title="Suivi"
                        onClick={handleTrackingAction}
                        className="tracking-btn"
                    />
                </div>
            </div>

            <div className="employee-details">
                <DetailItem icon={<FaIdCard />} value={employee.matricule} />
                <DetailItem
                    icon={<FaCalendarAlt />}
                    value={employee.dateEmbauche ? new Date(employee.dateEmbauche).toLocaleDateString() : 'Non définie'}
                />
                <DetailItem icon={<FaMoneyBillWave />} value={employee.salaireBase?.toLocaleString() + ' FCFA'} />
                <DetailItem icon={<FaBuilding />} value={employee.departement} />
            </div>
        </div>
    );
};

// Ligne tableau employé
const EmployeeTableRow = ({ employee, isSelected, onSelect, onView, onEdit, onDelete, onTracking }) => {
    const handleDeleteAction = (e) => {
        e.stopPropagation();
        onDelete(employee.id);
    };

    const handleViewAction = (e) => {
        e.stopPropagation();
        onView(employee);
    };

    const handleEditAction = (e) => {
        e.stopPropagation();
        onEdit(employee);
    };

    const handleTrackingAction = (e) => {
        e.stopPropagation();
        onTracking(employee);
    };

    return (
        <tr
            className={isSelected ? 'active' : ''}
            onClick={() => onSelect(employee.id)}
        >
            <td>
                <div className="cell-content">
                    <div className="employee-avatar-small">
                        {employee.prenom?.charAt(0).toUpperCase()}{employee.nom?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="employee-name-cell">{employee.prenom} {employee.nom}</div>
                        <div className="employee-department">{employee.departement}</div>
                    </div>
                </div>
            </td>
            <td>{employee.poste}</td>
            <td>{employee.matricule}</td>
            <td className="amount">{employee.salaireBase?.toLocaleString()} FCFA</td>
            <td>
                <span className={`employee-badge ${employee.typeContrat}`}>
                    {employee.typeContrat}
                </span>
            </td>
            <td>
                <div className="table-actions">
                    <ActionButton
                        icon={<FaEye />}
                        title="Voir détails"
                        onClick={handleViewAction}
                        className="view-btn"
                    />
                    <ActionButton
                        icon={<FaEdit />}
                        title="Modifier"
                        onClick={handleEditAction}
                        className="edit-btn"
                    />
                    <ActionButton
                        icon={<FaTrash />}
                        title="Supprimer"
                        onClick={handleDeleteAction}
                        className="delete-btn"
                    />
                    <ActionButton
                        icon={<FaCalendarAlt />}
                        title="Suivi"
                        onClick={handleTrackingAction}
                        className="tracking-btn"
                    />
                </div>
            </td>
        </tr>
    );
};

// Section fiches de paie
const EmployeePayrollsSection = ({ selectedEmployee, onCreatePayroll, sectionRef, payrolls = [] }) => {
    if (!selectedEmployee) return null;

    const employeePayrolls = payrolls.filter(p => p.employeeId === selectedEmployee.id);

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('fr-FR');
    };

    const formatCurrency = (amount) => {
        return (amount || 0).toLocaleString('fr-FR') + ' FCFA';
    };

    const getStatusBadge = (statut) => {
        const statusMap = {
            draft: { label: 'Brouillon', class: 'draft' },
            validated: { label: 'Validé', class: 'validated' },
            paid: { label: 'Payé', class: 'paid' },
            partially_paid: { label: 'Partiel', class: 'partial' }
        };
        const status = statusMap[statut] || { label: statut, class: '' };
        return <span className={`status-badge ${status.class}`}>{status.label}</span>;
    };

    return (
        <div className="payrolls-section" ref={sectionRef}>
            <div className="payrolls-header">
                <h2 className="section-title">
                    <FaFileAlt className="section-icon" /> Fiches de paie
                    <span className="count-badge">{employeePayrolls.length}</span>
                </h2>
                <div className="payrolls-actions">
                    <button onClick={onCreatePayroll} className="create-payroll-btn">
                        <FaPlus /> Générer une fiche
                    </button>
                </div>
            </div>

            {employeePayrolls.length > 0 ? (
                <div className="payrolls-list">
                    <table className="payrolls-table">
                        <thead>
                            <tr>
                                <th>Période</th>
                                <th>Numéro</th>
                                <th>Salaire net</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employeePayrolls.map(payroll => (
                                <tr key={payroll.id} className="payroll-row">
                                    <td>
                                        {formatDate(payroll.periode?.du)} - {formatDate(payroll.periode?.au)}
                                    </td>
                                    <td>{payroll.numero}</td>
                                    <td className="amount">{formatCurrency(payroll.calculations?.salaireNetAPayer)}</td>
                                    <td>{getStatusBadge(payroll.statut)}</td>
                                    <td className="actions">
                                        <ActionButton
                                            icon={<FaEye />}
                                            title="Aperçu"
                                            className="view-btn"
                                        />
                                        <ActionButton
                                            icon={<FaDownload />}
                                            title="Télécharger"
                                            className="download-btn"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="no-payrolls">
                    <p>Aucun bulletin de paie pour cet employé</p>
                    <p className="no-payrolls-hint">
                        Cliquez sur "Générer une fiche" pour créer le premier bulletin
                    </p>
                </div>
            )}
        </div>
    );
};

// Modal Suivi
const TrackingModal = React.memo(({ visible, onCancel, onSubmit, employee, trackingData }) => {
    const [localTrackingData, setLocalTrackingData] = useState(trackingData);

    useEffect(() => setLocalTrackingData(trackingData), [trackingData]);

    const handleLocalChange = (e) => {
        const { name, value } = e.target;
        setLocalTrackingData(prev => ({ ...prev, [name]: Number(value) }));
    };

    const handleLocalSubmit = (e) => {
        e.preventDefault();
        onSubmit(localTrackingData);
    };

    const fields = [
        { name: "joursConges", label: "Jours congés disponibles" },
        { name: "joursCongesUtilises", label: "Congés utilisés" },
        { name: "joursAbsence", label: "Jours absence" },
        { name: "avanceSalaire", label: "Avance salaire (FCFA)" }
    ];

    return (
        <Modal
            title={`Suivi congés/absences - ${employee?.prenom} ${employee?.nom}`}
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>Annuler</Button>,
                <Button key="submit" type="primary" onClick={handleLocalSubmit}>Enregistrer</Button>
            ]}
            width={800}
            className="employee-form-modal"
        >
            <div className="employee-form">
                <div className="form-section-title">
                    <FaCalendarAlt /> Suivi des congés et absences
                </div>

                <div className="form-row">
                    {fields.slice(0, 2).map(field => (
                        <FormField
                            key={field.name}
                            label={field.label}
                            name={field.name}
                            type="number"
                            value={localTrackingData[field.name]}
                            onChange={handleLocalChange}
                            min="0"
                        />
                    ))}
                </div>

                <div className="form-row">
                    {fields.slice(2).map(field => (
                        <FormField
                            key={field.name}
                            label={field.label}
                            name={field.name}
                            type="number"
                            value={localTrackingData[field.name]}
                            onChange={handleLocalChange}
                            min="0"
                        />
                    ))}
                </div>
            </div>
        </Modal>
    );
});

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
                Affichage de {startIndex + 1} à {endIndex} sur {totalItems} employés
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
                        if (page >= 1 && page <= totalPages) onPageChange(page);
                    }}
                    className="page-jump-input"
                />
            </div>
        </div>
    );
});

// COMPOSANT PRINCIPAL
const EmployeesPage = ({
    filteredEmployees,
    searchTerm,
    setSearchTerm,
    selectedEmployee,
    loadEmployeePayrolls,
    handleEdit,
    handleDelete,
    employee,
    handleChange,
    handleSubmit,
    editingEmployee,
    handleEditChange,
    handleUpdate,
    handleUpdateSuivi,
    cancelEdit,
    handleCreatePayroll,
    handleImportEmployees,
    importProgress,
    setImportProgress,
    nextMatricule,
    payrolls
}) => {
    const [viewMode, setViewMode] = useState('card');
    const [sortBy, setSortBy] = useState('nom');
    const [sortOrder, setSortOrder] = useState('asc');
    const payrollsSectionRef = useRef(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [backgroundLoaded, setBackgroundLoaded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // États modaux
    const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
    const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);
    const [isTrackingModalVisible, setIsTrackingModalVisible] = useState(false);
    const [trackingData, setTrackingData] = useState({
        joursConges: 0,
        joursCongesUtilises: 0,
        joursAbsence: 0,
        avanceSalaire: 0
    });

    // Préchargement background
    useEffect(() => {
        const img = new Image();
        img.src = "/bg-client.jpg";
        img.onload = img.onerror = () => setBackgroundLoaded(true);
    }, []);

    useEffect(() => {
        if (backgroundLoaded) {
            const timer = setTimeout(() => setLoading(false), 500);
            return () => clearTimeout(timer);
        }
    }, [backgroundLoaded]);

    useEffect(() => {
        const checkIsMobile = () => setIsMobile(window.innerWidth <= 992);
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    useEffect(() => setCurrentPage(1), [searchTerm, sortBy, sortOrder]);

    const handleFileUpload = useCallback((e) => {
        if (!e.target.files?.length) return;
        handleImportEmployees?.(e);
    }, [handleImportEmployees]);

    const toggleSort = useCallback((field) => {
        setSortBy(current => current === field ? current : field);
        setSortOrder(current => sortBy === field ? (current === 'asc' ? 'desc' : 'asc') : 'asc');
    }, [sortBy]);

    const sortedEmployees = useMemo(() => {
        return [...filteredEmployees].sort((a, b) => {
            let compareValue = 0;
            if (sortBy === 'nom') compareValue = a.nom.localeCompare(b.nom);
            else if (sortBy === 'poste') compareValue = a.poste.localeCompare(b.poste);
            else if (sortBy === 'dateEmbauche') compareValue = new Date(a.dateEmbauche) - new Date(b.dateEmbauche);
            return sortOrder === 'asc' ? compareValue : -compareValue;
        });
    }, [filteredEmployees, sortBy, sortOrder]);

    const totalItems = sortedEmployees.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const paginatedEmployees = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return sortedEmployees.slice(startIndex, endIndex);
    }, [sortedEmployees, currentPage, itemsPerPage]);

    const handlePageChange = useCallback((page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [totalPages]);

    const handleItemsPerPageChange = useCallback((e) => {
        setItemsPerPage(parseInt(e.target.value, 10));
        setCurrentPage(1);
    }, []);

    const handleEmployeeSelect = useCallback((employeeId) => {
        loadEmployeePayrolls(employeeId);
        setTimeout(() => {
            payrollsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }, [loadEmployeePayrolls]);

    const handleViewDetails = useCallback((employee) => {
        setSelectedEmployeeDetails(employee);
        setIsInfoModalVisible(true);
    }, []);

    const handleOpenTrackingModal = useCallback((employee) => {
        setSelectedEmployeeDetails(employee);
        setTrackingData({
            joursConges: employee.joursConges || 0,
            joursCongesUtilises: employee.joursCongesUtilises || 0,
            joursAbsence: employee.joursAbsence || 0,
            avanceSalaire: employee.avanceSalaire || 0
        });
        setIsTrackingModalVisible(true);
    }, []);

    const handleSubmitTracking = useCallback(async (updatedData) => {
        try {
            const updatedEmployee = { ...selectedEmployeeDetails, ...updatedData };
            await handleUpdateSuivi(updatedEmployee);
            setIsTrackingModalVisible(false);
        } catch (error) {
            console.error("Erreur mise à jour suivi:", error);
        }
    }, [selectedEmployeeDetails, handleUpdateSuivi]);

    const displayMode = isMobile ? 'card' : viewMode;

    if (loading) return <LoadingState />;

    return (
        <>
            {/* Formulaires */}
            {editingEmployee && (
                <EmployeeForm
                    isEditing={true}
                    formData={editingEmployee}
                    onSubmit={handleUpdate}
                    onCancel={cancelEdit}
                    onEditChange={handleEditChange}
                />
            )}

            {showAddForm && !editingEmployee && (
                <EmployeeForm
                    isEditing={false}
                    formData={employee}
                    onSubmit={handleSubmit}
                    onCancel={() => setShowAddForm(false)}
                    onChange={handleChange}
                    nextMatricule={nextMatricule}
                />
            )}

            {/* Section principale */}
            <div className={`employees-page ${backgroundLoaded ? 'background-loaded' : ''}`}>
                <EmployeesHeader
                    employeesCount={totalItems}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    toggleSort={toggleSort}
                    onAddEmployee={() => setShowAddForm(!showAddForm)}
                    showAddForm={showAddForm}
                    onImport={handleFileUpload}
                    isMobile={isMobile}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                />

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

                {totalItems === 0 ? (
                    <EmptyState onAddEmployee={() => setShowAddForm(true)} />
                ) : displayMode === 'card' ? (
                    <>
                        <div className="employees-grid">
                            {paginatedEmployees.map(emp => (
                                <EmployeeCard
                                    key={emp.id}
                                    employee={emp}
                                    isSelected={selectedEmployee?.id === emp.id}
                                    onSelect={handleEmployeeSelect}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onView={handleViewDetails}
                                    onTracking={handleOpenTrackingModal}
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
                        <div className="employees-table-container">
                            <table className="employees-table">
                                <thead>
                                    <tr>
                                        <th onClick={() => toggleSort('nom')} className={sortBy === 'nom' ? 'active' : ''}>
                                            <div className="th-content">
                                                Nom
                                                {sortBy === 'nom' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                            </div>
                                        </th>
                                        <th onClick={() => toggleSort('poste')} className={sortBy === 'poste' ? 'active' : ''}>
                                            <div className="th-content">
                                                Poste
                                                {sortBy === 'poste' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                            </div>
                                        </th>
                                        <th>Matricule</th>
                                        <th>Salaire</th>
                                        <th>Contrat</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedEmployees.map(emp => (
                                        <EmployeeTableRow
                                            key={emp.id}
                                            employee={emp}
                                            isSelected={selectedEmployee?.id === emp.id}
                                            onSelect={handleEmployeeSelect}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onView={handleViewDetails}
                                            onTracking={handleOpenTrackingModal}
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

            {/* Section fiches de paie */}
            <EmployeePayrollsSection
                selectedEmployee={selectedEmployee}
                onCreatePayroll={handleCreatePayroll}
                sectionRef={payrollsSectionRef}
                payrolls={payrolls}
            />

            {/* Modaux */}
            <EmployeeDetailsModal
                isVisible={isInfoModalVisible}
                onCancel={() => setIsInfoModalVisible(false)}
                employee={selectedEmployeeDetails}
            />
            <TrackingModal
                visible={isTrackingModalVisible}
                onCancel={() => setIsTrackingModalVisible(false)}
                onSubmit={handleSubmitTracking}
                employee={selectedEmployeeDetails}
                trackingData={trackingData}
            />
        </>
    );
};

export default React.memo(EmployeesPage);