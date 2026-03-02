import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import {
  FaUsers,
  FaFileInvoiceDollar,
  FaChartBar,
  FaMoneyBillWave,
  FaBars,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaUserCog,
  FaCalendarAlt,
  FaCreditCard
} from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import { GiTeamIdea } from 'react-icons/gi';
import '../css/Sidebar.css'; // Note: fichier renommé Sidebar.css

// Import de l'image de background (ajustez le chemin selon votre structure)
import bgSide from '../assets/bg/bg-side.jpg';

const Sidebar = ({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab, logo }) => {
  const { activeModule } = useAppContext();
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  // Détection responsive
  useEffect(() => {
    const checkResponsive = () => {
      const mobile = window.matchMedia('(max-width: 992px)').matches;
      setIsMobile(mobile);
    };

    checkResponsive();

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkResponsive, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Configuration des items du menu avec icônes et labels
  const menuItems = [
    {
      icon: <MdDashboard className="sd-icon" />,
      label: "Tableau de bord",
      tab: "dashboard",
      badge: null,
      description: "Vue d'ensemble"
    },
    ...(activeModule === "mentafact"
      ? [
        {
          icon: <FaUsers className="sd-icon" />,
          label: "Clients",
          tab: "clients",
          badge: null,
          description: "Gestion des clients"
        },
        {
          icon: <FaFileInvoiceDollar className="sd-icon" />,
          label: "Ment@Fact",
          tab: "factures",
          badge: null,
          description: "Factures & Devis"
        },
      ]
      : [
        {
          icon: <FaUsers className="sd-icon" />,
          label: "Employés",
          tab: "employees",
          badge: null,
          description: "Gestion du personnel"
        },
        {
          icon: <FaMoneyBillWave className="sd-icon" />,
          label: "Ment@Roll",
          tab: "payrolls",
          badge: null,
          description: "Bulletins de paie"
        },
        {
          icon: <FaCalendarAlt className="sd-icon" />,
          label: "Congés",
          tab: "leaves",
          badge: "2",
          description: "Demandes en cours"
        },
      ]
    ),
    {
      icon: <FaChartBar className="sd-icon" />,
      label: "Statistiques",
      tab: "stats",
      badge: null,
      description: "Analyses et rapports"
    },
    {
      icon: <GiTeamIdea className="sd-icon" />,
      label: "Équipes",
      tab: "equipes",
      badge: null,
      description: "Gestion des équipes"
    },
    {
      icon: <FaCreditCard className="sd-icon" />,
      label: "Paiements",
      tab: "paiements",
      badge: "3",
      description: "Encaissements"
    },
    {
      icon: <FaUserCog className="sd-icon" />,
      label: "Administration",
      tab: "admin",
      badge: null,
      description: "Paramètres avancés"
    }
  ];

  const handleItemClick = (tab) => {
    setActiveTab(tab);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Déterminer le titre en fonction du module actif
  const getTitle = () => {
    return activeModule === "mentafact" ? "Ment@Fact" : "Ment@Roll";
  };

  const getSubtitle = () => {
    return activeModule === "mentafact"
      ? "Gestion commerciale"
      : "Gestion des paies";
  };

  return (
    <>
      {/* Bouton mobile - visible uniquement en mode mobile */}
      {isMobile && (
        <button
          className="sd-mobile-toggle"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`sd-sidebar ${sidebarOpen ? 'sd-open' : 'sd-closed'} ${isMobile ? 'sd-mobile' : 'sd-desktop'}`}
      >
        {/* Background avec image */}
        <div
          className="sd-background"
          style={{
            backgroundImage: `url(${bgSide})`
          }}
        ></div>

        {/* Header avec logo et titre */}
        <Link
          to="/"
          onClick={() => handleItemClick("dashboard")}
          className="sd-header"
        >
          <div className="sd-logo-wrapper">
            <img
              src={logo}
              alt={getTitle()}
              className="sd-logo"
            />
            <div className="sd-logo-glow"></div>
          </div>
          <div className="sd-title-wrapper">
            <h2 className="sd-title">
              {getTitle()}
            </h2>
            <div className="sd-subtitle">
              {getSubtitle()}
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="sd-nav">
          <ul>
            {menuItems.map((item) => (
              <li
                key={item.tab}
                className={`sd-nav-item ${activeTab === item.tab ? 'sd-active' : ''}`}
                onClick={() => handleItemClick(item.tab)}
                onMouseEnter={() => setHoveredItem(item.tab)}
                onMouseLeave={() => setHoveredItem(null)}
                data-label={item.label}
                title={!sidebarOpen && isMobile ? item.label : undefined}
              >
                {item.icon}
                <span className="sd-label">
                  <span>{item.label}</span>
                </span>
                {item.badge && (
                  <span className="sd-badge">{item.badge}</span>
                )}

                {/* Tooltip enrichi pour la version compacte */}
                {!sidebarOpen && !isMobile && hoveredItem === item.tab && (
                  <div className="sd-tooltip">
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer avec bouton toggle */}
        <div className="sd-footer">
          <button
            className={`sd-toggle-btn ${!sidebarOpen ? 'sd-rotate' : ''}`}
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Réduire le menu" : "Étendre le menu"}
          >
            {sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
        </div>
      </div>

      {/* Overlay mobile */}
      {isMobile && sidebarOpen && (
        <div className="sd-overlay" onClick={toggleSidebar}></div>
      )}
    </>
  );
};

export default Sidebar;