import React, { useState, useMemo, useEffect } from "react";
import { useAppContext } from "../contexts/AppContext";
import {
  FaUsers, FaFileInvoiceDollar, FaPlus, FaBolt, FaUserPlus,
  FaFileImport, FaMoneyBillWave, FaFileSignature, FaChartLine,
  FaChartPie, FaCalendarAlt, FaDownload,  FaCheckCircle,
  FaClock,  FaBuilding, 
  FaArrowUp, FaArrowDown, FaEye, FaPrint, FaTrash, FaEdit,
  FaChevronRight, FaChevronLeft, FaSearch, 
  FaCreditCard, FaPercent,  FaBalanceScale, FaTachometerAlt,
  FaRegChartBar, FaRegCalendarCheck, FaRegClock, FaRegUserCircle
} from "react-icons/fa";
import {
  InvoiceChart, EmployeChart, PayrollChart, ContractTypeChart, ClientChart,
  RevenueChart, StatusChart
} from "../components/reports/Charts";
import {
  DocumentSliderCard, PaymentStatusSliderCard
} from '../components/reports/DocumentSliderCard';
import Chart from "react-apexcharts";
import { motion, AnimatePresence } from "framer-motion";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import { formatNumber, formatDate, getStatusColor, getStatusIcon } from "../utils/formatters";

const DashboardPage = ({ stats, allFactures, allDevis, allAvoirs, navigate, employees, payrolls, clients, currentUser }) => {
  const [activeSlide, setActiveSlide] = useState("factures");
  const { activeModule } = useAppContext();
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [selectedChartType, setSelectedChartType] = useState("revenue");

  // Animation d'entrée fluide
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);



  // Configuration des animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  // Configuration du graphique de performance
  const performanceOptions = useMemo(() => ({
    series: [{
      name: 'Performance',
      data: [65, 78, 82, 89, 94, 88, 92, 96, 85, 91, 87, 95]
    }],
    chart: {
      height: 280,
      type: 'area',
      toolbar: { show: true, tools: { download: true, selection: true, zoom: true, pan: true } },
      foreColor: '#9aa0ac',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      },
      sparkline: { enabled: false },
      zoom: { enabled: true }
    },
    colors: ['#4f46e5'],
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 3,
      lineCap: 'round'
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 90, 100]
      }
    },
    markers: {
      size: 4,
      colors: ['#fff'],
      strokeColors: '#4f46e5',
      strokeWidth: 2,
      hover: { size: 7 }
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 5,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } },
      padding: { top: 20, right: 20, bottom: 20, left: 20 }
    },
    xaxis: {
      categories: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#64748b', fontSize: '12px' } }
    },
    yaxis: {
      labels: {
        formatter: (val) => val + '%',
        style: { colors: '#64748b', fontSize: '12px' }
      }
    },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val) => val + '%' }
    }
  }), []);

  // Données pour les KPI
  const kpiData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Calculs pour le mois en cours
    const monthlyRevenue = allFactures?.filter(f => {
      const date = new Date(f.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).reduce((sum, f) => sum + (parseFloat(f.totalTTC) || 0), 0) || 0;

    // Calculs pour le mois précédent
    const previousMonthRevenue = allFactures?.filter(f => {
      const date = new Date(f.date);
      return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
    }).reduce((sum, f) => sum + (parseFloat(f.totalTTC) || 0), 0) || 0;

    const monthlyExpenses = payrolls?.filter(p => {
      const date = new Date(p.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).reduce((sum, p) => sum + (parseFloat(p.netAPayer) || 0), 0) || 0;

    const cashFlow = monthlyRevenue - monthlyExpenses;
    const revenueGrowth = previousMonthRevenue > 0 
      ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(1)
      : 0;

    return {
      monthlyRevenue,
      monthlyExpenses,
      cashFlow,
      revenueGrowth,
      profitMargin: monthlyRevenue > 0 ? ((cashFlow / monthlyRevenue) * 100).toFixed(1) : 0,
      employeeCount: employees?.length || 0,
      clientCount: clients?.length || 0,
      invoiceCount: allFactures?.length || 0,
      pendingInvoices: allFactures?.filter(f => f.statut === "en attente").length || 0,
      averageInvoice: allFactures?.length > 0 
        ? (allFactures.reduce((sum, f) => sum + (parseFloat(f.totalTTC) || 0), 0) / allFactures.length).toFixed(0)
        : 0
    };
  }, [allFactures, payrolls, employees, clients]);

  // Configuration du graphique de flux de trésorerie
  const cashFlowOptions = useMemo(() => ({
    series: [{
      name: 'Revenus',
      data: [45000, 52000, 48000, 58000, 62000, 59000, 65000, 71000, 68000, 72000, 75000, 82000]
    }, {
      name: 'Dépenses',
      data: [38000, 41000, 39000, 43000, 45000, 42000, 48000, 51000, 49000, 53000, 55000, 58000]
    }, {
      name: 'Cash Flow',
      type: 'line',
      data: [7000, 11000, 9000, 15000, 17000, 17000, 17000, 20000, 19000, 19000, 20000, 24000]
    }],
    chart: {
      height: 280,
      type: 'line',
      stacked: false,
      toolbar: { show: true },
      foreColor: '#9aa0ac',
      animations: { enabled: true, easing: 'easeinout', speed: 800 }
    },
    colors: ['#4f46e5', '#ef4444', '#10b981'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 6,
        borderRadiusApplication: 'end'
      }
    },
    dataLabels: { enabled: false },
    stroke: {
      width: [0, 0, 3],
      curve: 'smooth'
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 5,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } }
    },
    xaxis: {
      categories: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        formatter: (val) => val.toLocaleString() + ' FCFA'
      }
    },
    fill: { opacity: [1, 1, 0.1] },
    tooltip: {
      y: {
        formatter: (val) => val.toLocaleString() + ' FCFA'
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      offsetY: -10,
      markers: { radius: 6 }
    }
  }), []);

  // Configuration pour le module actif
  const moduleConfig = {
    mentafact: {
      stats: [
        {
          iconClass: "clients",
          icon: <FaUsers />,
          value: stats.totalClients,
          label: "Clients",
          trend: "+12%",
          trendUp: true,
          subValue: `${clients?.filter(c => c.type === 'client').length || 0} actifs`
        },
        {
          iconClass: "invoices",
          icon: <FaFileInvoiceDollar />,
          value: stats.totalFactures,
          label: "Factures",
          trend: "+8%",
          trendUp: true,
          subValue: `${kpiData.pendingInvoices} en attente`
        },
        {
          iconClass: "revenue",
          icon: <FaMoneyBillWave />,
          value: formatNumber(kpiData.monthlyRevenue) + " FCFA",
          label: "CA Mensuel",
          trend: `${kpiData.revenueGrowth}%`,
          trendUp: parseFloat(kpiData.revenueGrowth) > 0,
          subValue: `Marge: ${kpiData.profitMargin}%`
        },
        {
          iconClass: "cashflow",
          icon: <FaBalanceScale />,
          value: formatNumber(kpiData.cashFlow) + " FCFA",
          label: "Cash Flow",
          trend: `${Math.abs(kpiData.profitMargin)}%`,
          trendUp: kpiData.cashFlow > 0,
          subValue: kpiData.cashFlow > 0 ? "Positif" : "Négatif"
        },
        <DocumentSliderCard key="doc" stats={stats} />,
        <PaymentStatusSliderCard key="payment" stats={stats} showTrend={true} />
      ],
      quickActions: [
        { icon: <FaBolt />, text: "Facture Express", route: "/invoice", color: "#4f46e5", shortcut: "F" },
        { icon: <FaUserPlus />, text: "Nouveau Client", route: "/client/new", color: "#10b981", shortcut: "C" },
        { icon: <FaFileInvoiceDollar />, text: "Devis Rapide", route: "/quote", color: "#f59e0b", shortcut: "D" },
        { icon: <FaFileImport />, text: "Importer", route: "/import", color: "#8b5cf6", shortcut: "I" },
        { icon: <FaCreditCard />, text: "Encaissement", route: "/payment", color: "#ec4899", shortcut: "P" },
        { icon: <FaFileSignature />, text: "Avoir", route: "/credit-note", color: "#14b8a6", shortcut: "A" }
      ],
      charts: [
        {
          title: "Chiffre d'affaires mensuel",
          icon: <FaChartLine />,
          comp: <InvoiceChart invoices={allFactures} enableYearSelection={true} showTrend={true} />,
          type: "revenue"
        },
        {
          title: "Flux de trésorerie",
          icon: <FaMoneyBillWave />,
          comp: <Chart options={cashFlowOptions} series={cashFlowOptions.series} type="line" height={280} />,
          type: "cashflow"
        },
        {
          title: "Statut des factures",
          icon: <FaChartPie />,
          comp: <StatusChart invoices={allFactures} showLegend={true} />,
          type: "status"
        },
        {
          title: "Top 5 Clients",
          icon: <FaChartPie />,
          comp: <ClientChart clients={clients} limit={5} showLegend={true} />,
          type: "clients"
        }
      ]
    },
    payroll: {
      stats: [
        {
          iconClass: "employees",
          icon: <FaUsers />,
          value: stats.totalEmployees,
          label: "Employés",
          trend: "+8%",
          trendUp: true,
          subValue: `${employees?.filter(e => e.typeContrat === "CDI").length || 0} CDI`
        },
        {
          iconClass: "payroll",
          icon: <FaFileSignature />,
          value: stats.totalPayrolls,
          label: "Paies",
          trend: "+3%",
          trendUp: true,
          subValue: `${payrolls?.filter(p => {
            const date = new Date(p.date);
            return date.getMonth() === new Date().getMonth();
          }).length || 0} ce mois`
        },
        {
          iconClass: "masse_salariale",
          icon: <FaMoneyBillWave />,
          value: formatNumber((payrolls || []).reduce((sum, p) => sum + (parseFloat(p?.netAPayer) || 0), 0)) + " FCFA",
          label: "Masse salariale",
          trend: "Stable",
          trendUp: null,
          subValue: `Moyenne: ${formatNumber(kpiData.averageSalary || 0)} FCFA`
        },
        {
          iconClass: "contracts",
          icon: <FaFileSignature />,
          value: employees?.filter(e => e.typeContrat === "CDI").length || 0,
          label: "CDI",
          trend: "+2",
          trendUp: true,
          subValue: `${employees?.filter(e => e.typeContrat === "CDD").length || 0} CDD`
        },
        {
          iconClass: "leaves",
          icon: <FaRegClock />,
          value: employees?.filter(e => e.enConges).length || 0,
          label: "En congés",
          trend: "0",
          trendUp: null,
          subValue: `${employees?.filter(e => e.joursConges > 0).length || 0} avec congés`
        },
        {
          iconClass: "average",
          icon: <FaPercent />,
          value: formatNumber(kpiData.averageSalary || 0) + " FCFA",
          label: "Salaire moyen",
          trend: "+5%",
          trendUp: true,
          subValue: "Net à payer"
        }
      ],
      quickActions: [
        { icon: <FaBolt />, text: "Bulletin Express", route: "/payroll", color: "#4f46e5", shortcut: "B" },
        { icon: <FaUserPlus />, text: "Nouvel Employé", route: "/employee/new", color: "#10b981", shortcut: "E" },
        { icon: <FaFileSignature />, text: "Contrat", route: "/contract", color: "#f59e0b", shortcut: "C" },
        { icon: <FaFileImport />, text: "Importer", route: "/import", color: "#8b5cf6", shortcut: "I" },
        { icon: <FaRegCalendarCheck />, text: "Congés", route: "/leave", color: "#ec4899", shortcut: "L" },
        { icon: <FaPercent />, text: "Charges", route: "/charges", color: "#14b8a6", shortcut: "H" }
      ],
      charts: [
        { 
          title: "Répartition des paies", 
          icon: <FaChartPie />, 
          comp: <PayrollChart payrolls={payrolls} showLegend={true} />,
          type: "payroll"
        },
        { 
          title: "Types de contrat", 
          icon: <FaChartPie />, 
          comp: <ContractTypeChart employees={employees} showLegend={true} />,
          type: "contracts"
        },
        { 
          title: "Répartition des employés", 
          icon: <FaUsers />, 
          comp: <EmployeChart employees={employees} showLegend={true} />,
          type: "employees"
        },
        { 
          title: "Évolution masse salariale", 
          icon: <FaChartLine />, 
          comp: <RevenueChart data={payrolls} showTrend={true} />,
          type: "evolution"
        }
      ]
    }
  };

  const conf = moduleConfig[activeModule];

  // Calcul des meilleurs clients
  const clientMonthlyRevenues = useMemo(() => {
    const monthlyTotals = {};
    (allFactures || []).forEach(facture => {
      const client = facture.clientNom || "Inconnu";
      const montant = Number(facture.totalTTC?.replace(/\s/g, '').replace(',', '.')) || 0;
      const date = facture.date ? new Date(facture.date) : null;
      if (date) {
        const month = date.getMonth();
        if (!monthlyTotals[client]) {
          monthlyTotals[client] = Array(12).fill(0);
        }
        monthlyTotals[client][month] += montant;
      }
    });
    return Object.entries(monthlyTotals)
      .sort((a, b) => b[1].reduce((sum, v) => sum + v, 0) - a[1].reduce((sum, v) => sum + v, 0))
      .slice(0, 5);
  }, [allFactures]);

  const topClientsLineChartOptions = useMemo(() => {
    const categories = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const series = clientMonthlyRevenues.map(([client, monthlyData]) => ({
      name: client,
      data: monthlyData
    }));
    return {
      series,
      chart: {
        height: 300,
        type: "line",
        foreColor: "#9aa0ac",
        toolbar: { show: true },
        animations: { enabled: true, easing: "easeinout", speed: 800 },
        zoom: { enabled: true }
      },
      stroke: { curve: "smooth", width: 3 },
      colors: ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
      markers: { size: 4, hover: { size: 7 } },
      grid: { borderColor: "#e2e8f0", strokeDashArray: 5 },
      xaxis: { categories, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: {
        labels: { formatter: val => val.toLocaleString("fr-FR") + " FCFA" },
        min: 0
      },
      tooltip: {
        theme: "dark",
        y: { formatter: val => val.toLocaleString("fr-FR") + " FCFA" }
      },
      legend: {
        position: "top",
        horizontalAlign: "right",
        offsetY: -10,
        markers: { radius: 6 }
      }
    };
  }, [clientMonthlyRevenues]);

  // Récupère les 5 derniers documents
  const getLastFiveItems = (items) =>
    [...(items || [])].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  const currentItems = {
    factures: getLastFiveItems(allFactures),
    devis: getLastFiveItems(allDevis),
    avoirs: getLastFiveItems(allAvoirs)
  };


  // Gestionnaire pour l'export
  const handleExport = (format) => {
    // Logique d'export à implémenter
    console.log(`Export en format ${format}`);
  };

  if (!isLoaded) {
    return <LoadingState message="Chargement du tableau de bord..." size="large" />;
  }

  return (
    <motion.div
      className="mf-dashboard-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* En-tête du tableau de bord */}
      <motion.div className="mf-dashboard-header" variants={itemVariants}>
        <div className="mf-header-left">
          <h1 className="mf-page-title">
            <FaTachometerAlt className="mf-title-icon" />
            Tableau de bord
            <span className="mf-module-badge">
              {activeModule === 'mentafact' ? 'Fact' : 'Paie'}
            </span>
          </h1>
          <p className="mf-welcome-text">
            <FaRegUserCircle />
            Bienvenue, {currentUser?.name || 'Utilisateur'} • {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="mf-header-right">
          {/* Sélecteur de période rapide */}
          <div className="mf-period-selector">
            <FaCalendarAlt />
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="mf-period-select"
            >
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
              <option value="custom">Personnalisé</option>
            </select>
          </div>


          {/* Bouton d'export */}
          <div className="mf-export-dropdown">
            <button className="mf-export-btn" onClick={() => handleExport('pdf')}>
              <FaDownload />
              Exporter
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards - Version améliorée */}
      <motion.div className="mf-kpi-grid" variants={itemVariants}>
        <motion.div 
          className="mf-kpi-card mf-kpi-primary"
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="mf-kpi-icon-wrapper">
            <FaMoneyBillWave className="mf-kpi-icon" />
          </div>
          <div className="mf-kpi-content">
            <span className="mf-kpi-label">Chiffre d'affaires</span>
            <span className="mf-kpi-value">{formatNumber(kpiData.monthlyRevenue)} FCFA</span>
            <div className="mf-kpi-footer">
              <span className={`mf-kpi-trend ${parseFloat(kpiData.revenueGrowth) > 0 ? 'mf-trend-up' : 'mf-trend-down'}`}>
                {parseFloat(kpiData.revenueGrowth) > 0 ? <FaArrowUp /> : <FaArrowDown />}
                {Math.abs(kpiData.revenueGrowth)}%
              </span>
              <span className="mf-kpi-period">ce mois</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="mf-kpi-card mf-kpi-success"
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="mf-kpi-icon-wrapper">
            <FaCheckCircle className="mf-kpi-icon" />
          </div>
          <div className="mf-kpi-content">
            <span className="mf-kpi-label">Taux de recouvrement</span>
            <span className="mf-kpi-value">{kpiData.collectionRate || 85}%</span>
            <div className="mf-kpi-footer">
              <span className="mf-kpi-trend mf-trend-up">
                <FaArrowUp />5%
              </span>
              <span className="mf-kpi-period">vs mois dernier</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="mf-kpi-card mf-kpi-warning"
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="mf-kpi-icon-wrapper">
            <FaClock className="mf-kpi-icon" />
          </div>
          <div className="mf-kpi-content">
            <span className="mf-kpi-label">En attente</span>
            <span className="mf-kpi-value">{kpiData.pendingInvoices}</span>
            <div className="mf-kpi-footer">
              <span className="mf-kpi-trend mf-trend-neutral">factures</span>
              <span className="mf-kpi-period">
                {formatNumber(kpiData.averageInvoice)} FCFA en moyenne
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="mf-kpi-card mf-kpi-info"
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="mf-kpi-icon-wrapper">
            <FaUsers className="mf-kpi-icon" />
          </div>
          <div className="mf-kpi-content">
            <span className="mf-kpi-label">Clients actifs</span>
            <span className="mf-kpi-value">{kpiData.clientCount}</span>
            <div className="mf-kpi-footer">
              <span className="mf-kpi-trend mf-trend-up">
                <FaArrowUp />12%
              </span>
              <span className="mf-kpi-period">ce trimestre</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Stats Grid - Cartes statistiques */}
      <motion.div className="mf-stats-grid" variants={itemVariants}>
        {conf.stats.map((stat, idx) =>
          React.isValidElement(stat) ? (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {React.cloneElement(stat, {
                className: "mf-stat-card mf-stat-card-slider"
              })}
            </motion.div>
          ) : (
            <motion.div
              key={idx}
              className="mf-stat-card"
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className={`mf-stat-icon ${stat.iconClass}`}>{stat.icon}</div>
              <div className="mf-stat-info">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
                {stat.subValue && (
                  <span className="mf-stat-subvalue">{stat.subValue}</span>
                )}
                {stat.trend && (
                  <div className={`mf-stat-trend ${stat.trendUp === true ? 'mf-trend-up' : stat.trendUp === false ? 'mf-trend-down' : 'mf-trend-neutral'}`}>
                    {stat.trendUp === true && <FaArrowUp />}
                    {stat.trendUp === false && <FaArrowDown />}
                    {stat.trend}
                  </div>
                )}
              </div>
            </motion.div>
          )
        )}
      </motion.div>

      {/* Quick Actions avec bascule */}
      <motion.div className="mf-quick-actions-section" variants={itemVariants}>
        <div className="mf-section-header">
          <div className="mf-section-title">
            <FaBolt />
            <h2>Actions rapides</h2>
          </div>
          <button 
            className="mf-toggle-actions"
            onClick={() => setShowQuickActions(!showQuickActions)}
          >
            {showQuickActions ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
        </div>
        
        <AnimatePresence>
          {showQuickActions && (
            <motion.div 
              className="mf-quick-actions-grid"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {conf.quickActions.map((action, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => navigate(action.route)}
                  className="mf-quick-action"
                  variants={itemVariants}
                  whileHover={{ y: -5, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ '--action-color': action.color }}
                >
                  <div className="mf-action-icon-wrapper" style={{ backgroundColor: `${action.color}20` }}>
                    {React.cloneElement(action.icon, { style: { color: action.color } })}
                  </div>
                  <span>{action.text}</span>
                  {action.shortcut && (
                    <span className="mf-action-shortcut">{action.shortcut}</span>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Charts avec sélecteur de type */}
      <motion.div className="mf-charts-section" variants={itemVariants}>
        <div className="mf-section-header">
          <div className="mf-section-title">
            <FaRegChartBar />
            <h2>Analyses</h2>
          </div>
          <div className="mf-chart-type-selector">
            {conf.charts.map(chart => (
              <button
                key={chart.type}
                className={`mf-chart-type-btn ${selectedChartType === chart.type ? 'mf-active' : ''}`}
                onClick={() => setSelectedChartType(chart.type)}
              >
                {chart.icon}
                <span>{chart.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mf-charts-row">
          {conf.charts
            .filter(chart => chart.type === selectedChartType)
            .map((chart, idx) => (
              <motion.div
                key={idx}
                className="mf-chart-card mf-chart-card-large"
                variants={itemVariants}
                whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
              >
                <div className="mf-chart-header">
                  <div className="mf-chart-title">
                    <div className="mf-chart-icon">{chart.icon}</div>
                    <h3>{chart.title}</h3>
                  </div>
                  <div className="mf-chart-actions">
                    <button className="mf-chart-action" title="Exporter">
                      <FaDownload />
                    </button>
                    <button className="mf-chart-action" title="Agrandir">
                      <FaEye />
                    </button>
                  </div>
                </div>
                <div className="mf-chart-body">
                  {chart.comp}
                </div>
              </motion.div>
            ))}
        </div>
      </motion.div>

      {/* Recent Documents Section */}
      {activeModule === 'mentafact' && (
        <motion.div
          className="mf-recent-documents"
          variants={itemVariants}
        >
          <div className="mf-section-header">
            <div className="mf-section-title">
              <FaFileInvoiceDollar />
              <h2>Derniers documents</h2>
            </div>
            <div className="mf-section-actions">
              <div className="mf-document-search">
                <FaSearch />
                <input 
                  type="text" 
                  placeholder="Rechercher un document..."
                  className="mf-search-input"
                />
              </div>
              <button onClick={() => navigate("/invoice")} className="mf-create-btn">
                <FaPlus />
                Nouveau
              </button>
            </div>
          </div>

          <div className="mf-document-tabs">
            {["factures", "devis", "avoirs"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSlide(tab)}
                className={`mf-tab-btn ${activeSlide === tab ? 'mf-active' : ''}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {currentItems[tab].length > 0 && (
                  <span className="mf-tab-count">{currentItems[tab].length}</span>
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              className="mf-documents-list"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentItems[activeSlide].length > 0 ? (
                currentItems[activeSlide].map((item, idx) => (
                  <motion.div
                    key={item.id}
                    className="mf-document-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -3, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                  >
                    <div className="mf-document-header">
                      <span className="mf-document-number">{item.numero}</span>
                      <span
                        className="mf-document-status"
                        style={{ 
                          backgroundColor: `${getStatusColor(item.statut)}20`, 
                          color: getStatusColor(item.statut) 
                        }}
                      >
                        {getStatusIcon(item.statut)}
                        {item.statut}
                      </span>
                    </div>
                    
                    <div className="mf-document-client">
                      <FaBuilding />
                      <span>{item.clientNom || 'Client inconnu'}</span>
                    </div>
                    
                    <div className="mf-document-details">
                      <div className="mf-detail-row">
                        <span className="mf-detail-label">Montant TTC:</span>
                        <span className="mf-detail-value mf-amount">
                          {formatNumber(parseFloat(item.totalTTC?.replace(/\s/g, '').replace(',', '.')) || 0)} FCFA
                        </span>
                      </div>
                      <div className="mf-detail-row">
                        <span className="mf-detail-label">Date:</span>
                        <span className="mf-detail-value">
                          <FaCalendarAlt />
                          {formatDate(item.date)}
                        </span>
                      </div>
                    </div>

                    <div className="mf-document-actions">
                      <button className="mf-doc-action" title="Voir">
                        <FaEye />
                      </button>
                      <button className="mf-doc-action" title="Modifier">
                        <FaEdit />
                      </button>
                      <button className="mf-doc-action" title="Imprimer">
                        <FaPrint />
                      </button>
                      <button className="mf-doc-action mf-delete" title="Supprimer">
                        <FaTrash />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <EmptyState
                  title={`Aucun ${activeSlide}`}
                  message={`Commencez par créer votre premier ${activeSlide === "factures" ? "facture" : activeSlide === "devis" ? "devis" : "avoir"}`}
                  type={activeSlide === "factures" ? "facture" : activeSlide === "devis" ? "devis" : "avoir"}
                  navigate={navigate}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}

      {/* Performance Charts */}
      <motion.div className="mf-performance-grid" variants={itemVariants}>
        <motion.div className="mf-performance-card" variants={itemVariants}>
          <div className="mf-performance-header">
            <h3>Performance des meilleurs clients</h3>
            <select className="mf-performance-select">
              <option>Cette année</option>
              <option>Année dernière</option>
            </select>
          </div>
          <div className="mf-performance-body">
            {clientMonthlyRevenues.length > 0 ? (
              <Chart
                options={topClientsLineChartOptions}
                series={topClientsLineChartOptions.series}
                type="line"
                height={300}
              />
            ) : (
              <div className="mf-no-data">
                <FaChartLine />
                <p>Aucune donnée disponible</p>
                <span>Les performances des clients apparaîtront ici</span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div className="mf-performance-card" variants={itemVariants}>
          <div className="mf-performance-header">
            <h3>Performance mensuelle</h3>
            <select className="mf-performance-select">
              <option>Performance</option>
              <option>Objectifs</option>
            </select>
          </div>
          <div className="mf-performance-body">
            <Chart
              options={performanceOptions}
              series={performanceOptions.series}
              type="area"
              height={300}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Footer avec résumé */}
      <motion.div className="mf-dashboard-footer" variants={itemVariants}>
        <div className="mf-footer-stats">
          <div className="mf-footer-stat">
            <span className="mf-footer-label">Total documents:</span>
            <span className="mf-footer-value">{stats.totalFactures + stats.totalDevis + stats.totalAvoirs}</span>
          </div>
          <div className="mf-footer-stat">
            <span className="mf-footer-label">Dernière mise à jour:</span>
            <span className="mf-footer-value">{new Date().toLocaleTimeString('fr-FR')}</span>
          </div>
        </div>
        <div className="mf-footer-credits">
          Mentafact • Tableau de bord intelligent
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardPage;