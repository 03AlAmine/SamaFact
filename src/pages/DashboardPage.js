import React, { useState } from "react";
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

const DashboardPage = ({ stats, allFactures, allDevis, allAvoirs, navigate, employees, payrolls, clients }) => {
  const [activeSlide, setActiveSlide] = useState("factures");
  const { activeModule } = useAppContext();

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
    </>
  );
};

export default DashboardPage;
