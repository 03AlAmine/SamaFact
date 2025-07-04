import React, { useEffect, useState } from 'react';
import {
    collection, query, getDocs, deleteDoc, doc, updateDoc, addDoc, writeBatch
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { deleteApp, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { db, auth, firebaseConfig } from '../firebase';
import { useAuth } from '../auth/AuthContext';
import { BarChart, PieChart } from './Charts';
import { PasswordModal, CompanyModal, UserModal } from './Modals';
import { FaBuilding, FaUsers, FaBell, FaHome } from 'react-icons/fa';
import { CompanyTable, UserTable } from './Tables';
import './SamaFact.css';
import { useNavigate } from 'react-router-dom';
import { getPermissionsForRole } from '../auth/permissions';
import { message } from 'antd';


const SamaFact = () => {
    const { currentUser, isSuperAdmin } = useAuth();
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
        showCompanyModal: false,
        showUserModal: false,
        showPasswordModal: false,
        selectedItem: null,
        modalType: 'add',
        filters: {
            status: 'all',
            dateRange: 'all',
            role: 'all'
        },
        modalMode: 'add',
    });

    // États formulaires
    const [forms, setForms] = useState({
        companyForm: {
            name: '',
            email: '',
            industry: '',
            status: 'active',
        },
        userForm: {
            name: '',
            email: '',
            password: '',
            role: 'user',
            companyId: '',
            permissions: {}
        },
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

                const usersData = processUsers(usersSnapshot);
                const companiesData = processCompanies(companiesSnapshot, usersData);

                setData({
                    companies: companiesData,
                    users: usersData,
                    loading: false,
                    stats: calculateStats(companiesData, usersData),
                    charts: prepareChartData(companiesData, usersData)
                });
            } catch (error) {
                console.error("Erreur chargement :", error);
                message.error("Erreur lors du chargement des données");
            }
        };

        loadData();
    }, [isSuperAdmin]);

    // Fonctions de traitement des données
    const processCompanies = (companiesSnapshot, usersData) => {
        return companiesSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || '',
            email: doc.data().email || '',
            industry: doc.data().industry || '',
            status: doc.data().status || 'active',
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            usersCount: usersData.filter(user => user.companyId === doc.id).length
        }));
    };

    const processUsers = (snapshot) => {
        return snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || 'Non spécifié',
            email: doc.data().email || 'Non spécifié',
            role: doc.data().role || 'user',
            companyId: doc.data().companyId || '',
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            isSuperAdmin: doc.data().isSuperAdmin || false
        }));
    };

    const calculateStats = (companies, users) => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        return {
            totalCompanies: companies.length,
            activeCompanies: companies.filter(c => c.status === 'active').length,
            totalUsers: users.length,
            adminsCount: users.filter(u => u.role === 'admin').length,
            monthlyGrowth: companies.filter(c => c.createdAt > lastMonth).length
        };
    };

    const prepareChartData = (companies, users) => {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentYear = new Date().getFullYear();

        const companiesByMonth = monthNames.map((month, i) => ({
            name: month,
            count: companies.filter(c =>
                c.createdAt.getFullYear() === currentYear &&
                c.createdAt.getMonth() === i
            ).length
        }));

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
            refreshStats();
            message.success(`${type === 'companies' ? 'Entreprise' : 'Utilisateur'} supprimé avec succès`);
        } catch (error) {
            console.error("Erreur suppression :", error);
            message.error("Erreur lors de la suppression");
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
            message.success(`Statut mis à jour: ${newStatus}`);
        } catch (error) {
            console.error("Erreur changement statut :", error);
            message.error("Erreur lors du changement de statut");
        }
    };

    const handleAddCompany = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'companies'), {
                ...forms.companyForm,
                createdAt: new Date(),
            });
            refreshData();
            setUi(prev => ({ ...prev, showCompanyModal: false }));
            message.success('Entreprise créée avec succès !');
        } catch (error) {
            console.error("Erreur ajout entreprise:", error);
            message.error("Erreur lors de la création de l'entreprise");
        }
    };

    const handleCreateUser = async (userData) => {
        try {
            // 1. Vérifier l'email
            const methods = await fetchSignInMethodsForEmail(auth, userData.email);
            if (methods.length > 0) {
                throw new Error("Email déjà utilisé");
            }

            // 2. Créer une instance auth séparée
            const secondaryApp = initializeApp(firebaseConfig, "Secondary");
            const secondaryAuth = getAuth(secondaryApp);

            // 3. Créer l'utilisateur
            const userCredential = await createUserWithEmailAndPassword(
                secondaryAuth,
                userData.email,
                userData.password
            );

            // 4. Utiliser une transaction batch pour garantir l'intégrité des données
            const batch = writeBatch(db);

            // Document principal dans 'users'
            const userRef = doc(db, "users", userCredential.user.uid);
            batch.set(userRef, {
                name: userData.name,
                email: userData.email,
                role: userData.role,
                companyId: userData.companyId,
                isSuperAdmin: userData.role === 'superadmin',
                createdAt: new Date(),
                permissions: getPermissionsForRole(userData.role)
            });

            // Document profil dans la sous-collection company
            const profileRef = doc(db, `companies/${userData.companyId}/profiles`, userCredential.user.uid);
            batch.set(profileRef, {
                firstName: userData.name.split(' ')[0] || '',
                lastName: userData.name.split(' ').slice(1).join(' ') || '',
                email: userData.email,
                role: userData.role,
                createdAt: new Date(),
                createdBy: auth.currentUser.uid, // ID de l'admin qui a créé le compte
                permissions: getPermissionsForRole(userData.role),
                status: 'active'
            });

            // 5. Exécuter la transaction
            await batch.commit();

            // 6. Nettoyer
            await secondaryAuth.signOut();
            deleteApp(secondaryApp);

            // 7. Fermer le modal et actualiser
            setUi(prev => ({
                ...prev,
                showUserModal: false,
                userForm: {
                    name: '',
                    email: '',
                    password: '',
                    role: 'user',
                    companyId: '',
                    permissions: {}
                }
            }));

            refreshData();
            message.success('Utilisateur et profil créés avec succès !');

        } catch (error) {
            console.error("Erreur création:", error);
            message.error(error.message || "Erreur lors de la création");
        }
    };

    const handleUpdatePassword = async () => {
        try {
            // Implémentez ici la logique de mise à jour du mot de passe
            console.log("Mot de passe mis à jour pour:", ui.selectedItem);
            message.success('Mot de passe mis à jour avec succès');
            setUi(prev => ({ ...prev, showPasswordModal: false }));
        } catch (error) {
            console.error("Erreur mise à jour mot de passe:", error);
            message.error("Erreur lors de la mise à jour du mot de passe");
        }
    };

    // Fonctions utilitaires
    const refreshData = async () => {
        setData(prev => ({ ...prev, loading: true }));
        try {
            const [companiesSnapshot, usersSnapshot] = await Promise.all([
                getDocs(query(collection(db, 'companies'))),
                getDocs(query(collection(db, 'users')))
            ]);

            const usersData = processUsers(usersSnapshot);
            const companiesData = processCompanies(companiesSnapshot, usersData);

            setData({
                companies: companiesData,
                users: usersData,
                loading: false,
                stats: calculateStats(companiesData, usersData),
                charts: prepareChartData(companiesData, usersData)
            });
        } catch (error) {
            console.error("Erreur rechargement:", error);
            message.error("Erreur lors du rechargement des données");
        }
    };

    const refreshStats = () => {
        setData(prev => ({
            ...prev,
            stats: calculateStats(prev.companies, prev.users),
            charts: prepareChartData(prev.companies, prev.users)
        }));
    };

    const openModal = (type, item = null) => {
        // Réinitialisation du formulaire
        if (type === 'User') {
            setForms(prev => ({
                ...prev,
                userForm: {
                    name: '',
                    email: '',
                    password: '',
                    role: 'user',
                    companyId: '',
                    permissions: {}
                }
            }));
        }

        setUi(prev => ({
            ...prev,
            [`show${type}Modal`]: true,
            selectedItem: item,
            modalType: type.toLowerCase(),
            modalMode: item ? 'edit' : 'add'
        }));
    };

    const openPasswordModal = (item) => {
        setUi(prev => ({
            ...prev,
            showPasswordModal: true,
            selectedItem: item
        }));
    };

    // Filtrage des données
    const filteredCompanies = data.companies.filter(company => {
        const matchesSearch = ['name', 'email', 'industry'].some(field =>
            (company[field] ?? '').toLowerCase().includes(ui.searchTerm.toLowerCase())
        );
        const matchesStatus = ui.filters.status === 'all' || company.status === ui.filters.status;
        return matchesSearch && matchesStatus;
    });

    const filteredUsers = data.users.filter(user => {
        const matchesSearch = ['name', 'email', 'companyId'].some(field =>
            (user[field] ?? '').toLowerCase().includes(ui.searchTerm.toLowerCase())
        );
        const matchesRole = ui.filters.role === 'all' || user.role === ui.filters.role;
        return matchesSearch && matchesRole;
    });

    if (!isSuperAdmin()) {
        return navigate('/access-denied');
    }

    return (
        <div className="admin-dashboard">
            {/* En-tête */}
            <header className="dashboard-header">
                <h1><FaHome /> Tableau de bord SuperAdmin</h1>
                <button onClick={() => navigate('/')} className='first-btn'>
                    Test
                </button>
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
                {[
                    {
                        icon: <FaBuilding />,
                        title: "Entreprises",
                        values: [
                            `${data.stats.totalCompanies} total`,
                            `${data.stats.activeCompanies} actives`
                        ],
                        growth: `+${data.stats.monthlyGrowth} ce mois`
                    },
                    {
                        icon: <FaUsers />,
                        title: "Utilisateurs",
                        values: [
                            `${data.stats.totalUsers} total`,
                            `${data.stats.adminsCount} administrateurs`
                        ]
                    },
                    {
                        icon: <FaBell />,
                        title: "Activité",
                        values: ["30 jours", "5 nouvelles entreprises"]
                    }
                ].map((stat, i) => (
                    <div key={i} className="stat-card">
                        <div className={`stat-icon bg-${i === 0 ? 'primary' : i === 1 ? 'success' : 'warning'}`}>
                            {stat.icon}
                        </div>
                        <div className="stat-info">
                            <h3>{stat.title}</h3>
                            {stat.values.map((val, j) => (
                                <p key={j}>{j === 0 ? <strong>{val}</strong> : <small>{val}</small>}</p>
                            ))}
                        </div>
                        {stat.growth && (
                            <div className="stat-growth">{stat.growth}</div>
                        )}
                    </div>
                ))}
            </section>

            {/* Graphiques */}
            <section className="charts-section-admin">
                <div className="chart-container-admin">
                    <h3>Entreprises créées par mois</h3>
                    <BarChart data={data.charts.companiesByMonth} />
                </div>
                <div className="chart-container-admin">
                    <h3>Répartition des utilisateurs</h3>
                    <PieChart data={data.charts.usersByRole} />
                </div>
            </section>

            {/* Onglets */}
            <div className="content-tabs">
                {['companies', 'users'].map((tab) => (
                    <button
                        key={tab}
                        className={ui.activeTab === tab ? 'active' : ''}
                        onClick={() => setUi(prev => ({ ...prev, activeTab: tab }))}
                    >
                        <i className={`icon-${tab === 'companies' ? 'building' : 'users'}`}></i>
                        {tab === 'companies' ? 'Entreprises' : 'Utilisateurs'}
                    </button>
                ))}
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
                        {['all', 'active', 'suspended'].map((status) => (
                            <option key={status} value={status}>
                                {status === 'all' ? 'Tous les statuts' :
                                    status === 'active' ? 'Actives' : 'Suspendues'}
                            </option>
                        ))}
                    </select>
                ) : (
                    <select
                        value={ui.filters.role}
                        onChange={(e) => setUi(prev => ({
                            ...prev,
                            filters: { ...prev.filters, role: e.target.value }
                        }))}
                    >
                        {['all', 'admin', 'user'].map((role) => (
                            <option key={role} value={role}>
                                {role === 'all' ? 'Tous les rôles' :
                                    role === 'admin' ? 'Administrateurs' : 'Utilisateurs'}
                            </option>
                        ))}
                    </select>
                )}

                <select
                    value={ui.filters.dateRange}
                    onChange={(e) => setUi(prev => ({
                        ...prev,
                        filters: { ...prev.filters, dateRange: e.target.value }
                    }))}
                >
                    {['all', 'month', 'year'].map((range) => (
                        <option key={range} value={range}>
                            {range === 'all' ? 'Toutes les dates' :
                                range === 'month' ? 'Ce mois-ci' : 'Cette année'}
                        </option>
                    ))}
                </select>
            </div>

            {/* Tableaux */}
            {ui.activeTab === 'companies' ? (
                <CompanyTable
                    companies={filteredCompanies}
                    users={data.users || []} // Fournir un tableau vide par défaut
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                    onEdit={openModal}
                    onPasswordReset={openPasswordModal}
                />
            ) : (
                <UserTable
                    users={filteredUsers}
                    companies={data.companies}
                    onDelete={handleDelete}
                    onEdit={(user) => openModal('User', user)}
                    onPasswordReset={openPasswordModal}
                />
            )}

            {/* Modals */}
            <CompanyModal
                visible={ui.showCompanyModal}
                onClose={() => setUi(prev => ({ ...prev, showCompanyModal: false }))}
                onSubmit={handleAddCompany}
                company={forms.companyForm}
                onChange={(field, value) => setForms(prev => ({
                    ...prev,
                    companyForm: { ...prev.companyForm, [field]: value }
                }))}
                mode={ui.modalMode}
            />

            <UserModal
                visible={ui.showUserModal}
                onClose={() => setUi(prev => ({ ...prev, showUserModal: false }))}
                onSubmit={handleCreateUser} // ← Important
                user={forms.userForm}
                companies={data.companies}
                onChange={(field, value) => setForms(prev => ({
                    ...prev,
                    userForm: { ...prev.userForm, [field]: value }
                }))}
                mode={ui.modalMode}
                isSuperAdmin={currentUser.isSuperAdmin}
                currentUser={currentUser}
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