import React from 'react';
import { FaBuilding, FaUsers, FaTrash, FaEye, FaEdit, FaSearch, FaPlus, FaChartLine } from 'react-icons/fa';
import './SamaFact.css';

const CompanyUserView = ({
    loading, companies, users, stats,
    searchTerm, setSearchTerm,
    activeTab, setActiveTab,
    selectedCompany, setSelectedCompany,
    showAddForm, setShowAddForm,
    newCompany, setNewCompany,
    newUsers, setNewUsers,
    handleAddCompany, addUserField,
    handleDeleteCompany, handleToggleCompanyStatus
}) => {

    const filteredCompanies = companies.filter(company =>
        (company.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredUsers = users.filter(user =>
        (user.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.companyId ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getCompanyUsers = (companyId) => {
        return users.filter(user => user.companyId === companyId);
    };

    if (loading) return <div>Chargement...</div>;

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
                            {filteredCompanies.map(company => (
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
                            {filteredUsers.map(user => (
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
                )}{showAddForm && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>Nouvelle entreprise</h2>
                            <form onSubmit={handleAddCompany}>

                                {/* Infos entreprise */}
                                <input
                                    type="text"
                                    placeholder="Nom de l'entreprise"
                                    value={newCompany.name}
                                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                                    required
                                />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={newCompany.email}
                                    onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Secteur d’activité"
                                    value={newCompany.industry}
                                    onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                                />

                                {/* Liste des utilisateurs */}
                                <h3>Utilisateurs à créer</h3>
                                {newUsers.map((user, index) => (
                                    <div key={index} className="user-input">
                                        <input
                                            type="text"
                                            placeholder="Nom"
                                            value={user.name}
                                            onChange={(e) => {
                                                const updated = [...newUsers];
                                                updated[index].name = e.target.value;
                                                setNewUsers(updated);
                                            }}
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Nom utilisateur"
                                            value={user.username}
                                            onChange={(e) => {
                                                const updated = [...newUsers];
                                                updated[index].username = e.target.value;
                                                setNewUsers(updated);
                                            }}
                                            required
                                        />
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            value={user.email}
                                            onChange={(e) => {
                                                const updated = [...newUsers];
                                                updated[index].email = e.target.value;
                                                setNewUsers(updated);
                                            }}
                                            required
                                        />
                                        <input
                                            type="password"
                                            placeholder="Mot de passe"
                                            value={user.password}
                                            onChange={(e) => {
                                                const updated = [...newUsers];
                                                updated[index].password = e.target.value;
                                                setNewUsers(updated);
                                            }}
                                            required
                                        />
                                        <select
                                            value={user.role}
                                            onChange={(e) => {
                                                const updated = [...newUsers];
                                                updated[index].role = e.target.value;
                                                setNewUsers(updated);
                                            }}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="user">Utilisateur</option>
                                        </select>
                                    </div>
                                ))}
                                <button type="button" onClick={addUserField}>Ajouter un utilisateur</button>

                                <div className="form-actions">
                                    <button type="submit">Enregistrer</button>
                                    <button type="button" onClick={() => setShowAddForm(false)}>Annuler</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>

            <div className="superadmin-actions">
                <button className="primary-btn" onClick={() => setShowAddForm(true)}>
                    <FaPlus /> Ajouter une entreprise
                </button>

            </div>
        </div>

    );
};

export default CompanyUserView;
