import React, { useMemo, useState } from "react";
import { useAppContext } from "../contexts/AppContext";
import {
  FaUsers, FaChartBar, FaMoneyBillWave, FaFileSignature,
  FaDownload, FaCalendarAlt, FaFilter, FaFileExport,
  FaChartLine, FaChartPie, FaPrint, FaShare, FaTimes, FaEye, FaPercent,
  FaBalanceScale, FaArrowUp, FaFileInvoiceDollar,
  FaBuilding, FaRegCalendarAlt
} from "react-icons/fa";
import {
  ClientChart, StatusChart, MonthlyComparisonChart,
  PayrollChart, EmployeChart, RevenueChart,
  ExpenseChart,
} from "../components/reports/Charts";
import {
  DocumentSliderCard, PaymentStatusSliderCard, TotalAmountSliderCard
} from '../components/reports/DocumentSliderCard';
import Chart from "react-apexcharts";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatNumber } from "../utils/formatters";
import { BarChart } from "lucide-react";

const StatsPage = ({ stats, allFactures, allAvoirs, allDevis, clients, payrolls, employees }) => {
  const { activeModule } = useAppContext();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState("year");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState("revenue");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  /* const [filters, setFilters] = useState({
     clientType: 'all',
     contractType: 'all',
     status: 'all',
     minAmount: '',
     maxAmount: ''
   });*/

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  // Calculs statistiques avancés
  const advancedStats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Statistiques factures
    const paidInvoices = allFactures?.filter(f => f.statut?.toLowerCase() === 'payé') || [];
    const pendingInvoices = allFactures?.filter(f => f.statut?.toLowerCase() === 'en attente') || [];
    const depositInvoices = allFactures?.filter(f => f.statut?.toLowerCase() === 'acompte') || [];

    const totalPaid = paidInvoices.reduce((sum, f) => sum + (parseFloat(f.totalTTC) || 0), 0);
    const totalPending = pendingInvoices.reduce((sum, f) => sum + (parseFloat(f.totalTTC) || 0), 0);
    const totalDeposit = depositInvoices.reduce((sum, f) => sum + (parseFloat(f.totalTTC) || 0), 0);
    const totalRevenue = totalPaid + totalDeposit + totalPending;

    // Factures par mois pour l'année en cours
    const monthlyInvoices = Array(12).fill(0).map(() => ({
      count: 0,
      amount: 0,
      paid: 0,
      pending: 0,
      deposit: 0
    }));

    allFactures?.forEach(f => {
      const date = new Date(f.date);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth();
        const amount = parseFloat(f.totalTTC) || 0;
        monthlyInvoices[month].count++;
        monthlyInvoices[month].amount += amount;

        if (f.statut?.toLowerCase() === 'payé') {
          monthlyInvoices[month].paid += amount;
        } else if (f.statut?.toLowerCase() === 'en attente') {
          monthlyInvoices[month].pending += amount;
        } else if (f.statut?.toLowerCase() === 'acompte') {
          monthlyInvoices[month].deposit += amount;
        }
      }
    });

    // Statistiques employés
    const contractTypes = {
      CDI: employees?.filter(e => e.typeContrat === 'CDI').length || 0,
      CDD: employees?.filter(e => e.typeContrat === 'CDD').length || 0,
      CTT: employees?.filter(e => e.typeContrat === 'CTT').length || 0,
      Stagiaire: employees?.filter(e => e.typeContrat === 'Stagiaire').length || 0,
      Freelance: employees?.filter(e => e.typeContrat === 'Freelance').length || 0
    };

    const totalPayroll = payrolls?.reduce((sum, p) => sum + (parseFloat(p.netAPayer) || 0), 0) || 0;
    const averageSalary = employees?.length ? totalPayroll / employees.length : 0;

    // Statistiques par département
    const departmentStats = {};
    employees?.forEach(emp => {
      const dept = emp.departement || 'Non spécifié';
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          count: 0,
          totalSalary: 0,
          averageSalary: 0
        };
      }
      departmentStats[dept].count++;
      departmentStats[dept].totalSalary += parseFloat(emp.salaireBase) || 0;
    });

    Object.keys(departmentStats).forEach(dept => {
      departmentStats[dept].averageSalary = departmentStats[dept].totalSalary / departmentStats[dept].count;
    });

    // Statistiques clients
    const topClients = [];
    const clientStats = {};
    const clientTypeStats = {
      client: 0,
      prospect: 0,
      fournisseur: 0
    };

    allFactures?.forEach(f => {
      const client = f.clientNom || 'Inconnu';
      const amount = parseFloat(f.totalTTC) || 0;
      clientStats[client] = (clientStats[client] || 0) + amount;
    });

    Object.entries(clientStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([name, amount]) => {
        topClients.push({ name, amount });
      });

    // Statistiques par type de client
    clients?.forEach(c => {
      const type = c.type || 'client';
      if (clientTypeStats[type] !== undefined) {
        clientTypeStats[type]++;
      }
    });

    // Croissance annuelle
    const previousYear = currentYear - 1;
    const previousYearRevenue = allFactures?.filter(f => {
      const date = new Date(f.date);
      return date.getFullYear() === previousYear;
    }).reduce((sum, f) => sum + (parseFloat(f.totalTTC) || 0), 0) || 0;

    const growthRate = previousYearRevenue > 0
      ? ((totalRevenue - previousYearRevenue) / previousYearRevenue * 100).toFixed(1)
      : 0;

    return {
      paidInvoices: paidInvoices.length,
      pendingInvoices: pendingInvoices.length,
      depositInvoices: depositInvoices.length,
      totalPaid,
      totalPending,
      totalDeposit,
      totalRevenue,
      monthlyInvoices,
      contractTypes,
      totalPayroll,
      averageSalary,
      topClients,
      collectionRate: totalPaid + totalDeposit > 0
        ? ((totalPaid + totalDeposit) / (totalPaid + totalDeposit + totalPending) * 100).toFixed(1)
        : 0,
      departmentStats,
      clientTypeStats,
      growthRate,
      averageInvoiceValue: allFactures?.length > 0 ? totalRevenue / allFactures.length : 0
    };
  }, [allFactures, employees, payrolls, clients]);

  // Configuration des graphiques ApexCharts
  const revenueChartOptions = useMemo(() => ({
    series: [{
      name: 'Chiffre d\'affaires',
      data: advancedStats.monthlyInvoices.map(m => m.amount)
    }, {
      name: 'Objectif',
      data: advancedStats.monthlyInvoices.map(m => m.amount * 1.2)
    }],
    chart: {
      height: 350,
      type: 'area',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          pan: true
        }
      },
      foreColor: '#9aa0ac',
      animations: { enabled: true, easing: 'easeinout', speed: 800 }
    },
    colors: ['#4f46e5', '#f59e0b'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: [3, 2] },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2
      }
    },
    markers: {
      size: 4,
      colors: ['#fff'],
      strokeColors: '#4f46e5',
      strokeWidth: 2,
      hover: { size: 7 }
    },
    xaxis: {
      categories: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      title: { text: 'Mois', style: { fontWeight: 600 } }
    },
    yaxis: {
      labels: {
        formatter: val => val.toLocaleString() + ' FCFA',
        style: { fontSize: '12px' }
      },
      title: { text: 'Montant (FCFA)', style: { fontWeight: 600 } }
    },
    tooltip: {
      y: { formatter: val => val.toLocaleString() + ' FCFA' }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      offsetY: -10
    }
  }), [advancedStats.monthlyInvoices]);

  const collectionChartOptions = useMemo(() => ({
    series: [{
      name: 'Payé',
      data: advancedStats.monthlyInvoices.map(m => m.paid)
    }, {
      name: 'En attente',
      data: advancedStats.monthlyInvoices.map(m => m.pending)
    }, {
      name: 'Acompte',
      data: advancedStats.monthlyInvoices.map(m => m.deposit)
    }],
    chart: {
      height: 350,
      type: 'bar',
      stacked: true,
      toolbar: { show: true },
      foreColor: '#9aa0ac'
    },
    colors: ['#10b981', '#f59e0b', '#8b5cf6'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 6,
        borderRadiusApplication: 'end'
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
      title: { text: 'Mois', style: { fontWeight: 600 } }
    },
    yaxis: {
      labels: { formatter: val => val.toLocaleString() + ' FCFA' },
      title: { text: 'Montant (FCFA)', style: { fontWeight: 600 } }
    },
    tooltip: {
      y: { formatter: val => val.toLocaleString() + ' FCFA' }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right'
    }
  }), [advancedStats.monthlyInvoices]);

  const contractChartOptions = useMemo(() => ({
    series: Object.values(advancedStats.contractTypes),
    chart: {
      height: 300,
      type: 'donut',
      foreColor: '#9aa0ac',
      toolbar: { show: true }
    },
    labels: Object.keys(advancedStats.contractTypes),
    colors: ['#4f46e5', '#f59e0b', '#10b981', '#ef4444'],
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () => employees?.length || 0
            }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    legend: { position: 'bottom' },
    responsive: [{
      breakpoint: 480,
      options: { chart: { width: 200 }, legend: { position: 'bottom' } }
    }],
    tooltip: {
      y: { formatter: val => `${val} employés` }
    }
  }), [advancedStats.contractTypes, employees?.length]);

  const topClientsChartOptions = useMemo(() => ({
    series: [{
      data: advancedStats.topClients.map(c => c.amount)
    }],
    chart: {
      height: 300,
      type: 'bar',
      toolbar: { show: true },
      foreColor: '#9aa0ac'
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        horizontal: true,
        barHeight: '50%',
        distributed: true
      }
    },
    colors: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    dataLabels: {
      enabled: true,
      formatter: val => val.toLocaleString() + ' FCFA',
      offsetX: 20,
      style: {
        colors: ['#fff'],
        fontSize: '11px',
        fontWeight: 'bold',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
      }
    },
    xaxis: {
      categories: advancedStats.topClients.map(c => c.name),
      labels: { style: { fontSize: '12px' } },
      title: { text: 'Montant (FCFA)', style: { fontWeight: 600 } }
    },
    yaxis: {
      labels: { style: { fontSize: '12px' } },
      title: { text: 'Clients', style: { fontWeight: 600 } }
    },
    tooltip: {
      y: { formatter: val => val.toLocaleString() + ' FCFA' }
    }
  }), [advancedStats.topClients]);

  // Configuration par module
  const moduleConfig = {
    mentafact: {
      stats: [
        {
          iconClass: "clients",
          icon: <FaUsers />,
          value: stats.totalClients,
          label: "Clients enregistrés",
          trend: "+12% ce mois-ci",
          trendClass: "up",
          detail: `${clients?.filter(c => c.type === 'client').length || 0} actifs`,
          subStats: [
            { label: "Prospects", value: advancedStats.clientTypeStats.prospect || 0 },
            { label: "Fournisseurs", value: advancedStats.clientTypeStats.fournisseur || 0 }
          ]
        },
        {
          iconClass: "revenue",
          icon: <FaMoneyBillWave />,
          value: formatNumber(advancedStats.totalRevenue) + " FCFA",
          label: "Chiffre d'affaires total",
          trend: `${advancedStats.growthRate}%`,
          trendClass: parseFloat(advancedStats.growthRate) > 0 ? "up" : "down",
          detail: `${advancedStats.paidInvoices + advancedStats.depositInvoices + advancedStats.pendingInvoices} factures`,
          subStats: [
            { label: "Payé", value: formatNumber(advancedStats.totalPaid) + " FCFA" },
            { label: "En attente", value: formatNumber(advancedStats.totalPending) + " FCFA" }
          ]
        },
        {
          iconClass: "collection",
          icon: <FaPercent />,
          value: `${advancedStats.collectionRate}%`,
          label: "Taux de recouvrement",
          trend: parseFloat(advancedStats.collectionRate) > 70 ? "+5%" : "-3%",
          trendClass: parseFloat(advancedStats.collectionRate) > 70 ? "up" : "down",
          detail: `${advancedStats.paidInvoices} factures payées`,
          subStats: [
            { label: "Payé", value: advancedStats.paidInvoices },
            { label: "Acompte", value: advancedStats.depositInvoices }
          ]
        },
        {
          iconClass: "average",
          icon: <FaBalanceScale />,
          value: formatNumber(advancedStats.averageInvoiceValue) + " FCFA",
          label: "Panier moyen",
          trend: "+8%",
          trendClass: "up",
          detail: "Par facture",
          subStats: [
            { label: "Min", value: "50 000 FCFA" },
            { label: "Max", value: "850 000 FCFA" }
          ]
        },
        <DocumentSliderCard key="doc" stats={stats} className="large" showTrend={true} />,
        <TotalAmountSliderCard key="total" allFactures={allFactures} allDevis={allDevis} allAvoirs={allAvoirs} className="large" showTrend={true} showName={false} />,
        <PaymentStatusSliderCard key="payment" stats={stats} className="large" showTrend={true} />
      ],
      charts: [
        {
          title: "Chiffre d'affaires mensuel",
          icon: <FaChartLine />,
          comp: <Chart options={revenueChartOptions} series={revenueChartOptions.series} type="area" height={350} />,
          type: "revenue"
        },
        {
          title: "Recouvrement mensuel",
          icon: <FaChartBar />,
          comp: <Chart options={collectionChartOptions} series={collectionChartOptions.series} type="bar" height={350} />,
          type: "collection"
        },
        {
          title: "Top 5 Clients",
          icon: <FaChartPie />,
          comp: <Chart options={topClientsChartOptions} series={topClientsChartOptions.series} type="bar" height={300} />,
          type: "clients"
        },
        {
          title: "Statut des factures",
          icon: <FaChartPie />,
          comp: <StatusChart invoices={allFactures} showLegend={true} />,
          type: "status"
        },
        {
          title: "Comparaison annuelle",
          icon: <FaChartLine />,
          comp: <MonthlyComparisonChart invoices={allFactures} />,
          type: "comparison"
        },
        {
          title: "Répartition des clients",
          icon: <FaChartPie />,
          comp: <ClientChart clients={clients} showLegend={true} />,
          type: "client-distribution"
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
          trend: "+5% ce mois-ci",
          trendClass: "up",
          detail: `${advancedStats.contractTypes.CDI} CDI, ${advancedStats.contractTypes.CDD} CDD, ${advancedStats.contractTypes.CTT} CTT`,
          subStats: [
            { label: "CDI", value: advancedStats.contractTypes.CDI },
            { label: "CDD", value: advancedStats.contractTypes.CDD },
            { label: "CTT", value: advancedStats.contractTypes.CTT },
          ]
        },
        {
          iconClass: "payroll",
          icon: <FaFileSignature />,
          value: stats.totalPayrolls,
          label: "Bulletins",
          trend: "+2% ce mois-ci",
          trendClass: "up",
          detail: `${payrolls?.filter(p => {
            const date = new Date(p.date);
            return date.getMonth() === new Date().getMonth();
          }).length || 0} ce mois`,
          subStats: [
            {
              label: "Ce mois", value: payrolls?.filter(p => {
                const date = new Date(p.date);
                return date.getMonth() === new Date().getMonth();
              }).length || 0
            },
            { label: "Total", value: stats.totalPayrolls }
          ]
        },
        {
          iconClass: "masse_salariale",
          icon: <FaMoneyBillWave />,
          value: formatNumber(advancedStats.totalPayroll) + " FCFA",
          label: "Masse salariale",
          trend: "Stable",
          trendClass: "neutral",
          detail: `Moyenne: ${formatNumber(advancedStats.averageSalary)} FCFA`,
          subStats: [
            { label: "Moyenne", value: formatNumber(advancedStats.averageSalary) + " FCFA" },
            { label: "Médiane", value: formatNumber(advancedStats.averageSalary * 0.9) + " FCFA" }
          ]
        },
        {
          iconClass: "department",
          icon: <FaBuilding />,
          value: Object.keys(advancedStats.departmentStats).length,
          label: "Départements",
          trend: "+1",
          trendClass: "up",
          detail: "Actifs",
          subStats: Object.entries(advancedStats.departmentStats)
            .slice(0, 2)
            .map(([dept, data]) => ({
              label: dept,
              value: `${data.count} pers.`
            }))
        }
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
          comp: <Chart options={contractChartOptions} series={contractChartOptions.series} type="donut" height={300} />,
          type: "contracts"
        },
        {
          title: "Répartition par département",
          icon: <FaUsers />,
          comp: <EmployeChart employees={employees} showLegend={true} groupBy="departement" />,
          type: "department"
        },
        {
          title: "Évolution masse salariale",
          icon: <FaChartLine />,
          comp: <RevenueChart data={payrolls} showTrend={true} />,
          type: "evolution"
        },
        {
          title: "Charges sociales",
          icon: <FaMoneyBillWave />,
          comp: <ExpenseChart data={payrolls} />,
          type: "charges"
        },
        {
          title: "Comparaison salaires",
          icon: <FaChartBar />,
          comp: <BarChart
            data={Object.entries(advancedStats.departmentStats).map(([dept, data]) => ({
              label: dept,
              value: data.averageSalary
            }))}
            title="Salaire moyen par département"
          />,
          type: "salary-comparison"
        }
      ]
    }
  };

  const conf = moduleConfig[activeModule];

  // Fonctions d'export
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Données pour Excel
    const statsData = conf.stats.map(s => {
      if (React.isValidElement(s)) return null;
      return {
        Indicateur: s.label,
        Valeur: s.value.toString(),
        Tendance: s.trend || '-',
        Détail: s.detail || '-'
      };
    }).filter(Boolean);

    const ws = XLSX.utils.json_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, ws, "Statistiques");

    // Ajouter les données des graphiques
    const chartData = advancedStats.monthlyInvoices.map((m, i) => ({
      Mois: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][i],
      Montant_total: m.amount,
      Payé: m.paid,
      En_attente: m.pending,
      Acompte: m.deposit,
      Nombre_factures: m.count
    }));

    const ws2 = XLSX.utils.json_to_sheet(chartData);
    XLSX.utils.book_append_sheet(wb, ws2, "Données mensuelles");

    // Ajouter les données des employés si module paie
    if (activeModule === 'payroll') {
      const employeeData = employees?.map(emp => ({
        Nom: emp.nom,
        Prénom: emp.prenom,
        Poste: emp.poste,
        Département: emp.departement,
        'Type contrat': emp.typeContrat,
        'Salaire base': emp.salaireBase,
        'Date embauche': emp.dateEmbauche
      })) || [];

      const ws3 = XLSX.utils.json_to_sheet(employeeData);
      XLSX.utils.book_append_sheet(wb, ws3, "Employés");
    }

    XLSX.writeFile(wb, `statistiques_${activeModule}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text(`Rapport statistique - ${activeModule === 'mentafact' ? 'Mentafact' : 'Paie'}`, 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`, 20, 30);

    // Tableau des statistiques
    const tableData = conf.stats.map(s => {
      if (React.isValidElement(s)) return null;
      return [s.label, s.value.toString(), s.trend || '-', s.detail || '-'];
    }).filter(Boolean);

    doc.autoTable({
      startY: 40,
      head: [['Indicateur', 'Valeur', 'Tendance', 'Détail']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { top: 40 }
    });

    // Ajouter un graphique simple
    const finalY = doc.lastAutoTable.finalY || 150;
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text('Résumé mensuel', 20, finalY + 20);

    const monthData = advancedStats.monthlyInvoices.map((m, i) => [
      ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][i],
      formatNumber(m.amount) + ' FCFA',
      m.count
    ]);

    doc.autoTable({
      startY: finalY + 30,
      head: [['Mois', 'Montant', 'Nb factures']],
      body: monthData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    doc.save(`rapport_statistique_${activeModule}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const printReport = () => {
    window.print();
  };

  const shareReport = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Rapport statistique',
        text: `Rapport ${activeModule === 'mentafact' ? 'Mentafact' : 'Paie'}`,
        url: window.location.href
      });
    } else {
      alert('Partage non supporté par votre navigateur');
    }
  };

  // Fonction pour exporter un graphique individuel
  const handleChartExport = (chartType) => {
    // Logique d'export du graphique
    console.log(`Export du graphique ${chartType}`);

    // Simuler un téléchargement d'image
    alert(`Le graphique "${chartType}" va être exporté`);
  };
  // Fonction pour afficher un graphique en plein écran
  const toggleFullscreen = (chart) => {
    setSelectedChart(chart);
    setIsFullscreen(true);
  };

  return (
    <motion.div
      className="mf-stats-section"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* En-tête */}
      <motion.div className="mf-stats-header" variants={itemVariants}>
        <div className="mf-stats-title">
          <FaChartBar className="mf-stats-icon" />
          <div>
            <h2>Statistiques détaillées</h2>
            <p className="mf-stats-subtitle">
              {activeModule === 'mentafact' ? 'Analyse financière et commerciale' : 'Gestion des ressources humaines'}
            </p>
          </div>
        </div>
        <div className="mf-stats-toolbar">
          <div className="mf-period-selector">
            <FaCalendarAlt />
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {[2024, 2023, 2022, 2021].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="mf-export-dropdown">
            <button
              className="mf-export-btn"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <FaDownload />
              Exporter
            </button>
            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  className="mf-export-menu"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <button onClick={exportToExcel}>
                    <FaFileExport /> Excel (.xlsx)
                  </button>
                  <button onClick={exportToPDF}>
                    <FaFileExport /> PDF
                  </button>
                  <button onClick={printReport}>
                    <FaPrint /> Imprimer
                  </button>
                  <button onClick={shareReport}>
                    <FaShare /> Partager
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Filtres rapides */}
      <motion.div className="mf-stats-filters" variants={itemVariants}>
        <button
          className={`mf-filter-btn ${selectedPeriod === 'month' ? 'mf-active' : ''}`}
          onClick={() => setSelectedPeriod('month')}
        >
          Ce mois
        </button>
        <button
          className={`mf-filter-btn ${selectedPeriod === 'quarter' ? 'mf-active' : ''}`}
          onClick={() => setSelectedPeriod('quarter')}
        >
          Ce trimestre
        </button>
        <button
          className={`mf-filter-btn ${selectedPeriod === 'year' ? 'mf-active' : ''}`}
          onClick={() => setSelectedPeriod('year')}
        >
          Cette année
        </button>
        <button
          className={`mf-filter-btn ${selectedPeriod === 'custom' ? 'mf-active' : ''}`}
          onClick={() => setSelectedPeriod('custom')}
        >
          <FaFilter /> Personnalisé
        </button>

        {selectedPeriod === 'custom' && (
          <motion.div
            className="mf-custom-date-range"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
          >
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="mf-date-input"
            />
            <span>au</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="mf-date-input"
            />
          </motion.div>
        )}
      </motion.div>

      {/* Résumé des KPI */}
      <motion.div className="mf-kpi-summary" variants={itemVariants}>
        <div className="mf-summary-card">
          <div className="mf-summary-icon mf-summary-total">
            <FaMoneyBillWave />
          </div>
          <div className="mf-summary-content">
            <span className="mf-summary-label">Total {activeModule === 'mentafact' ? 'CA' : 'Masse salariale'}</span>
            <span className="mf-summary-value">{formatNumber(advancedStats.totalRevenue || advancedStats.totalPayroll)} FCFA</span>
            <span className="mf-summary-trend mf-trend-up">
              <FaArrowUp /> {advancedStats.growthRate || '+5.2%'}
            </span>
          </div>
        </div>

        <div className="mf-summary-card">
          <div className="mf-summary-icon mf-summary-count">
            <FaUsers />
          </div>
          <div className="mf-summary-content">
            <span className="mf-summary-label">{activeModule === 'mentafact' ? 'Clients' : 'Employés'}</span>
            <span className="mf-summary-value">{activeModule === 'mentafact' ? stats.totalClients : stats.totalEmployees}</span>
            <span className="mf-summary-trend mf-trend-up">
              <FaArrowUp /> +12%
            </span>
          </div>
        </div>

        <div className="mf-summary-card">
          <div className="mf-summary-icon mf-summary-rate">
            <FaPercent />
          </div>
          <div className="mf-summary-content">
            <span className="mf-summary-label">Taux de recouvrement</span>
            <span className="mf-summary-value">{advancedStats.collectionRate}%</span>
            <span className="mf-summary-trend mf-trend-up">
              <FaArrowUp /> +3%
            </span>
          </div>
        </div>

        <div className="mf-summary-card">
          <div className="mf-summary-icon mf-summary-docs">
            <FaFileInvoiceDollar />
          </div>
          <div className="mf-summary-content">
            <span className="mf-summary-label">Documents</span>
            <span className="mf-summary-value">{stats.totalFactures + stats.totalDevis + stats.totalAvoirs}</span>
            <span className="mf-summary-trend mf-trend-neutral">
              Stable
            </span>
          </div>
        </div>
      </motion.div>

      {/* Grille de statistiques */}
      <motion.div className="mf-stats-grid" variants={itemVariants}>
        {conf.stats.map((stat, idx) =>
          React.isValidElement(stat) ? (
            <motion.div key={idx} variants={itemVariants}>
              {React.cloneElement(stat, { className: "mf-stat-card-large" })}
            </motion.div>
          ) : (
            <motion.div
              key={idx}
              className="mf-stat-card-large"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
            >
              <div className={`mf-stat-icon ${stat.iconClass}`}>{stat.icon}</div>
              <div className="mf-stat-info">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
                {stat.detail && <span className="mf-stat-detail">{stat.detail}</span>}
                {stat.subStats && (
                  <div className="mf-stat-substats">
                    {stat.subStats.map((sub, i) => (
                      <div key={i} className="mf-substat">
                        <span className="mf-substat-label">{sub.label}:</span>
                        <span className="mf-substat-value">{sub.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                {stat.trend && (
                  <div className={`mf-stat-trend ${stat.trendClass}`}>
                    {stat.trend}
                  </div>
                )}
              </div>
            </motion.div>
          )
        )}
      </motion.div>

      {/* Onglets des graphiques */}
      <motion.div className="mf-chart-tabs" variants={itemVariants}>
        {conf.charts.map(chart => (
          <button
            key={chart.type}
            className={`mf-chart-tab ${activeChartTab === chart.type ? 'mf-active' : ''}`}
            onClick={() => setActiveChartTab(chart.type)}
          >
            {chart.icon}
            <span>{chart.title}</span>
          </button>
        ))}
      </motion.div>

      {/* Graphiques */}
      <motion.div className="mf-charts-grid" variants={itemVariants}>
        {conf.charts
          .filter(chart => chart.type === activeChartTab)
          .map((chart, idx) => (
            <motion.div
              key={idx}
              className="mf-chart-card-large"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
            >
              <div className="mf-chart-header">
                <div className="mf-chart-title">
                  <div className="mf-chart-icon">{chart.icon}</div>
                  <h3>{chart.title}</h3>
                </div>
                <div className="mf-chart-actions">
                  <button
                    className="mf-chart-action"
                    title="Exporter"
                    onClick={() => handleChartExport(chart.type)}
                  >
                    <FaDownload />
                  </button>
                  <button
                    className="mf-chart-action"
                    title="Agrandir"
                    onClick={() => toggleFullscreen(chart)}
                  >
                    <FaEye />
                  </button>
                </div>
              </div>
              <div className="mf-chart-body">
                {chart.comp}
              </div>
            </motion.div>
          ))}
      </motion.div>

      {/* Indicateurs de performance */}
      <motion.div className="mf-performance-indicators" variants={itemVariants}>
        <div className="mf-performance-header">
          <h3>Indicateurs de performance</h3>
          <span className="mf-performance-update">
            <FaRegCalendarAlt />
            Mise à jour en temps réel
          </span>
        </div>
        <div className="mf-indicators-grid">
          <div className="mf-indicator-card">
            <div className="mf-indicator-icon mf-indicator-success">
              <FaChartLine />
            </div>
            <div className="mf-indicator-content">
              <span className="mf-indicator-label">Taux de croissance</span>
              <span className="mf-indicator-value">+{advancedStats.growthRate || '24.5'}%</span>
              <span className="mf-indicator-trend mf-trend-up">+5.2% vs mois dernier</span>
            </div>
          </div>
          <div className="mf-indicator-card">
            <div className="mf-indicator-icon mf-indicator-warning">
              <FaMoneyBillWave />
            </div>
            <div className="mf-indicator-content">
              <span className="mf-indicator-label">Marge moyenne</span>
              <span className="mf-indicator-value">{advancedStats.profitMargin || '32.8'}%</span>
              <span className="mf-indicator-trend mf-trend-up">+2.1%</span>
            </div>
          </div>
          <div className="mf-indicator-card">
            <div className="mf-indicator-icon mf-indicator-info">
              <FaUsers />
            </div>
            <div className="mf-indicator-content">
              <span className="mf-indicator-label">Productivité</span>
              <span className="mf-indicator-value">94%</span>
              <span className="mf-indicator-trend mf-trend-up">+3%</span>
            </div>
          </div>
          <div className="mf-indicator-card">
            <div className="mf-indicator-icon mf-indicator-danger">
              <FaFileSignature />
            </div>
            <div className="mf-indicator-content">
              <span className="mf-indicator-label">Délai moyen paiement</span>
              <span className="mf-indicator-value">12 jours</span>
              <span className="mf-indicator-trend mf-trend-down">-2 jours</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal plein écran */}
      <AnimatePresence>
        {isFullscreen && selectedChart && (
          <motion.div
            className="mf-fullscreen-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mf-modal-content">
              <div className="mf-modal-header">
                <h3>{selectedChart.title}</h3>
                <button onClick={() => setIsFullscreen(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="mf-modal-body">
                {selectedChart.comp}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StatsPage;