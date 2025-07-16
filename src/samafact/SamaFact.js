import React, { useEffect, useState } from 'react';
import {
  collection, query, getDocs, deleteDoc, doc, updateDoc, addDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';
import { BarChart, PieChart } from './Charts';
import { PasswordModal, CompanyModal, UserModal } from './Modals';
import { FaBuilding, FaUsers, FaBell, FaSignOutAlt, FaSearch, FaPlus, FaChartLine } from 'react-icons/fa';
import { FiSettings, FiUsers, FiPieChart, FiBarChart2, FiHome } from 'react-icons/fi';

import { CompanyTable, UserTable } from './Tables';
import './SamaFact.css';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { userService } from '../services/userService';


const SamaFact = () => {
  const { currentUser, isSuperAdmin, logout } = useAuth();
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
      username: '',
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
      username: doc.data().username || 'Non spécifié',
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
      // Utilisation du service
      const result = await userService.createUserWithIsolatedAuth(
        {
          email: userData.email,
          password: userData.password,
          name: userData.name,
          username: userData.username,
          role: userData.role,
          companyId: userData.companyId,
        },
        currentUser.uid
      );

      if (result.success) {
        // Fermer le modal et actualiser
        setUi(prev => ({
          ...prev,
          showUserModal: false,
          userForm: {
            name: '',
            username: '',
            email: '',
            password: '',
            role: 'user',
            companyId: '',
            permissions: {}
          }
        }));

        refreshData();
        message.success('Utilisateur créé avec succès !');
      }
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
          username: '',
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
    const matchesSearch = ['name', 'username', 'email', 'companyId'].some(field =>
      (user[field] ?? '').toLowerCase().includes(ui.searchTerm.toLowerCase())
    );
    const matchesRole = ui.filters.role === 'all' || user.role === ui.filters.role;
    return matchesSearch && matchesRole;
  });


  const getRoleLabel = (role) => {
    switch (role) {
      case 'all':
        return 'Tous les rôles';
      case 'superadmin':
        return 'SuperAdmin';
      case 'admin':
        return 'Administrateurs';
      case 'charge_compte':
        return 'Chargé de compte';
      case 'comptable':
        return 'Comptable';
      case 'lecteur':
        return 'Lecteur';
      case 'user':
        return 'Utilisateur';
      default:
        return role;
    }
  };


  if (!isSuperAdmin()) {
    return navigate('/access-denied');
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <h1>SamaFact Admin</h1>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${ui.activeTab === "users" ? "active" : ""}`}
            onClick={() => navigate("/")}
          >
            <FiHome className="nav-icon" />
            <span>SamaF@ct</span>
          </button>

          <button
            className={`nav-item ${ui.activeTab === "companies" ? "active" : ""
              }`}
            onClick={() =>
              setUi((prev) => ({ ...prev, activeTab: "companies" }))
            }
          >
            <FaBuilding className="nav-icon" />
            <span>Entreprises</span>
          </button>

          <button
            className={`nav-item ${ui.activeTab === "users" ? "active" : ""}`}
            onClick={() => setUi((prev) => ({ ...prev, activeTab: "users" }))}
          >
            <FiUsers className="nav-icon" />
            <span>Utilisateurs</span>
          </button>

          <button className="nav-item">
            <FiBarChart2 className="nav-icon" />
            <span>Statistiques</span>
          </button>

          <button className="nav-item">
            <FiSettings className="nav-icon" />
            <span>Paramètres</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">{currentUser?.name?.charAt(0) || "A"}</div>
            <div className="user-info">
              <span className="username">{currentUser?.name || "Admin"}</span>
              <span className="role">Super Admin</span>
            </div>
          </div>
          <button onClick={() => logout()} className="logout-btn">
            <FaSignOutAlt />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Top Bar */}
        <header className="dashboard-topbar">
          <div className="topbar-title">
            <h2>
              {ui.activeTab === "companies" ? (
                <>
                  <FaBuilding /> Gestion des Entreprises
                </>
              ) : (
                <>
                  <FiUsers /> Gestion des Utilisateurs
                </>
              )}
            </h2>
            <p className="breadcrumb">
              Dashboard /{" "}
              {ui.activeTab === "companies" ? "Entreprises" : "Utilisateurs"}
            </p>
          </div>

          <div className="topbar-actions">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder={`Rechercher ${ui.activeTab === "companies"
                  ? "une entreprise..."
                  : "un utilisateur..."
                  }`}
                value={ui.searchTerm}
                onChange={(e) =>
                  setUi((prev) => ({ ...prev, searchTerm: e.target.value }))
                }
              />
            </div>

            <button
              className="primary-btn"
              onClick={() =>
                openModal(ui.activeTab === "companies" ? "Company" : "User")
              }
            >
              <FaPlus />
              <span>
                Ajouter{" "}
                {ui.activeTab === "companies"
                  ? "une entreprise"
                  : "un utilisateur"}
              </span>
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon bg-blue">
              <FaBuilding />
            </div>
            <div className="stat-info">
              <h3>Entreprises</h3>
              <div className="stat-numbers">
                <span className="main-value">{data.stats.totalCompanies}</span>
                <span className="secondary-value">
                  {data.stats.activeCompanies} actives
                </span>
              </div>
              <div className="stat-trend positive">
                <FaChartLine /> +{data.stats.monthlyGrowth} ce mois
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon bg-purple">
              <FaUsers />
            </div>
            <div className="stat-info">
              <h3>Utilisateurs</h3>
              <div className="stat-numbers">
                <span className="main-value">{data.stats.totalUsers}</span>
                <span className="secondary-value">
                  {data.stats.adminsCount} admins
                </span>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon bg-orange">
              <FaBell />
            </div>
            <div className="stat-info">
              <h3>Activité</h3>
              <div className="stat-numbers">
                <span className="main-value">30</span>
                <span className="secondary-value">jours</span>
              </div>
              <div className="stat-trend">5 nouvelles entreprises</div>
            </div>
          </div>
        </section>

        {/* Charts Section */}
        <section className="charts-section">
          <div className="chart-card">
            <div className="chart-header">
              <h3>
                <FiBarChart2 /> Entreprises créées par mois
              </h3>
              <select className="chart-filter">
                <option>Cette année</option>
                <option>6 derniers mois</option>
                <option>30 derniers jours</option>
              </select>
            </div>
            <div className="chart-container">
              <BarChart data={data.charts.companiesByMonth} />
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3>
                <FiPieChart /> Répartition des utilisateurs
              </h3>
            </div>
            <div className="chart-container">
              <PieChart data={data.charts.usersByRole} />
            </div>
          </div>
        </section>

        {/* Data Table Section */}
        <section className="data-section">
          <div className="section-header">
            <h3>
              {ui.activeTab === "companies"
                ? "Liste des entreprises"
                : "Liste des utilisateurs"}
            </h3>

            <div className="section-filters">
              {ui.activeTab === "companies" ? (
                <select
                  value={ui.filters.status}
                  onChange={(e) =>
                    setUi((prev) => ({
                      ...prev,
                      filters: { ...prev.filters, status: e.target.value },
                    }))
                  }
                >
                  {["all", "active", "suspended"].map((status) => (
                    <option key={status} value={status}>
                      {status === "all"
                        ? "Tous les statuts"
                        : status === "active"
                          ? "Actives"
                          : "Suspendues"}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={ui.filters.role}
                  onChange={(e) =>
                    setUi((prev) => ({
                      ...prev,
                      filters: { ...prev.filters, role: e.target.value },
                    }))
                  }
                >
                  {[
                    "all",
                    "superadmin",
                    "admin",
                    "charge_compte",
                    "comptable",
                    "lecteur",
                    "user",
                  ].map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={ui.filters.dateRange}
                onChange={(e) =>
                  setUi((prev) => ({
                    ...prev,
                    filters: { ...prev.filters, dateRange: e.target.value },
                  }))
                }
              >
                {["all", "month", "year"].map((range) => (
                  <option key={range} value={range}>
                    {range === "all"
                      ? "Toutes les dates"
                      : range === "month"
                        ? "Ce mois-ci"
                        : "Cette année"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {ui.activeTab === "companies" ? (
            <CompanyTable
              companies={filteredCompanies}
              users={data.users || []}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onEdit={openModal}
              onPasswordReset={openPasswordModal}
              getRoleLabel={getRoleLabel}
            />
          ) : (
            <UserTable
              users={filteredUsers}
              companies={data.companies}
              onDelete={handleDelete}
              onEdit={(user) => openModal("User", user)}
              onPasswordReset={openPasswordModal}
              getRoleLabel={getRoleLabel}
            />
          )}
        </section>
      </main>

      {/* Modals (restent identiques) */}
      <CompanyModal
        visible={ui.showCompanyModal}
        onClose={() => setUi((prev) => ({ ...prev, showCompanyModal: false }))}
        onSubmit={handleAddCompany}
        company={forms.companyForm}
        onChange={(field, value) =>
          setForms((prev) => ({
            ...prev,
            companyForm: { ...prev.companyForm, [field]: value },
          }))
        }
        mode={ui.modalMode}
      />

      <UserModal
        visible={ui.showUserModal}
        onClose={() => setUi((prev) => ({ ...prev, showUserModal: false }))}
        onSubmit={handleCreateUser}
        user={forms.userForm}
        companies={data.companies}
        onChange={(field, value) =>
          setForms((prev) => ({
            ...prev,
            userForm: { ...prev.userForm, [field]: value },
          }))
        }
        mode={ui.modalMode}
        isSuperAdmin={currentUser.isSuperAdmin}
        currentUser={currentUser}
      />

      <PasswordModal
        visible={ui.showPasswordModal}
        onClose={() => setUi((prev) => ({ ...prev, showPasswordModal: false }))}
        onSubmit={handleUpdatePassword}
        password={forms.passwordForm.newPassword}
        confirmPassword={forms.passwordForm.confirmPassword}
        onChange={(field, value) =>
          setForms((prev) => ({
            ...prev,
            passwordForm: { ...prev.passwordForm, [field]: value },
          }))
        }
        item={ui.selectedItem}
      />
    </div>
  );
};

export default SamaFact;