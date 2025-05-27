import React from "react";
import { MdDashboard } from "react-icons/md";
import { FaUsers, FaFileInvoiceDollar, FaChartBar } from "react-icons/fa";
import "./css/Dashbill.css"; // Assure-toi d'avoir un fichier CSS pour le style
import logo from './assets/logo.png';


const Sidebar = ({ sidebarOpen, activeTab, setActiveTab, setSidebarOpen }) => {
    return (
        <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
            <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={logo} alt="Logo Ment@Bill" style={{ height: '40px' }} />
                <h2 style={{ margin: 0 }}>Ment@Bill</h2>
            </div>
            <nav className="sidebar-nav">
                <ul>
                    <li
                        className={activeTab === "dashboard" ? "active" : ""}
                        onClick={() => setActiveTab("dashboard")}
                    >
                        <MdDashboard className="nav-icon" />
                        {sidebarOpen && <span>Tableau de bord</span>}
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
                <button
                    className="toggle-sidebar"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    {sidebarOpen ? "◄" : "►"}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;