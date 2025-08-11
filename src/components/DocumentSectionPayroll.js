import React, { useState } from 'react';
import {
    FaSearch,
    FaPlus,
    FaEdit,
    FaTrash,
    FaCopy,
    FaEye,
    FaDownload,
    FaList,
    FaTh,
    FaSortAlphaDown,
    FaSortNumericDown,
    FaCalendarAlt,
    FaMoneyBillWave,
    FaUser,
    FaCheck,
    FaTimes,
    FaCreditCard,
    FaUserEdit,
    FaCheckCircle,
    FaFileSignature
} from 'react-icons/fa';
import { Modal, Button } from 'antd';
import empty from '../assets/empty.png';
import '../css/DocumentSection.css';
import UserNameLookup from './UserNameLookup';
import { useNavigate } from 'react-router-dom';

const PayrollSection = ({
    title,
    items,
    searchTerm,
    setSearchTerm,
    onDelete,
    selectedEmployee,
    onDuplicate,
    onDownload,
    onPreview,
    onValidate,
    onMarkAsPaid,
    onCancel,
    getStatus,
    showEmployeeColumn = true
}) => {
    const [sortBy, setSortBy] = useState('numero');
    const [sortOrder, setSortOrder] = useState('desc');
    const [viewMode, setViewMode] = useState('list');
    const [hoveredItem, setHoveredItem] = useState(null);
    const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
    const [selectedPayroll, ] = useState(null);


    const handleInfoModalCancel = () => {
        setIsInfoModalVisible(false);
    };

    const safeSearch = (searchTerm || '').toLowerCase();

    const filteredItems = (items || [])
        .filter(item => {
            if (!item) return false; // Évite les null/undefined
            const numero = (item.numero || '').toLowerCase();
            const name = (item.employeeName || '').toLowerCase();
            return numero.includes(safeSearch) || name.includes(safeSearch);
        })

        .sort((a, b) => {
            let compareValue;
            if (sortBy === 'numero') {
                const numA = parseInt((a.numero || '').replace(/\D/g, ''), 10);
                const numB = parseInt((b.numero || '').replace(/\D/g, ''), 10);
                compareValue = numA - numB;
            } else if (sortBy === 'employeeName') {
                compareValue = (a.employeeName || '').localeCompare(b.employeeName || '');
            } else if (sortBy === 'periode') {
                compareValue = new Date(a.periode?.au) - new Date(b.periode?.au);
            } else if (sortBy === 'salaireNetAPayer') {
                compareValue = (a.calculations?.salaireNetAPayer || 0) - (b.calculations?.salaireNetAPayer || 0);
            }
            return sortOrder === 'asc' ? compareValue : -compareValue;
        });

    const toggleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const formatDateRange = (periode) => {
        if (!periode?.du || !periode?.au) return '';

        const format = (date) => {
            const d = date instanceof Date ? date : new Date(date); // Conversion forcée
            return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        };

        return `${format(periode.du)} - ${format(periode.au)}`;
    };
    const navigate = useNavigate();

    return (
        <div className="document-section-container">
            <div className="section-header">
                <div className="header-left">
                    <h2 className="section-title">
                        <FaFileSignature className="section-icon" style={{ color: '#3b82f6' }} />
                        {title} <span className="count-badge">{filteredItems.length}</span>
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
                    <div className="search-container">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <div className="sort-options">
                        <div className="sort-label">Trier par:</div>
                        <button
                            onClick={() => toggleSort('numero')}
                            className={`sort-btn ${sortBy === 'numero' ? 'active' : ''}`}
                        >
                            <FaSortNumericDown /> Numéro
                            {sortBy === 'numero' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </button>
                        {showEmployeeColumn && (
                            <button
                                onClick={() => toggleSort('employeeName')}
                                className={`sort-btn ${sortBy === 'employeeName' ? 'active' : ''}`}
                            >
                                <FaSortAlphaDown /> Employé
                                {sortBy === 'employeeName' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => navigate("/payroll", { state: { employee: selectedEmployee } })}
                        className="create-btn"
                        style={{ backgroundColor: '#3b82f6' }}
                    >
                        <FaPlus className="btn-icon" />
                        Créer un bulletin
                    </button>
                </div>
            </div>

            {filteredItems.length === 0 ? (
                <div className="empty-state">
                    <img src={empty} alt="Aucun document" className="empty-image" />
                    <h3>Aucun bulletin de paie trouvé</h3>
                    <p>Commencez par créer votre premier bulletin</p>
                    <button
                        onClick={() => navigate("/payroll", { state: { employee: selectedEmployee } })}
                        className="create-btn empty-btn"
                        style={{ backgroundColor: '#3b82f6' }}
                    >
                        <FaPlus className="btn-icon" />
                        Créer un bulletin
                    </button>
                </div>
            ) : viewMode === 'card' ? (
                <div className="cards-grid">
                    {filteredItems.map((p) => (
                        <div
                            key={p.id}
                            className={`document-card ${getStatus(p) === "Payé" ? "paid-card" :
                                getStatus(p) === "Validé" ? "validated-card" :
                                    getStatus(p) === "Annulé" ? "cancelled-card" : ""
                                }`}
                            onMouseEnter={() => setHoveredItem(p.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                            onClick={() => onPreview(p)}
                        >
                            <div className="card-header" style={{ borderTop: '4px solid #3b82f6' }}>
                                <div className="header-status">
                                    <span className={`status-badge ${getStatus(p) === "Payé" ? "paid" :
                                        getStatus(p) === "Validé" ? "validated" :
                                            getStatus(p) === "Annulé" ? "cancelled" : "draft"
                                        }`}>
                                        {getStatus(p)}
                                    </span>
                                </div>

                                <div className="document-icon">
                                    <FaFileSignature style={{ color: '#3b82f6' }} />
                                </div>
                                <div className="document-info">
                                    <h3 className="document-number">{p.numero}</h3>
                                    {showEmployeeColumn && (
                                        <p className="document-client">{p.employeeName || "Sans employé"}</p>
                                    )}
                                </div>
                            </div>

                            <div className="card-details">
                                <div className="detail-item">
                                    <FaCalendarAlt className="detail-icon" />
                                    <span>{formatDateRange(p.periode)}</span>
                                </div>

                                <div className="detail-item">
                                    <FaMoneyBillWave className="detail-icon" />
                                    <span>
                                        {p.calculations?.salaireNetAPayer?.toLocaleString('fr-FR', {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                        }) || '0'} FCFA
                                    </span>
                                </div>

                                <div className="detail-item">
                                    <FaUser className="detail-icon" />
                                    <UserNameLookup userId={p.userId} />
                                </div>
                            </div>

                            <div className={`card-actions ${hoveredItem === p.id ? 'visible' : ''}`}>
                                <div className="action-group">
                                    <button className="action-btn view" onClick={(e) => { e.stopPropagation(); onPreview(p); }} title="Aperçu">
                                        <FaEye />
                                    </button>
                                    <button className="action-btn download" onClick={(e) => { e.stopPropagation(); onDownload(p); }} title="Télécharger">
                                        <FaDownload />
                                    </button>
                                    <button className="action-btn delete" onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} title="Supprimer">
                                        <FaTrash />
                                    </button>
                                </div>

                                <div className="action-group">
                                    <button className="action-btn edit" onClick={(e) => {
                                        e.stopPropagation();
                                        navigate("/payroll", {
                                            state: {
                                                payroll: p,
                                                employee: selectedEmployee || {
                                                    id: p.employeeId,
                                                    nom: p.employeeName?.split(' ')[0],
                                                    prenom: p.employeeName?.split(' ').slice(1).join(' ')
                                                }
                                            }
                                        });
                                    }} title="Modifier">
                                        <FaEdit />
                                    </button>
                                    <button className="action-btn duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(p); }} title="Dupliquer">
                                        <FaCopy />
                                    </button>
                                    {p.statut === "draft" ? (
                                        <button className="action-btn validate" onClick={(e) => { e.stopPropagation(); onValidate(p.id); }} title="Valider">
                                            <FaCheckCircle />
                                        </button>
                                    ) : p.statut === "validated" ? (
                                        <button className="action-btn pay" onClick={(e) => { e.stopPropagation(); onMarkAsPaid(p.id); }} title="Marquer comme payé">
                                            <FaCreditCard />
                                        </button>
                                    ) : p.statut === "paid" ? (
                                        <button className="action-btn cancel" onClick={(e) => { e.stopPropagation(); onCancel(p.id); }} title="Annuler">
                                            <FaTimes />
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="table-container">
                    <table className="documents-table">
                        <thead>
                            <tr>
                                <th onClick={() => toggleSort('numero')} className={sortBy === 'numero' ? 'active' : ''}>
                                    <div className="th-content">
                                        Numéro
                                        {sortBy === 'numero' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                </th>
                                {showEmployeeColumn && (
                                    <th onClick={() => toggleSort('employeeName')} className={sortBy === 'employeeName' ? 'active' : ''}>
                                        <div className="th-content">
                                            Employé
                                            {sortBy === 'employeeName' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                        </div>
                                    </th>
                                )}
                                <th onClick={() => toggleSort('periode')} className={sortBy === 'periode' ? 'active' : ''}>
                                    <div className="th-content">
                                        Période
                                        {sortBy === 'periode' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                </th>
                                <th onClick={() => toggleSort('salaireNetAPayer')} className={sortBy === 'salaireNetAPayer' ? 'active' : ''}>
                                    <div className="th-content">
                                        Net à payer
                                        {sortBy === 'salaireNetAPayer' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                </th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredItems.map((p) => (
                                <tr
                                    key={p.id}
                                    onClick={() => onPreview(p)}
                                    className={
                                        getStatus(p) === 'Payé' ? 'paid-row' :
                                            getStatus(p) === 'Validé' ? 'validated-row' :
                                                getStatus(p) === 'Annulé' ? 'cancelled-row' : 'draft-row'
                                    }
                                >
                                    <td>
                                        <div className="cell-content">
                                            <FaFileSignature
                                                className="cell-icon"
                                                style={{ color: '#3b82f6' }}
                                            />
                                            {p.numero}
                                        </div>
                                    </td>

                                    {showEmployeeColumn && <td>{p.employeeName || 'Sans employé'}</td>}

                                    <td>{formatDateRange(p.periode)}</td>

                                    <td className="amount-cell">
                                        {p.calculations?.salaireNetAPayer?.toLocaleString('fr-FR', {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                        }) || '0'} FCFA
                                    </td>

                                    <td>
                                        <span className={`status-badge ${getStatus(p) === 'Payé' ? 'paid' :
                                            getStatus(p) === 'Validé' ? 'validated' :
                                                getStatus(p) === 'Annulé' ? 'cancelled' : 'draft'
                                            }`}>
                                            {getStatus(p)}
                                        </span>
                                    </td>

                                    <td className="actions-cell">
                                        <div className="actions-container">
                                            <div className="main-actions">
                                                <button
                                                    className="action-btn view"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onPreview(p);
                                                    }}
                                                    title="Aperçu"
                                                >
                                                    <FaEye />
                                                </button>

                                                <button
                                                    className="action-btn download"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDownload(p);
                                                    }}
                                                    title="Télécharger"
                                                >
                                                    <FaDownload />
                                                </button>

                                                <button
                                                    className="action-btn delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete(p.id);
                                                    }}
                                                    title="Supprimer"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>

                                            <div className="secondary-actions">
                                                <button
                                                    className="action-btn edit"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate("/payroll", {
                                                            state: {
                                                                payroll: p,
                                                                employee: selectedEmployee || {
                                                                    id: p.employeeId,
                                                                    nom: p.employeeName?.split(' ')[0],
                                                                    prenom: p.employeeName?.split(' ').slice(1).join(' ')
                                                                }
                                                            }
                                                        });
                                                    }}
                                                    title="Modifier"
                                                >
                                                    <FaEdit />
                                                </button>

                                                <button
                                                    className="action-btn duplicate"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDuplicate(p);
                                                    }}
                                                    title="Dupliquer"
                                                >
                                                    <FaCopy />
                                                </button>

                                                {p.statut === "draft" ? (
                                                    <button
                                                        className="action-btn validate"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onValidate(p.id);
                                                        }}
                                                        title="Valider"
                                                    >
                                                        <FaCheckCircle />
                                                    </button>
                                                ) : p.statut === "validated" ? (
                                                    <button
                                                        className="action-btn pay"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onMarkAsPaid(p.id);
                                                        }}
                                                        title="Marquer comme payé"
                                                    >
                                                        <FaCreditCard />
                                                    </button>
                                                ) : p.statut === "paid" ? (
                                                    <button
                                                        className="action-btn cancel"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onCancel(p.id);
                                                        }}
                                                        title="Annuler"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                title={
                    <div className="modal-title">
                        <FaFileSignature style={{ color: '#3b82f6', marginRight: 10 }} />
                        <span>Détails de {selectedPayroll?.numero}</span>
                    </div>
                }
                open={isInfoModalVisible}
                onCancel={handleInfoModalCancel}
                footer={[
                    <Button
                        key="back"
                        onClick={handleInfoModalCancel}
                        style={{ padding: '8px 20px', height: 'auto' }}
                    >
                        Fermer
                    </Button>
                ]}
                width={700}
                className="document-details-modal-container"
            >
                {selectedPayroll && (
                    <div className="document-details-content-container">
                        <div className="document-details-content">
                            <div className="details-main-section">
                                <div className="details-row">
                                    <div className="detail-item">
                                        <span className="detail-label">
                                            <FaUser className="detail-icon" />
                                            Employé
                                        </span>
                                        <span className="detail-value">{selectedPayroll.employeeName || "Non spécifié"}</span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label">
                                            <FaCalendarAlt className="detail-icon" />
                                            Période
                                        </span>
                                        <span className="detail-value">{formatDateRange(selectedPayroll.periode)}</span>
                                    </div>
                                </div>

                                <div className="details-row">
                                    <div className="detail-item">
                                        <span className="detail-label">
                                            <FaMoneyBillWave className="detail-icon" />
                                            Net à payer
                                        </span>
                                        <span className="detail-value amount">
                                            {selectedPayroll.calculations?.salaireNetAPayer?.toLocaleString('fr-FR', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            }) || '0,00'} FCFA
                                        </span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label">
                                            <FaCheckCircle className="detail-icon" />
                                            Statut
                                        </span>
                                        <span className={`detail-value status ${selectedPayroll.statut === "paid" ? "paid" :
                                            selectedPayroll.statut === "validated" ? "validated" :
                                                selectedPayroll.statut === "cancelled" ? "cancelled" : "draft"}`}>
                                            {getStatus(selectedPayroll)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="payment-section">
                                <h4 className="section-subtitle">
                                    <FaCreditCard style={{ marginRight: 8 }} />
                                    Rémunération
                                </h4>

                                <div className="details-grid two-columns">
                                    <div className="detail-item">
                                        <span className="detail-label">Salaire de base</span>
                                        <span className="detail-value">
                                            {selectedPayroll.remuneration?.salaireBase?.toLocaleString('fr-FR', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            }) || '0,00'} FCFA
                                        </span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label">Sursalaire</span>
                                        <span className="detail-value">
                                            {selectedPayroll.remuneration?.sursalaire?.toLocaleString('fr-FR', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            }) || '0,00'} FCFA
                                        </span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label">Indemnité déplacement</span>
                                        <span className="detail-value">
                                            {selectedPayroll.remuneration?.indemniteDeplacement?.toLocaleString('fr-FR', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            }) || '0,00'} FCFA
                                        </span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label">Avantages en nature</span>
                                        <span className="detail-value">
                                            {selectedPayroll.remuneration?.avantagesNature?.toLocaleString('fr-FR', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            }) || '0,00'} FCFA
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="payment-section">
                                <h4 className="section-subtitle">
                                    <FaMoneyBillWave style={{ marginRight: 8 }} />
                                    Primes
                                </h4>

                                <div className="details-grid two-columns">
                                    <div className="detail-item">
                                        <span className="detail-label">Transport</span>
                                        <span className="detail-value">
                                            {selectedPayroll.primes?.transport?.toLocaleString('fr-FR', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            }) || '0,00'} FCFA
                                        </span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label">Panier</span>
                                        <span className="detail-value">
                                            {selectedPayroll.primes?.panier?.toLocaleString('fr-FR', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            }) || '0,00'} FCFA
                                        </span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label">Responsabilité</span>
                                        <span className="detail-value">
                                            {selectedPayroll.primes?.responsabilite?.toLocaleString('fr-FR', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            }) || '0,00'} FCFA
                                        </span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label">Autres primes</span>
                                        <span className="detail-value">
                                            {selectedPayroll.primes?.autresPrimes?.toLocaleString('fr-FR', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            }) || '0,00'} FCFA
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {selectedPayroll.statut === "paid" && (
                                <div className="payment-section">
                                    <h4 className="section-subtitle">
                                        <FaCreditCard style={{ marginRight: 8 }} />
                                        Paiement
                                    </h4>

                                    <div className="details-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">Date de paiement</span>
                                            <span className="detail-value">
                                                {new Date(selectedPayroll.paymentDate).toLocaleDateString('fr-FR')}
                                            </span>
                                        </div>

                                        <div className="detail-item">
                                            <span className="detail-label">Méthode</span>
                                            <span className="detail-value">
                                                {selectedPayroll.paymentMethod === "virement" ? "Virement bancaire" :
                                                    selectedPayroll.paymentMethod === "cheque" ? "Chèque" :
                                                        selectedPayroll.paymentMethod || "Non spécifié"}
                                            </span>
                                        </div>

                                        <div className="detail-item">
                                            <span className="detail-label">Référence</span>
                                            <span className="detail-value">
                                                {selectedPayroll.paymentReference || 'Aucune référence'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="creation-section">
                                <div className="detail-item full-width">
                                    <span className="detail-label">
                                        <FaUserEdit className="detail-icon" />
                                        Créé par
                                    </span>
                                    <span className="detail-value">
                                        <UserNameLookup userId={selectedPayroll.userId} />
                                        <span className="creation-date">le {new Date(selectedPayroll.createdAt).toLocaleDateString('fr-FR')}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="status-progress-bar">
                            <div className="progress-steps-container">
                                <div className={`progress-step ${selectedPayroll.statut ? 'completed' : ''}`}>
                                    <div className="step-circle">
                                        {selectedPayroll.statut && <FaCheck className="check-icon" />}
                                    </div>
                                    <div className="step-label">Créé</div>
                                    <div className="step-connector"></div>
                                </div>

                                <div className={`progress-step ${['validated', 'paid'].includes(selectedPayroll.statut) ? 'completed' : ''}`}>
                                    <div className="step-circle">
                                        {['validated', 'paid'].includes(selectedPayroll.statut) && <FaCheck className="check-icon" />}
                                    </div>
                                    <div className="step-label">Validé</div>
                                    <div className="step-connector"></div>
                                </div>

                                <div className={`progress-step ${selectedPayroll.statut === 'paid' ? 'completed' : ''}`}>
                                    <div className="step-circle">
                                        {selectedPayroll.statut === 'paid' && <FaCheck className="check-icon" />}
                                    </div>
                                    <div className="step-label">Payé</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PayrollSection;