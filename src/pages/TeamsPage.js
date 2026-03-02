import React, { useState, useEffect } from "react";
import {
    FaUsers,
    FaEdit,
    FaTrash,
    FaPlus,
    FaSearch,
    FaUserEdit,
    FaUser,
    FaTimes,
    FaCheck,
    FaCheckCircle,
    FaExclamationTriangle,
    FaKey,
    FaUserTie,
    FaUserCog,
    FaArrowLeft,
    FaChevronDown,
    FaChevronUp,
    FaList,
    FaTh
} from "react-icons/fa";
import empty_team from '../assets/empty_team.png';
import { ROLES } from '../auth/AuthContext';
import { teamService } from '../services/teamService';
import "../css/TeamPage.css"; // Note: le fichier CSS s'appelle TeamPage.css
import { useAuth } from '../auth/AuthContext';
import { userService } from '../services/userService';
import bgTeam from "../assets/bg/bg-team.jpg";

// =============================================================================
// HOOKS PERSONNALISÉS
// =============================================================================

const useBackgroundLoader = (bgImage) => {
    const [backgroundLoaded, setBackgroundLoaded] = useState(false);

    useEffect(() => {
        const img = new Image();
        img.src = bgImage;
        img.onload = () => setBackgroundLoaded(true);
        img.onerror = () => {
            console.error("Erreur de chargement de l'image de fond");
            setBackgroundLoaded(true);
        };
    }, [bgImage]);

    return backgroundLoaded;
};

const useNotifications = () => {
    const [notifications, setNotifications] = useState({
        success: null,
        error: null
    });

    const showSuccess = (title, message) => {
        setNotifications({ success: { title, message }, error: null });
    };

    const showError = (title, message, details = null) => {
        setNotifications({ error: { title, message, details }, success: null });
    };

    const clearNotifications = () => {
        setNotifications({ success: null, error: null });
    };

    return { notifications, showSuccess, showError, clearNotifications };
};

const useTeamsManagement = (currentUser, showSuccess, showError, usersList = []) => {
    const [teams, setTeams] = useState({
        list: [],
        filtered: [],
        searchTerm: '',
        editing: null,
        form: {
            nom: '',
            responsable: '',
            responsableId: '',
            description: '',
            members: []
        }
    });

    const loadTeams = async () => {
        try {
            const teamsList = await teamService.getTeams(currentUser.companyId);
            setTeams(prev => ({
                ...prev,
                list: teamsList,
                filtered: teamsList
            }));
        } catch (error) {
            showError("Erreur", "Impossible de charger les équipes");
        }
    };

    const handleTeamSearch = (searchTerm) => {
        const filtered = teams.list.filter(team =>
            team.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (team.responsable && team.responsable.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setTeams(prev => ({ ...prev, filtered, searchTerm }));
    };

    const handleTeamFormChange = (field, value) => {
        setTeams(prev => ({
            ...prev,
            form: { ...prev.form, [field]: value }
        }));
    };

    const startTeamEdit = (team) => {
        setTeams(prev => ({ ...prev, editing: team }));
    };

    const handleTeamEditChange = (field, value) => {
        setTeams(prev => ({
            ...prev,
            editing: { ...prev.editing, [field]: value }
        }));
    };

    const handleMemberToggle = (userId, isAdding, isEditing = false) => {
        if (isEditing) {
            const currentMembers = teams.editing.members || [];
            if (isAdding && currentMembers.includes(userId)) {
                showError("Erreur", "Cet utilisateur est déjà membre de l'équipe");
                return;
            }
            setTeams(prev => ({
                ...prev,
                editing: {
                    ...prev.editing,
                    members: isAdding
                        ? [...(prev.editing.members || []), userId]
                        : (prev.editing.members || []).filter(id => id !== userId)
                }
            }));
        } else {
            setTeams(prev => ({
                ...prev,
                form: {
                    ...prev.form,
                    members: isAdding
                        ? [...prev.form.members, userId]
                        : prev.form.members.filter(id => id !== userId)
                }
            }));
        }
    };

    const getEligibleMembers = () => {
        return usersList.filter(user =>
            !user.disabled &&
            [ROLES.CHARGE_COMPTE, ROLES.COMPTABLE, ROLES.LECTEUR].includes(user.role)
        );
    };

    const getEligibleResponsables = () => {
        return usersList.filter(user =>
            !user.disabled &&
            [ROLES.ADMIN, ROLES.RH_DAF, ROLES.CHARGE_COMPTE, ROLES.COMPTABLE].includes(user.role)
        );
    };

    const findUserById = (userId) => {
        return usersList.find(user => user.id === userId);
    };

    const handleTeamSubmit = async (e) => {
        e.preventDefault();

        if (!teams.form.nom.trim()) {
            showError("Erreur", "Le nom de l'équipe est obligatoire");
            return;
        }

        if (!teams.form.responsableId) {
            showError("Erreur", "Un responsable doit être sélectionné");
            return;
        }

        try {
            const nameExists = await teamService.checkTeamNameExists(
                currentUser.companyId,
                teams.form.nom
            );

            if (nameExists) {
                showError("Erreur", "Une équipe avec ce nom existe déjà");
                return;
            }

            await teamService.addTeam(currentUser.companyId, teams.form);
            await loadTeams();

            setTeams(prev => ({
                ...prev,
                form: {
                    nom: '',
                    responsable: '',
                    responsableId: '',
                    description: '',
                    members: []
                }
            }));

            showSuccess("Succès", "Équipe ajoutée avec succès");
        } catch (error) {
            showError("Erreur", error.message || "Erreur lors de l'ajout de l'équipe");
        }
    };

    const handleTeamUpdate = async (e) => {
        e.preventDefault();
        try {
            await teamService.updateTeam(teams.editing.id, teams.editing);
            await loadTeams();
            setTeams(prev => ({ ...prev, editing: null }));
            showSuccess("Succès", "Équipe mise à jour avec succès");
        } catch (error) {
            showError("Erreur", error.message || "Erreur lors de la mise à jour de l'équipe");
        }
    };

    const cancelTeamEdit = () => {
        setTeams(prev => ({ ...prev, editing: null }));
    };

    const handleTeamDelete = async (teamId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette équipe ?")) {
            try {
                await teamService.deleteTeam(teamId);
                await loadTeams();
                showSuccess("Succès", "Équipe supprimée avec succès");
            } catch (error) {
                showError("Erreur", error.message || "Erreur lors de la suppression de l'équipe");
            }
        }
    };

    return {
        teams,
        loadTeams,
        handleTeamSearch,
        handleTeamFormChange,
        handleTeamSubmit,
        startTeamEdit,
        handleTeamEditChange,
        handleTeamUpdate,
        cancelTeamEdit,
        handleTeamDelete,
        handleMemberToggle,
        getEligibleResponsables,
        getEligibleMembers,
        findUserById
    };
};

const useUsersManagement = (currentUser, showSuccess, showError) => {
    const [users, setUsers] = useState({
        list: [],
        loading: true,
        editing: null,
        form: { email: '', name: '', username: '', role: ROLES.CHARGE_COMPTE },
        password: generateRandomPassword(),
        isCreating: true,
        showResetModal: false,
        userToReset: null
    });

    function generateRandomPassword() {
        return Math.random().toString(36).slice(-8) + 'A1!';
    }

    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadUsers = async () => {
        setUsers(prev => ({ ...prev, loading: true }));
        try {
            const usersList = await userService.getCompanyUsers(currentUser.companyId);
            setUsers(prev => ({ ...prev, list: usersList }));
        } catch (error) {
            showError("Erreur", error.message || "Impossible de charger les utilisateurs");
        } finally {
            setUsers(prev => ({ ...prev, loading: false }));
        }
    };

    const handleUserFormChange = (field, value) => {
        setUsers(prev => ({
            ...prev,
            form: { ...prev.form, [field]: value }
        }));
    };

    const handleCreateUser = async () => {
        if (!currentUser) {
            showError("Erreur", "Utilisateur non connecté", "Veuillez vous reconnecter");
            return;
        }

        try {
            setIsSubmitting(true);
            await userService.createUserWithIsolatedAuth(
                {
                    ...users.form,
                    password: users.password,
                    companyId: currentUser.companyId,
                },
                currentUser.uid
            );

            showSuccess("Succès", "Utilisateur créé avec succès");
            resetUserForm();
            await loadUsers();
        } catch (error) {
            handleUserError(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUserError = (error) => {
        let message = "Échec de la création";
        if (error.code === 'auth/email-already-in-use') {
            message = "Email déjà utilisé";
        } else if (error.message.includes('already-in-use')) {
            message = "Email déjà enregistré";
        } else if (error.code === 'permission-denied') {
            message = "Permissions insuffisantes";
        }
        showError("Erreur", message, error.message);
    };

    const resetUserForm = () => {
        setUsers(prev => ({
            ...prev,
            form: { email: '', name: '', username: '', role: ROLES.CHARGE_COMPTE },
            password: generateRandomPassword(),
            isCreating: true,
            editing: null
        }));
    };

    const startUserEdit = (user) => {
        setUsers(prev => ({
            ...prev,
            editing: user,
            form: {
                email: user.email,
                name: user.name || '',
                username: user.username || '',
                role: user.role
            },
            isCreating: false
        }));
    };

    const handleUserUpdate = async () => {
        try {
            setIsSubmitting(true);
            await teamService.updateUser(users.editing.id, {
                ...users.form,
                companyId: currentUser.companyId,
                updatedAt: new Date()
            });

            await loadUsers();
            resetUserForm();
            showSuccess("Succès", "Utilisateur mis à jour avec succès");
        } catch (error) {
            showError("Erreur", error.message || "Erreur lors de la mise à jour de l'utilisateur");
        } finally {
            setIsSubmitting(false);
        }
    };

    const cancelUserEdit = () => {
        resetUserForm();
    };

    const handleUserDelete = async (userId) => {
        if (window.confirm("Êtes-vous sûr de vouloir **supprimer définitivement** cet utilisateur ?")) {
            try {
                await teamService.deleteUser(currentUser.companyId, userId);
                await loadUsers();
                showSuccess("Succès", "Utilisateur supprimé avec succès");
            } catch (error) {
                showError("Erreur", error.message || "Erreur lors de la suppression de l'utilisateur");
            }
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            await teamService.toggleUserStatus(currentUser.companyId, userId, currentStatus);
            await loadUsers();
            showSuccess("Succès", `Utilisateur ${!currentStatus ? 'désactivé' : 'activé'} avec succès`);
        } catch (error) {
            showError("Erreur", error.message || "Erreur lors du changement de statut");
        }
    };

    const handleResetPassword = (user) => {
        setUsers(prev => ({ ...prev, userToReset: user, showResetModal: true }));
    };

    const confirmResetPassword = async () => {
        try {
            await teamService.resetUserPassword(users.userToReset.email);
            setUsers(prev => ({ ...prev, showResetModal: false }));
            showSuccess("Succès", `Email de réinitialisation envoyé à ${users.userToReset.email}`);
        } catch (error) {
            showError("Erreur", error.message || "Erreur lors de l'envoi de l'email de réinitialisation");
        }
    };

    return {
        users,
        isSubmitting,
        loadUsers,
        handleUserFormChange,
        handleCreateUser,
        startUserEdit,
        handleUserUpdate,
        cancelUserEdit,
        handleUserDelete,
        toggleUserStatus,
        handleResetPassword,
        confirmResetPassword,
        setUsers
    };
};

// =============================================================================
// COMPOSANTS FONCTIONNELS AVEC PRÉFIXES
// =============================================================================

const LoadingSpinner = () => (
    <div className="team-loading-spinner">
        <div>⏳</div>
        <div>Chargement...</div>
    </div>
);

const Notifications = ({ success, error, onClose }) => (
    <div className="team-notifications-container">
        {success && (
            <div className="team-notification team-success">
                <FaCheckCircle />
                <div>
                    <h4>{success.title}</h4>
                    <p>{success.message}</p>
                </div>
                <button onClick={onClose}><FaTimes /></button>
            </div>
        )}
        {error && (
            <div className="team-notification team-error">
                <FaExclamationTriangle />
                <div>
                    <h4>{error.title}</h4>
                    <p>{error.message}</p>
                </div>
                <button onClick={onClose}><FaTimes /></button>
            </div>
        )}
    </div>
);

const Section = ({ title, icon, isOpen, onToggle, children }) => (
    <div className="team-section-card">
        <div className="team-section-header" onClick={onToggle}>
            <h2 className="team-section-title">
                {icon}
                {title}
            </h2>
            <button className="team-icon-btn">
                {isOpen ? <FaChevronUp /> : <FaChevronDown />}
            </button>
        </div>
        {isOpen && children}
    </div>
);

const UserForm = ({
    isCreating,
    form,
    password,
    isSubmitting,
    onFormChange,
    onPasswordGenerate,
    onCreate,
    onUpdate,
    onCancelEdit
}) => (
    <div className="team-form-card">
        <div className="team-form-header">
            <h3 className="team-form-subtitle">
                {isCreating ? 'Ajouter un nouvel utilisateur' : 'Modifier l\'utilisateur'}
            </h3>
            {!isCreating && (
                <button onClick={onCancelEdit} className="team-btn-secondary">
                    <FaArrowLeft /> Annuler l'édition
                </button>
            )}
        </div>

        <div className="team-form-row">
            <div className="team-form-group">
                <label>Email <span className="team-required">*</span></label>
                <input
                    type="email"
                    value={form.email}
                    onChange={(e) => onFormChange('email', e.target.value)}
                    placeholder="Email de l'utilisateur"
                    className="team-form-input"
                    required
                    disabled={!isCreating}
                />
            </div>
            <div className="team-form-group">
                <label>Nom complet</label>
                <input
                    value={form.name}
                    onChange={(e) => onFormChange('name', e.target.value)}
                    placeholder="Nom de l'utilisateur"
                    className="team-form-input"
                />
            </div>
        </div>

        <div className="team-form-row">
            <div className="team-form-group">
                <label>Nom d'utilisateur</label>
                <input
                    value={form.username}
                    onChange={(e) => onFormChange('username', e.target.value)}
                    placeholder="Pseudo"
                    className="team-form-input"
                />
            </div>
            <div className="team-form-group">
                <label>Rôle <span className="team-required">*</span></label>
                <select
                    value={form.role}
                    onChange={(e) => onFormChange('role', e.target.value)}
                    className="team-form-input"
                    required
                >
                    <option value={ROLES.ADMIN}>Administrateur</option>
                    <option value={ROLES.RH_DAF}>RH_DAF</option>
                    <option value={ROLES.COMPTABLE}>Comptable</option>
                    <option value={ROLES.CHARGE_COMPTE}>Chargé de compte</option>
                    <option value={ROLES.LECTEUR}>Lecteur</option>
                </select>
            </div>

            {isCreating && (
                <div className="team-form-group">
                    <label>Mot de passe temporaire</label>
                    <div className="team-password-input">
                        <input
                            type="text"
                            value={password}
                            readOnly
                            className="team-form-input"
                        />
                        <button
                            type="button"
                            onClick={onPasswordGenerate}
                            className="team-icon-btn"
                            title="Générer un nouveau mot de passe"
                        >
                            <FaPlus />
                        </button>
                    </div>
                    <small className="team-hint">Ce mot de passe sera envoyé à l'utilisateur</small>
                </div>
            )}
        </div>

        <div className="team-form-actions">
            {isCreating ? (
                <button
                    onClick={onCreate}
                    className="team-btn-primary"
                    disabled={!form.email || !form.role || isSubmitting}
                >
                    {isSubmitting ? 'Création en cours...' : <><FaPlus /> Créer l'utilisateur</>}
                </button>
            ) : (
                <button
                    onClick={onUpdate}
                    className="team-btn-primary"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Mise à jour...' : <><FaEdit /> Mettre à jour</>}
                </button>
            )}
        </div>
    </div>
);

// Composant UsersList avec sélecteur de vue
const UsersList = ({
    users,
    loading,
    getRoleIcon,
    formatDate,
    onEdit,
    onDelete,
    onResetPassword,
    onToggleStatus
}) => {
    const [viewMode, setViewMode] = useState('card');

    return (
        <div className="team-users-section">
            <div className="team-list-header">
                <h3 className="team-section-subtitle">
                    <FaUsers />
                    Liste des Utilisateurs ({users.length})
                </h3>

                {/* Sélecteur de vue */}
                <div className="view-controls">
                    <button
                        className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                        title="Vue tableau"
                    >
                        <FaList />
                    </button>
                    <button
                        className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
                        onClick={() => setViewMode('card')}
                        title="Vue cartes"
                    >
                        <FaTh />

                    </button>
                </div>
            </div>

            {loading ? (
                <div className="team-loading">Chargement des utilisateurs...</div>
            ) : users.length === 0 ? (
                <div className="team-empty-state">
                    <p>Aucun utilisateur trouvé</p>
                </div>
            ) : (
                <>
                    {/* Vue Tableau */}
                    {viewMode === 'list' && (
                        <div className="team-desktop-view">
                            <table className="team-data-table">
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
                                                <div className="team-user-cell">
                                                    {getRoleIcon(user.role)}
                                                    <span>{user.name || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`team-badge team-role-${user.role.toLowerCase()}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td>{formatDate(user.createdAt)}</td>
                                            <td>
                                                <span className={`team-badge ${user.disabled ? 'team-status-inactive' : 'team-status-active'}`}>
                                                    {user.disabled ? 'Désactivé' : 'Actif'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="team-action-buttons">
                                                    <button
                                                        onClick={() => onEdit(user)}
                                                        className="team-icon-btn team-edit"
                                                        title="Modifier"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete(user.id)}
                                                        className="team-icon-btn team-delete"
                                                        title="Supprimer"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                    <button
                                                        onClick={() => onResetPassword(user)}
                                                        className="team-icon-btn team-reset"
                                                        title="Réinitialiser le mot de passe"
                                                    >
                                                        <FaKey />
                                                    </button>
                                                    <button
                                                        onClick={() => onToggleStatus(user.id, user.disabled)}
                                                        className={`team-icon-btn ${user.disabled ? 'team-activate' : 'team-deactivate'}`}
                                                        title={user.disabled ? 'Activer' : 'Désactiver'}
                                                    >
                                                        {user.disabled ? <FaCheck /> : <FaTimes />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Vue Cartes */}
                    {viewMode === 'card' && (
                        <div className="team-mobile-view team-users-grid">
                            {users.map((user) => (
                                <UserCard
                                    key={user.id}
                                    user={user}
                                    getRoleIcon={getRoleIcon}
                                    formatDate={formatDate}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onResetPassword={onResetPassword}
                                    onToggleStatus={onToggleStatus}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const UserCard = ({ user, getRoleIcon, formatDate, onEdit, onDelete, onResetPassword, onToggleStatus }) => (
    <div className="team-user-card">
        <div className="team-user-card-header">
            <div className="team-user-avatar">
                {getRoleIcon(user.role)}
            </div>
            <div className="team-user-info">
                <h4 className="team-user-name">{user.name || 'N/A'}</h4>
                <p className="team-user-email">{user.email}</p>
                <div className="team-user-meta">
                    <span className={`team-badge team-role-${user.role.toLowerCase()}`}>
                        {user.role}
                    </span>
                    <span className={`team-badge ${user.disabled ? 'team-status-inactive' : 'team-status-active'}`}>
                        {user.disabled ? 'Désactivé' : 'Actif'}
                    </span>
                </div>
                <p className="team-user-date">Créé le: {formatDate(user.createdAt)}</p>
            </div>
        </div>

        <div className="team-user-card-actions">
            <button onClick={() => onEdit(user)} className="team-icon-btn team-edit" title="Modifier">
                <FaEdit />
            </button>
            <button onClick={() => onDelete(user.id)} className="team-icon-btn team-delete" title="Supprimer">
                <FaTrash />
            </button>
            <button onClick={() => onResetPassword(user)} className="team-icon-btn team-reset" title="Réinitialiser le mot de passe">
                <FaKey />
            </button>
            <button
                onClick={() => onToggleStatus(user.id, user.disabled)}
                className={`team-icon-btn ${user.disabled ? 'team-activate' : 'team-deactivate'}`}
                title={user.disabled ? 'Activer' : 'Désactiver'}
            >
                {user.disabled ? <FaCheck /> : <FaTimes />}
            </button>
        </div>
    </div>
);

const ResetPasswordModal = ({ show, user, onConfirm, onClose }) => {
    if (!show) return null;

    return (
        <div className="team-modal-overlay">
            <div className="team-modal">
                <div className="team-modal-header">
                    <h3>Réinitialiser le mot de passe</h3>
                    <button onClick={onClose} className="team-close-btn">
                        <FaTimes />
                    </button>
                </div>
                <div className="team-modal-body">
                    <p>Voulez-vous envoyer un email de réinitialisation de mot de passe à <strong>{user?.email}</strong> ?</p>
                </div>
                <div className="team-modal-footer">
                    <button onClick={onClose} className="team-btn-secondary">Annuler</button>
                    <button onClick={onConfirm} className="team-btn-primary">Confirmer</button>
                </div>
            </div>
        </div>
    );
};

const TeamForm = ({
    editing,
    form,
    eligibleResponsables,
    eligibleMembers,
    onFormChange,
    onEditChange,
    onMemberToggle,
    onSubmit,
    onUpdate,
    onCancelEdit
}) => (
    <form onSubmit={editing ? onUpdate : onSubmit} className="team-form-card">
        <h2 className="team-form-title">
            {editing ? <FaEdit /> : <FaPlus />}
            {editing ? 'Modifier l\'équipe' : 'Ajouter une nouvelle équipe'}
        </h2>

        <div className="team-form-row">
            <div className="team-form-group">
                <label>Nom <span className="team-required">*</span></label>
                <input
                    name="nom"
                    value={editing ? editing.nom : form.nom}
                    onChange={(e) => editing ? onEditChange('nom', e.target.value) : onFormChange('nom', e.target.value)}
                    required
                    className="team-form-input"
                />
            </div>
        </div>

        <div className="team-form-group">
            <ResponsableSelector
                users={eligibleResponsables}
                selectedResponsableId={editing ? editing.responsableId : form.responsableId}
                onResponsableChange={(userId, userName) => {
                    if (editing) {
                        onEditChange('responsableId', userId);
                        onEditChange('responsable', userName);
                    } else {
                        onFormChange('responsableId', userId);
                        onFormChange('responsable', userName);
                    }
                }}
                placeholder="Choisir un responsable..."
            />
        </div>

        <div className="team-form-group">
            <MembersSelector
                users={eligibleMembers}
                selectedMembers={editing ? (editing.members || []) : (form.members || [])}
                onMembersChange={(userId, isAdding) => onMemberToggle(userId, isAdding, !!editing)}
                placeholder="Ajouter des membres à l'équipe..."
            />
        </div>

        <div className="team-form-group">
            <label>Description</label>
            <textarea
                name="description"
                value={editing ? editing.description : form.description}
                onChange={(e) => editing ? onEditChange('description', e.target.value) : onFormChange('description', e.target.value)}
                className="team-form-input"
                rows="3"
            />
        </div>

        <div className="team-form-actions">
            {editing && (
                <button type="button" onClick={onCancelEdit} className="team-btn-secondary">
                    Annuler
                </button>
            )}
            <button type="submit" className="team-btn-primary">
                {editing ? 'Mettre à jour' : 'Ajouter l\'équipe'}
            </button>
        </div>
    </form>
);

const TeamList = ({
    teams,
    searchTerm,
    onSearch,
    onEdit,
    onDelete,
    onAddTeam,
    findUserById,
    usersList
}) => (
    <div className="team-list-section">
        <div className="team-list-header">
            <h3 className="team-section-subtitle">
                <FaUsers />
                Équipes ({teams.length})
            </h3>
            <div className="team-search-box">
                <FaSearch className="team-search-icon" />
                <input
                    type="text"
                    placeholder="Rechercher une équipe..."
                    value={searchTerm}
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>
        </div>

        {teams.length === 0 ? (
            <div className="team-empty-state">
                <img src={empty_team} alt="Aucune équipe" className="team-empty-image" />
                <p>Aucune équipe trouvée</p>
                <button className="team-btn-primary" onClick={onAddTeam}>
                    <FaPlus /> Ajouter une équipe
                </button>
            </div>
        ) : (
            <div className="team-grid-view">
                {teams.map((team) => (
                    <TeamCard
                        key={team.id}
                        team={team}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        findUserById={findUserById}
                        usersList={usersList}
                    />
                ))}
            </div>
        )}
    </div>
);

const TeamCard = ({ team, onEdit, onDelete, findUserById, usersList }) => {
    const responsableUser = team.responsableId ? findUserById(team.responsableId) : null;
    const teamMembers = team.members || [];
    const memberUsers = teamMembers.map(userId => findUserById(userId)).filter(Boolean);

    return (
        <div className="team-card">
            <div className="team-card-header">
                <div className="team-avatar">
                    <FaUsers />
                </div>
                <div className="team-info">
                    <div className="team-title">{team.nom}</div>
                    {responsableUser && (
                        <div className="team-subtitle">
                            <FaUserTie className="team-responsable-icon" />
                            Responsable: {responsableUser.name} ({responsableUser.email})
                        </div>
                    )}
                    {team.responsable && !responsableUser && (
                        <div className="team-subtitle team-warning">
                            <FaExclamationTriangle />
                            Ancien responsable: {team.responsable}
                        </div>
                    )}

                    {memberUsers.length > 0 && (
                        <div className="team-members-preview">
                            <FaUsers className="team-members-icon" />
                            <span>{memberUsers.length} membre(s)</span>
                        </div>
                    )}
                </div>
                <div className="team-card-actions">
                    <button onClick={() => onEdit(team)} className="team-icon-btn team-edit" title="Modifier">
                        <FaEdit />
                    </button>
                    <button onClick={() => onDelete(team.id)} className="team-icon-btn team-delete" title="Supprimer">
                        <FaTrash />
                    </button>
                </div>
            </div>

            {team.description && (
                <div className="team-card-body">
                    <p>{team.description}</p>
                </div>
            )}

            {memberUsers.length > 0 && (
                <div className="team-card-members">
                    <h4>Membres de l'équipe:</h4>
                    <div className="team-members-list">
                        {memberUsers.map(user => (
                            <div key={user.id} className="team-member-item">
                                <FaUser className="team-member-icon" />
                                <span className="team-member-name">{user.name || user.email}</span>
                                <span className={`team-member-role team-role-${user.role.toLowerCase()}`}>
                                    {user.role}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const ResponsableSelector = ({ users, selectedResponsableId, onResponsableChange, placeholder = "Sélectionner un responsable" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedUser = users.find(user => user.id === selectedResponsableId);

    const handleSelect = (user) => {
        onResponsableChange(user.id, user.name);
        setIsOpen(false);
        setSearchTerm('');
    };

    const clearSelection = () => {
        onResponsableChange('', '');
    };

    return (
        <div className="team-responsable-selector">
            <label>Responsable <span className="team-required">*</span></label>
            <div className="team-dropdown-container">
                <div
                    className="team-dropdown-header"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {selectedUser ? (
                        <div className="team-selected-user">
                            <FaUser className="team-user-icon" />
                            <div className="team-user-details">
                                <span className="team-user-name">{selectedUser.name}</span>
                                <span className="team-user-email">{selectedUser.email}</span>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    clearSelection();
                                }}
                                className="team-clear-btn"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    ) : (
                        <span className="team-placeholder">{placeholder}</span>
                    )}
                    <span className="team-dropdown-arrow">
                        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                    </span>
                </div>

                {isOpen && (
                    <div className="team-dropdown-list">
                        <div className="team-search-box">
                            <FaSearch className="team-search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher un utilisateur..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="team-search-input"
                            />
                        </div>

                        <div className="team-users-list">
                            {filteredUsers.length === 0 ? (
                                <div className="team-no-users">Aucun utilisateur trouvé</div>
                            ) : (
                                filteredUsers.map(user => (
                                    <div
                                        key={user.id}
                                        className={`team-user-option ${selectedResponsableId === user.id ? 'team-selected' : ''}`}
                                        onClick={() => handleSelect(user)}
                                    >
                                        <FaUser className="team-user-icon" />
                                        <div className="team-user-details">
                                            <span className="team-user-name">{user.name || 'Non renseigné'}</span>
                                            <span className="team-user-email">{user.email}</span>
                                            <span className={`team-user-role team-role-${user.role.toLowerCase()}`}>
                                                {user.role}
                                            </span>
                                        </div>
                                        {selectedResponsableId === user.id && (
                                            <FaCheck className="team-check-icon" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const MembersSelector = ({
    users,
    selectedMembers = [],
    onMembersChange,
    placeholder = "Sélectionner des membres"
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedUsers = users.filter(user => selectedMembers.includes(user.id));

    const handleToggleMember = (userId, isSelected) => {
        onMembersChange(userId, !isSelected);
    };

    const removeMember = (userId, e) => {
        e.stopPropagation();
        onMembersChange(userId, false);
    };

    const clearAll = () => {
        selectedMembers.forEach(userId => onMembersChange(userId, false));
    };

    return (
        <div className="team-members-selector">
            <label>Membres de l'équipe</label>
            <div className="team-dropdown-container">
                <div
                    className="team-dropdown-header team-multi-select"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="team-selected-members">
                        {selectedUsers.length === 0 ? (
                            <span className="team-placeholder">{placeholder}</span>
                        ) : (
                            <div className="team-members-list">
                                {selectedUsers.slice(0, 3).map(user => (
                                    <span key={user.id} className="team-member-tag">
                                        {user.name || user.email}
                                        <button
                                            type="button"
                                            onClick={(e) => removeMember(user.id, e)}
                                            className="team-remove-btn"
                                        >
                                            <FaTimes />
                                        </button>
                                    </span>
                                ))}
                                {selectedUsers.length > 3 && (
                                    <span className="team-more-members">
                                        +{selectedUsers.length - 3} autres
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="team-dropdown-controls">
                        {selectedUsers.length > 0 && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    clearAll();
                                }}
                                className="team-clear-all-btn"
                                title="Tout effacer"
                            >
                                <FaTimes />
                            </button>
                        )}
                        <span className="team-dropdown-arrow">
                            {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                        </span>
                    </div>
                </div>

                {isOpen && (
                    <div className="team-dropdown-list team-multi-select">
                        <div className="team-search-box">
                            <FaSearch className="team-search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher des utilisateurs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="team-search-input"
                            />
                        </div>

                        <div className="team-selected-count">
                            {selectedUsers.length} utilisateur(s) sélectionné(s)
                        </div>

                        <div className="team-users-list">
                            {filteredUsers.length === 0 ? (
                                <div className="team-no-users">Aucun utilisateur trouvé</div>
                            ) : (
                                filteredUsers.map(user => {
                                    const isSelected = selectedMembers.includes(user.id);
                                    return (
                                        <div
                                            key={user.id}
                                            className={`team-user-option ${isSelected ? 'team-selected' : ''}`}
                                            onClick={() => handleToggleMember(user.id, isSelected)}
                                        >
                                            <div className="team-user-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => { }}
                                                    className="team-hidden-checkbox"
                                                />
                                                <div className={`team-custom-checkbox ${isSelected ? 'team-checked' : ''}`}>
                                                    {isSelected && <FaCheck className="team-check-icon" />}
                                                </div>
                                            </div>
                                            <FaUser className="team-user-icon" />
                                            <div className="team-user-details">
                                                <span className="team-user-name">{user.name || 'Non renseigné'}</span>
                                                <span className="team-user-email">{user.email}</span>
                                                <span className={`team-user-role team-role-${user.role.toLowerCase()}`}>
                                                    {user.role}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

const TeamsPage = ({ checkPermission }) => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [sections, setSections] = useState({
        users: true,
        addTeam: true
    });

    const backgroundLoaded = useBackgroundLoader(bgTeam);
    const { notifications, showSuccess, showError, clearNotifications } = useNotifications();

    const usersManager = useUsersManagement(currentUser, showSuccess, showError);
    const teamsManager = useTeamsManagement(currentUser, showSuccess, showError, usersManager.users.list);

    useEffect(() => {
        const loadData = async () => {
            if (currentUser?.companyId) {
                try {
                    if (checkPermission('manageUsers')) {
                        await usersManager.loadUsers();
                    }
                    await teamsManager.loadTeams();
                } catch (error) {
                    showError("Erreur", "Impossible de charger les données");
                } finally {
                    setLoading(false);
                }
            }
        };

        loadData();
    }, [currentUser]);

    function generateRandomPassword() {
        return Math.random().toString(36).slice(-8) + 'A1!';
    }

    const getRoleIcon = (role) => {
        const icons = {
            [ROLES.SUPADMIN]: <FaUserTie className="team-role-icon team-supadmin" />,
            [ROLES.ADMIN]: <FaUserTie className="team-role-icon team-admin" />,
            [ROLES.RH_DAF]: <FaUserTie className="team-role-icon team-rhdaf" />,
            [ROLES.COMPTABLE]: <FaUserCog className="team-role-icon team-comptable" />,
            [ROLES.CHARGE_COMPTE]: <FaUserEdit className="team-role-icon team-charge-compte" />,
            [ROLES.LECTEUR]: <FaUser className="team-role-icon team-lecteur" />
        };
        return icons[role] || <FaUser className="team-role-icon team-default" />;
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate();
        return date.toLocaleDateString('fr-FR');
    };

    const toggleSection = (section) => {
        setSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className={`team-container ${backgroundLoaded ? 'team-loaded' : ''}`}>
            <Notifications
                success={notifications.success}
                error={notifications.error}
                onClose={clearNotifications}
            />

            {checkPermission('manageUsers') && (
                <Section
                    title="Gestion des Utilisateurs"
                    icon={<FaUsers />}
                    isOpen={sections.users}
                    onToggle={() => toggleSection('users')}
                >
                    <UserForm
                        isCreating={usersManager.users.isCreating}
                        form={usersManager.users.form}
                        password={usersManager.users.password}
                        isSubmitting={usersManager.isSubmitting}
                        onFormChange={usersManager.handleUserFormChange}
                        onPasswordGenerate={() => usersManager.setUsers(prev => ({
                            ...prev,
                            password: generateRandomPassword()
                        }))}
                        onCreate={usersManager.handleCreateUser}
                        onUpdate={usersManager.handleUserUpdate}
                        onCancelEdit={usersManager.cancelUserEdit}
                    />

                    <UsersList
                        users={usersManager.users.list}
                        loading={usersManager.users.loading}
                        getRoleIcon={getRoleIcon}
                        formatDate={formatDate}
                        onEdit={usersManager.startUserEdit}
                        onDelete={usersManager.handleUserDelete}
                        onResetPassword={usersManager.handleResetPassword}
                        onToggleStatus={usersManager.toggleUserStatus}
                    />

                    <ResetPasswordModal
                        show={usersManager.users.showResetModal}
                        user={usersManager.users.userToReset}
                        onConfirm={usersManager.confirmResetPassword}
                        onClose={() => usersManager.setUsers(prev => ({ ...prev, showResetModal: false }))}
                    />
                </Section>
            )}

            <Section
                title={teamsManager.teams.editing ? "Modifier l'équipe" : "Gestion des équipes"}
                icon={teamsManager.teams.editing ? <FaEdit /> : <FaPlus />}
                isOpen={sections.addTeam}
                onToggle={() => toggleSection('addTeam')}
            >
                <TeamForm
                    editing={teamsManager.teams.editing}
                    form={teamsManager.teams.form}
                    eligibleResponsables={teamsManager.getEligibleResponsables()}
                    eligibleMembers={teamsManager.getEligibleMembers()}
                    onFormChange={teamsManager.handleTeamFormChange}
                    onEditChange={teamsManager.handleTeamEditChange}
                    onMemberToggle={teamsManager.handleMemberToggle}
                    onSubmit={teamsManager.handleTeamSubmit}
                    onUpdate={teamsManager.handleTeamUpdate}
                    onCancelEdit={teamsManager.cancelTeamEdit}
                />

                <TeamList
                    teams={teamsManager.teams.filtered}
                    searchTerm={teamsManager.teams.searchTerm}
                    onSearch={teamsManager.handleTeamSearch}
                    onEdit={teamsManager.startTeamEdit}
                    onDelete={teamsManager.handleTeamDelete}
                    onAddTeam={() => toggleSection('addTeam')}
                    findUserById={teamsManager.findUserById}
                    usersList={usersManager.users.list}
                />
            </Section>
        </div>
    );
};

export default TeamsPage;