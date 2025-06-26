import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';
import { FaBuilding, FaUsers, FaTrash, FaEdit, FaSearch, FaEye, FaPlus, FaChartLine } from 'react-icons/fa';
import './SamaFact.css';

const SamaFact = () => {
    const { currentUser } = useAuth();
    const [companies, setCompanies] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('companies');
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [stats, setStats] = useState({
        totalCompanies: 0,
        activeCompanies: 0,
        totalUsers: 0,
        adminsCount: 0
    });

    useEffect(() => {
        if (!currentUser || !currentUser.isSuperAdmin) return;

        const loadData = async () => {
            try {
                setLoading(true);

                // Charger les entreprises
                const companiesQuery = query(collection(db, 'companies'));
                const companiesSnapshot = await getDocs(companiesQuery);
                const companiesData = companiesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date()
                }));
                setCompanies(companiesData);

                // Charger les utilisateurs
                const usersQuery = query(collection(db, 'users'));
                const usersSnapshot = await getDocs(usersQuery);
                const usersData = usersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setUsers(usersData);

                // Calculer les statistiques
                setStats({
                    totalCompanies: companiesData.length,
                    activeCompanies: companiesData.filter(c => c.status === 'active').length,
                    totalUsers: usersData.length,
                    adminsCount: usersData.filter(u => u.role === 'admin').length
                });

            } catch (error) {
                console.error("Error loading superadmin data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentUser]);

    const handleDeleteCompany = async (companyId) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette entreprise ? Toutes les données associées seront perdues.")) {
            return;
        }

        try {
            // Note: En production, vous devriez aussi supprimer toutes les sous-collections
            await deleteDoc(doc(db, 'companies', companyId));
            setCompanies(companies.filter(c => c.id !== companyId));
            setStats(prev => ({ ...prev, totalCompanies: prev.totalCompanies - 1 }));
        } catch (error) {
            console.error("Error deleting company:", error);
        }
    };

    const handleToggleCompanyStatus = async (companyId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

        try {
            await updateDoc(doc(db, 'companies', companyId), {
                status: newStatus
            });

            setCompanies(companies.map(c =>
                c.id === companyId ? { ...c, status: newStatus } : c
            ));

            setStats(prev => ({
                ...prev,
                activeCompanies: newStatus === 'active'
                    ? prev.activeCompanies + 1
                    : prev.activeCompanies - 1
            }));
        } catch (error) {
            console.error("Error updating company status:", error);
        }
    };

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