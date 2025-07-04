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
  const backgroundColors = [
    'rgba(255, 99, 132, 0.6)',  // Jan
    'rgba(54, 162, 235, 0.6)',  // Fév
    'rgba(255, 206, 86, 0.6)',  // Mar
    'rgba(75, 192, 192, 0.6)',  // Avr
    'rgba(153, 102, 255, 0.6)', // Mai
    'rgba(0, 128, 128, 0.6)',   // Jun
    'rgba(255, 159, 64, 0.6)',  // Jul
    'rgba(255, 105, 180, 0.6)', // Aoû
    'rgba(0, 191, 255, 0.6)',   // Sep
    'rgba(34, 139, 34, 0.6)',   // Oct
    'rgba(255, 140, 0, 0.6)',   // Nov
    'rgba(128, 0, 128, 0.6)'    // Déc
  ];

  const borderColors = backgroundColors.map(color => color.replace('0.6', '1'));
  const data = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: [
      {
        label: "Chiffre d'affaires (FCFA)",
        data: monthlyData,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
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

  // ✅ Vérification sécurisée
  if (Array.isArray(clients)) {
    clients.forEach(client => {
      const company = client.nom || 'Non spécifié';
      companies[company] = (companies[company] || 0) + 1;
    });
  } else {
    console.warn('clients est vide ou non défini');
  }

  function generateRandomColors(count) {
    const colors = [];

    for (let i = 0; i < count; i++) {
      const r = Math.floor(Math.random() * 256);   // Rouge: 0-255
      const g = Math.floor(Math.random() * 256);   // Vert
      const b = Math.floor(Math.random() * 256);   // Bleu
      const a = 0.6;                                // Opacité constante

      colors.push(`rgba(${r}, ${g}, ${b}, ${a})`);
    }

    return colors;
  }

  const backgroundColors = generateRandomColors(100); // génère 10 couleurs aléatoires


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
