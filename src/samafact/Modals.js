import React from 'react';
import PropTypes from 'prop-types';

export const CompanyModal = ({
    visible,
    onClose,
    onSubmit,
    company,
    users,
    onChange,
    onUserChange,
    onAddUser,
    mode
}) => {
    if (!visible) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{mode === 'edit' ? 'Modifier' : 'Ajouter'} une entreprise</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <form onSubmit={onSubmit}>
                        <div className="form-group">
                            <label>Nom de l'entreprise</label>
                            <input
                                type="text"
                                className="form-control"
                                value={company.name}
                                onChange={(e) => onChange('name', e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                className="form-control"
                                value={company.email}
                                onChange={(e) => onChange('email', e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Secteur d'activité</label>
                            <input
                                type="text"
                                className="form-control"
                                value={company.industry}
                                onChange={(e) => onChange('industry', e.target.value)}
                            />
                        </div>

                        <h3>Utilisateurs</h3>
                        {users.map((user, index) => (
                            <div key={index} className="user-form-group">
                                <div className="form-group">
                                    <label>Nom complet</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={user.name}
                                        onChange={(e) => onUserChange(index, 'name', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={user.email}
                                        onChange={(e) => onUserChange(index, 'email', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Mot de passe</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={user.password}
                                        onChange={(e) => onUserChange(index, 'password', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Rôle</label>
                                    <select
                                        className="form-control"
                                        value={user.role}
                                        onChange={(e) => onUserChange(index, 'role', e.target.value)}
                                    >
                                        <option value="admin">Administrateur</option>
                                        <option value="user">Utilisateur</option>
                                    </select>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onAddUser}
                        >
                            Ajouter un utilisateur
                        </button>

                        <div className="form-actions">
                            <button type="button" className="btn btn-cancel" onClick={onClose}>
                                Annuler
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {mode === 'edit' ? 'Mettre à jour' : 'Créer'}
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
    company: PropTypes.object.isRequired,
    users: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired,
    onUserChange: PropTypes.func.isRequired,
    onAddUser: PropTypes.func.isRequired,
    mode: PropTypes.oneOf(['add', 'edit']).isRequired,
};

export const UserModal = ({
    visible,
    onClose,
    onSubmit,
    user,
    companies,
    onChange,
    mode
}) => {
    if (!visible) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{mode === 'edit' ? 'Modifier' : 'Ajouter'} un utilisateur</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <form onSubmit={onSubmit}>
                        <div className="form-group">
                            <label>Nom complet</label>
                            <input
                                type="text"
                                className="form-control"
                                value={user.name}
                                onChange={(e) => onChange('name', e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                className="form-control"
                                value={user.email}
                                onChange={(e) => onChange('email', e.target.value)}
                                required
                            />
                        </div>

                        {mode === 'add' && (
                            <div className="form-group">
                                <label>Mot de passe</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={user.password}
                                    onChange={(e) => onChange('password', e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Rôle</label>
                            <select
                                className="form-control"
                                value={user.role}
                                onChange={(e) => onChange('role', e.target.value)}
                            >
                                <option value="admin">Administrateur</option>
                                <option value="user">Utilisateur</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Entreprise</label>
                            <select
                                className="form-control"
                                value={user.companyId}
                                onChange={(e) => onChange('companyId', e.target.value)}
                            >
                                {companies.map(company => (
                                    <option key={company.id} value={company.id}>
                                        {company.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn btn-cancel" onClick={onClose}>
                                Annuler
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {mode === 'edit' ? 'Mettre à jour' : 'Créer'}
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
    user: PropTypes.object.isRequired,
    companies: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired,
    mode: PropTypes.oneOf(['add', 'edit']).isRequired,
};

export const PasswordModal = ({
    visible,
    onClose,
    onSubmit,
    password,
    confirmPassword,
    onChange,
    item
}) => {
    if (!visible) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Modifier le mot de passe</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <form onSubmit={onSubmit}>
                        <p>Modification pour: <strong>{item?.name || item?.email}</strong></p>

                        <div className="form-group">
                            <label>Nouveau mot de passe</label>
                            <input
                                type="password"
                                className="form-control"
                                value={password}
                                onChange={(e) => onChange('newPassword', e.target.value)}
                                required
                                minLength="6"
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirmer le mot de passe</label>
                            <input
                                type="password"
                                className="form-control"
                                value={confirmPassword}
                                onChange={(e) => onChange('confirmPassword', e.target.value)}
                                required
                                minLength="6"
                            />
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn btn-cancel" onClick={onClose}>
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={password !== confirmPassword || password.length < 6}
                            >
                                Enregistrer
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
    item: PropTypes.object
};