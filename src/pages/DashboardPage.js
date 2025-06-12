import React from "react";
import { FaUsers, FaFileInvoiceDollar, FaChartLine, FaBell, FaPlus } from "react-icons/fa";
import { InvoiceChart, ClientChart } from "../components/Charts";

const DashboardPage = ({ stats, allFactures, navigate, clients }) => {
    const getLastThreeInvoices = () => [...allFactures]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

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
                <div className="stat-card">
                    <div className="stat-icon invoices">
                        <FaFileInvoiceDollar />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.totalFactures}</h3>
                        <p>Factures</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon revenue">
                        <FaChartLine />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.revenusMensuels.toLocaleString()} FCFA</h3>
                        <p>Facturations mensuels</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon pending">
                        <FaBell />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.facturesImpayees}</h3>
                        <p>Impayées</p>
                    </div>
                </div>
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

            <div className="recent-invoices">
                <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2 className="section-title" style={{ display: "flex", alignItems: "center", margin: 0 }}>
                        <FaFileInvoiceDollar style={{ marginRight: "10px" }} />
                        Dernières factures
                    </h2>

                    <div className="invoices-actions" style={{ display: "flex", gap: "10px" }}>
                        <button onClick={() => navigate("/bill")} className="create-invoice-btn">
                            <FaPlus style={{ marginRight: "8px" }} />
                            Créer une facture
                        </button>
                    </div>
                </div>

                {allFactures.length > 0 ? (
                    <div className="invoices-list">
                        {getLastThreeInvoices().map(invoice => (
                            <div key={invoice.id} className="invoice-card">
                                <div className="invoice-header">
                                    <span className="invoice-number">{invoice.numero}</span>
                                    <span className={`invoice-status ${invoice.statut}`}>
                                        {invoice.statut}
                                    </span>
                                </div>
                                <div className="invoice-client">{invoice.clientNom}</div>
                                <div className="invoice-details">
                                    <span className="invoice-amount">{invoice.totalTTC} FCFA</span>
                                    <span className="invoice-date">
                                        {invoice.date ? new Date(invoice.date).toLocaleDateString('fr-FR') : 'Date invalide'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>Aucune facture trouvée</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default DashboardPage;