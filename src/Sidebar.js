// Sidebar.js
import React from "react";
import { MdDashboard } from "react-icons/md";
import {
    FaFileInvoiceDollar,
    FaUsers,
    FaChartBar,
    FaMoneyBillWave
} from 'react-icons/fa';
import logo from './assets/Logo_Mf.png';
import { Link } from "react-router-dom";
import { useAppContext } from "./contexts/AppContext";
import bgSide from "./assets/bg/bg-side.jpg";


const Sidebar = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) => {
    const { activeModule } = useAppContext();

    return (
        <div
            className={`sidebar ${sidebarOpen ? "open" : "closed"}`}
            style={{ "--sidebar-bg": `url(${bgSide})` }}
        >
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
                    {/* Tableau de bord */}
                    <Link
                        to="/"
                        onClick={() => setActiveTab("dashboard")}
                        className="nav-link"
                    >
                        <li className={activeTab === "dashboard" ? "active" : ""}>
                            <MdDashboard className="nav-icon" />
                            {sidebarOpen && <span>Tableau de bord</span>}
                        </li>
                    </Link>

                    {/* Onglets spécifiques au module actif */}
                    {activeModule === "mentafact" && (
                        <>

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
                                {sidebarOpen && <span>Ment@Fact</span>}
                            </li>
                        </>
                    )}

                    {activeModule === "payroll" && (
                        <>
                            <li
                                className={activeTab === "employees" ? "active" : ""}
                                onClick={() => setActiveTab("employees")}
                            >
                                <FaUsers className="nav-icon" />
                                {sidebarOpen && <span>Employés</span>}
                            </li>
                            <li
                                className={activeTab === "payrolls" ? "active" : ""}
                                onClick={() => setActiveTab("payrolls")}
                            >
                                <FaMoneyBillWave className="nav-icon" />
                                {sidebarOpen && <span>Ment@Roll</span>}
                            </li>


                        </>
                    )}

                    {/* Statistiques */}
                    <li
                        className={activeTab === "stats" ? "active" : ""}
                        onClick={() => setActiveTab("stats")}
                    >
                        <FaChartBar className="nav-icon" />
                        {sidebarOpen && <span>Statistiques</span>}
                    </li>

                    {/* Équipes */}
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
                    aria-label={sidebarOpen ? "Réduire le menu" : "Agrandir le menu"}
                >
                    {sidebarOpen ? '◄' : '►'}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
