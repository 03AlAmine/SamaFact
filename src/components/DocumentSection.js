import React, { useState } from 'react';
import {
    FaFileInvoiceDollar,
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
    FaInfoCircle,
    FaCreditCard,
    FaStickyNote,
    FaUserEdit,
    FaCheckCircle,
    FaPaperPlane
} from 'react-icons/fa';
import { Modal, Button } from 'antd';
import empty from '../assets/empty.png';
import '../css/DocumentSection.css';
import UserNameLookup from './UserNameLookup';


const DocumentSection = ({
    title,
    items,
    searchTerm,
    setSearchTerm,
    navigate,
    onDelete,
    selectedClient,
    type,
    onDuplicate,
    onDownload,
    onPreview,
    onMarkAsPaid,
    onMarkAsPending,
    getStatus
}) => {
    const [sortBy, setSortBy] = useState('numero');
    const [sortOrder, setSortOrder] = useState('desc');
    const [viewMode, setViewMode] = useState('list');
    const [hoveredItem, setHoveredItem] = useState(null);
    const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);

    const showInfoModal = (document) => {
        setSelectedDocument(document);
        setIsInfoModalVisible(true);
    };

    const handleInfoModalCancel = () => {
        setIsInfoModalVisible(false);
    };

    const filteredItems = items
        .filter(item =>
        (item.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.clientNom && item.clientNom.toLowerCase().includes(searchTerm.toLowerCase())))
        )
        .sort((a, b) => {
            let compareValue;
            if (sortBy === 'numero') {
                const numA = parseInt(a.numero.replace(/\D/g, ''));
                const numB = parseInt(b.numero.replace(/\D/g, ''));
                compareValue = numA - numB;
            } else if (sortBy === 'clientNom') {
                compareValue = (a.clientNom || '').localeCompare(b.clientNom || '');
            } else if (sortBy === 'date') {
                compareValue = new Date(a.date) - new Date(b.date);
            } else if (sortBy === 'totalTTC') {
                compareValue = a.totalTTC - b.totalTTC;
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

    const getTypeColor = () => {
        switch (type) {
            case 'facture': return '#4f46e5';
            case 'devis': return '#10b981';
            case 'avoir': return '#f59e0b';
            default: return '#4f46e5';
        }
    };

    return (
        <div className="document-section-container">
            <div className="section-header">
                <div className="header-left">
                    <h2 className="section-title">
                        <FaFileInvoiceDollar className="section-icon" style={{ color: getTypeColor() }} />
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
                            placeholder={`Rechercher...`}
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
                        <button
                            onClick={() => toggleSort('clientNom')}
                            className={`sort-btn ${sortBy === 'clientNom' ? 'active' : ''}`}
                        >
                            <FaSortAlphaDown /> Client
                            {sortBy === 'clientNom' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </button>
                    </div>

                    <button
                        onClick={() => navigate("/bill", { state: { type } })}
                        className="create-btn"
                        style={{ backgroundColor: getTypeColor() }}
                    >
                        <FaPlus className="btn-icon" />
                        Créer {type === "facture" ? "une Facture" : type === "devis" ? "un Devis" : "un Avoir"}
                    </button>
                </div>
            </div>

            {filteredItems.length === 0 ? (
                <div className="empty-state">
                    <img src={empty} alt="Aucun document" className="empty-image" />
                    <h3>Aucun {title.toLowerCase().slice(0, -1)} trouvé</h3>
                    <p>Commencez par créer votre premier document</p>
                    <button
                        onClick={() => navigate("/bill", { state: { type } })}
                        className="create-btn empty-btn"
                        style={{ backgroundColor: getTypeColor() }}
                    >
                        <FaPlus className="btn-icon" />
                        Créer {type === "facture" ? "une Facture" : type === "devis" ? "un Devis" : "un Avoir"}
                    </button>
                </div>
            ) : viewMode === 'card' ? (
                <div className="cards-grid">
                    {filteredItems.map((f) => (
                        <div
                            key={f.id}
                            className={`document-card ${getStatus(f) === "Payé" ? "paid-card" :
                                getStatus(f) === "Accompte" ? "partial-card" :
                                    ""
                                }`}
                            onMouseEnter={() => setHoveredItem(f.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                            onClick={() => onPreview(f)}
                        >
                            <div className="card-header" style={{ borderTop: `4px solid ${getTypeColor()}` }}>
                                <div className="header-status">
                                    <span className={`status-badge ${getStatus(f) === "Payé" ? "paid" :
                                        getStatus(f) === "Accompte" ? "partial" : "pending"
                                        }`}>
                                        {getStatus(f)}
                                    </span>
                                </div>

                                <div className="document-icon">
                                    <FaFileInvoiceDollar style={{ color: getTypeColor() }} />
                                </div>
                                <div className="document-info">
                                    <h3 className="document-number">{f.numero}</h3>
                                    <p className="document-client">{f.clientNom || "Sans client"}</p>
                                </div>
                            </div>

                            <div className="card-details">
                                <div className="detail-item">
                                    <FaCalendarAlt className="detail-icon" />
                                    <span>{f.date}</span>
                                </div>

                                <div className="detail-item">
                                    <FaMoneyBillWave className="detail-icon" />
                                    <span>
                                        {f.totalTTC
                                            ? Number(f.totalTTC.replace(/\s/g, '').replace(',', '.'))
                                                .toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                                            : '0'} FCFA
                                    </span>
                                </div>

                                <div className="detail-item">
                                    <FaUser className="detail-icon" />
                                    <UserNameLookup userId={f.userId} />
                                </div>
                            </div>

                            <div className={`card-actions ${hoveredItem === f.id ? 'visible' : ''}`}>
                                <div className="action-group">
                                    <button className="action-btn view" onClick={(e) => { e.stopPropagation(); onPreview(f); }} title="Aperçu">
                                        <FaEye />
                                    </button>
                                    <button className="action-btn download" onClick={(e) => { e.stopPropagation(); onDownload(f); }} title="Télécharger">
                                        <FaDownload />
                                    </button>
                                    <button className="action-btn delete" onClick={(e) => { e.stopPropagation(); onDelete(f.id, type); }} title="Supprimer">
                                        <FaTrash />
                                    </button>
                                </div>

                                <div className="action-group">
                                    <button className="action-btn edit" onClick={(e) => { e.stopPropagation(); navigate("/bill", { state: { facture: f, client: selectedClient, type: f.type, objet: f.objet, ribs: f.ribs, showSignature: f.showSignature } }); }} title="Modifier">
                                        <FaEdit />
                                    </button>
                                    <button className="action-btn duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(f); }} title="Dupliquer">
                                        <FaCopy />
                                    </button>
                                    {f.statut === "payé" ? (
                                        <button className="action-btn unpaid" onClick={(e) => { e.stopPropagation(); onMarkAsPending(f.id, type); }} title="Annuler le paiement">
                                            <FaTimes />
                                        </button>
                                    ) : (
                                        <button className="action-btn paid" onClick={(e) => { e.stopPropagation(); onMarkAsPaid(f.id, type); }} title="Marquer comme payé">
                                            <FaCheck />
                                        </button>
                                    )}


                                </div>

                                <div className="action-group">
                                    <button className="action-btn info" onClick={(e) => { e.stopPropagation(); showInfoModal(f); }} title="Détails">
                                        <FaInfoCircle />
                                    </button>
                                    <button className="action-btn send" title="Envoyer par email">
                                        <FaPaperPlane />
                                    </button>
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
                                {['numero', 'clientNom', 'date', 'totalTTC'].map((field) => (
                                    <th
                                        key={field}
                                        onClick={() => toggleSort(field)}
                                        className={sortBy === field ? 'active' : ''}
                                    >
                                        <div className="th-content">
                                            {{
                                                numero: 'Numéro',
                                                clientNom: 'Client',
                                                date: 'Date',
                                                totalTTC: 'Montant'
                                            }[field]}
                                            {sortBy === field && (
                                                <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredItems.map((f) => (
                                <tr
                                    key={f.id}
                                    onClick={() => onPreview(f)}
                                    className={
                                        getStatus(f) === 'Payé' ? 'paid-row' :
                                            getStatus(f) === 'Accompte' ? 'partial-row' :
                                                ''
                                    }
                                >
                                    <td>
                                        <div className="cell-content">
                                            <FaFileInvoiceDollar
                                                className="cell-icon"
                                                style={{ color: getTypeColor() }}
                                            />
                                            {f.numero}
                                        </div>
                                    </td>

                                    <td>{f.clientNom || 'Sans client'}</td>
                                    <td>{f.date}</td>

                                    <td className="amount-cell">
                                        {f.totalTTC
                                            ? Number(f.totalTTC.replace(/\s/g, '').replace(',', '.')).toLocaleString('fr-FR', {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0
                                            })
                                            : '0'} FCFA
                                    </td>

                                    <td>
                                        <span className={`status-badge ${getStatus(f) === 'Payé' ? 'paid' :
                                            getStatus(f) === 'Accompte' ? 'partial' : 'pending'
                                            }`}>
                                            {getStatus(f)}
                                        </span>
                                    </td>

                                    <td className="actions-cell">
                                        <div className="actions-container">
                                            {/* Actions principales */}
                                            <div className="main-actions">
                                                <button
                                                    className="action-btn view"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onPreview(f);
                                                    }}
                                                    title="Aperçu"
                                                >
                                                    <FaEye />
                                                </button>

                                                <button
                                                    className="action-btn download"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDownload(f);
                                                    }}
                                                    title="Télécharger"
                                                >
                                                    <FaDownload />
                                                </button>

                                                <button
                                                    className="action-btn delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete(f.id, type);
                                                    }}
                                                    title="Supprimer"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>

                                            {/* Actions secondaires */}
                                            <div className="secondary-actions">
                                                <button
                                                    className="action-btn edit"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate("/bill", {
                                                            state: {
                                                                facture: f,
                                                                client: selectedClient,
                                                                type: f.type,
                                                                objet: f.objet,
                                                                ribs: f.ribs,
                                                                showSignature: f.showSignature
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
                                                        onDuplicate(f);
                                                    }}
                                                    title="Dupliquer"
                                                >
                                                    <FaCopy />
                                                </button>

                                                {f.statut === 'payé' ? (
                                                    <button
                                                        className="action-btn unpaid"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onMarkAsPending(f.id, type);
                                                        }}
                                                        title="Annuler le paiement"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="action-btn paid"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onMarkAsPaid(f.id, type);
                                                        }}
                                                        title="Marquer comme payé"
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Autres actions */}
                                            <div className="secondary-actions">
                                                <button
                                                    className="action-btn info"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        showInfoModal(f);
                                                    }}
                                                    title="Détails"
                                                >
                                                    <FaInfoCircle />
                                                </button>

                                                <button
                                                    className="action-btn send"
                                                    title="Envoyer par email"
                                                >
                                                    <FaPaperPlane />
                                                </button>
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
                        <FaFileInvoiceDollar style={{ color: getTypeColor(), marginRight: 10 }} />
                        <span>Détails de {selectedDocument?.numero}</span>
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
                width={600}
                className="document-details-modal-container"
            >
                {selectedDocument && (
                    <div className="document-details-content-container">
                        {/* Barre de progression verticale */}
                        <div className="document-details-content">

                            {/* Section Principale */}
                            <div className="details-main-section">
                                <div className="details-row">
                                    <div className="detail-item">
                                        <span className="detail-label">
                                            <FaCalendarAlt className="detail-icon" />
                                            Date
                                        </span>
                                        <span className="detail-value">{selectedDocument.date}</span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label">
                                            <FaUser className="detail-icon" />
                                            Client
                                        </span>
                                        <span className="detail-value">{selectedDocument.clientNom || "Non spécifié"}</span>
                                    </div>
                                </div>

                                <div className="details-row">
                                    <div className="detail-item">
                                        <span className="detail-label">
                                            <FaMoneyBillWave className="detail-icon" />
                                            Montant Total
                                        </span>
                                        <span className="detail-value amount">
                                            {selectedDocument.totalTTC
                                                ? Number(selectedDocument.totalTTC.toString().replace(/\s/g, '').replace(',', '.'))
                                                    .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' FCFA'
                                                : '0,00 FCFA'}
                                        </span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label">
                                            <FaCheckCircle className="detail-icon" />
                                            Statut
                                        </span>
                                        <span className={`detail-value status ${selectedDocument.statut === "payé" ? "paid" : "pending"}`}>
                                            {getStatus(selectedDocument)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Section Paiement */}
                            <div className="payment-section">
                                <h4 className="section-subtitle">
                                    <FaCreditCard style={{ marginRight: 8 }} />
                                    Informations de Paiement
                                </h4>

                                <div className="details-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Montant Payé</span>
                                        <span className="detail-value highlight">
                                            {selectedDocument.montantPaye !== undefined && selectedDocument.montantPaye !== null
                                                ? Number(
                                                    selectedDocument.montantPaye.toString()
                                                        .replace(/\s/g, '')
                                                        .replace(',', '.')
                                                ).toLocaleString('fr-FR', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                }) + ' FCFA'
                                                : '0,00 FCFA'}
                                        </span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label">Mode de Paiement</span>
                                        <span className="detail-value">
                                            {selectedDocument.modePaiement
                                                ? selectedDocument.modePaiement.charAt(0).toUpperCase() + selectedDocument.modePaiement.slice(1)
                                                : 'Non spécifié'}
                                        </span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label">Référence</span>
                                        <span className="detail-value">
                                            {selectedDocument.referencePaiement || 'Aucune référence'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Section Création */}
                            <div className="creation-section">
                                <div className="detail-item full-width">
                                    <span className="detail-label">
                                        <FaUserEdit className="detail-icon" />
                                        Créé par
                                    </span>
                                    <span className="detail-value">
                                        <UserNameLookup userId={selectedDocument.userId} />
                                        <span className="creation-date">le {new Date(selectedDocument.createdAt).toLocaleDateString('fr-FR')}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedDocument.note && (
                                <div className="notes-section">
                                    <h4 className="section-subtitle">
                                        <FaStickyNote style={{ marginRight: 8 }} />
                                        Notes
                                    </h4>
                                    <div className="notes-content">
                                        {selectedDocument.note}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="status-progress-bar">
                            <div className="progress-steps-container">
                                <div className={`progress-step ${selectedDocument.statut ? 'completed' : ''}`}>
                                    <div className="step-circle">
                                        {selectedDocument.statut && <FaCheck className="check-icon" />}
                                    </div>
                                    <div className="step-label">Créé</div>
                                    <div className="step-connector"></div>
                                </div>

                                <div className={`progress-step ${['en attente', 'accompte', 'payé'].includes(selectedDocument.statut?.toLowerCase())
                                    ? selectedDocument.statut?.toLowerCase() === 'en attente'
                                        ? 'pending'
                                        : selectedDocument.statut?.toLowerCase() === 'accompte'
                                            ? 'partial'
                                            : 'completed'
                                    : ''
                                    }`}>
                                    <div className="step-circle">
                                        {['en attente', 'accompte', 'payé'].includes(selectedDocument.statut?.toLowerCase()) && <FaCheck className="check-icon" />}
                                    </div>
                                    <div className="step-label">En Attente</div>
                                    <div className="step-connector"></div>
                                </div>

                                <div className={`progress-step ${['accompte', 'payé'].includes(selectedDocument.statut?.toLowerCase())
                                    ? selectedDocument.statut?.toLowerCase() === 'accompte'
                                        ? 'partial'
                                        : 'completed'
                                    : ''
                                    }`}>
                                    <div className="step-circle">
                                        {['accompte', 'payé'].includes(selectedDocument.statut?.toLowerCase()) && <FaCheck className="check-icon" />}
                                    </div>
                                    <div className="step-label">Accompte</div>
                                    <div className="step-connector"></div>
                                </div>

                                <div className={`progress-step ${selectedDocument.statut?.toLowerCase() === 'payé' ? 'completed' : ''
                                    }`}>
                                    <div className="step-circle">
                                        {selectedDocument.statut?.toLowerCase() === 'payé' && <FaCheck className="check-icon" />}
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

export default DocumentSection;