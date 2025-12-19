import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import {
  FaUsers,
  FaFileInvoiceDollar,
  FaChartBar,
  FaMoneyBillWave,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import '../css/side.css';

// Import de l'image de background

const Sidebar = ({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab, logo }) => {
  const { activeModule } = useAppContext();
  const [isMobile, setIsMobile] = useState(false);

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

  const menuItems = [
    { icon: <MdDashboard className="nav-icon" />, label: "Tableau de bord", tab: "dashboard" },
    ...(activeModule === "mentafact" 
      ? [
          { icon: <FaUsers className="nav-icon" />, label: "Clients", tab: "clients" },
          { icon: <FaFileInvoiceDollar className="nav-icon" />, label: "Ment@Fact", tab: "factures" },
        ]
      : [
          { icon: <FaUsers className="nav-icon" />, label: "Employés", tab: "employees" },
          { icon: <FaMoneyBillWave className="nav-icon" />, label: "Ment@Roll", tab: "payrolls" },
        ]
    ),
    { icon: <FaChartBar className="nav-icon" />, label: "Statistiques", tab: "stats" },
    { icon: <FaUsers className="nav-icon" />, label: "Équipes", tab: "equipes" }
  ];

  const handleItemClick = (tab) => {
    setActiveTab(tab);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Bouton mobile - TOUJOURS visible en mode mobile */}
      {isMobile && (
        <button
          className="mobile-toggle-btn"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : 'desktop'}`}>
        
        {/* Background avec image importée */}
        <div 
          className="sidebar-background"
          style={{
            backgroundImage: `linear-gradient(rgba(39, 51, 185, 0.7), rgba(188, 159, 53, 0.6)), url("/bg-side.jpg")`
          }}
        ></div>
        
        <Link
          to="/"
          onClick={() => handleItemClick("dashboard")}
          className="sidebar-header"
        >
          <img 
            src={logo} 
            alt={activeModule === "mentafact" ? "Logo SamaFact" : "Logo SamaSalaire"} 
            className="sidebar-logo" 
          />
          <h2 className="sidebar-title">
            {activeModule === "mentafact" ? "SamaFact" : "SamaSalaire"}
          </h2>
        </Link>

        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => (
              <li
                key={item.tab}
                className={`nav-item ${activeTab === item.tab ? 'active' : ''}`}
                onClick={() => handleItemClick(item.tab)}
              >
                {item.icon}
                <span className="nav-label">{item.label}</span>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bouton toggle pour desktop ET mobile (quand sidebar fermé) */}
        <div className="sidebar-footer">
          <button
            className="toggle-btn"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Réduire le menu" : "Étendre le menu"}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
      </div>

      {/* Overlay mobile */}
      {isMobile && sidebarOpen && (
        <div className="mobile-overlay" onClick={toggleSidebar}></div>
      )}
    </>
  );
};

export default Sidebar;