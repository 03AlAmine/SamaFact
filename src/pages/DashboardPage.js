import React, { useState } from "react";
import { FaUsers, FaFileInvoiceDollar, FaPlus, FaBolt, FaUserPlus, FaFileImport } from "react-icons/fa";
import { InvoiceChart, ClientChart } from "../components/Charts";
import { DocumentSliderCard, MonthlyAmountSliderCard, PaymentStatusSliderCard } from '../components/DocumentSliderCard'; // ou directement dans le fichier

const DashboardPage = ({ stats, allFactures, allDevis, allAvoirs, navigate, clients }) => {
    const [activeSlide, setActiveSlide] = useState("factures");

    const getLastThreeItems = (items) => [...items]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

    const currentItems = {
        factures: getLastThreeItems(allFactures),
        devis: getLastThreeItems(allDevis),
        avoirs: getLastThreeItems(allAvoirs)
    };

    return (

        <>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon clients">
                        <FaUsers />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.totalClients}</h3>
                        <p>Clients</p>
                    </div>
                </div>
                <DocumentSliderCard stats={stats} />
                <MonthlyAmountSliderCard stats={stats} allFactures={allFactures} allDevis={allDevis} allAvoirs={allAvoirs} />
                <PaymentStatusSliderCard stats={stats} />

            </div>

            {/* Actions rapides */}
            <div className="quick-actions-grid">
                <button onClick={() => navigate("/bill")} className="quick-action">
                    <FaBolt className="action-icon" />
                    <span>Facture Express</span>
                </button>
                <button onClick={() => navigate("/client/new")} className="quick-action">
                    <FaUserPlus className="action-icon" />
                    <span>Nouveau Client</span>
                </button>
                <button onClick={() => navigate("/import")} className="quick-action">
                    <FaFileImport className="action-icon" />
                    <span>Importer</span>
                </button>
            </div>
            <div className="charts-row">
                <div className="chart-card">
                    <h3>Chiffre d'affaires mensuel</h3>
                    <div className="chart-container">
                        <InvoiceChart invoices={allFactures} />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Répartition des clients</h3>
                    <div className="chart-container">
                        <ClientChart clients={clients} />
                    </div>
                </div>
            </div>
            {/* Derniers documents (factures/devis/avoirs) */}
            <div className="recent-invoices">
                <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2 className="section-title" style={{ display: "flex", alignItems: "center", margin: 0 }}>
                        <FaFileInvoiceDollar style={{ marginRight: "10px" }} />
                        Derniers documents
                    </h2>

                    <div className="invoices-actions" style={{ display: "flex", gap: "10px" }}>
                        <button onClick={() => navigate("/bill")} className="create-invoice-btn">
                            <FaPlus style={{ marginRight: "8px" }} />
                            Créer une facture
                        </button>
                    </div>
                </div>

                {/* Onglets de sélection */}
                <div className="slider-tabs" style={{ display: "flex", gap: "20px", marginBottom: "10px" }}>
                    {["factures", "devis", "avoirs"].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveSlide(tab)}
                            style={{
                                padding: "8px 16px",
                                background: activeSlide === tab ? "#333" : "#eee",
                                color: activeSlide === tab ? "#fff" : "#000",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer"
                            }}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Affichage des documents */}
                {currentItems[activeSlide].length > 0 ? (
                    <div className="invoices-list">
                        {currentItems[activeSlide].map(item => (
                            <div key={item.id} className="invoice-card">
                                <div className="invoice-header">
                                    <span className="invoice-number">{item.numero}</span>
                                    <span className={`invoice-status ${item.statut}`}>
                                        {item.statut}
                                    </span>
                                </div>
                                <div className="invoice-client">{item.clientNom}</div>
                                <div className="invoice-details">
                                    <span className="invoice-amount">{
                                        item.totalTTC
                                            ? Number(item.totalTTC.replace(/\s/g, '').replace(',', '.')).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                                            : '0'
                                    } FCFA</span>
                                    <span className="invoice-date">
                                        {item.date ? new Date(item.date).toLocaleDateString('fr-FR') : 'Date invalide'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>Aucun {activeSlide} trouvé</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default DashboardPage;