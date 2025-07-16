import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaEye, FaEyeSlash, FaEdit, FaTrash, FaLock, FaToggleOn, FaToggleOff } from 'react-icons/fa';

export const CompanyTable = ({ companies, users, onDelete, onToggleStatus, onEdit, onPasswordReset, getRoleLabel }) => {
    const [expandedCompany, setExpandedCompany] = useState(null);

    const toggleCompanyExpansion = (companyId) => {
        setExpandedCompany(expandedCompany === companyId ? null : companyId);
    };

    const getCompanyUsers = (companyId) => {
        return (users || []).filter(user => user.companyId === companyId);
    };



    return (
        <div className="data-table">
            <div className="table-header">
                <div>Nom</div>
                <div>Email</div>
                <div>Date création</div>
                <div>Statut</div>
                <div>Utilisateurs</div>
                <div>Actions</div>
            </div>

            <div className="table-body">
                {companies.map(company => {
                    const companyUsers = getCompanyUsers(company.id);
                    const isExpanded = expandedCompany === company.id;

                    return (
                        <React.Fragment key={company.id}>
                            <div className="table-row">
                                <div className="table-cell">
                                    <strong>{company.name}</strong>
                                </div>

                                <div className="table-cell">
                                    {company.email || 'Non spécifié'}
                                </div>

                                <div className="table-cell">
                                    {company.createdAt.toLocaleDateString()}
                                </div>

                                <div className="table-cell">
                                    <span className={`status-badge ${company.status}`}>
                                        {company.status === 'active' ? 'Actif' : 'Suspendu'}
                                    </span>
                                </div>

                                <div className="table-cell">
                                    <button
                                        className="btn btn-view"
                                        onClick={() => toggleCompanyExpansion(company.id)}
                                        aria-expanded={isExpanded}
                                    >
                                        {companyUsers.length}
                                        {isExpanded ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>

                                <div className="table-cell actions">
                                    <button
                                        className="btn btn-toggle"
                                        onClick={() => onToggleStatus(company.id, company.status)}
                                        aria-label={company.status === 'active' ? 'Suspendre' : 'Activer'}
                                    >
                                        {company.status === 'active' ? <FaToggleOff /> : <FaToggleOn />}
                                    </button>

                                    <button
                                        className="btn btn-edit"
                                        onClick={() => onEdit('Company', company)}
                                        aria-label="Modifier"
                                    >
                                        <FaEdit />
                                    </button>

                                    <button
                                        className="btn btn-delete"
                                        onClick={() => onDelete('companies', company.id)}
                                        aria-label="Supprimer"
                                    >
                                        <FaTrash />
                                    </button>

                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => onPasswordReset('Company', company)}
                                        aria-label="Réinitialiser mot de passe"
                                    >
                                        <FaLock />
                                    </button>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="company-users-expanded">
                                    <h4>Utilisateurs de {company.name}</h4>
                                    {companyUsers.length > 0 ? (
                                        <div className="users-list">
                                            {companyUsers.map(user => (
                                                <div key={user.id} className="user-item">
                                                    <div>
                                                        <strong>{user.name || 'Non spécifié'}</strong>
                                                        <small>{user.email}</small>
                                                    </div>
                                                    <span className={`user-role ${user.role}`}>
                                                        {getRoleLabel(user.role)}
                                                    </span>

                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="no-users">Aucun utilisateur trouvé</p>
                                    )}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

CompanyTable.propTypes = {
    companies: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string,
            email: PropTypes.string,
            industry: PropTypes.string,
            status: PropTypes.string,
            createdAt: PropTypes.instanceOf(Date),
        })
    ).isRequired,
    users: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string,
            email: PropTypes.string,
            role: PropTypes.string,
            companyId: PropTypes.string,
        })
    ).isRequired,
    onDelete: PropTypes.func.isRequired,
    onToggleStatus: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onPasswordReset: PropTypes.func.isRequired,
};

export const UserTable = ({ users, companies, onDelete, onEdit, onPasswordReset, getRoleLabel }) => {
    const getCompanyName = (companyId) => {
        const company = companies.find(c => c.id === companyId);
        return company ? company.name : 'Inconnue';
    };

    return (
        <div className="data-table">
            <div className="table-header">
                <div>Nom</div>
                <div>Email</div>
                <div>Entreprise</div>
                <div>Rôle</div>
                <div>Dernière connexion</div>
                <div>Actions</div>
            </div>

            <div className="table-body">
                {users.map(user => (
                    <div className="table-row" key={user.id}>
                        <div className="table-cell">
                            <strong>{user.name || 'Non spécifié'}</strong>
                        </div>

                        <div className="table-cell">
                            {user.email}
                        </div>

                        <div className="table-cell">
                            {getCompanyName(user.companyId)}
                        </div>

                        <div className="table-cell">
                            <span className={`user-role ${user.role}`}>
                                {getRoleLabel(user.role)}
                            </span>

                        </div>

                        <div className="table-cell">
                            {user.lastLogin?.toLocaleDateString() || 'Jamais'}
                        </div>

                        <div className="table-cell actions">
                            <button
                                className="btn btn-edit"
                                onClick={() => onEdit('User', user)}
                                aria-label="Modifier"
                            >
                                <FaEdit />
                            </button>

                            <button
                                className="btn btn-delete"
                                onClick={() => onDelete('users', user.id)}
                                aria-label="Supprimer"
                            >
                                <FaTrash />
                            </button>

                            <button
                                className="btn btn-secondary"
                                onClick={() => onPasswordReset('User', user)}
                                aria-label="Réinitialiser mot de passe"
                            >
                                <FaLock />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

UserTable.propTypes = {
    users: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string,
            email: PropTypes.string,
            role: PropTypes.string,
            companyId: PropTypes.string,
            lastLogin: PropTypes.instanceOf(Date),
        })
    ).isRequired,
    companies: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string,
        })
    ).isRequired,
    onDelete: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onPasswordReset: PropTypes.func.isRequired,
};