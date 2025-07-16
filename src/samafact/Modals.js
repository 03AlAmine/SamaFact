import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ROLES, getPermissionsForRole } from '../auth/permissions';
import { FaEye, FaEyeSlash } from "react-icons/fa";

export const CompanyModal = ({
    visible,
    onClose,
    onSubmit,
    company,
    onChange,
    mode,
    loading = false
}) => {
    if (!visible) return null;

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{mode === 'edit' ? 'Modifier' : 'Ajouter'} une entreprise</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Fermer">&times;</button>
                </div>
                <div className="modal-body">
                    <form onSubmit={onSubmit}>
                        <div className="form-group">
                            <label htmlFor="company-name">Nom de l'entreprise</label>
                            <input
                                id="company-name"
                                type="text"
                                className="form-control"
                                value={company.name}
                                onChange={(e) => onChange('name', e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="company-email">Email</label>
                            <input
                                id="company-email"
                                type="email"
                                className="form-control"
                                value={company.email}
                                onChange={(e) => onChange('email', e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="company-industry">Secteur d'activité</label>
                            <input
                                id="company-industry"
                                type="text"
                                className="form-control"
                                value={company.industry}
                                onChange={(e) => onChange('industry', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="company-status">Statut</label>
                            <select
                                id="company-status"
                                className="form-control"
                                value={company.status}
                                onChange={(e) => onChange('status', e.target.value)}
                            >
                                <option value="active">Actif</option>
                                <option value="suspended">Suspendu</option>
                            </select>
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn btn-cancel"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm" /> Création en cours...
                                    </>
                                ) : (
                                    mode === 'edit' ? 'Mettre à jour' : 'Créer'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

CompanyModal.propTypes = {
    visible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    company: PropTypes.shape({
        name: PropTypes.string,
        email: PropTypes.string,
        industry: PropTypes.string,
        status: PropTypes.string,
    }).isRequired,
    onChange: PropTypes.func.isRequired,
    mode: PropTypes.oneOf(['add', 'edit']).isRequired,
    loading: PropTypes.bool,
};

export const UserModal = ({
    visible,
    onClose,
    onSubmit,
    user,
    companies = [],
    onChange,
    mode,
    isSuperAdmin,
    currentUser,
    loading = false
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const showCompanyField = !isSuperAdmin || user.role !== ROLES.SUPERADMIN;
    const availableCompanies = isSuperAdmin
        ? companies
        : companies.filter(c => c.id === currentUser?.companyId);

    // Initialise les permissions au montage
    useEffect(() => {
        if (mode === 'add' && user.role) {
            const perms = getPermissionsForRole(user.role);
            onChange('permissions', perms);
        }
        // ✅ Ne pas mettre `onChange` ici sauf s’il est `useCallback`
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, user.role]);


    if (!visible) return null;

    return (
        <div
            className="modal-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{mode === "edit" ? "Modifier" : "Ajouter"} un utilisateur</h2>
                    <button
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Fermer"
                    >
                        &times;
                    </button>
                </div>
                <div className="modal-body">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            onSubmit(user); // Passer l'objet user complet
                        }}
                    >
                        <div className="form-group">
                            <label htmlFor="user-name">Nom complet</label>
                            <input
                                id="user-name"
                                type="text"
                                className="form-control"
                                value={user.name}
                                onChange={(e) => onChange("name", e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="user-pseudo">Pseudo</label>
                            <input
                                id="user-pseudo"
                                type="text"
                                className="form-control"
                                value={user.username}
                                onChange={(e) => onChange("username", e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="user-email">Email</label>
                            <input
                                id="user-email"
                                type="email"
                                className="form-control"
                                value={user.email}
                                onChange={(e) => onChange("email", e.target.value)}
                                required
                            />
                        </div>

                        {mode === "add" && (
                            <div className="form-group">
                                <label htmlFor="user-password">Mot de passe</label>
                                <div className="password-input-container">
                                    <input
                                        id="user-password"
                                        type={showPassword ? "text" : "password"}
                                        className="form-control"
                                        value={user.password || ""}
                                        onChange={(e) => onChange("password", e.target.value)}
                                        required
                                        minLength="6"
                                        style={{ paddingRight: "40px" }} // Pour ne pas que l'œil cache le texte
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={
                                            showPassword
                                                ? "Masquer le mot de passe"
                                                : "Afficher le mot de passe"
                                        }
                                        style={{
                                            position: "absolute",
                                            right: "10px",
                                            background: "transparent",
                                            border: "none",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                <PasswordStrengthIndicator password={user.password} />
                            </div>
                        )}

                        {showCompanyField && availableCompanies.length > 0 && (
                            <div className="form-group">
                                <label htmlFor="user-company">Entreprise</label>
                                <select
                                    id="user-company"
                                    className="form-control"
                                    value={user.companyId}
                                    onChange={(e) => onChange("companyId", e.target.value)}
                                    required
                                    disabled={availableCompanies.length === 1}
                                >
                                    {availableCompanies.length > 1 && (
                                        <option value="">Sélectionner une entreprise</option>
                                    )}
                                    {availableCompanies.map((company) => (
                                        <option key={company.id} value={company.id}>
                                            {company.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {showCompanyField && availableCompanies.length === 0 && (
                            <div className="alert alert-warning">
                                Aucune entreprise disponible pour l'affectation
                            </div>
                        )}
                        <div className="form-group">
                            <label htmlFor="user-role">Rôle</label>
                            <select
                                id="user-role"
                                className="form-control"
                                value={user.role}
                                onChange={(e) => onChange("role", e.target.value)}
                            >
                                <option value="admin">Administrateur</option>
                                <option value="comptable">Comptable</option>
                                <option value="charge_compte">Chargé de compte</option>
                                <option value="lecteur">Lecteur</option>
                                {isSuperAdmin && (
                                    <option value="superadmin">Super Admin</option>
                                )}
                            </select>
                        </div>
                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn btn-cancel"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading || (showCompanyField && !user.companyId)}
                            >
                                {loading ? (
                                    <span className="spinner-border spinner-border-sm" />
                                ) : mode === "edit" ? (
                                    "Mettre à jour"
                                ) : (
                                    "Création..."
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

UserModal.propTypes = {
    visible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    user: PropTypes.shape({
        name: PropTypes.string,
        email: PropTypes.string,
        password: PropTypes.string,
        role: PropTypes.string,
        companyId: PropTypes.string,
        permissions: PropTypes.object,
    }).isRequired,
    companies: PropTypes.array,
    onChange: PropTypes.func.isRequired,
    mode: PropTypes.oneOf(['add', 'edit']).isRequired,
    isSuperAdmin: PropTypes.bool,
    currentUser: PropTypes.object,
    loading: PropTypes.bool,
};

export const PasswordModal = ({
    visible,
    onClose,
    onSubmit,
    password,
    confirmPassword,
    onChange,
    item,
    loading = false
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const passwordsMatch = password === confirmPassword;
    const isValid = password.length >= 6 && passwordsMatch;

    if (!visible) return null;

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Modifier le mot de passe</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Fermer">&times;</button>
                </div>
                <div className="modal-body">
                    <form onSubmit={onSubmit}>
                        <p>Modification pour: <strong>{item?.name || item?.email}</strong></p>

                        <div className="form-group">
                            <label htmlFor="new-password">Nouveau mot de passe</label>
                            <div className="password-input-container">
                                <input
                                    id="new-password"
                                    type={showPassword ? "text" : "password"}
                                    className="form-control"
                                    value={password}
                                    onChange={(e) => onChange('newPassword', e.target.value)}
                                    required
                                    minLength="6"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                    style={{
                                        position: "absolute",
                                        right: "10px",
                                        top: "55%",
                                        transform: "translateY(-50%)",
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer"
                                    }}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>

                            </div>
                            <PasswordStrengthIndicator password={password} />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirm-password">Confirmer le mot de passe</label>
                            <input
                                id="confirm-password"
                                type={showPassword ? "text" : "password"}
                                className="form-control"
                                value={confirmPassword}
                                onChange={(e) => onChange('confirmPassword', e.target.value)}
                                required
                                minLength="6"
                            />
                            {!passwordsMatch && confirmPassword && (
                                <small className="text-danger">Les mots de passe ne correspondent pas</small>
                            )}
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn btn-cancel"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={!isValid || loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm" /> Enregistrement...
                                    </>
                                ) : (
                                    'Enregistrer'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

PasswordModal.propTypes = {
    visible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    password: PropTypes.string.isRequired,
    confirmPassword: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    item: PropTypes.object,
    loading: PropTypes.bool,
};

// Composant d'indicateur de force du mot de passe
const PasswordStrengthIndicator = ({ password }) => {
    if (!password) return null;

    const strength = {
        width: `${Math.min(100, password.length * 10)}%`,
        background: password.length > 10 ? 'var(--success)' :
            password.length > 6 ? 'var(--warning)' : 'var(--danger)'
    };

    return (
        <div className="password-strength">
            <div className="strength-bar" style={strength} />
            <small>
                Force: {password.length > 10 ? 'Forte' : password.length > 6 ? 'Moyenne' : 'Faible'}
            </small>
        </div>
    );
};

PasswordStrengthIndicator.propTypes = {
    password: PropTypes.string
};