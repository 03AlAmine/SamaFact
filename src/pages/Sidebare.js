import React, { useState } from 'react';
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
import bgSide from "../assets/bg/bg-side.jpg";


const Sidebar = ({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab, logo }) => {
  const { activeModule } = useAppContext();
  const [isOpen, setIsOpen] = useState(sidebarOpen); // état interne pour gérer l'anim

  const toggleSidebar = () => {
    const layout = document.querySelector(".dashboard-layout");

    if (isOpen) {
      layout.classList.add("closing");
      layout.classList.remove("opening");
    } else {
      layout.classList.add("opening");
      layout.classList.remove("closing");
    }

    setIsOpen(!isOpen);
    setSidebarOpen(!isOpen);

    // Retirer les classes après le plus long délai (3s)
    setTimeout(() => {
      layout.classList.remove("opening", "closing");
    }, 3000);
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

  return (
    <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
      {/* ✅ équivalent du ::before */}
      <div
        className="sidebar-bg"
        style={{
          backgroundImage: `linear-gradient(rgba(39, 51, 185, 0.5), rgba(188, 159, 53, 0.5)), url(${bgSide})`,
          backgroundSize: "cover",
          backgroundPosition: "left",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: -1,
          animation: "zoom-bg 20s ease-in-out infinite alternate",
        }}
      ></div>

      {/* ✅ équivalent du ::after */}
      <div
        className="sidebar-overlay"
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(39, 51, 185, 0.2)",
          animation: "pulse-overlay 5s infinite alternate",
          pointerEvents: "none",
          zIndex: -1,
        }}
      ></div>
      <Link
        to="/"
        onClick={() => setActiveTab("dashboard")}
        className="sidebar-header"
        style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}
      >
        <img src={logo} alt={activeModule === "mentafact" ? "Logo SamaFact" : "Logo SamaSalaire"} style={{ height: '50px' }} />
        {sidebarOpen && (
          <h2 style={{ margin: 0 }}>
            {activeModule === "mentafact" ? "SamaFact" : "SamaSalaire"}
          </h2>
        )}
      </Link>

      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => (
            <li
              key={item.tab}
              className={activeTab === item.tab ? "active" : ""}
              onClick={() => setActiveTab(item.tab)}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button
          className="toggle-sidebar"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Réduire le menu" : "Agrandir le menu"}
        >
          {sidebarOpen ? '◄' : '►'}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
