import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import {
  FaUsers,
  FaFileInvoiceDollar,
  FaChartBar,
  FaMoneyBillWave,
} from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';

const Sidebar = ({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab, logo }) => {
  const { activeModule } = useAppContext();

  const commonItems = [
    { icon: <MdDashboard className="nav-icon" />, label: "Tableau de bord", tab: "dashboard" },
    { icon: <FaChartBar className="nav-icon" />, label: "Statistiques", tab: "stats" },
    { icon: <FaUsers className="nav-icon" />, label: "Équipes", tab: "equipes" }
  ];

  const moduleSpecificItems = {
    mentafact: [
      { icon: <FaFileInvoiceDollar className="nav-icon" />, label: "Ment@Fact", tab: "factures" },
      { icon: <FaUsers className="nav-icon" />, label: "Clients", tab: "clients" },
    ],
    payroll: [
      { icon: <FaMoneyBillWave className="nav-icon" />, label: "Ment@Roll", tab: "payrolls" },
      { icon: <FaUsers className="nav-icon" />, label: "Employés", tab: "employees" },

    ]
  };

  const menuItems = [...commonItems, ...moduleSpecificItems[activeModule]];

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <Link
        to="/"
        onClick={() => setActiveTab("dashboard")}
        className="sidebar-header"
        style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}
      >
        <img src={logo} alt="Logo Sam@Salaire" style={{ height: '50px' }} />
        {sidebarOpen && <h2 style={{ margin: 0 }}>SamaSalaire</h2>}
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
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Réduire le menu" : "Agrandir le menu"}
        >
          {sidebarOpen ? '◄' : '►'}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;