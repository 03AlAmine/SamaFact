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
    FaCheck
} from "react-icons/fa";
import empty_team from '../assets/empty_team.png';
import { ROLES } from '../auth/AuthContext';
import { teamService } from '../services/teamService';
import "../css/TeamPage.css"

const TeamsPage = ({ currentUser, checkPermission, createSubUser }) => {
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
    const [subUserSuccess, setSubUserSuccess] = useState('');
    const [subUserError, setSubUserError] = useState('');

    // Charger les équipes au montage
    useEffect(() => {
        const fetchTeams = async () => {
            if (currentUser?.companyId) {
                const teams = await teamService.getTeams(currentUser.companyId);
                setEquipes(teams);
                setFilteredEquipes(teams);
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
                    console.error("Error loading users:", error);
                    setSubUserError("Erreur lors du chargement des utilisateurs");
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
            const { success } = await teamService.addTeam(currentUser.companyId, equipe);
            if (success) {
                setEquipe({ nom: '', responsable: '', description: '' });
                const updatedTeams = await teamService.getTeams(currentUser.companyId);
                setEquipes(updatedTeams);
                setFilteredEquipes(updatedTeams);
            }
        } catch (error) {
            console.error("Error adding team:", error);
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
        } catch (error) {
            console.error("Error updating team:", error);
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
            } catch (error) {
                console.error("Error deleting team:", error);
            }
        }
    };

    // Gestion des utilisateurs
    const handleCreateSubUser = async () => {
        try {
            await createSubUser(
                subUserForm.email,
                subUserPassword,
                subUserForm.name,
                subUserForm.role
            );
            setSubUserSuccess("Utilisateur créé avec succès");
            setSubUserForm({ email: '', name: '', role: ROLES.VIEWER });
            setSubUserPassword(generateRandomPassword());

            // Rafraîchir la liste des utilisateurs
            const updatedUsers = await teamService.getCompanyUsers(currentUser.companyId);
            setUsers(updatedUsers);

            setTimeout(() => setSubUserSuccess(''), 3000);
        } catch (error) {
            setSubUserError(`Erreur: ${error.message}`);
            setTimeout(() => setSubUserError(''), 3000);
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            await teamService.toggleUserStatus(currentUser.companyId, userId, currentStatus);
            const updatedUsers = await teamService.getCompanyUsers(currentUser.companyId);
            setUsers(updatedUsers);
            setSubUserSuccess(`Utilisateur ${!currentStatus ? 'activé' : 'désactivé'} avec succès`);
            setTimeout(() => setSubUserSuccess(''), 3000);
        } catch (error) {
            setSubUserError(`Erreur: ${error.message}`);
            setTimeout(() => setSubUserError(''), 3000);
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

    return (
        <div className="teams-container">
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

                    {subUserSuccess && <div className="alert success">{subUserSuccess}</div>}
                    {subUserError && <div className="alert error">{subUserError}</div>}

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
                                    {Object.values(ROLES)
                                        .filter(role => {
                                            // Vérifiez d'abord si currentUser existe
                                            if (!currentUser) return false;

                                            if (currentUser.role === ROLES.ADMIN && role === ROLES.SUPERADMIN) return false;
                                            if (currentUser.role === ROLES.MANAGER &&
                                                [ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.MANAGER].includes(role)) return false;
                                            return true;
                                        })
                                        .map((role) => (
                                            <option key={role} value={role}>
                                                {role}
                                            </option>
                                        ))}
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
                            disabled={!subUserForm.email || !subUserForm.role}
                        >
                            <FaPlus /> Créer l'utilisateur
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