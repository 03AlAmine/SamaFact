import React, { useState, useMemo, useEffect } from "react";
import { useAppContext } from "../contexts/AppContext";
import {
  FaUsers, FaFileInvoiceDollar, FaPlus, FaBolt, FaUserPlus,
  FaFileImport, FaMoneyBillWave, FaFileSignature
} from "react-icons/fa";
import {
  InvoiceChart, EmployeChart, PayrollChart, ContractTypeChart, ClientChart
} from "../components/reports/Charts";
import {
  DocumentSliderCard, MonthlyAmountSliderCard, PaymentStatusSliderCard
} from '../components/reports/DocumentSliderCard';
import Chart from "react-apexcharts";

const DashboardPage = ({ stats, allFactures, allDevis, allAvoirs, navigate, employees, payrolls, clients }) => {
  const [activeSlide, setActiveSlide] = useState("factures");
  const { activeModule } = useAppContext();
  const [isLoaded, setIsLoaded] = useState(false);

  // Animation d'entrée fluide
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

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
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
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
        <PaymentStatusSliderCard key="payment" stats={stats} />,
        {
          iconClass: "users",
          icon: <FaUsers />,
          value: stats.totalUsers,
          label: "Utilisateurs"
        },
      ],
      quickActions: [
        { icon: <FaBolt className="action-icon" />, text: "Facture Express", route: "/invoice" },
        { icon: <FaUserPlus className="action-icon" />, text: "Nouvel Client", route: "/employee/new" }
      ],
      charts: [
        {
          title: "Chiffre d'affaires mensuel",
          comp: <InvoiceChart invoices={allFactures} enableYearSelection={false} />
        },
        {
          title: "Répartition des clients",
          comp: <ClientChart clients={clients} />
        }
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
    <div className={`dashboard-container ${isLoaded ? 'loaded' : ''}`}>
      {/* Bloc stats */}
      <div className="stats-grid">
        {conf.stats.map((stat, idx) =>
          React.isValidElement(stat) ? (
            React.cloneElement(stat, {
              key: idx,
              style: {
                animationDelay: `${idx * 0.1}s`,
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateY(0)' : 'translateY(20px)'
              }
            })
          ) : (
            <div
              key={idx}
              className="stat-card"
              style={{
                animationDelay: `${idx * 0.1}s`,
                opacity: isLoaded ? 1 : 0,
              }}
            >
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
          <button
            key={idx}
            onClick={() => navigate(action.route)}
            className="quick-action"
            style={{
              animationDelay: `${0.1 + idx * 0.1}s`,
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)'
            }}
          >
            {React.cloneElement(action.icon, { className: "action-icon" })}
            <span>{action.text}</span>
          </button>
        ))}
        <button
          onClick={() => navigate("/import")}
          className="quick-action"
          style={{
            animationDelay: `${0.1 + conf.quickActions.length * 0.1}s`,
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)'
          }}
        >
          <FaFileImport className="action-icon" />
          <span>Importer</span>
        </button>
      </div>

      {/* Graphiques */}
      <div className="charts-row">
        {conf.charts.map((chart, idx) => (
          <div
            key={idx}
            className="chart-card"
            style={{
              animationDelay: `${0.6 + idx * 0.15}s`,
              opacity: isLoaded ? 1 : 0,
            }}
          >
            <h3>{chart.title}</h3>
            <div className="chart-container">{chart.comp}</div>
          </div>
        ))}
      </div>

      {/* Derniers documents pour mentafact */}
      {activeModule === 'mentafact' && (
        <div
          className="recent-invoices"
          style={{
            animationDelay: `0.8s`,
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          <div className=" section-header-dash">
            <h2 className=" section-title-dash">
              <FaFileInvoiceDollar />
              Derniers documents
            </h2>
            <button onClick={() => navigate("/invoice")} className="create-invoice-btn">
              <FaPlus />
              Créer une facture
            </button>
          </div>

          <div className="slider-tabs">
            {["factures", "devis", "avoirs"].map((tab, idx) => (
              <button
                key={tab}
                onClick={() => setActiveSlide(tab)}
                className={activeSlide === tab ? "active" : ""}
                style={{
                  animationDelay: `${0.9 + idx * 0.1}s`,
                  opacity: isLoaded ? 1 : 0,
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Liste */}
          {currentItems[activeSlide].length > 0 ? (
            <div className="invoices-list">
              {currentItems[activeSlide].map((item, idx) => (
                <div
                  key={item.id}
                  className="invoice-card"
                  style={{
                    animationDelay: `${1.0 + idx * 0.1}s`,
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0)' : 'translateY(10px)'
                  }}
                >
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
            <div
              className="empty-state"
              style={{
                animationDelay: `1.0s`,
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateY(0)' : 'translateY(10px)'
              }}
            >
              <p>Aucun {activeSlide} trouvé</p>
            </div>
          )}
        </div>
      )}

      {/* Graphiques de performance */}
      <div className="performance-charts-row">
        {/* Top Clients Chart */}
        <div className="card">
          <div className="header">
            <h2>Performance des meilleurs clients</h2>
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

        {/* Student Performance Chart */}
        <div className="card">
          <div className="header">
            <h2>Performance mensuelle</h2>
          </div>
          <div className="body">
            <Chart
              options={studentPerformanceOptions}
              series={studentPerformanceOptions.series}
              type="bar"
              height={300}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;