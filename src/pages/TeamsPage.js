import React, { useState, useEffect } from "react";
import {
    FaUsers,
    FaEdit,
    FaTrash,
    FaPlus,
    FaSearch,
    FaUserShield,
    FaUserEdit,
    FaUser,
    FaTimes,
    FaCheck,
    FaCheckCircle,
    FaExclamationTriangle
} from "react-icons/fa";
import empty_team from '../assets/empty_team.png';
import { ROLES } from '../auth/AuthContext';
import { teamService } from '../services/teamService';
import "../css/TeamPage.css";
import { useAuth } from '../auth/AuthContext';

const TeamsPage = ({  checkPermission }) => {
    const { currentUser, loading } = useAuth();

    // États pour la gestion des équipes
    const [equipes, setEquipes] = useState([]);
    const [filteredEquipes, setFilteredEquipes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditingEquipe, setIsEditingEquipe] = useState(false);
    const [editingEquipe, setEditingEquipe] = useState(null);
    const [equipe, setEquipe] = useState({
        nom: '',
        responsable: '',
        description: ''
    });

    // États pour la gestion des utilisateurs
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [subUserForm, setSubUserForm] = useState({
        email: '',
        name: '',
        role: ROLES.VIEWER
    });
    const [subUserPassword, setSubUserPassword] = useState(generateRandomPassword());
    const [subUserSuccess, setSubUserSuccess] = useState(null);
    const [subUserError, setSubUserError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Charger les équipes au montage
    useEffect(() => {
        const fetchTeams = async () => {
            if (currentUser?.companyId) {
                try {
                    const teams = await teamService.getTeams(currentUser.companyId);
                    setEquipes(teams);
                    setFilteredEquipes(teams);
                } catch (error) {
                    setSubUserError({
                        title: "Erreur",
                        message: "Impossible de charger les équipes"
                    });
                }
            }
        };
        fetchTeams();
    }, [currentUser]);

    // Charger les utilisateurs si permission
    useEffect(() => {
        const fetchUsers = async () => {
            if (checkPermission('manageUsers') && currentUser?.companyId) {
                setLoadingUsers(true);
                try {
                    const users = await teamService.getCompanyUsers(currentUser.companyId);
                    setUsers(users);
                } catch (error) {
                    setSubUserError({
                        title: "Erreur",
                        message: "Impossible de charger les utilisateurs"
                    });
                } finally {
                    setLoadingUsers(false);
                }
            }
        };
        fetchUsers();
    }, [currentUser, checkPermission]);

    // Filtrer les équipes selon le terme de recherche
    useEffect(() => {
        const filtered = equipes.filter(eq =>
            eq.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (eq.responsable && eq.responsable.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredEquipes(filtered);
    }, [searchTerm, equipes]);

    // Générer un mot de passe aléatoire
    function generateRandomPassword() {
        return Math.random().toString(36).slice(-8) + 'A1!';
    }

    // Gestion des équipes
    const handleEquipeChange = (e) => {
        const { name, value } = e.target;
        setEquipe(prev => ({ ...prev, [name]: value }));
    };

    const handleEquipeSubmit = async (e) => {
        e.preventDefault();
        try {
            const result = await teamService.addTeam(currentUser.companyId, equipe);
            if (result.success) {
                setEquipe({ nom: '', responsable: '', description: '' });
                const updatedTeams = await teamService.getTeams(currentUser.companyId);
                setEquipes(updatedTeams);
                setFilteredEquipes(updatedTeams);
                setSubUserSuccess({
                    title: "Succès",
                    message: "Équipe ajoutée avec succès"
                });
            }
        } catch (error) {
            setSubUserError({
                title: "Erreur",
                message: error.message || "Erreur lors de l'ajout de l'équipe"
            });
        }
    };

    const handleEquipeEdit = (equipe) => {
        setIsEditingEquipe(true);
        setEditingEquipe(equipe);
    };

    const handleEquipeEditChange = (e) => {
        const { name, value } = e.target;
        setEditingEquipe(prev => ({ ...prev, [name]: value }));
    };

    const handleEquipeUpdate = async (e) => {
        e.preventDefault();
        try {
            await teamService.updateTeam(editingEquipe.id, editingEquipe);
            const updatedTeams = await teamService.getTeams(currentUser.companyId);
            setEquipes(updatedTeams);
            setFilteredEquipes(updatedTeams);
            setIsEditingEquipe(false);
            setEditingEquipe(null);
            setSubUserSuccess({
                title: "Succès",
                message: "Équipe mise à jour avec succès"
            });
        } catch (error) {
            setSubUserError({
                title: "Erreur",
                message: error.message || "Erreur lors de la mise à jour de l'équipe"
            });
        }
    };

    const cancelEquipeEdit = () => {
        setIsEditingEquipe(false);
        setEditingEquipe(null);
    };

    const handleEquipeDelete = async (teamId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette équipe ?")) {
            try {
                await teamService.deleteTeam(teamId);
                const updatedTeams = await teamService.getTeams(currentUser.companyId);
                setEquipes(updatedTeams);
                setFilteredEquipes(updatedTeams);
                setSubUserSuccess({
                    title: "Succès",
                    message: "Équipe supprimée avec succès"
                });
            } catch (error) {
                setSubUserError({
                    title: "Erreur",
                    message: error.message || "Erreur lors de la suppression de l'équipe"
                });
            }
        }
    };

// Gestion des utilisateurs
const handleCreateSubUser = async () => {
    // Vérification initiale de currentUser
    if (!currentUser) {
        setSubUserError({
            title: "Erreur",
            message: "Utilisateur non connecté",
            details: "Veuillez vous reconnecter"
        });
        return;
    }

    if (!currentUser.companyId) {
        setSubUserError({
            title: "Erreur",
            message: "Company ID manquant",
            details: "L'utilisateur n'est pas associé à une entreprise"
        });
        return;
    }

    try {
        setIsSubmitting(true);
        setSubUserError(null);

        console.log('Données soumises:', {
            email: subUserForm.email,
            role: subUserForm.role,
            companyId: currentUser.companyId
        });

        const result = await teamService.createUserWithIsolatedAuth(
            {
                email: subUserForm.email,
                password: subUserPassword,
                name: subUserForm.name,
                role: subUserForm.role,
                companyId: currentUser.companyId
            },
            currentUser.uid
        );

        console.log('Résultat de création:', result);

        if (result.success) {
            setSubUserSuccess({
                title: "Succès",
                message: `Utilisateur créé - ID: ${result.userId}`,
                userId: result.userId
            });

            // Réinitialisation du formulaire
            setSubUserForm({ email: '', name: '', role: ROLES.VIEWER });
            setSubUserPassword(generateRandomPassword());

            // Mise à jour de la liste
            const updatedUsers = await teamService.getCompanyUsers(currentUser.companyId);
            setUsers(updatedUsers);
        }
    } catch (error) {
        console.error('Erreur complète:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });

        let errorMessage = "Échec de la création";
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "Email déjà utilisé";
        } else if (error.message.includes('already-in-use')) {
            errorMessage = "Email déjà enregistré";
        } else if (error.code === 'permission-denied') {
            errorMessage = "Permissions insuffisantes";
        }

        setSubUserError({
            title: "Erreur",
            message: errorMessage,
            details: error.message
        });
    } finally {
        setIsSubmitting(false);
    }
};
    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            await teamService.toggleUserStatus(currentUser.companyId, userId, currentStatus);
            const updatedUsers = await teamService.getCompanyUsers(currentUser.companyId);
            setUsers(updatedUsers);
            setSubUserSuccess({
                title: "Succès",
                message: `Utilisateur ${!currentStatus ? 'activé' : 'désactivé'} avec succès`
            });
        } catch (error) {
            setSubUserError({
                title: "Erreur",
                message: error.message || "Erreur lors du changement de statut"
            });
        }
    };

    // Helper functions
    const getRoleIcon = (role) => {
        switch (role) {
            case ROLES.ADMIN: return <FaUserShield className="role-icon admin" />;
            case ROLES.MANAGER: return <FaUserEdit className="role-icon manager" />;
            case ROLES.EDITOR: return <FaUserEdit className="role-icon editor" />;
            default: return <FaUser className="role-icon viewer" />;
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate();
        return date.toLocaleDateString('fr-FR');
    };
        if (loading) {
        return <div>Chargement en cours...</div>;
    }
    
    if (!currentUser) {
        return <div>Veuillez vous connecter</div>;
    }

    return (
        <div className="teams-container">
            {/* Notifications */}
            <div className="notifications-container">
                {subUserSuccess && (
                    <div className="notification success">
                        <FaCheckCircle />
                        <div>
                            <h4>{subUserSuccess.title}</h4>
                            <p>{subUserSuccess.message}</p>
                            {subUserSuccess.userId && <small>ID: {subUserSuccess.userId}</small>}
                        </div>
                        <button onClick={() => setSubUserSuccess(null)}>
                            <FaTimes />
                        </button>
                    </div>
                )}

                {subUserError && (
                    <div className="notification error">
                        <FaExclamationTriangle />
                        <div>
                            <h4>{subUserError.title}</h4>
                            <p>{subUserError.message}</p>
                        </div>
                        <button onClick={() => setSubUserError(null)}>
                            <FaTimes />
                        </button>
                    </div>
                )}
            </div>

            {/* Formulaire d'édition/création d'équipe */}
            {isEditingEquipe ? (
                <form onSubmit={handleEquipeUpdate} className="form-card">
                    <h2 className="form-title">
                        <FaEdit style={{ marginRight: "10px" }} />
                        Modifier l'équipe
                    </h2>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Nom <span className="required">*</span></label>
                            <input
                                name="nom"
                                value={editingEquipe.nom}
                                onChange={handleEquipeEditChange}
                                required
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Responsable</label>
                            <input
                                name="responsable"
                                value={editingEquipe.responsable}
                                onChange={handleEquipeEditChange}
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={editingEquipe.description}
                            onChange={handleEquipeEditChange}
                            className="form-input"
                            rows="3"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={cancelEquipeEdit} className="btn-secondary">
                            Annuler
                        </button>
                        <button type="submit" className="btn-primary">
                            Mettre à jour
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleEquipeSubmit} className="form-card">
                    <h2 className="form-title">
                        <FaPlus style={{ marginRight: "10px" }} />
                        Ajouter une nouvelle équipe
                    </h2>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Nom <span className="required">*</span></label>
                            <input
                                name="nom"
                                value={equipe.nom}
                                onChange={handleEquipeChange}
                                required
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Responsable</label>
                            <input
                                name="responsable"
                                value={equipe.responsable}
                                onChange={handleEquipeChange}
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={equipe.description}
                            onChange={handleEquipeChange}
                            className="form-input"
                            rows="3"
                        />
                    </div>

                    <button type="submit" className="btn-primary">
                        Ajouter l'équipe
                    </button>
                </form>
            )}

            {/* Liste des équipes */}
            <div className="section-card">
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
                    <div className="empty-state">
                        <img src={empty_team} alt="Aucune équipe" className="empty-image" />
                        <p>Aucune équipe trouvée</p>
                        <button
                            className="btn-primary"
                            onClick={() => setIsEditingEquipe(false)}
                        >
                            <FaPlus /> Ajouter une équipe
                        </button>
                    </div>
                ) : (
                    <div className="grid-view">
                        {filteredEquipes.map((eq) => (
                            <div key={eq.id} className="card">
                                <div className="card-header">
                                    <div className="avatar">
                                        <FaUsers />
                                    </div>
                                    <div className="info">
                                        <div className="title">{eq.nom}</div>
                                        {eq.responsable && <div className="subtitle">Responsable: {eq.responsable}</div>}
                                    </div>
                                    <div className="actions">
                                        <button
                                            onClick={() => handleEquipeEdit(eq)}
                                            className="icon-btn edit"
                                            title="Modifier"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleEquipeDelete(eq.id)}
                                            className="icon-btn delete"
                                            title="Supprimer"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                                {eq.description && (
                                    <div className="card-body">
                                        <p>{eq.description}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Gestion des utilisateurs */}
            {checkPermission('manageUsers') && (
                <div className="section-card">
                    <h2 className="section-title">
                        <FaUsers style={{ marginRight: "10px" }} />
                        Gestion des Utilisateurs
                    </h2>

                    {/* Formulaire de création d'utilisateur */}
                    <div className="form-card">
                        <h3 className="form-subtitle">Ajouter un nouvel utilisateur</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Email <span className="required">*</span></label>
                                <input
                                    type="email"
                                    value={subUserForm.email}
                                    onChange={(e) => setSubUserForm({ ...subUserForm, email: e.target.value })}
                                    placeholder="Email de l'utilisateur"
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Nom complet</label>
                                <input
                                    value={subUserForm.name}
                                    onChange={(e) => setSubUserForm({ ...subUserForm, name: e.target.value })}
                                    placeholder="Nom de l'utilisateur"
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Rôle <span className="required">*</span></label>
                                <select
                                    value={subUserForm.role}
                                    onChange={(e) => setSubUserForm({ ...subUserForm, role: e.target.value })}
                                    className="form-input"
                                    required
                                >
                                    <option value={ROLES.ADMIN}>Administrateur</option>
                                    <option value={ROLES.MANAGER}>Manager</option>
                                    <option value={ROLES.EDITOR}>Éditeur</option>
                                    <option value={ROLES.VIEWER}>Lecteur</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Mot de passe temporaire</label>
                                <div className="password-input">
                                    <input
                                        type="text"
                                        value={subUserPassword}
                                        readOnly
                                        className="form-input"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setSubUserPassword(generateRandomPassword())}
                                        className="icon-btn"
                                        title="Générer un nouveau mot de passe"
                                    >
                                        <FaPlus />
                                    </button>
                                </div>
                                <small className="hint">Ce mot de passe sera envoyé à l'utilisateur</small>
                            </div>
                        </div>

                        <button
                            onClick={handleCreateSubUser}
                            className="btn-primary"
                            disabled={!subUserForm.email || !subUserForm.role || isSubmitting}
                        >
                            {isSubmitting ? 'Création en cours...' : <><FaPlus /> Créer l'utilisateur</>}
                        </button>
                    </div>

                    {/* Liste des utilisateurs */}
                    <div className="users-section">
                        <h3 className="section-subtitle">Liste des Utilisateurs ({users.length})</h3>

                        {loadingUsers ? (
                            <div className="loading">Chargement des utilisateurs...</div>
                        ) : users.length === 0 ? (
                            <div className="empty-state">
                                <p>Aucun utilisateur trouvé</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Utilisateur</th>
                                            <th>Email</th>
                                            <th>Rôle</th>
                                            <th>Créé le</th>
                                            <th>Statut</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id}>
                                                <td>
                                                    <div className="user-cell">
                                                        {getRoleIcon(user.role)}
                                                        <span>{user.name || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td>{user.email}</td>
                                                <td>
                                                    <span className={`badge role-${user.role.toLowerCase()}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td>{formatDate(user.createdAt)}</td>
                                                <td>
                                                    <span className={`badge status-${user.disabled ? 'inactive' : 'active'}`}>
                                                        {user.disabled ? 'Désactivé' : 'Actif'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => toggleUserStatus(user.id, user.disabled)}
                                                        className={`icon-btn ${user.disabled ? 'activate' : 'deactivate'}`}
                                                        title={user.disabled ? 'Activer' : 'Désactiver'}
                                                    >
                                                        {user.disabled ? <FaCheck /> : <FaTimes />}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamsPage;