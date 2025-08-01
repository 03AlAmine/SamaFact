import React, { useState, useEffect, useRef } from 'react';
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

// Palette de couleurs cohérente
const CHART_COLORS = {
  primary: 'rgba(99, 102, 241, 0.8)',
  secondary: 'rgba(79, 70, 229, 0.8)',
  success: 'rgba(16, 185, 129, 0.8)',
  danger: 'rgba(239, 68, 68, 0.8)',
  warning: 'rgba(245, 158, 11, 0.8)',
  info: 'rgba(59, 130, 246, 0.8)',
  light: 'rgba(209, 213, 219, 0.8)',
  dark: 'rgba(55, 65, 81, 0.8)'
};

const CHART_BORDERS = {
  primary: 'rgba(99, 102, 241, 1)',
  secondary: 'rgba(79, 70, 229, 1)',
  success: 'rgba(16, 185, 129, 1)',
  danger: 'rgba(239, 68, 68, 1)',
  warning: 'rgba(245, 158, 11, 1)',
  info: 'rgba(59, 130, 246, 1)',
  light: 'rgba(209, 213, 219, 1)',
  dark: 'rgba(55, 65, 81, 1)'
};

// Options communes
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          family: "'Inter', sans-serif",
          size: 12,
          weight: '500'
        },
        padding: 20,
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      titleFont: {
        family: "'Inter', sans-serif",
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        family: "'Inter', sans-serif",
        size: 12
      },
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      usePointStyle: true
    }
  },
  scales: {
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        font: {
          family: "'Inter', sans-serif"
        }
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          family: "'Inter', sans-serif"
        }
      }
    }
  },
  animation: {
    duration: 1000,
    easing: 'easeOutQuart'
  }
};

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

  // Palette dégradée
  const backgroundColors = Array(12).fill(0).map((_, i) => {
    const ratio = i / 12;
    return `rgba(99, 102, 241, ${0.4 + ratio * 0.4})`;
  });

  const borderColors = backgroundColors.map(color => color.replace('0.4', '1').replace('0.8', '1'));

  const data = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: [
      {
        label: "Chiffre d'affaires (FCFA)",
        data: monthlyData,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: borderColors,
        hoverBorderWidth: 2
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.raw.toLocaleString()} FCFA`;
          }
        }
      }
    },
    scales: {
      ...commonOptions.scales,
      y: {
        ...commonOptions.scales.y,
        beginAtZero: true,
        ticks: {
          ...commonOptions.scales.y.ticks,
          callback: value => value.toLocaleString() + ' FCFA'
        }
      }
    }
  };

  return (
    <div style={{ height: '250px', padding: '1rem' }}>
      <Bar data={data} options={options} />
    </div>
  );
};

// 🧍‍♂️ Clients par entreprise (Doughnut)

const navButtonStyle = {
  background: '#4f46e5',
  color: 'white',
  border: 'none',
  borderRadius: '50%',
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  ':hover': {
    background: '#4338ca',
    transform: 'scale(1.05)'
  },
  ':disabled': {
    background: '#e2e8f0',
    color: '#94a3b8',
    cursor: 'not-allowed',
    transform: 'none'
  }
};

const legendItemStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 12px',
  borderRadius: '8px',
  transition: 'all 0.2s ease',
  ':hover': {
    backgroundColor: '#f8fafc',
    transform: 'translateX(2px)'
  }
};

export const ClientChart = ({ clients }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  const intervalRef = useRef(null);

  const companies = {};
  if (Array.isArray(clients)) {
    clients.forEach(client => {
      const company = client.nom || 'Non spécifié';
      companies[company] = (companies[company] || 0) + 1;
    });
  }

  const labels = Object.keys(companies);
  const values = Object.values(companies);

  // Palette de couleurs modernes
  const backgroundColors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444',
    '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
    '#64748b', '#94a3b8', '#cbd5e1'
  ];

  const data = {
    labels,
    datasets: [{
      label: 'Nombre de clients',
      data: values,
      backgroundColor: backgroundColors.slice(0, labels.length),
      borderColor: '#fff',
      borderWidth: 2,
      hoverOffset: 10,
      cutout: '75%',
    }]
  };

  const options = {
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        displayColors: false
      }
    },
    cutout: '75%',
    layout: { 
      padding: 20 
    },
    animation: {
      animateScale: true,
      animateRotate: true
    }
  };

  const totalPages = Math.ceil(labels.length / itemsPerPage);
  const start = currentPage * itemsPerPage;
  const end = start + itemsPerPage;
  const visibleLegends = labels.slice(start, end);

  // Auto-slide toutes les 3 secondes
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentPage(prev => (prev + 1) % totalPages);
    }, 3000);

    return () => clearInterval(intervalRef.current);
  }, [totalPages]);

  const pauseAutoSlide = () => clearInterval(intervalRef.current);
  const resumeAutoSlide = () => {
    intervalRef.current = setInterval(() => {
      setCurrentPage(prev => (prev + 1) % totalPages);
    }, 3000);
  };

  return (
    <div style={{
      display: 'flex',
      gap: '2rem',
      alignItems: 'center',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {/* Graphique */}
      <div style={{ 
        height: '250px', 
        width: '250px',
        position: 'relative'
      }}>
        <Doughnut data={data} options={options} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1e293b'
          }}>
            {values.reduce((a, b) => a + b, 0)}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#64748b'
          }}>
            Clients
          </div>
        </div>
      </div>

      {/* Légende avec carousel */}
      <div
        onMouseEnter={pauseAutoSlide}
        onMouseLeave={resumeAutoSlide}
        style={{
          flex: 1,
          minWidth: '240px',
          padding: '1rem',
          borderRadius: '12px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}
      >


        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1px',
          minHeight: '160px'
        }}>
          {visibleLegends.map((label, i) => (
            <div key={label} style={legendItemStyle}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: backgroundColors[start + i],
                  marginRight: 12,
                  borderRadius: '4px',
                  flexShrink: 0
                }}
              />
              <span style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: '#334155',
                fontWeight: '500'
              }}>
                {label}
              </span>
              <span style={{
                marginLeft: 'auto',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                {values[start + i]}
              </span>
            </div>
          ))}
        </div>

        {/* Navigation et indicateur de page */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginTop: '1rem'
        }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 0))}
            disabled={currentPage === 0}
            style={{
              ...navButtonStyle,
              background: currentPage === 0 ? '#e2e8f0' : '#6366f1',
              color: currentPage === 0 ? '#94a3b8' : 'white'
            }}
          >
            ◀
          </button>
          
          <div style={{
            display: 'flex',
            gap: '6px'
          }}>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <div 
                key={idx}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: currentPage === idx ? '#6366f1' : '#cbd5e1',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages - 1))}
            disabled={currentPage === totalPages - 1}
            style={{
              ...navButtonStyle,
              background: currentPage === totalPages - 1 ? '#e2e8f0' : '#6366f1',
              color: currentPage === totalPages - 1 ? '#94a3b8' : 'white'
            }}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
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
          CHART_COLORS.success,
          CHART_COLORS.warning,
          CHART_COLORS.danger
        ],
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 10
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      legend: {
        ...commonOptions.plugins.legend,
        position: 'right'
      }
    }
  };

  return (
    <div style={{ height: '275px', padding: '1rem' }}>
      <Pie data={data} options={options} />
    </div>
  );
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
        borderColor: CHART_BORDERS.primary,
        backgroundColor: CHART_COLORS.primary,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#fff',
        pointBorderColor: CHART_BORDERS.primary,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: `${lastYear}`,
        data: lastYearData,
        borderColor: CHART_BORDERS.secondary,
        backgroundColor: CHART_COLORS.secondary,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#fff',
        pointBorderColor: CHART_BORDERS.secondary,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.raw.toLocaleString()} FCFA`;
          }
        }
      }
    },
    scales: {
      ...commonOptions.scales,
      y: {
        ...commonOptions.scales.y,
        beginAtZero: true,
        ticks: {
          ...commonOptions.scales.y.ticks,
          callback: value => value.toLocaleString() + ' FCFA'
        }
      }
    },
    elements: {
      line: {
        borderWidth: 2
      }
    }
  };

  return (
    <div style={{ height: '250px', padding: '1rem' }}>
      <Line data={data} options={options} />
    </div>
  );
};