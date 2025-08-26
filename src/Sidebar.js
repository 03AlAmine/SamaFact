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


const Sidebar = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) => {
    const { activeModule } = useAppContext();

    return (
        <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
            {/* ✅ équivalent du ::before */}
            <div
                className="sidebar-bg"
                style={{
                    backgroundImage: `linear-gradient(rgba(39, 51, 185, 0.5), rgba(188, 159, 53, 0.5)), url("/bg-side.jpg")`,
                    backgroundSize: "cover",
                    backgroundPosition: "left", // 👈 à la place de "start"
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
