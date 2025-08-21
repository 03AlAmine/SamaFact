import React, { useState, useMemo } from "react";
import { useAppContext } from "../contexts/AppContext";
import {
  FaUsers, FaFileInvoiceDollar, FaPlus, FaBolt, FaUserPlus,
  FaFileImport, FaMoneyBillWave, FaFileSignature
} from "react-icons/fa";
import {
  InvoiceChart, EmployeChart, PayrollChart, ContractTypeChart, ClientChart
} from "../components/Charts";
import {
  DocumentSliderCard, MonthlyAmountSliderCard, PaymentStatusSliderCard
} from '../components/DocumentSliderCard';
import Chart from "react-apexcharts";

const DashboardPage = ({ stats, allFactures, allDevis, allAvoirs, navigate, employees, payrolls, clients }) => {
  const [activeSlide, setActiveSlide] = useState("factures");
  const { activeModule } = useAppContext();

  // Configuration du graphique de performance des étudiants
  const studentPerformanceOptions = useMemo(() => ({
    series: [
      {
        name: 'percent',
        data: [5, 8, 10, 14, 9, 7, 11, 5, 9, 16, 7, 5],
      },
    ],
    chart: {
      height: 320,
      type: 'bar',
      toolbar: {
        show: false,
      },
      foreColor: '#9aa0ac',
    },
    plotOptions: {
      bar: {
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val + '%';
      },
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: ['#9aa0ac'],
      },
    },
    grid: {
      show: true,
      borderColor: '#9aa0ac',
      strokeDashArray: 1,
    },
    xaxis: {
      categories: [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ],
      position: 'bottom',
      labels: {
        offsetY: 0,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      crosshairs: {
        fill: {
          type: 'gradient',
          gradient: {
            colorFrom: '#D8E3F0',
            colorTo: '#BED1E6',
            stops: [0, 100],
            opacityFrom: 0.4,
            opacityTo: 0.5,
          },
        },
      },
      tooltip: {
        enabled: true,
        offsetY: -35,
      },
    },
    fill: {
      type: 'gradient',
      colors: ['#4F86F8', '#4F86F8'],
      gradient: {
        shade: 'light',
        type: 'horizontal',
        shadeIntensity: 0.25,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
      },
    },
    yaxis: {
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        show: false,
        formatter: function (val) {
          return val + '%';
        },
      },
    },
    tooltip: {
      theme: 'dark',
      marker: {
        show: true,
      },
      x: {
        show: true,
      },
    },
  }), []);

  const lineChartOptions = {
    series: [
      { name: "Teacher 1", data: [15, 13, 30, 23, 13, 32, 27] },
      { name: "Teacher 2", data: [12, 25, 14, 18, 27, 13, 21] },
      { name: "Teacher 3", data: [20, 18, 25, 22, 30, 28, 35] },
    ],
    chart: {
      height: 270,
      type: "line",
      foreColor: "#9aa0ac",
      dropShadow: { enabled: true, color: "#000", top: 18, left: 7, blur: 10, opacity: 0.2 },
      toolbar: { show: false },
    },
    colors: ["#9F78FF", "#858585", "#34c38f"],
    stroke: { curve: "smooth" },
    grid: { show: true, borderColor: "#9aa0ac", strokeDashArray: 1 },
    markers: { size: 3 },
    xaxis: { categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"], title: { text: "Month" } },
    yaxis: { min: 5, max: 40 },
    legend: { position: "top", horizontalAlign: "right", floating: true, offsetY: -25, offsetX: -5 },
    tooltip: { theme: "dark", marker: { show: true }, x: { show: true } },
  };

  // Récupère les 3 derniers éléments
  const getLastThreeItems = (items) =>
    [...items].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);

  const currentItems = {
    factures: getLastThreeItems(allFactures),
    devis: getLastThreeItems(allDevis),
    avoirs: getLastThreeItems(allAvoirs)
  };

  // Configuration par module
  const moduleConfig = {
    mentafact: {
      stats: [
        {
          iconClass: "clients",
          icon: <FaUsers />,
          value: stats.totalClients,
          label: "Clients"
        },
        <DocumentSliderCard key="doc" stats={stats} />,
        <MonthlyAmountSliderCard key="monthly" stats={stats} allFactures={allFactures} allDevis={allDevis} allAvoirs={allAvoirs} />,
        <PaymentStatusSliderCard key="payment" stats={stats} />
      ],
      quickActions: [
        { icon: <FaBolt className="action-icon" />, text: "Facture Express", route: "/bill" },
        { icon: <FaUserPlus className="action-icon" />, text: "Nouvel Client", route: "/employee/new" }
      ],
      charts: [
        { title: "Chiffre d'affaires mensuel", comp: <InvoiceChart invoices={allFactures} /> },
        { title: "Répartition des clients", comp: <ClientChart clients={clients} /> }
      ]
    },
    payroll: {
      stats: [
        {
          iconClass: "employees",
          icon: <FaUsers />,
          value: stats.totalEmployees,
          label: "Employés"
        },
        {
          iconClass: "payroll",
          icon: <FaFileSignature />,
          value: stats.totalPayrolls,
          label: "Paies"
        },
        {
          iconClass: "masse_salariale",
          icon: <FaMoneyBillWave />,
          value: (payrolls || []).reduce((sum, p) => sum + (parseFloat(p?.netAPayer) || 0), 0).toLocaleString('fr-FR') + " FCFA",
          label: "Masse salariale"
        }
      ],
      quickActions: [
        { icon: <FaBolt className="action-icon" />, text: "Bulletin Express", route: "/payroll" },
        { icon: <FaUserPlus className="action-icon" />, text: "Nouvel Employé", route: "/employee/new" }
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
    <>
      {/* Bloc stats */}
      <div className="stats-grid">
        {conf.stats.map((stat, idx) =>
          React.isValidElement(stat) ? (
            stat
          ) : (
            <div key={idx} className="stat-card">
              <div className={`stat-icon ${stat.iconClass}`}>{stat.icon}</div>
              <div className="stat-info">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            </div>
          )
        )}
      </div>

      {/* Actions rapides */}
      <div className="quick-actions-grid">
        {conf.quickActions.map((action, idx) => (
          <button key={idx} onClick={() => navigate(action.route)} className="quick-action">
            {action.icon}
            <span>{action.text}</span>
          </button>
        ))}
        <button onClick={() => navigate("/import")} className="quick-action">
          <FaFileImport className="action-icon" />
          <span>Importer</span>
        </button>
      </div>

      {/* Graphiques */}
      <div className="charts-row">
        {conf.charts.map((chart, idx) => (
          <div key={idx} className="chart-card">
            <h3>{chart.title}</h3>
            <div className="chart-container">{chart.comp}</div>
          </div>
        ))}
      </div>

      {/* Derniers documents pour mentafact */}
      {activeModule === 'mentafact' && (
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

          {/* Onglets */}
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

          {/* Liste */}
          {currentItems[activeSlide].length > 0 ? (
            <div className="invoices-list">
              {currentItems[activeSlide].map(item => (
                <div key={item.id} className="invoice-card">
                  <div className="invoice-header">
                    <span className="invoice-number">{item.numero}</span>
                    <span className={`invoice-status ${item.statut}`}>{item.statut}</span>
                  </div>
                  <div className="invoice-client">{item.clientNom}</div>
                  <div className="invoice-details">
                    <span className="invoice-amount">
                      {item.totalTTC
                        ? Number(item.totalTTC.replace(/\s/g, '').replace(',', '.')).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                        : '0'} FCFA
                    </span>
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
      )}

      {/* Graphiques de performance */}
      <div className="performance-charts-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px' }}>
        {/* Graphique de performance des enseignants */}
        <div className="chart-wrapper" style={{ flex: '1 1 60%', minWidth: '300px' }}>
          <div className="card">
            <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>Teacher Performance</h2>
            </div>
            <div className="body">
              <Chart
                options={lineChartOptions}
                series={lineChartOptions.series}
                type="line"
                height={270}
              />
            </div>
          </div>
        </div>

        {/* Graphique de performance des étudiants */}
        <div className="chart-wrapper" style={{ flex: '1 1 35%', minWidth: '300px' }}>
          <div className="card">
            <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>Student Performance</h2>
              <div className="dropdown">
                <button className="dropdown-toggle" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <span className="material-icons">more_vert</span>
                </button>
              </div>
            </div>
            <div className="body">
              <Chart
                options={studentPerformanceOptions}
                series={studentPerformanceOptions.series}
                type="bar"
                height={270}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;