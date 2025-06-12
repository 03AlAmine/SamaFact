import React from "react";
import { FaUsers, FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";
import empty_team from '../assets/empty_team.png';

const TeamsPage = ({
    filteredEquipes,
    searchTerm,
    setSearchTerm,
    isEditingEquipe,
    setIsEditingEquipe,
    editingEquipe,
    handleEquipeEditChange,
    handleEquipeUpdate,
    cancelEquipeEdit,
    equipe,
    handleEquipeChange,
    handleEquipeSubmit,
    handleEquipeEdit,
    handleEquipeDelete
}) => {
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
};

export default TeamsPage;