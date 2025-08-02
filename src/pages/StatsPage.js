import React from "react";
import { FaUsers, } from "react-icons/fa";
import { FaChartBar } from "react-icons/fa";
import { InvoiceChart, ClientChart, StatusChart, MonthlyComparisonChart } from "../components/Charts";
import { DocumentSliderCard, PaymentStatusSliderCard, TotalAmountSliderCard } from '../components/DocumentSliderCard'; // ou directement dans le fichier

const StatsPage = ({ stats, allFactures, allAvoirs, allDevis, clients }) => {

    return (
        <div className="stats-section">
            <h2 className="section-title">
                <FaChartBar style={{ marginRight: "10px" }} />
                Statistiques
            </h2>

            <div className="stats-grid">
                <div className="stat-card large">
                    <div className="stat-icon clients">
                        <FaUsers />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.totalClients}</h3>
                        <p>Clients enregistrés</p>
                        <div className="stat-trend up">+12% ce mois-ci</div>
                    </div>
                </div>
                <DocumentSliderCard stats={stats} className="large" showTrend={true} showName={false}

                />
                <TotalAmountSliderCard
                    allFactures={allFactures}
                    allDevis={allDevis}
                    allAvoirs={allAvoirs}
                    className="large"
                    showTrend={true}
                    showName={false}
                />
                <PaymentStatusSliderCard stats={stats} className="large" showTrend={true} />

                <div className="stat-card large">
                    <div className="stat-icon teams">
                        <FaUsers />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.totalEquipes}</h3>
                        <p>Équipes actives</p>
                        <div className="stat-trend neutral">Stable</div>
                    </div>
                </div>
            </div>

            <div className="charts-container">
                <div className="chart-card">
                    <h3>Chiffre d'affaires mensuel</h3>
                    <div className="chart-container">
                        <InvoiceChart invoices={allFactures} />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Comparaison annuelle</h3>
                    <div className="chart-container">
                        <MonthlyComparisonChart invoices={allFactures} />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Répartition des clients</h3>
                    <div className="chart-container">
                        <ClientChart clients={clients} />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Statut des factures</h3>
                    <div className="chart-container">
                        <StatusChart invoices={allFactures} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsPage;