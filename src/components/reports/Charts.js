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

  // Palette de couleurs variée pour chaque barre
  const backgroundColors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#f59e0b',
    '#eab308', '#84cc16', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9'
  ];

  const borderColors = backgroundColors.map(color => color);

  const data = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
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
      {
        // Ligne de courbe pour relier les sommets
        type: 'line',
        label: 'Tendance',
        data: monthlyData,
        backgroundColor: 'transparent',
        borderColor: 'rgba(45, 91, 156, 0.5)',
        borderWidth: 1.5,
        pointRadius: 3, // Cercles visibles sur chaque point
        pointHoverRadius: 5,
        pointBackgroundColor: 'rgba(145, 66, 48, 0.8)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        tension: 0.4, // Courbure de la ligne
        fill: false
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label || 'Tendance'}: ${context.raw.toLocaleString()} FCFA`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.03)'
        },
        ticks: {
          callback: value => value.toLocaleString() + ' FCFA'
        }
      },
      x: {
        grid: {
          display: false
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


// 📊 Composant générique de graphique donut avec légende paginée
export const DonutChartWithLegend = ({ 
  dataItems, 
  title = "Données", 
  dataKey = "nom",
  valueKey = "count",
  labelSingular = "élément",
  labelPlural = "éléments"
}) => {
  const [currentPage, setCurrentPage] = useState(0); // 0 = graphique, 1 = légende
  const [currentLegendPage, setCurrentLegendPage] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const itemsPerPage = 6;
  const intervalRef = useRef(null);

  // Grouper les données (même logique que ClientChart et EmployeChart)
  const groupedData = {};
  if (Array.isArray(dataItems)) {
    dataItems.forEach(item => {
      const key = item[dataKey] || 'Non spécifié';
      const value = item[valueKey] || 1;
      groupedData[key] = (groupedData[key] || 0) + value;
    });
  }

  const labels = Object.keys(groupedData);
  const values = Object.values(groupedData);
  const total = values.reduce((a, b) => a + b, 0);
  const labelText = total === 1 ? labelSingular : labelPlural;

  // Palette de couleurs étendue (commune aux deux graphiques)
  const backgroundColors = [
    // Bleus & Violets
    '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81', '#1e3a8a', '#1e40af', '#1d4ed8',
    '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#c7d2fe', '#a5b4fc',
    '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#3f0c96', '#9d4edd', '#7b2cbf',
    '#a855f7', '#9333ea', '#c026d3', '#a21caf', '#86198f', '#701a75',

    // Roses / Rouges
    '#ec4899', '#db2777', '#be185d', '#9d174d', '#f472b6', '#f06292', '#ff80ab', '#ff4d94',
    '#e84393', '#ff6f91', '#ff8da1', '#fca5a5', '#fecaca', '#f43f5e', '#ef4444', '#dc2626',
    '#b91c1c', '#ae2c2c', '#9f1239', '#fb7185', '#fda4af', '#ffe0e6',

    // Oranges & Jaunes
    '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12', '#ff8e42', '#ff6a00', '#ff7849',
    '#ffa366', '#ffb380', '#fca311', '#fb8c00', '#f57c00', '#ef6c00', '#ff9800', '#ffb74d',
    '#fed7aa', '#fbd38d', '#f6ad55', '#f59e0b', '#eab308', '#facc15', '#fcd34d', '#fde68a',
    '#fef08a', '#fff3b0', '#ffd166',

    // Verts
    '#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#34d399', '#22c55e', '#16a34a',
    '#15803d', '#166534', '#14532d', '#4ade80', '#84cc16', '#bef264', '#c6f68d', '#86efac',
    '#bbf7d0', '#ccfbf1', '#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e',
    '#064e3b', '#4caf50', '#66bb6a', '#81c784', '#a5d6a7', '#c7f9cc', '#80ed99', '#57cc99',
  ];

  const data = {
    labels,
    datasets: [{
      label: `Nombre de ${labelPlural}`,
      data: values,
      backgroundColor: backgroundColors.slice(0, labels.length),
      borderColor: '#fff',
      borderWidth: 2,
      hoverOffset: 10,
      cutout: '70%',
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} ${labelPlural} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '70%',
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1000
    }
  };

  // Calculs pour la pagination de la légende
  const totalLegendPages = Math.ceil(labels.length / itemsPerPage);
  const start = currentLegendPage * itemsPerPage;
  const end = start + itemsPerPage;
  const visibleLegends = labels.slice(start, end);

  // Gestion de la rotation automatique
  useEffect(() => {
    if (!isHovering) {
      intervalRef.current = setInterval(() => {
        setCurrentPage(prev => (prev + 1) % 2);
      }, 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovering]);

  // Gestion du survol
  const handleMouseEnter = () => {
    setIsHovering(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  // Navigation manuelle de la légende
  const handleNextLegendPage = () => {
    setCurrentLegendPage(prev => (prev + 1) % totalLegendPages);
  };

  const handlePrevLegendPage = () => {
    setCurrentLegendPage(prev => (prev - 1 + totalLegendPages) % totalLegendPages);
  };

  // Navigation manuelle des pages
  const handlePageChange = (pageIndex) => {
    setCurrentPage(pageIndex);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (!isHovering) {
      intervalRef.current = setInterval(() => {
        setCurrentPage(prev => (prev + 1) % 2);
      }, 5000);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '250px',
        position: 'relative',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="donut-chart-container"
    >
      {/* Boutons de pagination */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '10px',
        zIndex: 10,
        display: 'flex',
        gap: '6px'
      }}>
        <button
          onClick={() => handlePageChange(0)}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: currentPage === 0 ? '#6366f1' : 'rgba(226, 232, 240, 0.8)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: currentPage === 0 ? 'white' : '#64748b',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            boxShadow: currentPage === 0 ? '0 2px 8px rgba(99, 102, 241, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}
          title="Voir le graphique"
        >
          📊
        </button>
        <button
          onClick={() => handlePageChange(1)}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: currentPage === 1 ? '#6366f1' : 'rgba(226, 232, 240, 0.8)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: currentPage === 1 ? 'white' : '#64748b',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            boxShadow: currentPage === 1 ? '0 2px 8px rgba(99, 102, 241, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}
          title="Voir la légende"
        >
          📋
        </button>
      </div>

      {/* Page 1: Graphique seul */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: currentPage === 0 ? 1 : 0,
          transform: currentPage === 0 ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'all 0.5s ease-in-out',
          pointerEvents: currentPage === 0 ? 'auto' : 'none'
        }}
      >
        <div style={{
          width: '200px',
          height: '200px',
          position: 'relative'
        }}>
          <Doughnut data={data} options={options} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '4px',
              lineHeight: 1
            }}>
              {total}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#64748b',
              fontWeight: '500',
              marginBottom: '4px'
            }}>
              {labelText}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#94a3b8',
              opacity: 0.8
            }}>
              Cliquez pour détails
            </div>
          </div>
        </div>
      </div>

      {/* Page 2: Légende seule */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          opacity: currentPage === 1 ? 1 : 0,
          transform: currentPage === 1 ? 'translateY(0)' : 'translateY(100%)',
          transition: 'all 0.5s ease-in-out',
          padding: '20px',
          overflow: 'hidden',
          pointerEvents: currentPage === 1 ? 'auto' : 'none'
        }}
      >
        {/* Liste des légendes */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '8px',
          marginBottom: '2px'
        }}>
          {visibleLegends.map((label, i) => {
            const value = values[start + i];

            return (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '5px 12px',
                  marginBottom: '2px',
                  borderRadius: '8px',
                  background: i % 2 === 0 ? 'transparent' : '#f8fafc6b',
                  transition: 'all 0.2s ease'
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: backgroundColors[start + i],
                    marginRight: '12px',
                    borderRadius: '3px',
                    flexShrink: 0
                  }}
                />
                <div style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#334155',
                    marginBottom: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {label}
                  </span>
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6366f1',
                  marginLeft: '10px',
                  flexShrink: 0
                }}>
                  {value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Barre inférieure */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '10px',
          borderTop: '1px solid #e2e8f0',
          gap: '10px'
        }}>
          {/* Indicateur d'état de rotation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: isHovering ? '#f59e0b' : '#94a3b8',
            background: isHovering ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.8)',
            padding: '4px 10px',
            borderRadius: '12px',
            backdropFilter: 'blur(5px)',
            flexShrink: 0,
            border: isHovering ? '1px solid rgba(245, 158, 11, 0.2)' : 'none'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isHovering ? '#f59e0b' : '#6366f1',
              animation: isHovering ? 'none' : 'pulse 2s infinite'
            }} />
            {isHovering ? 'Suspendue' : 'Auto'}
          </div>

          {/* Indicateur de pagination de légende */}
          {totalLegendPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              flex: 1
            }}>
              <div style={{
                display: 'flex',
                gap: '6px',
                margin: '0 10px'
              }}>
                {Array.from({ length: totalLegendPages }).map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentLegendPage(idx)}
                    style={{
                      width: currentLegendPage === idx ? '20px' : '8px',
                      height: '6px',
                      borderRadius: '3px',
                      background: currentLegendPage === idx ? '#6366f1' : '#cbd5e1',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Boutons de pagination de légende */}
          {totalLegendPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0
            }}>
              <span style={{
                fontSize: '12px',
                color: '#64748b',
                whiteSpace: 'nowrap'
              }}>
                {currentLegendPage + 1}/{totalLegendPages}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={handlePrevLegendPage}
                  disabled={totalLegendPages <= 1}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: totalLegendPages <= 1 ? '#e2e8f0' : '#6366f1',
                    color: totalLegendPages <= 1 ? '#94a3b8' : 'white',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: totalLegendPages <= 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '12px'
                  }}
                  title="Page précédente"
                >
                  ◀
                </button>
                <button
                  onClick={handleNextLegendPage}
                  disabled={totalLegendPages <= 1}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: totalLegendPages <= 1 ? '#e2e8f0' : '#6366f1',
                    color: totalLegendPages <= 1 ? '#94a3b8' : 'white',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: totalLegendPages <= 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '12px'
                  }}
                  title="Page suivante"
                >
                  ▶
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 🧍‍♂️ Clients par entreprise 
export const ClientChart = ({ clients }) => (
  <DonutChartWithLegend
    dataItems={clients}
  //  title="Répartition des clients"
    dataKey="nom"
    labelSingular="client"
    labelPlural="clients"
  />
);

// 👥 Employés par entreprise 
export const EmployeChart = ({ employees }) => {
  // Transformer les données d'employés pour le composant générique
  const transformedEmployees = Array.isArray(employees) 
    ? employees.map(emp => ({
        id: emp.id,
        nom: [emp.nom, emp.prenom].filter(Boolean).join(' ') || 'Non spécifié',
        count: 1
      }))
    : [];

  return (
    <DonutChartWithLegend
      dataItems={transformedEmployees}
    //  title="Répartition des employés"
      dataKey="nom"
      valueKey="count"
      labelSingular="employé"
      labelPlural="employés"
    />
  );
};

// 💳 Statut des factures (Pie)
export const StatusChart = ({ invoices }) => {
  const statusCounts = {
    'payé': 0,
    'en attente': 0,
    'acompte': 0,
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

export const PayrollChart = ({ payrolls = [] }) => {
  const data = {
    labels: payrolls.map(p => p.mois),
    datasets: [
      {
        label: 'Net à payer (FCFA)',
        data: payrolls.map(p => p.netAPayer),
        backgroundColor: CHART_COLORS.primary,
        borderColor: CHART_BORDERS.primary,
        borderWidth: 2,
        borderRadius: 4,
        hoverBackgroundColor: CHART_BORDERS.primary
      },
      {
        label: 'Charges sociales (FCFA)',
        data: payrolls.map(p => p.chargesSociales),
        backgroundColor: CHART_COLORS.secondary,
        borderColor: CHART_BORDERS.secondary,
        borderWidth: 2,
        borderRadius: 4,
        hoverBackgroundColor: CHART_BORDERS.secondary
      }
    ]
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.raw.toLocaleString('fr-FR')} FCFA`;
          }
        }
      }
    },
    scales: {
      ...commonOptions.scales,
      y: {
        ...commonOptions.scales.y,
        ticks: {
          callback: (value) => `${value.toLocaleString('fr-FR')} FCFA`
        }
      }
    }
  };

  return (
    <div style={{ height: '300px', padding: '1rem' }}>
      <Bar data={data} options={options} />
    </div>
  );
};

// Nouveau graphique pour les types de contrat (Payroll)
export const ContractTypeChart = ({ employees = [] }) => {
  const contractTypes = {
    'CDI': 0,
    'CDD': 0,
    'Stagiaire': 0,
    'Autre': 0
  };

  employees.forEach(emp => {
    const type = emp.typeContrat || 'Autre';
    contractTypes[type] = (contractTypes[type] || 0) + 1;
  });


  const data = {
    labels: Object.keys(contractTypes),
    datasets: [{
      data: Object.values(contractTypes),
      backgroundColor: [
        CHART_COLORS.success,
        CHART_COLORS.warning,
        CHART_COLORS.info,
        CHART_COLORS.light
      ],
      borderColor: '#fff',
      borderWidth: 2
    }]
  };

  return (
    <div style={{ height: '250px', padding: '1rem' }}>
      <Pie
        data={data}
        options={{
          ...commonOptions,
          plugins: {
            ...commonOptions.plugins,
            title: {
              display: true,
              text: 'Types de contrat',
              font: { size: 16 }
            }
          }
        }}
      />
    </div>
  );
};