import React from 'react';
import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

// ✅ Enregistrement des composants nécessaires
ChartJS.register(
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
);

// 📊 Factures mensuelles (Barres)
export const InvoiceChart = ({ invoices }) => {
  const monthlyData = Array(12).fill(0);
  const currentYear = new Date().getFullYear();

  invoices.forEach(invoice => {
    const date = new Date(invoice.date);
    if (date.getFullYear() === currentYear) {
      const month = date.getMonth();
      monthlyData[month] += parseFloat(invoice.totalTTC) || 0;
    }
  });

  const data = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: [
      {
        label: 'Chiffre d\'affaires (FCFA)',
        data: monthlyData,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.raw.toLocaleString()} FCFA`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => value.toLocaleString() + ' FCFA'
        }
      }
    }
  };

  return <Bar data={data} options={options} />;
};

// 🧍‍♂️ Clients par entreprise (Doughnut)
export const ClientChart = ({ clients }) => {
  const companies = {};
  clients.forEach(client => {
    const company = client.societe || 'Non spécifié';
    companies[company] = (companies[company] || 0) + 1;
  });

  const backgroundColors = [
    'rgba(255, 99, 132, 0.6)',
    'rgba(54, 162, 235, 0.6)',
    'rgba(255, 206, 86, 0.6)',
    'rgba(75, 192, 192, 0.6)',
    'rgba(153, 102, 255, 0.6)',
    'rgba(255, 159, 64, 0.6)',
  ];

  const data = {
    labels: Object.keys(companies),
    datasets: [
      {
        label: 'Nombre de clients',
        data: Object.values(companies),
        backgroundColor: backgroundColors.slice(0, Object.keys(companies).length),
        borderColor: backgroundColors.map(c => c.replace('0.6', '1')),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'right' },
    },
  };

  return <Doughnut data={data} options={options} />;
};

// 💳 Statut des factures (Pie)
export const StatusChart = ({ invoices }) => {
  const statusCounts = {
    'payée': 0,
    'en attente': 0,
    'impayée': 0,
  };

  invoices.forEach(invoice => {
    const status = invoice.statut?.toLowerCase() || 'en attente';
    if (statusCounts[status] !== undefined) {
      statusCounts[status]++;
    }
  });

  const data = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        label: 'Statut des factures',
        data: Object.values(statusCounts),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)', // payée
          'rgba(255, 206, 86, 0.6)', // en attente
          'rgba(255, 99, 132, 0.6)', // impayée
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return <Pie data={data} />;
};

// 📈 Comparaison mensuelle entre 2 années (Lignes)
export const MonthlyComparisonChart = ({ invoices }) => {
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  const currentYearData = Array(12).fill(0);
  const lastYearData = Array(12).fill(0);

  invoices.forEach(invoice => {
    const date = new Date(invoice.date);
    const month = date.getMonth();
    const amount = parseFloat(invoice.totalTTC) || 0;

    if (date.getFullYear() === currentYear) {
      currentYearData[month] += amount;
    } else if (date.getFullYear() === lastYear) {
      lastYearData[month] += amount;
    }
  });

  const data = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: [
      {
        label: `${currentYear}`,
        data: currentYearData,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
      },
      {
        label: `${lastYear}`,
        data: lastYearData,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.raw.toLocaleString()} FCFA`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => value.toLocaleString() + ' FCFA'
        }
      }
    }
  };

  return <Line data={data} options={options} />;
};
