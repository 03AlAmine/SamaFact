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
    FaUser
} from 'react-icons/fa';
import empty from '../assets/empty.png';
import '../css/DocumentSection.css'; // Assurez-vous d'avoir un fichier CSS pour le style
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
    onView,
    onDownload
}) => {
    const [sortBy, setSortBy] = useState('numero');
    const [sortOrder, setSortOrder] = useState('asc');
    const [viewMode, setViewMode] = useState('card');
    const [hoveredItem, setHoveredItem] = useState(null);

    // Filtre et tri
    const filteredItems = items
        .filter(item =>
        (item.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.clientNom && item.clientNom.toLowerCase().includes(searchTerm.toLowerCase())))
        )
        .sort((a, b) => {
            let compareValue;
            if (sortBy === 'numero') {
                // Utilisez parseInt pour convertir en nombre avant de comparer
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
        })
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
                            className="document-card"
                            onMouseEnter={() => setHoveredItem(f.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                            onClick={() => onView(f)}
                        >
                            <div className="card-header" style={{ borderTop: `4px solid ${getTypeColor()}` }}>
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
                                    <span>{f.totalTTC ? f.totalTTC.toLocaleString() : '0'} FCFA</span>
                                </div>
                                <div className="detail-item">
                                    <FaUser className="detail-icon" />
                                    <UserNameLookup userId={f.userId} />
                                </div>
                            </div>

                            <div className={`card-actions ${hoveredItem === f.id ? 'visible' : ''}`}>
                                <button
                                    className="action-btn view"
                                    onClick={(e) => { e.stopPropagation(); onView(f); }}
                                    title="Voir"
                                >
                                    <FaEye />
                                </button>
                                <button
                                    className="action-btn download"
                                    onClick={(e) => { e.stopPropagation(); onDownload(f); }}
                                    title="Télécharger"
                                >
                                    <FaDownload />
                                </button>
                                <button
                                    className="action-btn edit"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate("/bill", { state: { facture: f, client: selectedClient, type: f.type } });
                                    }}
                                    title="Modifier"
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    className="action-btn duplicate"
                                    onClick={(e) => { e.stopPropagation(); onDuplicate(f); }}
                                    title="Dupliquer"
                                >
                                    <FaCopy />
                                </button>
                                <button
                                    className="action-btn delete"
                                    onClick={(e) => { e.stopPropagation(); onDelete(f.id, type); }}
                                    title="Supprimer"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="table-container">
                    <table className="documents-table">
                        <thead>
                            <tr>
                                <th
                                    onClick={() => toggleSort('numero')}
                                    className={sortBy === 'numero' ? 'active' : ''}
                                >
                                    <div className="th-content">
                                        Numéro
                                        {sortBy === 'numero' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                </th>
                                <th
                                    onClick={() => toggleSort('clientNom')}
                                    className={sortBy === 'clientNom' ? 'active' : ''}
                                >
                                    <div className="th-content">
                                        Client
                                        {sortBy === 'clientNom' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                </th>
                                <th
                                    onClick={() => toggleSort('date')}
                                    className={sortBy === 'date' ? 'active' : ''}
                                >
                                    <div className="th-content">
                                        Date
                                        {sortBy === 'date' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                </th>
                                <th
                                    onClick={() => toggleSort('totalTTC')}
                                    className={sortBy === 'totalTTC' ? 'active' : ''}
                                >
                                    <div className="th-content">
                                        Montant
                                        {sortBy === 'totalTTC' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                </th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((f) => (
                                <tr key={f.id} onClick={() => onView(f)}>
                                    <td>
                                        <div className="cell-content">
                                            <FaFileInvoiceDollar className="cell-icon" style={{ color: getTypeColor() }} />
                                            {f.numero}
                                        </div>
                                    </td>
                                    <td>{f.clientNom || "Sans client"}</td>
                                    <td>{f.date}</td>
                                    <td className="amount-cell">{f.totalTTC.toLocaleString()} FCFA</td>
                                    <td className="actions-cell">
                                        <div className="actions-container">
                                            <button
                                                className="action-btn view"
                                                onClick={(e) => { e.stopPropagation(); onView(f); }}
                                                title="Voir"
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                className="action-btn download"
                                                onClick={(e) => { e.stopPropagation(); onDownload(f); }}
                                                title="Télécharger"
                                            >
                                                <FaDownload />
                                            </button>
                                            <button
                                                className="action-btn edit"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate("/bill", { state: { facture: f, client: selectedClient, type: f.type } });
                                                }}
                                                title="Modifier"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="action-btn duplicate"
                                                onClick={(e) => { e.stopPropagation(); onDuplicate(f); }}
                                                title="Dupliquer"
                                            >
                                                <FaCopy />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={(e) => { e.stopPropagation(); onDelete(f.id, type); }}
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
    );
};

export default DocumentSection;