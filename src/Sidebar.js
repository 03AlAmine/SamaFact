// Sidebar.js
import React from "react";
import { MdDashboard } from "react-icons/md";
import {
    FaFileInvoiceDollar,
    FaUsers,
    FaChartBar,
} from 'react-icons/fa';
import logo from './assets/logo.png';
import { Link } from "react-router-dom";
import './css/side.css'; // Assure-toi d'avoir un fichier CSS pour le style de la sidebar

const Sidebar = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) => {
    return (
        <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
<Link
  to="/"
  onClick={() => setActiveTab("dashboard")}
  className="sidebar-header"
  style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}
>
  <img src={logo} alt="Logo Ment@Bill" style={{ height: '50px' }} />
  <h2 style={{ margin: 0 }}>Ment@Bill</h2>
</Link>


            <nav className="sidebar-nav">
                <ul>
                    <li className={activeTab === "dashboard" ? "active" : ""}>
                        <Link
                            to="/"
                            onClick={() => setActiveTab("dashboard")}
                            className="nav-link"
                        >
                            <MdDashboard className="nav-icon" />
                            {sidebarOpen && <span>Tableau de bord</span>}
                        </Link>
                    </li>
                    <li
                        className={activeTab === "clients" ? "active" : ""}
                        onClick={() => setActiveTab("clients")}
                    >
                        <FaUsers className="nav-icon" />
                        {sidebarOpen && <span>Clients</span>}
                    </li>
                    <li
                        className={activeTab === "factures" ? "active" : ""}
                        onClick={() => setActiveTab("factures")}
                    >
                        <FaFileInvoiceDollar className="nav-icon" />
                        {sidebarOpen && <span>Factures</span>}
                    </li>
                    <li
                        className={activeTab === "stats" ? "active" : ""}
                        onClick={() => setActiveTab("stats")}
                    >
                        <FaChartBar className="nav-icon" />
                        {sidebarOpen && <span>Statistiques</span>}
                    </li>
                    <li
                        className={activeTab === "equipes" ? "active" : ""}
                        onClick={() => setActiveTab("equipes")}
                    >
                        <FaUsers className="nav-icon" />
                        {sidebarOpen && <span>Équipes</span>}
                    </li>
                </ul>
            </nav>
            <div className="sidebar-footer">
                <button className="toggle-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? '◄' : '►'}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;