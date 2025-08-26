import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import {
  FaUsers,
  FaFileInvoiceDollar,
  FaChartBar,
  FaMoneyBillWave,
} from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import '../css/side.css';

const Sidebar = ({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab, logo }) => {
  const { activeModule } = useAppContext();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Si on passe en mode desktop et que la sidebar est fermée, on l'ouvre
      if (!mobile && !sidebarOpen) {
        setSidebarOpen(true);
      }
      
      // Si on passe en mode mobile et que la sidebar est ouverte, on la ferme
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen, setSidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const dashboardItem = [
    { icon: <MdDashboard className="nav-icon" />, label: "Tableau de bord", tab: "dashboard" }
  ];

  const bottomItems = [
    { icon: <FaChartBar className="nav-icon" />, label: "Statistiques", tab: "stats" },
    { icon: <FaUsers className="nav-icon" />, label: "Équipes", tab: "equipes" }
  ];

  const moduleSpecificItems = {
    mentafact: [
      { icon: <FaUsers className="nav-icon" />, label: "Clients", tab: "clients" },
      { icon: <FaFileInvoiceDollar className="nav-icon" />, label: "Ment@Fact", tab: "factures" },
    ],
    payroll: [
      { icon: <FaUsers className="nav-icon" />, label: "Employés", tab: "employees" },
      { icon: <FaMoneyBillWave className="nav-icon" />, label: "Ment@Roll", tab: "payrolls" },
    ]
  };

  const menuItems = [
    ...dashboardItem,
    ...moduleSpecificItems[activeModule],
    ...bottomItems
  ];

  const handleItemClick = (tab) => {
    setActiveTab(tab);
    if (isMobile) {
      // Fermer le menu après avoir cliqué sur un élément en mode mobile
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Bouton d'ouverture en mode mobile */}
      {isMobile && (
        <button
          className="mobile-menu-button"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Réduire le menu" : "Agrandir le menu"}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? '' : 'closed'} ${isMobile ? 'mobile' : ''}`}>
        <div
          className="sidebar-bg"
          style={{
            backgroundImage: `linear-gradient(rgba(39, 51, 185, 0.5), rgba(188, 159, 53, 0.5)), url("/bg-side.jpg")`,
            backgroundSize: "cover",
            backgroundPosition: "left",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: -1,
          }}
        ></div>

        <div
          className="sidebar-overlay"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(39, 51, 185, 0.2)",
            pointerEvents: "none",
            zIndex: -1,
          }}
        ></div>

        <Link
          to="/"
          onClick={() => handleItemClick("dashboard")}
          className="sidebar-header"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}
        >
          <img src={logo} alt={activeModule === "mentafact" ? "Logo SamaFact" : "Logo SamaSalaire"} style={{ height: '50px' }} />
          <h2 style={{ margin: 0 }}>
            {activeModule === "mentafact" ? "SamaFact" : "SamaSalaire"}
          </h2>
        </Link>

        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => (
              <li
                key={item.tab}
                className={activeTab === item.tab ? "active" : ""}
                onClick={() => handleItemClick(item.tab)}
              >
                {item.icon}
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </nav>

        {!isMobile && (
          <div className="sidebar-footer">
            <button
              className="toggle-sidebar"
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? "Réduire le menu" : "Agrandir le menu"}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>
        )}
      </div>

      {/* Overlay pour mobile quand la sidebar est ouverte */}
      {isMobile && sidebarOpen && (
        <div
          className="sidebar-overlay-mobile"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};

export default Sidebar;