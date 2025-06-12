import React from 'react';
import {
    FaFileInvoiceDollar,
    FaSearch,
    FaPlus,
    FaEdit,
    FaTrash
} from 'react-icons/fa';
import empty from '../assets/empty.png';

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

export default DocumentSection;