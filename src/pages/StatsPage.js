import React from "react";
import { useAppContext } from "../contexts/AppContext";
import { FaUsers, FaChartBar, FaMoneyBillWave, FaFileSignature } from "react-icons/fa";
import {
  InvoiceChart, ClientChart, StatusChart, MonthlyComparisonChart,
  PayrollChart, ContractTypeChart, EmployeChart
} from "../components/Charts";
import {
  DocumentSliderCard, PaymentStatusSliderCard, TotalAmountSliderCard
} from '../components/DocumentSliderCard';


const StatsPage = ({ stats, allFactures, allAvoirs, allDevis, clients, payrolls, employees }) => {
  const { activeModule } = useAppContext();

  const moduleConfig = {
    mentafact: {
      stats: [
        {
          iconClass: "clients",
          icon: <FaUsers />,
          value: stats.totalClients,
          label: "Clients enregistrés",
          trend: "+12% ce mois-ci",
          trendClass: "up"
        },
        <DocumentSliderCard key="doc" stats={stats} className="large" showTrend={true} showName={false} />,
        <TotalAmountSliderCard key="total" allFactures={allFactures} allDevis={allDevis} allAvoirs={allAvoirs} className="large" showTrend={true} showName={false} />,
        <PaymentStatusSliderCard key="payment" stats={stats} className="large" showTrend={true} />,
        {
          iconClass: "teams",
          icon: <FaUsers />,
          value: stats.totalEquipes,
          label: "Équipes actives",
          trend: "Stable",
          trendClass: "neutral"
        }
      ],
      charts: [
        { title: "Chiffre d'affaires mensuel", comp: <InvoiceChart invoices={allFactures} /> },
        { title: "Comparaison annuelle", comp: <MonthlyComparisonChart invoices={allFactures} /> },
        { title: "Répartition des clients", comp: <ClientChart clients={clients} /> },
        { title: "Statut des factures", comp: <StatusChart invoices={allFactures} /> }
      ]
    },
    payroll: {
      stats: [
        {
          iconClass: "employees",
          icon: <FaUsers />,
          value: stats.totalEmployees,
          label: "Employés",
          trend: "+5% ce mois-ci",
          trendClass: "up"
        },
        {
          iconClass: "payroll",
          icon: <FaFileSignature />,
          value: stats.totalPayrolls,
          label: "Paies",
          trend: "+2% ce mois-ci",
          trendClass: "up"
        },
        {
          iconClass: "masse_salariale",
          icon: <FaMoneyBillWave />,
          value: (payrolls || []).reduce((sum, p) => sum + (parseFloat(p?.netAPayer) || 0), 0).toLocaleString('fr-FR') + " FCFA",
          label: "Masse salariale",
          trend: "Stable",
          trendClass: "neutral"
        }
      ],
      charts: [
        { title: "Répartition des paies", comp: <PayrollChart payrolls={payrolls} /> },
        { title: "Types de contrat", comp: <ContractTypeChart employees={employees} /> },
        { title: "Répartition des employés", comp: <EmployeChart employees={employees} /> }
      ]
    }
  };

  const conf = moduleConfig[activeModule];

  return (
    <div
      className="stats-section"
      style={{
        backgroundImage: `url(/bg-stat.jpg)`
      }}
    >
      <h2 className="section-title">
        <FaChartBar style={{ marginRight: "10px" }} />
        Statistiques
      </h2>

      {/* Bloc stats */}
      <div className="stats-grid">
        {conf.stats.map((stat, idx) =>
          React.isValidElement(stat) ? (
            stat
          ) : (
            <div key={idx} className="stat-card large">
              <div className={`stat-icon ${stat.iconClass}`}>{stat.icon}</div>
              <div className="stat-info">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
                <div className={`stat-trend ${stat.trendClass}`}>{stat.trend}</div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Graphiques */}
      <div className="charts-container">
        {conf.charts.map((chart, idx) => (
          <div key={idx} className="chart-card-stat">
            <h3>{chart.title}</h3>
            <div className="chart-container">{chart.comp}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsPage;
