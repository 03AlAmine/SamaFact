import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaBell,
  FaUserCircle,
  FaChevronDown,
  FaChevronRight,
  FaUser,
  FaCog,
  FaCreditCard,
  FaSignOutAlt,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaSun,
  FaMoon,
  FaDesktop,
  FaPalette,
  FaCheck,
  FaExclamationTriangle,
  FaUserPlus,
  FaClock,
  FaTimes
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import SearchBox from "./SearchBox";
import CompanyNameDisplay from "../other/CompanyNameDisplay";
import { useTheme } from '../../hooks/useTheme'; // Import du hook
import "../../css/Navbar.css";
import "../../css/themes.css";
import { formatNumber } from "../../utils/formatters";

const Navbar = ({
  searchTerm,
  setSearchTerm,
  currentUser,
  companyId,
  activeModule,
  setModuleBasedOnRole,
  canToggleModules,
  logout,
  allFactures,
  employees,
  clients
}) => {
  // Utilisation du hook useTheme
  const { theme, effectiveTheme, setTheme } = useTheme();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const themeMenuRef = useRef(null);
  const themeButtonRef = useRef(null);

  // Fermer le menu thème quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        themeMenuRef.current &&
        !themeMenuRef.current.contains(event.target) &&
        !themeButtonRef.current.contains(event.target)
      ) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fermer le menu mobile quand la fenêtre est redimensionnée
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 992) {
        setIsMobileMenuOpen(false);
        setIsSearchExpanded(false);
        setIsThemeMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const roleLabels = {
    'supadmin': 'Sup Admin',
    'admin': 'Administrateur',
    'comptable': 'Comptable',
    'user': 'Utilisateur',
    'superadmin': 'Super Admin',
    'charge_compte': 'Chargé de Compte',
    'lecteur': 'Lecteur',
    'rh_daf': 'RH DAF'
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isThemeMenuOpen) setIsThemeMenuOpen(false);
    if (showNotifications) setShowNotifications(false);
  };

  const handleSearchFocus = () => {
    setIsSearchExpanded(true);
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      setIsSearchExpanded(false);
    }, 200);
  };

  const handleModuleToggle = () => {
    if (!canToggleModules?.()) return;
    const newModule = activeModule === "mentafact" ? "payroll" : "mentafact";
    setModuleBasedOnRole(newModule, currentUser?.role);
  };

  // Gestion du thème avec le hook
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    setIsThemeMenuOpen(false);
  };

  const getThemeIcon = () => {
    switch (effectiveTheme) {
      case 'light': return <FaSun />;
      case 'dark': return <FaMoon />;
      default: return <FaDesktop />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Clair';
      case 'dark': return 'Sombre';
      default: return 'Auto';
    }
  };
  // Générer des notifications basées sur les données
  useEffect(() => {
    const generateNotifications = () => {
      const notifs = [];

      const unpaidInvoices = allFactures?.filter(f => f.statut === "en attente") || [];
      if (unpaidInvoices.length > 0) {
        notifs.push({
          id: 'unpaid',
          type: 'warning',
          icon: <FaExclamationTriangle />,
          title: 'Factures impayées',
          message: `${unpaidInvoices.length} facture(s) en attente de paiement`,
          time: 'À l\'instant',
          amount: unpaidInvoices.reduce((sum, f) => sum + (parseFloat(f.totalTTC) || 0), 0)
        });
      }

      const employeesOnLeave = employees?.filter(e => e.enConges) || [];
      if (employeesOnLeave.length > 0) {
        notifs.push({
          id: 'leave',
          type: 'info',
          icon: <FaClock />,
          title: 'Employés en congés',
          message: `${employeesOnLeave.length} employé(s) actuellement en congés`,
          time: 'Aujourd\'hui'
        });
      }

      const newClientsThisMonth = clients?.filter(c => {
        const date = new Date(c.createdAt);
        return date.getMonth() === new Date().getMonth();
      }) || [];
      if (newClientsThisMonth.length > 0) {
        notifs.push({
          id: 'new-clients',
          type: 'success',
          icon: <FaUserPlus />,
          title: 'Nouveaux clients',
          message: `${newClientsThisMonth.length} nouveau(x) client(s) ce mois-ci`,
          time: 'Ce mois'
        });
      }

      const overdueInvoices = allFactures?.filter(f => {
        if (f.statut !== "en attente") return false;
        const dueDate = new Date(f.echeance || f.date);
        const today = new Date();
        return dueDate < today;
      }) || [];
      if (overdueInvoices.length > 0) {
        notifs.push({
          id: 'overdue',
          type: 'danger',
          icon: <FaExclamationTriangle />,
          title: 'Factures en retard',
          message: `${overdueInvoices.length} facture(s) en retard de paiement`,
          time: 'Urgent'
        });
      }

      setNotifications(notifs);
    };

    generateNotifications();
  }, [allFactures, employees, clients]);

  const markAsRead = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications([]);
  };

  return (
    <>
      <div className="navbar-sticky-wrapper">
        <header className="navbar-premium">
          <div className="navbar-left">
            {/* Menu Hamburger pour mobile */}
            <div
              className={`hamburger-menu ${isMobileMenuOpen ? 'active' : ''}`}
              onClick={toggleMobileMenu}
              aria-label="Menu principal"
              role="button"
              tabIndex={0}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div className="company-brand">
              <CompanyNameDisplay
                companyId={companyId}
                currentUser={currentUser}
              />
            </div>

            {/* Recherche desktop */}
            <div className="search-container-nav desktop-search">
              <SearchBox
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                placeholder="Rechercher employés, factures..."
                className="navbar-search-box"
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
              />
            </div>
          </div>

          {/* Recherche mobile */}
          <div className={`mobile-search-container-nav ${isMobileMenuOpen ? 'active' : ''}`}>
            <SearchBox
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder="Rechercher employés, factures..."
              className="navbar-search-box mobile"
            />
          </div>

          <div className={`navbar-right ${isMobileMenuOpen ? 'active' : ''}`}>
            {/* Sélecteur de thème */}
            <div className="theme-selector">
              <button
                ref={themeButtonRef}
                className="theme-toggle-btn"
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                title="Changer le thème"
                aria-label="Changer le thème"
                aria-expanded={isThemeMenuOpen}
              >
                {getThemeIcon()}
                <span className="theme-label">{getThemeLabel()}</span>
                <FaChevronDown className={`theme-arrow ${isThemeMenuOpen ? 'open' : ''}`} />
              </button>

              {/* Wrapper div with the ref for click outside detection */}
              <div ref={themeMenuRef}>
                <AnimatePresence>
                  {isThemeMenuOpen && (
                    <motion.div
                      className="theme-dropdown-menu"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="theme-dropdown-header">
                        <FaPalette />
                        <span>Choisir un thème</span>
                      </div>

                      <button
                        className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                        onClick={() => handleThemeChange('light')}
                      >
                        <FaSun />
                        <span>Clair</span>
                        {theme === 'light' && <FaCheck className="theme-check" />}
                      </button>

                      <button
                        className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                        onClick={() => handleThemeChange('dark')}
                      >
                        <FaMoon />
                        <span>Sombre</span>
                        {theme === 'dark' && <FaCheck className="theme-check" />}
                      </button>

                      <button
                        className={`theme-option ${theme === 'auto' ? 'active' : ''}`}
                        onClick={() => handleThemeChange('auto')}
                      >
                        <FaDesktop />
                        <span>Auto (système)</span>
                        {theme === 'auto' && <FaCheck className="theme-check" />}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="module-toggle">
              <button
                className={`toggle-btn ${activeModule === "mentafact" ? "mentafact" : "payroll"} clignote`}
                onClick={handleModuleToggle}
                disabled={!canToggleModules?.()}
                title={
                  !canToggleModules?.()
                    ? "Changement de module réservé aux administrateurs et comptables"
                    : `Basculer vers ${activeModule === "mentafact" ? "Payroll" : "Mentafact"}`
                }
                aria-label="Basculer entre les modules"
              >
                {activeModule === "mentafact" ? (
                  <>
                    <FaMoneyBillWave className="toggle-icon" />
                    <span className="toggle-text">Payroll</span>
                  </>
                ) : (
                  <>
                    <FaFileInvoiceDollar className="toggle-icon" />
                    <span className="toggle-text">Mentafact</span>
                  </>
                )}
              </button>
            </div>

            {/* Notifications */}
            <div className="mf-notification-wrapper">
              <button
                className={`mf-notification-btn ${notifications.length > 0 ? 'mf-has-notif' : ''}`}
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
                aria-expanded={showNotifications}
              >
                <FaBell />
                {notifications.length > 0 && (
                  <span className="mf-notification-badge">{notifications.length}</span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    className="mf-notification-dropdown"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mf-notification-header">
                      <h3>Notifications</h3>
                      {notifications.length > 0 && (
                        <button onClick={markAllAsRead}>Tout marquer comme lu</button>
                      )}
                    </div>
                    <div className="mf-notification-list">
                      {notifications.length > 0 ? (
                        notifications.map(notif => (
                          <div key={notif.id} className={`mf-notification-item mf-notification-${notif.type}`}>
                            <div className="mf-notif-icon">{notif.icon}</div>
                            <div className="mf-notif-content">
                              <h4>{notif.title}</h4>
                              <p>{notif.message}</p>
                              {notif.amount && (
                                <span className="mf-notif-amount">
                                  {formatNumber(notif.amount)} FCFA
                                </span>
                              )}
                              <span className="mf-notif-time">{notif.time}</span>
                            </div>
                            <button
                              className="mf-notif-close"
                              onClick={() => markAsRead(notif.id)}
                              aria-label="Fermer la notification"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="mf-notification-empty">
                          <FaBell />
                          <p>Aucune notification</p>
                          <span>Tout est calme pour le moment</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="user-profile-dropdown">
              <div className="user-profile-trigger" role="button" tabIndex={0} aria-label="Menu utilisateur">
                <div className="user-avatar-wrapper">
                  <FaUserCircle className="user-avatar" />
                  <div className="user-status"></div>
                </div>
                <div className="user-info">
                  <span className="user-name">
                    {currentUser?.name || "Admin"}
                  </span>
                  <span className="user-role">
                    {roleLabels[currentUser?.role] || "Utilisateur"}
                  </span>
                </div>
                <FaChevronDown className="dropdown-arrow" />
              </div>

              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <div className="user-avatar-wrapper large">
                    <FaUserCircle className="user-avatar" />
                  </div>
                  <div className="user-info">
                    <span className="user-name">
                      {currentUser?.name || "Admin"}
                    </span>
                    <span className="user-email">
                      {currentUser?.email || "admin@entreprise.com"}
                    </span>
                  </div>
                </div>

                <Link
                  to="/profile"
                  className="dropdown-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaUser className="dropdown-icon" />
                  <span>Mon Profil</span>
                  <FaChevronRight className="dropdown-arrow-right" />
                </Link>

                <Link
                  to="/settings"
                  className="dropdown-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaCog className="dropdown-icon" />
                  <span>Paramètres</span>
                  <FaChevronRight className="dropdown-arrow-right" />
                </Link>

                <Link
                  to="/billing"
                  className="dropdown-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaCreditCard className="dropdown-icon" />
                  <span>Abonnement</span>
                  <FaChevronRight className="dropdown-arrow-right" />
                </Link>

                <div className="dropdown-divider"></div>

                <button
                  className="dropdown-item logout-btn"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                >
                  <FaSignOutAlt className="dropdown-icon" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Overlay pour la searchbox expandée */}
        {isSearchExpanded && (
          <div
            className="search-overlay"
            onClick={() => setIsSearchExpanded(false)}
            aria-hidden="true"
          ></div>
        )}
      </div>
    </>
  );
};

export default Navbar;