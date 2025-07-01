import React, { useEffect, useState } from 'react';
import {
    collection, query, getDocs, deleteDoc, doc, updateDoc, addDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';
import { BarChart, PieChart } from './Charts';
import { PasswordModal, CompanyModal, UserModal } from './Modals';
import { FaBuilding, FaUsers, FaBell, FaHome } from 'react-icons/fa'; // Import FaUsers and FaBell icons
import { CompanyTable, UserTable } from './Tables'; // or correct relative pathconst { CompanyTable, UserTable } = Tables;
import './SamaFact.css'; // Assurez-vous d'avoir le bon chemin pour le CSS
import { useNavigate } from 'react-router-dom';
const SamaFact = () => {
    // eslint-disable-next-line no-unused-vars
    const { currentUser, isSuperAdmin, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // États principaux
    const [data, setData] = useState({
        companies: [],
        users: [],
        loading: true,
        stats: {
            totalCompanies: 0,
            activeCompanies: 0,
            totalUsers: 0,
            adminsCount: 0,
            monthlyGrowth: 0
        },
        charts: {
            companiesByMonth: [],
            usersByRole: []
        }
    });


    // États UI
    const [ui, setUi] = useState({
        searchTerm: '',
        activeTab: 'companies',
        selectedCompany: null,
        showCompanyModal: false,  // Changé de showAddCompany
        showUserModal: false,     // Ajouté
        showPasswordModal: false,
        selectedItem: null,
        modalType: 'add',
        filters: {
            status: 'all',
            dateRange: 'all',
            role: 'all'
        },
        modalMode: 'add' // Nouvel état spécifique pour le mode
    });

    // États formulaires
    const [forms, setForms] = useState({
        newCompany: {
            name: '',
            email: '',
            industry: '',
            status: 'active',
        },
        newUsers: [
            { name: '', email: '', password: '', role: 'admin' }
        ],
        passwordForm: {
            newPassword: '',
            confirmPassword: ''
        }
    });

    // Chargement des données
    useEffect(() => {
        if (!isSuperAdmin()) return;

        const loadData = async () => {
            setData(prev => ({ ...prev, loading: true }));
            try {
                const [companiesSnapshot, usersSnapshot] = await Promise.all([
                    getDocs(query(collection(db, 'companies'))),
                    getDocs(query(collection(db, 'users')))
                ]);

                // Traitement des utilisateurs d'abord
                const usersData = processUsers(usersSnapshot);

                // Passez les données utilisateurs pour le traitement des entreprises
                const companiesData = processCompanies(companiesSnapshot, usersData);

                // Mettre à jour l'état avec les données traitées
                setData(prev => ({
                    ...prev,
                    companies: companiesData,
                    users: usersData,
                    loading: false,
                    stats: calculateStats(companiesData, usersData),
                    charts: prepareChartData(companiesData, usersData)
                }));
            } catch (error) {
                console.error("Erreur chargement :", error);
            }
        };

        loadData();
    }, [currentUser, isSuperAdmin]); // Dépendances ajoutées

    // Fonctions de traitement des données
    const processCompanies = (companiesSnapshot, usersData) => {
        return companiesSnapshot.docs.map(doc => {
            const data = doc.data();
            const companyId = doc.id;

            // Calculer le nombre d'utilisateurs pour cette entreprise
            const usersCount = usersData.filter(user => user.companyId === companyId).length;

            return {
                id: companyId,
                name: data.name || '',
                email: data.email || '',
                industry: data.industry || '',
                status: data.status || 'active',
                createdAt: data.createdAt?.toDate() || new Date(),
                usersCount // Ajout du compteur d'utilisateurs
            };
        });
    };
    const processUsers = (snapshot) => {
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || 'Non spécifié',
                email: data.email || 'Non spécifié',
                role: data.role || 'user',
                companyId: data.companyId || '',
                createdAt: data.createdAt?.toDate() || new Date(),
                isSuperAdmin: data.isSuperAdmin || false
            };
        });
    };

    const calculateStats = (companies, users) => {
        const now = new Date();
        const lastMonth = new Date(now.setMonth(now.getMonth() - 1));

        return {
            totalCompanies: companies.length,
            activeCompanies: companies.filter(c => c.status === 'active').length,
            totalUsers: users.length,
            adminsCount: users.filter(u => u.role === 'admin').length,
            monthlyGrowth: companies.filter(c => c.createdAt > lastMonth).length
        };
    };

    const prepareChartData = (companies, users) => {
        // Préparation données pour graphiques
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentYear = new Date().getFullYear();

        const companiesByMonth = Array(12).fill(0).map((_, i) => {
            const monthCompanies = companies.filter(c =>
                c.createdAt.getFullYear() === currentYear &&
                c.createdAt.getMonth() === i
            );
            return {
                name: monthNames[i],
                count: monthCompanies.length
            };
        });

        const roleCounts = users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {});

        const usersByRole = Object.entries(roleCounts).map(([role, count]) => ({
            name: role,
            value: count
        }));

        return { companiesByMonth, usersByRole };
    };

    // Fonctions CRUD
    const handleDelete = async (type, id) => {
        if (!window.confirm(`Supprimer ce ${type} ?`)) return;

        try {
            await deleteDoc(doc(db, type, id));
            setData(prev => ({
                ...prev,
                [type]: prev[type].filter(item => item.id !== id)
            }));
            // Mise à jour des stats
            refreshStats();
        } catch (error) {
            console.error("Erreur suppression :", error);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        try {
            await updateDoc(doc(db, 'companies', id), { status: newStatus });
            setData(prev => ({
                ...prev,
                companies: prev.companies.map(c =>
                    c.id === id ? { ...c, status: newStatus } : c
                )
            }));
            refreshStats();
        } catch (error) {
            console.error("Erreur changement statut :", error);
        }
    };

    const handleAddCompany = async (e) => {
        e.preventDefault();
        setData(prev => ({ ...prev, loading: true }));

        try {
            // Ajout entreprise
            const companyRef = await addDoc(collection(db, 'companies'), {
                ...forms.newCompany,
                createdAt: new Date(),
            });

            // Ajout utilisateurs
            await Promise.all(
                forms.newUsers.map(user =>
                    addDoc(collection(db, 'users'), {
                        ...user,
                        companyId: companyRef.id,
                        createdAt: new Date(),
                    })
                )
            );

            // Réinitialisation et rechargement
            resetForms();
            refreshData();

        } catch (error) {
            console.error("Erreur ajout :", error);
        } finally {
            setData(prev => ({ ...prev, loading: false }));
        }
    };

    const handleUpdatePassword = async () => {
        // Implémentez la logique de mise à jour du mot de passe
        // (via Firebase Auth ou votre propre système)
        console.log("Mot de passe mis à jour pour:", ui.selectedItem);
        setUi(prev => ({ ...prev, showPasswordModal: false }));
    };

    // Fonctions utilitaires
    const refreshData = () => {
        // Recharge les données depuis Firestore
        // (similaire à useEffect mais appelable manuellement)
    };

    const refreshStats = () => {
        // Recalcule les statistiques
        setData(prev => ({
            ...prev,
            stats: calculateStats(prev.companies, prev.users),
            charts: prepareChartData(prev.companies, prev.users)
        }));
    };

    const resetForms = () => {
        setForms({
            newCompany: {
                name: '',
                email: '',
                industry: '',
                status: 'active',
            },
            newUsers: [
                { name: '', email: '', password: '', role: 'admin' }
            ],
            passwordForm: {
                newPassword: '',
                confirmPassword: ''
            }
        });
        setUi(prev => ({
            ...prev,
            showAddCompany: false,
            showPasswordModal: false
        }));
    };

    const addUserField = () => {
        setForms(prev => ({
            ...prev,
            newUsers: [...prev.newUsers, { name: '', email: '', password: '', role: 'user' }]
        }));
    };

    // Modifier la fonction openModal
    const openModal = (type, item = null) => {
        setUi(prev => ({
            ...prev,
            [`show${type}Modal`]: true,
            selectedItem: item,
            modalType: type.toLowerCase(),
            modalMode: item ? 'edit' : 'add' // Toujours définir 'add' ou 'edit'
        }));
    };
    // Ouvre le modal de réinitialisation du mot de passe
    const openPasswordModal = (item) => {
        setUi(prev => ({
            ...prev,
            showPasswordModal: true,
            selectedItem: item
        }));
    };

    // Filtrage des données
    const filteredCompanies = data.companies.filter(company => {
        const matchesSearch =
            (company.name ?? '').toLowerCase().includes(ui.searchTerm.toLowerCase()) ||
            (company.email ?? '').toLowerCase().includes(ui.searchTerm.toLowerCase());

        const matchesStatus =
            ui.filters.status === 'all' || company.status === ui.filters.status;

        return matchesSearch && matchesStatus;
    });

    const filteredUsers = data.users.filter(user => {
        const matchesSearch =
            (user.name?.toLowerCase() || '').includes(ui.searchTerm.toLowerCase()) ||
            (user.email?.toLowerCase() || '').includes(ui.searchTerm.toLowerCase()) ||
            (user.companyId?.toLowerCase() || '').includes(ui.searchTerm.toLowerCase());

        const matchesRole =
            ui.filters.role === 'all' || user.role === ui.filters.role;

        return matchesSearch && matchesRole;
    });
    if (!isSuperAdmin()) {
        return (
            navigate ('/access-denied')
        );
    }


    return (
        console.log("Rendering SamaFact component with data:", currentUser.role),
        <div className="admin-dashboard">
            {/* En-tête avec recherche et boutons */}
            <header className="dashboard-header">
                <h1>
                    <FaHome />
                    Tableau de bord SuperAdmin
                </h1>

                <div className="header-actions">
                    <div className="search-bar">
                        <i className="icon-search"></i>
                        <input
                            type="text"
                            placeholder={`Rechercher ${ui.activeTab === 'companies' ? 'entreprises' : 'utilisateurs'}...`}
                            value={ui.searchTerm}
                            onChange={(e) => setUi(prev => ({ ...prev, searchTerm: e.target.value }))}
                        />
                    </div>

                    <button
                        className="primary-btn"
                        onClick={() => openModal(ui.activeTab === 'companies' ? 'Company' : 'User')}
                    >
                        <i className="icon-plus"></i>
                        Ajouter {ui.activeTab === 'companies' ? 'une entreprise' : 'un utilisateur'}
                    </button>
                </div>
            </header>

            {/* Section Statistiques */}
            <section className="stats-section-admin">
                <div className="stat-card">
                    <div className="stat-icon bg-primary">
                        <FaBuilding />
                    </div>
                    <div className="stat-info">
                        <h3>Entreprises</h3>
                        <p>{data.stats.totalCompanies} total</p>
                        <small>{data.stats.activeCompanies} actives</small>
                    </div>
                    <div className="stat-growth">
                        +{data.stats.monthlyGrowth} ce mois
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon bg-success">
                        <FaUsers />
                    </div>
                    <div className="stat-info">
                        <h3>Utilisateurs</h3>
                        <p>{data.stats.totalUsers} total</p>
                        <small>{data.stats.adminsCount} administrateurs</small>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon bg-warning">
                        <FaBell />
                    </div>
                    <div className="stat-info">
                        <h3>Activité</h3>
                        <p>30 jours</p>
                        <small>5 nouvelles entreprises</small>
                    </div>
                </div>
            </section>

            {/* Graphiques */}
            <section className="charts-section-admin">
                <div className="chart-container-admin-first">
                    <h3>Entreprises créées par mois</h3>
                    <BarChart data={data.charts.companiesByMonth} />
                </div>
                <div className="chart-container-admin">
                    <h3>Répartition des utilisateurs</h3>
                    <PieChart data={data.charts.usersByRole} />
                </div>
            </section>

            {/* Onglets et contenu principal */}
            <div className="content-tabs">
                <button
                    className={ui.activeTab === 'companies' ? 'active' : ''}
                    onClick={() => setUi(prev => ({ ...prev, activeTab: 'companies' }))}
                >
                    <i className="icon-building"></i> Entreprises
                </button>
                <button
                    className={ui.activeTab === 'users' ? 'active' : ''}
                    onClick={() => setUi(prev => ({ ...prev, activeTab: 'users' }))}
                >
                    <i className="icon-users"></i> Utilisateurs
                </button>
            </div>

            {/* Filtres */}
            <div className="filters-section">
                {ui.activeTab === 'companies' ? (
                    <select
                        value={ui.filters.status}
                        onChange={(e) => setUi(prev => ({
                            ...prev,
                            filters: { ...prev.filters, status: e.target.value }
                        }))}
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="active">Actives</option>
                        <option value="suspended">Suspendues</option>
                    </select>
                ) : (
                    <select
                        value={ui.filters.role}
                        onChange={(e) => setUi(prev => ({
                            ...prev,
                            filters: { ...prev.filters, role: e.target.value }
                        }))}
                    >
                        <option value="all">Tous les rôles</option>
                        <option value="admin">Administrateurs</option>
                        <option value="user">Utilisateurs</option>
                    </select>
                )}

                <select
                    value={ui.filters.dateRange}
                    onChange={(e) => setUi(prev => ({
                        ...prev,
                        filters: { ...prev.filters, dateRange: e.target.value }
                    }))}
                >
                    <option value="all">Toutes les dates</option>
                    <option value="month">Ce mois-ci</option>
                    <option value="year">Cette année</option>
                </select>
            </div>

            {/* Contenu des tableaux */}
            {ui.activeTab === 'companies' ? (
                <CompanyTable
                    companies={filteredCompanies}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                    mode={ui.modalType}  // Passe 'add' ou 'edit'
                    users={data.users} // <-- Ceci est essentiel
                    onEdit={openModal}
                    onPasswordReset={openPasswordModal}
                />
            ) : (
                // Pour UserTable
                <UserTable
                    users={filteredUsers}
                    companies={data.companies}
                    onDelete={handleDelete}
                    mode={ui.modalType}  // Passe 'add' ou 'edit'

                    onEdit={openModal}
                    onPasswordReset={openPasswordModal}
                />
            )}

            {/* Modals */}
            <CompanyModal
                visible={ui.showCompanyModal}
                onClose={() => setUi(prev => ({ ...prev, showCompanyModal: false }))}
                onSubmit={handleAddCompany}
                company={forms.newCompany}
                users={forms.newUsers}
                onChange={(field, value) => setForms(prev => ({
                    ...prev,
                    newCompany: { ...prev.newCompany, [field]: value }
                }))}
                onUserChange={(index, field, value) => {
                    const updatedUsers = [...forms.newUsers];
                    updatedUsers[index][field] = value;
                    setForms(prev => ({ ...prev, newUsers: updatedUsers }));
                }}
                onAddUser={addUserField}
                mode={ui.modalMode || 'add'} // Valeur de secours
            />

            <UserModal
                visible={ui.showUserModal}
                onClose={() => setUi(prev => ({ ...prev, showUserModal: false }))}
                onSubmit={handleAddCompany}
                user={forms.newUsers[0]}
                companies={data.companies}
                onChange={(field, value) => {
                    const updatedUsers = [...forms.newUsers];
                    updatedUsers[0][field] = value;
                    setForms(prev => ({ ...prev, newUsers: updatedUsers }));
                }}
                mode={ui.modalMode || 'add'} // Valeur de secours
            />

            <PasswordModal
                visible={ui.showPasswordModal}
                onClose={() => setUi(prev => ({ ...prev, showPasswordModal: false }))}
                onSubmit={handleUpdatePassword}
                password={forms.passwordForm.newPassword}
                confirmPassword={forms.passwordForm.confirmPassword}
                onChange={(field, value) => setForms(prev => ({
                    ...prev,
                    passwordForm: { ...prev.passwordForm, [field]: value }
                }))}
                item={ui.selectedItem}
            />
        </div>
    );
};

export default SamaFact;