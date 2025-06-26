import React from 'react';
import { FaBuilding, FaUsers, FaTrash, FaEdit, FaSearch, FaEye, FaPlus, FaChartLine } from 'react-icons/fa';
import './SamaFact.css';

const SamaFact = ({
    loading,
    currentUser,
    companies,
    users,
    stats,
    searchTerm,
    activeTab,
    selectedCompany,
    setSearchTerm,
    setActiveTab,
    setSelectedCompany,
    handleDeleteCompany,
    handleToggleCompanyStatus,
    getCompanyUsers
}) => {
    if (loading) {
        return <div className="superadmin-loading">Chargement des données admin...</div>;
    }

    if (!currentUser?.isSuperAdmin) {
        return (
            <div className="superadmin-unauthorized">
                <h2>Accès non autorisé</h2>
                <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
            </div>
        );
    }

    return (
        <div className="superadmin-container">
            <header className="superadmin-header">
                <h1><FaBuilding /> Tableau de bord SuperAdmin</h1>
                <div className="superadmin-search">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder={`Rechercher ${activeTab === 'companies' ? 'entreprises' : 'utilisateurs'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="superadmin-stats">
                <div className="stat-card">
                    <div className="stat-icon"><FaBuilding /></div>
                    <div className="stat-info">
                        <h3>Entreprises</h3>
                        <p>{stats.totalCompanies} total / {stats.activeCompanies} actives</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><FaUsers /></div>
                    <div className="stat-info">
                        <h3>Utilisateurs</h3>
                        <p>{stats.totalUsers} total / {stats.adminsCount} admins</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><FaChartLine /></div>
                    <div className="stat-info">
                        <h3>Activité</h3>
                        <p>7 nouvelles entreprises ce mois</p>
                    </div>
                </div>
            </div>

            <div className="superadmin-tabs">
                <button
                    className={activeTab === 'companies' ? 'active' : ''}
                    onClick={() => setActiveTab('companies')}
                >
                    <FaBuilding /> Entreprises
                </button>
                <button
                    className={activeTab === 'users' ? 'active' : ''}
                    onClick={() => setActiveTab('users')}
                >
                    <FaUsers /> Utilisateurs
                </button>
            </div>

            <div className="superadmin-content">
                {activeTab === 'companies' ? (
                    <div className="companies-table">
                        <div className="table-header">
                            <div className="row">
                                <div className="col">Nom</div>
                                <div className="col">Email</div>
                                <div className="col">Date création</div>
                                <div className="col">Statut</div>
                                <div className="col">Utilisateurs</div>
                                <div className="col">Actions</div>
                            </div>
                        </div>
                        <div className="table-body">
                            {companies.map(company => (
                                <div className="row" key={company.id}>
                                    <div className="col">
                                        <strong>{company.name}</strong>
                                        <small>{company.industry || 'Non spécifié'}</small>
                                    </div>
                                    <div className="col">{company.email || 'Non spécifié'}</div>
                                    <div className="col">
                                        {company.createdAt.toLocaleDateString()}
                                    </div>
                                    <div className="col">
                                        <span className={`status-badge ${company.status}`}>
                                            {company.status === 'active' ? 'Actif' : 'Suspendu'}
                                        </span>
                                    </div>
                                    <div className="col">
                                        <button
                                            className="view-users-btn"
                                            onClick={() => setSelectedCompany(selectedCompany?.id === company.id ? null : company)}
                                        >
                                            {getCompanyUsers(company.id).length} <FaEye />
                                        </button>
                                    </div>
                                    <div className="col actions">
                                        <button
                                            className="toggle-status-btn"
                                            onClick={() => handleToggleCompanyStatus(company.id, company.status)}
                                        >
                                            {company.status === 'active' ? 'Suspendre' : 'Activer'}
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDeleteCompany(company.id)}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>

                                    {selectedCompany?.id === company.id && (
                                        <div className="company-users-detail">
                                            <h4>Utilisateurs de {company.name}</h4>
                                            {getCompanyUsers(company.id).length > 0 ? (
                                                <ul>
                                                    {getCompanyUsers(company.id).map(user => (
                                                        <li key={user.id}>
                                                            <span>{user.name} ({user.email})</span>
                                                            <span className={`user-role ${user.role}`}>
                                                                {user.role}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p>Aucun utilisateur trouvé</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="users-table">
                        <div className="table-header">
                            <div className="row">
                                <div className="col">Nom</div>
                                <div className="col">Email</div>
                                <div className="col">Entreprise</div>
                                <div className="col">Rôle</div>
                                <div className="col">Actions</div>
                            </div>
                        </div>
                        <div className="table-body">
                            {users.map(user => (
                                <div className="row" key={user.id}>
                                    <div className="col">
                                        <strong>{user.name || 'Non spécifié'}</strong>
                                    </div>
                                    <div className="col">{user.email}</div>
                                    <div className="col">
                                        {companies.find(c => c.id === user.companyId)?.name || 'Inconnue'}
                                    </div>
                                    <div className="col">
                                        <span className={`user-role ${user.role}`}>
                                            {user.role}
                                        </span>
                                    </div>
                                    <div className="col actions">
                                        <button className="edit-btn">
                                            <FaEdit />
                                        </button>
                                        <button className="delete-btn">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="superadmin-actions">
                <button className="primary-btn">
                    <FaPlus /> Ajouter une entreprise
                </button>
            </div>
        </div>
    );
};

export default SamaFact;