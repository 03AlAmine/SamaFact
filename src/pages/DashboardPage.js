import React, { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { useAppContext } from "../contexts/AppContext";
import {
  FaUsers, FaFileInvoiceDollar, FaPlus, FaBolt, FaUserPlus,
  FaFileImport, FaMoneyBillWave, FaFileSignature, FaChartLine,
  FaChartPie, FaCalendarAlt, FaDownload,
  FaClock, FaBuilding, FaEye, FaEdit, FaChevronRight, FaChevronLeft, FaSearch,
  FaTachometerAlt, FaRegChartBar, FaRegClock, FaRegUserCircle,
  FaRegCalendarCheck, FaPercent, FaCreditCard
} from "react-icons/fa";
import { DocumentSliderCard, PaymentStatusSliderCard, TotalAmountSliderCard } from '../components/reports/DocumentSliderCard';
import { motion, AnimatePresence } from "framer-motion";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import { formatNumber, getStatusColor } from "../utils/formatters";

// ── Lazy imports — EN DEHORS du composant, au niveau du module ───────────────
const Chart = lazy(() => import("react-apexcharts"));
const InvoiceChart = lazy(() => import("../components/reports/Charts").then(m => ({ default: m.InvoiceChart })));
const EmployeChart = lazy(() => import("../components/reports/Charts").then(m => ({ default: m.EmployeChart })));
const PayrollChart = lazy(() => import("../components/reports/Charts").then(m => ({ default: m.PayrollChart })));
const ContractTypeChart = lazy(() => import("../components/reports/Charts").then(m => ({ default: m.ContractTypeChart })));

// ── Fallback graphique — EN DEHORS du composant ──────────────────────────────
const ChartSkeleton = () => (
  <div style={{
    height: 300,
    background: "var(--color-background-secondary)",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--color-text-tertiary)",
    fontSize: 13
  }}>
    Chargement du graphique…
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

const DashboardPage = ({ stats, allFactures, allDevis, allAvoirs, navigate, employees, payrolls, clients, currentUser }) => {
  const [activeSlide, setActiveSlide] = useState("factures");
  const { activeModule } = useAppContext();
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [showQuickActions, setShowQuickActions] = useState(true);

  // ── Valeurs par défaut sécurisées ─────────────────────────────────────────
  const safeStats = {
    totalFactures: stats?.totalFactures || 0,
    totalDevis: stats?.totalDevis || 0,
    totalAvoirs: stats?.totalAvoirs || 0,
    totalClients: stats?.totalClients || 0,
    totalEmployees: stats?.totalEmployees || 0,
    totalPayrolls: stats?.totalPayrolls || 0,
    facturesPayees: stats?.facturesPayees || 0,
    facturesImpayees: stats?.facturesImpayees || 0
  };

  // ── Animation d'entrée ────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0, opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 12 }
    }
  };

  // ── KPI ───────────────────────────────────────────────────────────────────
  const kpiData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyRevenue = (allFactures || []).filter(f => {
      if (!f?.date) return false;
      try {
        const date = new Date(f.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      } catch { return false; }
    }).reduce((sum, f) => {
      const amount = parseFloat(f?.totalTTC) || 0;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    return {
      monthlyRevenue: monthlyRevenue || 0,
      pendingInvoices: (allFactures || []).filter(f => f?.statut === "en attente").length || 0,
      activeClients: (clients || []).filter(c => c?.type === "client").length || 0,
      employeeCount: (employees || []).length || 0,
      invoiceCount: (allFactures || []).length || 0
    };
  }, [allFactures, clients, employees]);

  // ── moduleConfig mémoïsé ──────────────────────────────────────────────────
  const moduleConfig = useMemo(() => ({
    mentafact: {
      stats: [
        { icon: <FaMoneyBillWave />, value: formatNumber(kpiData.monthlyRevenue) + " FCFA", label: "CA Mensuel", color: "revenue" },
        { icon: <FaFileInvoiceDollar />, value: safeStats.totalFactures.toString(), label: "Factures", color: "invoices" },
        { icon: <FaClock />, value: kpiData.pendingInvoices.toString(), label: "En attente", color: "warning" },
        { icon: <FaUsers />, value: safeStats.totalClients.toString(), label: "Clients", color: "clients" }
      ],
      sliderCards: [
        <DocumentSliderCard key="doc" stats={safeStats} showTrend={true} />,
        <TotalAmountSliderCard key="total" allFactures={allFactures} allDevis={allDevis} allAvoirs={allAvoirs} className="large" showTrend={true} showName={false} />,
        <PaymentStatusSliderCard key="payment" stats={safeStats} showTrend={true} />
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
          comp: <Suspense fallback={<ChartSkeleton />}><InvoiceChart invoices={allFactures || []} enableYearSelection={true} /></Suspense>,
          type: "revenue"
        }
      ]
    },
    payroll: {
      stats: [
        { icon: <FaUsers />, value: safeStats.totalEmployees.toString(), label: "Employés", color: "employees" },
        { icon: <FaFileSignature />, value: safeStats.totalPayrolls.toString(), label: "Paies", color: "payroll" },
        {
          icon: <FaMoneyBillWave />,
          value: formatNumber((payrolls || []).reduce((sum, p) => sum + (parseFloat(p?.netAPayer) || 0), 0)) + " FCFA",
          label: "Masse salariale",
          color: "masse_salariale"
        },
        {
          icon: <FaRegClock />,
          value: ((employees || []).filter(e => e?.enConges).length || 0).toString(),
          label: "En congés",
          color: "leaves"
        }
      ],
      sliderCards: [],
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
          comp: <Suspense fallback={<ChartSkeleton />}><PayrollChart payrolls={payrolls || []} /></Suspense>,
          type: "payroll"
        },
        {
          title: "Types de contrat",
          icon: <FaChartPie />,
          comp: <Suspense fallback={<ChartSkeleton />}><ContractTypeChart employees={employees || []} /></Suspense>,
          type: "contracts"
        },
        {
          title: "Répartition des employés",
          icon: <FaUsers />,
          comp: <Suspense fallback={<ChartSkeleton />}><EmployeChart employees={employees || []} /></Suspense>,
          type: "employees"
        }
      ]
    }
  }), [kpiData, safeStats, allFactures, allDevis, allAvoirs, payrolls, employees]);

  const conf = moduleConfig[activeModule] || moduleConfig.mentafact;

  // ── Derniers documents ────────────────────────────────────────────────────
  const getLastFiveItems = (items) => {
    if (!items || !Array.isArray(items)) return [];
    return [...items]
      .filter(item => item && item.date)
      .sort((a, b) => {
        try { return new Date(b.date) - new Date(a.date); }
        catch { return 0; }
      })
      .slice(0, 5);
  };

  const currentItems = {
    factures: getLastFiveItems(allFactures),
    devis: getLastFiveItems(allDevis),
    avoirs: getLastFiveItems(allAvoirs)
  };

  // ── Meilleurs clients ─────────────────────────────────────────────────────
  const clientMonthlyRevenues = useMemo(() => {
    const monthlyTotals = {};
    (allFactures || []).forEach(facture => {
      if (!facture) return;
      const client = facture.clientNom || "Inconnu";
      let montant = 0;
      try { montant = Number(facture.totalTTC?.replace(/\s/g, "").replace(",", ".")) || 0; }
      catch { montant = 0; }
      if (isNaN(montant)) montant = 0;
      try {
        const date = facture.date ? new Date(facture.date) : null;
        if (date && !isNaN(date.getTime())) {
          const month = date.getMonth();
          if (!monthlyTotals[client]) monthlyTotals[client] = Array(12).fill(0);
          monthlyTotals[client][month] += montant;
        }
      } catch { /* ignorer */ }
    });
    return Object.entries(monthlyTotals)
      .sort((a, b) => b[1].reduce((s, v) => s + v, 0) - a[1].reduce((s, v) => s + v, 0))
      .slice(0, 5);
  }, [allFactures]);

  // ── Options ApexCharts ────────────────────────────────────────────────────
  const performanceOptions = useMemo(() => ({
    series: [{ name: "Performance", data: [65, 78, 82, 89, 94, 88, 92, 96, 85, 91, 87, 95] }],
    chart: {
      height: 280, type: "area",
      toolbar: { show: true, tools: { download: true, selection: true, zoom: true, pan: true } },
      foreColor: "#9aa0ac",
      animations: { enabled: true, easing: "easeinout", speed: 800 },
      zoom: { enabled: true }
    },
    colors: ["#4f46e5"],
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 3, lineCap: "round" },
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.2, stops: [0, 90, 100] } },
    markers: { size: 4, colors: ["#fff"], strokeColors: "#4f46e5", strokeWidth: 2, hover: { size: 7 } },
    grid: {
      borderColor: "#e2e8f0", strokeDashArray: 5,
      xaxis: { lines: { show: true } }, yaxis: { lines: { show: true } },
      padding: { top: 20, right: 20, bottom: 20, left: 20 }
    },
    xaxis: {
      categories: ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"],
      axisBorder: { show: false }, axisTicks: { show: false },
      labels: { style: { colors: "#64748b", fontSize: "12px" } }
    },
    yaxis: { labels: { formatter: val => val + "%", style: { colors: "#64748b", fontSize: "12px" } } },
    tooltip: { theme: "dark", y: { formatter: val => val + "%" } }
  }), []);

  const topClientsLineChartOptions = useMemo(() => {
    const categories = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const series = clientMonthlyRevenues.map(([client, monthlyData]) => ({
      name: client || "Client",
      data: monthlyData.map(val => isNaN(val) ? 0 : val)
    }));
    return {
      series,
      chart: { height: 300, type: "line", foreColor: "#9aa0ac", toolbar: { show: true }, animations: { enabled: true, easing: "easeinout", speed: 800 }, zoom: { enabled: true } },
      stroke: { curve: "smooth", width: 3 },
      colors: ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
      markers: { size: 4, hover: { size: 7 } },
      grid: { borderColor: "#e2e8f0", strokeDashArray: 5 },
      xaxis: { categories, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { formatter: val => (Number(val) || 0).toLocaleString("fr-FR") + " FCFA" }, min: 0 },
      tooltip: { theme: "dark", y: { formatter: val => (Number(val) || 0).toLocaleString("fr-FR") + " FCFA" } },
      legend: { position: "top", horizontalAlign: "right", offsetY: -10, markers: { radius: 6 } }
    };
  }, [clientMonthlyRevenues]);

  const handleExport = (format) => {
    alert(`Export ${format} en cours de développement`);
  };

  // ── Garde de chargement ───────────────────────────────────────────────────
  if (!isLoaded) {
    return <LoadingState message="Chargement du tableau de bord..." size="large" />;
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <motion.div className="mf-dashboard-container" variants={containerVariants} initial="hidden" animate="visible">

      {/* En-tête */}
      <motion.div className="mf-dashboard-header" variants={itemVariants}>
        <div className="mf-header-left">
          <h1 className="mf-page-title">
            <FaTachometerAlt className="mf-title-icon" />
            Tableau de bord
            <span className="mf-module-badge">{activeModule === "mentafact" ? "Fact" : "Paie"}</span>
          </h1>
          <p className="mf-welcome-text">
            <FaRegUserCircle />
            Bienvenue, {currentUser?.name || "Utilisateur"} • {new Date().toLocaleDateString("fr-FR", {
              weekday: "long", year: "numeric", month: "long", day: "numeric"
            })}
          </p>
        </div>
        <div className="mf-header-right">
          <div className="mf-period-selector">
            <FaCalendarAlt />
            <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="mf-period-select">
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
              <option value="custom">Personnalisé</option>
            </select>
          </div>
          <div className="mf-export-dropdown">
            <button className="mf-export-btn" onClick={() => handleExport("pdf")}>
              <FaDownload /> Exporter
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div className="mf-stats-grid" variants={itemVariants}>
        {conf.stats.map((stat, idx) => (
          <motion.div
            key={idx}
            className={`mf-stat-card mf-stat-${stat.color}`}
            variants={itemVariants}
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className={`mf-stat-icon ${stat.color}`}>{stat.icon}</div>
            <div className="mf-stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Slider Cards */}
      {activeModule === "mentafact" && conf.sliderCards.length > 0 && (
        <motion.div className="mf-slider-cards-grid" variants={itemVariants}>
          {conf.sliderCards.map((card, idx) => (
            <motion.div key={idx} className="mf-slider-card-wrapper" variants={itemVariants} whileHover={{ y: -5 }}>
              {card}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div className="mf-quick-actions-section" variants={itemVariants}>
        <div className="mf-section-header">
          <div className="mf-section-title">
            <FaBolt />
            <h2>Actions rapides</h2>
          </div>
          <button className="mf-toggle-actions" onClick={() => setShowQuickActions(!showQuickActions)}>
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
                  whileHover={{ y: -5, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="mf-action-icon-wrapper" style={{ backgroundColor: `${action.color}20` }}>
                    {React.cloneElement(action.icon, { style: { color: action.color } })}
                  </div>
                  <span>{action.text}</span>
                  {action.shortcut && <span className="mf-action-shortcut">{action.shortcut}</span>}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Graphiques */}
      <motion.div className="mf-charts-section" variants={itemVariants}>
        <div className="mf-section-header">
          <div className="mf-section-title">
            <FaRegChartBar />
            <h2>Aperçu</h2>
          </div>
        </div>
        <div className="mf-charts-row">
          {conf.charts.map((chart, idx) => (
            <motion.div key={idx} className="mf-chart-card" variants={itemVariants} whileHover={{ y: -5 }}>
              <div className="mf-chart-header">
                <div className="mf-chart-title">
                  <div className="mf-chart-icon">{chart.icon}</div>
                  <h3>{chart.title}</h3>
                </div>
              </div>
              <div className="mf-chart-body">
                {chart.comp}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Derniers documents */}
      {activeModule === "mentafact" && (
        <motion.div className="mf-recent-documents" variants={itemVariants}>
          <div className="mf-section-header">
            <div className="mf-section-title">
              <FaFileInvoiceDollar />
              <h2>Derniers documents</h2>
            </div>
            <div className="mf-section-actions">
              <div className="mf-document-search">
                <FaSearch />
                <input type="text" placeholder="Rechercher..." className="mf-search-input" />
              </div>
              <button onClick={() => navigate("/invoice")} className="mf-create-btn">
                <FaPlus /> Nouveau
              </button>
            </div>
          </div>

          <div className="mf-document-tabs">
            {["factures", "devis", "avoirs"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSlide(tab)}
                className={`mf-tab-btn ${activeSlide === tab ? "mf-active" : ""}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="mf-tab-count">{currentItems[tab].length}</span>
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
                  >
                    <div className="mf-document-header">
                      <span className="mf-document-number">{item.numero || "N/A"}</span>
                      <span
                        className="mf-document-status"
                        style={{ backgroundColor: `${getStatusColor(item.statut)}20`, color: getStatusColor(item.statut) }}
                      >
                        {item.statut || "N/A"}
                      </span>
                    </div>
                    <div className="mf-document-client">
                      <FaBuilding />
                      <span>{item.clientNom || "Client inconnu"}</span>
                    </div>
                    <div className="mf-document-details">
                      <div className="mf-detail-row">
                        <span className="mf-detail-label">Montant:</span>
                        <span className="mf-detail-value mf-amount">
                          {formatNumber(parseFloat(item.totalTTC) || 0)} FCFA
                        </span>
                      </div>
                    </div>
                    <div className="mf-document-actions">
                      <button className="mf-doc-action" title="Voir"><FaEye /></button>
                      <button className="mf-doc-action" title="Modifier"><FaEdit /></button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <EmptyState
                  title={`Aucun ${activeSlide}`}
                  message="Commencez par créer votre premier document"
                  type={activeSlide}
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
              <Suspense fallback={<ChartSkeleton />}>
                <Chart
                  options={topClientsLineChartOptions}
                  series={topClientsLineChartOptions.series}
                  type="line"
                  height={300}
                />
              </Suspense>
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
            <Suspense fallback={<ChartSkeleton />}>
              <Chart
                options={performanceOptions}
                series={performanceOptions.series}
                type="area"
                height={300}
              />
            </Suspense>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.div className="mf-dashboard-footer" variants={itemVariants}>
        <div className="mf-footer-stats">
          <div className="mf-footer-stat">
            <span className="mf-footer-label">Total documents:</span>
            <span className="mf-footer-value">
              {(safeStats.totalFactures + safeStats.totalDevis + safeStats.totalAvoirs).toString()}
            </span>
          </div>
          <div className="mf-footer-stat">
            <span className="mf-footer-label">Dernière mise à jour:</span>
            <span className="mf-footer-value">{new Date().toLocaleTimeString("fr-FR")}</span>
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