import React, {  useMemo } from "react";
import { useAppContext } from "../contexts/AppContext";
import { FaUsers, FaChartBar, FaMoneyBillWave, FaFileSignature } from "react-icons/fa";
import {
  InvoiceChart, ClientChart, StatusChart, MonthlyComparisonChart,
  PayrollChart, ContractTypeChart, EmployeChart
} from "../components/Charts";
import {
  DocumentSliderCard, PaymentStatusSliderCard, TotalAmountSliderCard
} from '../components/DocumentSliderCard';
import Chart from "react-apexcharts";


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

  const clientMonthlyRevenues = useMemo(() => {
    const monthlyTotals = {};

    (allFactures || []).forEach(facture => {
      const client = facture.clientNom || "Inconnu";
      const montant = Number(facture.totalTTC?.replace(/\s/g, '').replace(',', '.')) || 0;
      const date = facture.date ? new Date(facture.date) : null;

      if (date) {
        const month = date.getMonth(); // 0 = Janvier, 11 = Décembre
        if (!monthlyTotals[client]) {
          monthlyTotals[client] = Array(12).fill(0); // tableau [0,0,...,0] pour les 12 mois
        }
        monthlyTotals[client][month] += montant;
      }
    });

    // On trie par chiffre d’affaires total et on garde les 3 meilleurs clients
    return Object.entries(monthlyTotals)
      .sort((a, b) => b[1].reduce((sum, v) => sum + v, 0) - a[1].reduce((sum, v) => sum + v, 0))
      .slice(0, 3);
  }, [allFactures]);
  const topClientsLineChartOptions = useMemo(() => {
    const categories = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const series = clientMonthlyRevenues.map(([client, monthlyData]) => ({
      name: client,
      data: monthlyData // ex: [2000, 1500, 0, 3000, ...] pour les 12 mois
    }));

    return {
      series,
      chart: {
        height: 320,
        type: "line",
        foreColor: "#9aa0ac",
        toolbar: { show: false },
        animations: { enabled: true, easing: "easeinout", speed: 800 },
      },
      stroke: { curve: "smooth", width: 3 },
      colors: ["#9F78FF", "#FF7E5F", "#34C38F"],
      markers: { size: 4, hover: { size: 7 } },
      grid: { borderColor: "#9aa0ac", strokeDashArray: 1 },
      xaxis: {
        categories,
        title: { text: "Mois" },
      },
      yaxis: {
        labels: { formatter: val => val.toLocaleString("fr-FR") + " FCFA" },
        min: 0,
      },
      tooltip: {
        theme: "dark",
        y: { formatter: val => val.toLocaleString("fr-FR") + " FCFA" },
      },
      legend: { position: "top", horizontalAlign: "right" },
    };
  }, [clientMonthlyRevenues]);
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

      <div
        className="performance-charts-row"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          marginTop: '20px',
          animationDelay: `1.1s`,
        }}
      >
        {/* Graphique de performance des enseignants */}
        <div className="chart-wrapper" style={{ flex: '1 1 60%', minWidth: '300px' }}>
          <div className="card">
            <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", margin: "0 10px" }}>
              <h2>Performance</h2>
            </div>
            <div className="body">
              <Chart
                options={topClientsLineChartOptions}
                series={topClientsLineChartOptions.series}
                type="line"
                height={300}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
