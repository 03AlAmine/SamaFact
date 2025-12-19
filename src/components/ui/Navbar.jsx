import React, { useState, useEffect } from "react";
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
  FaFileInvoiceDollar
} from "react-icons/fa";
import SearchBox from "./SearchBox";
import CompanyNameDisplay from "../other/CompanyNameDisplay";
import "../../css/Navbar.css";

const Navbar = ({
  searchTerm,
  setSearchTerm,
  currentUser,
  companyId,
  activeModule,
  setModuleBasedOnRole,
  canToggleModules,
  logout
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Fermer le menu mobile quand la fenêtre est redimensionnée au-dessus de 992px
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 992) {
        setIsMobileMenuOpen(false);
        setIsSearchExpanded(false);
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
  

  return (
    <>
    <div className="navbar-sticky-wrapper">

      <header className="navbar-premium">
        <div className="navbar-left">
          {/* Menu Hamburger pour mobile */}
          <div 
            className={`hamburger-menu ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
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
              placeholder="Rechercher employees, factures..."
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
            placeholder="Rechercher employees, factures..."
            className="navbar-search-box mobile"
          />
        </div>

        <div className={`navbar-right ${isMobileMenuOpen ? 'active' : ''}`}>
          <div className="module-toggle">
            <button
              className={`toggle-btn ${
                activeModule === "mentafact" ? "mentafact" : "payroll"
              } clignote`}
              onClick={handleModuleToggle}
              disabled={!canToggleModules?.()}
              title={
                !canToggleModules?.()
                  ? "Changement de module réservé aux administrateurs et comptables"
                  : `Basculer vers ${activeModule === "mentafact" ? "Payroll" : "Mentafact"}`
              }
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

          <button className="notification-btn">
            <FaBell />
            <span className="notification-badge pulse">3</span>
          </button>

          <div className="user-profile-dropdown">
            <div className="user-profile-trigger">
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

        {/* Overlay pour mobile */}
        {isMobileMenuOpen && (
          <div 
            className="mobile-menu-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}
      </header>

      {/* Overlay pour la searchbox expandée */}
      {isSearchExpanded && (
        <div 
          className="search-overlay"
          onClick={() => setIsSearchExpanded(false)}
        ></div>
      )}
      </div>
    </>
  );
};

export default Navbar;