import React from "react";
import { FaUsers, FaEdit, FaTrash, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBuilding, FaPlus, FaSearch, FaFileInvoiceDollar } from "react-icons/fa";
import empty_client from '../assets/empty_client.png';


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
    handleDeleteFacture // <-- Add this prop
}) => {
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

                    {/* Formulaire d'ajout... */}
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