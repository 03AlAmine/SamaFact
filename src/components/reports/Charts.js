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


export const ClientChart = ({ clients }) => {
  const [currentPage, setCurrentPage] = useState(0); // 0 = graphique, 1 = légende
  const [currentLegendPage, setCurrentLegendPage] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const itemsPerPage = 6;
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
  const totalClients = values.reduce((a, b) => a + b, 0);

  // Palette de couleurs
  const backgroundColors = [
    // 🌌 Bleus & Violets
    '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81', '#1e3a8a', '#1e40af', '#1d4ed8',
    '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#c7d2fe', '#a5b4fc',
    '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#3f0c96', '#9d4edd', '#7b2cbf',
    '#a855f7', '#9333ea', '#c026d3', '#a21caf', '#86198f', '#701a75',

    // 💖 Roses / Magentas / Rouges doux
    '#ec4899', '#db2777', '#be185d', '#9d174d', '#f472b6', '#f06292', '#ff80ab', '#ff4d94',
    '#e84393', '#ff6f91', '#ff8da1', '#fca5a5', '#fecaca', '#f43f5e', '#ef4444', '#dc2626',
    '#b91c1c', '#ae2c2c', '#9f1239', '#fb7185', '#fda4af', '#ffe0e6',

    // 🔥 Oranges & Tons chauds
    '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12', '#ff8e42', '#ff6a00', '#ff7849',
    '#ffa366', '#ffb380', '#fca311', '#fb8c00', '#f57c00', '#ef6c00', '#ff9800', '#ffb74d',
    '#fed7aa', '#fbd38d', '#f6ad55', '#f59e0b', '#eab308', '#facc15', '#fcd34d', '#fde68a',
    '#fef08a', '#fff3b0', '#ffd166',

    // 🍃 Verts / Menthes / Limes
    '#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#34d399', '#22c55e', '#16a34a',
    '#15803d', '#166534', '#14532d', '#4ade80', '#84cc16', '#bef264', '#c6f68d', '#86efac',
    '#bbf7d0', '#ccfbf1', '#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e',
    '#064e3b', '#4caf50', '#66bb6a', '#81c784', '#a5d6a7', '#c7f9cc', '#80ed99', '#57cc99',

    // 🌊 Turquoises / Cyans / Bleus clairs
    '#06b6d4', '#0891b2', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe', '#0d9488',
    '#0284c7', '#0369a1', '#075985', '#0e7490', '#14b8a6', '#2ec4b6', '#1d9bf0', '#3da9fc',
    '#48cae4', '#90e0ef', '#caf0f8', '#0096c7', '#00b4d8', '#7cd4fd',

    // 🍇 Mélanges premium (dégradés naturels)
    '#d946ef', '#c026d3', '#a21caf', '#86198f', '#fb7185', '#fb6f92', '#ff99cc', '#ffb3d9',
    '#ffa8e2', '#ffd1dc', '#fcd5ce', '#fae1dd', '#fde2e4', '#f8edeb', '#ffe5ec', '#ffc2d1',

    // 🪵 Marrons / Chauds naturels
    '#78350f', '#92400e', '#b45309', '#d97706', '#e4863b', '#c8652c', '#ad4f1c', '#8d3c13',
    '#7b341e', '#6d2812', '#5c1f0f', '#cc8e35', '#a47148', '#8d5524', '#7f4f24', '#6f400f',

    // 🖤 Gris / Neutres / Anthracite
    '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#0b141f', '#94a3b8', '#cbd5e1',
    '#e2e8f0', '#f1f5f9', '#f8fafc', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937',
    '#f3f4f6', '#e5e7eb', '#d1d5db', '#a8a29e', '#78716c', '#57534e', '#44403c', '#262626',

    // ✨ Pastels premium (super beaux pour backgrounds)
    '#fde2e4', '#fad2e1', '#e2ece9', '#bee1e6', '#fef6e4', '#fff5e1', '#f6e9d7', '#faedcd',
    '#f5ebe0', '#e3d5ca', '#d6ccc2', '#f8edeb', '#dbe9f4', '#edf2fb', '#ffe5ec', '#e9edc9',
    '#d7e3fc', '#f0efeb', '#d8e2dc', '#ece4db', '#f7ede2', '#fff1e6', '#fde4cf', '#f1faee',

    // 🟣 Tons spéciaux / Vibrants / Néons
    '#b5179e', '#f72585', '#7209b7', '#560bad', '#480ca8', '#4cc9f0', '#4361ee', '#3a0ca3',
    '#720e9e', '#d00000', '#ff4800', '#ff6d00', '#ff9500', '#ffea00', '#bcff01', '#80ff72',
    '#38b000', '#008000', '#37ff8b', '#00ffa3', '#00f5d4', '#00bbf0', '#00a6fb', '#00509d',

    // 🌈 Mélanges personnalisés
    '#ff4f79', '#ff7f50', '#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff',
    '#bdb2ff', '#ffc6ff', '#fffffc', '#f1c0e8', '#cfbaf0', '#a3c4f3', '#90dbf4', '#00b3a4',
    '#00aab7', '#0096a5', '#006d77', '#e29578', '#ffddd2', '#edf6f9', '#eaf4f4', '#bee3db'
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
            const percentage = totalClients > 0 ? ((value / totalClients) * 100).toFixed(1) : 0;
            return `${label}: ${value} clients (${percentage}%)`;
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
        setCurrentPage(prev => (prev + 1) % 2); // Alterne entre 0 et 1
      }, 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovering]); // Dépendance sur isHovering 

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
    // Réinitialiser le timer quand on change manuellement de page
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
      className="client-chart-container"
    >
      {/* Boutons de pagination seulement (sans titre) */}
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
              {totalClients}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#64748b',
              fontWeight: '500',
              marginBottom: '4px'
            }}>
              Clients
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
        {/* Liste des légendes avec scroll */}
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

        {/* Barre inférieure avec état de rotation ET pagination de légende */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '10px',
          borderTop: '1px solid #e2e8f0',
          gap: '10px'
        }}>
          {/* Indicateur d'état de rotation à gauche */}
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

          {/* Indicateur de pagination de légende au centre */}
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

          {/* Boutons de pagination de légende à droite */}
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
export const EmployeChart = ({ employees }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  const intervalRef = useRef(null);

  const companies = {};
  if (Array.isArray(employees)) {
    employees.forEach(employee => {
      const company = [employee?.nom, employee?.prenom].filter(Boolean).join(' ') || 'Non spécifié';
      companies[company] = (companies[company] || 0) + 1;
    });
  }

  const labels = Object.keys(companies);
  const values = Object.values(companies);

  // Palette de couleurs modernes
  const backgroundColors = [
    // Couleurs existantes
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444',
    '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
    '#64748b', '#94a3b8', '#cbd5e1',

    // Couleurs ajoutées
    '#a855f7', '#9333ea', '#7c3aed', '#6d28d9', // violet
    '#d946ef', '#c026d3', '#a21caf', '#86198f', // rose/violet
    '#facc15', '#fde68a', '#fef08a', '#fcd34d', // jaune
    '#4ade80', '#34d399', '#2dd4bf', '#5eead4', // vert-menthe
    '#0d9488', '#0891b2', '#0284c7', '#2563eb', // bleu
    '#1d4ed8', '#1e40af', '#1e3a8a', '#172554', // bleu foncé
    '#f43f5e', '#fb7185', '#fca5a5', '#fecaca', // rouge/rose
    '#e2e8f0', '#f1f5f9', '#f8fafc', '#e5e7eb'  // gris/pastel
  ];


  const data = {
    labels,
    datasets: [{
      label: 'Nombre d\'employés par ',
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
      gap: '1rem',
      alignItems: 'center',
      flexWrap: 'wrap', // ✅ pour responsivité
      maxWidth: '100%',
      margin: '0 auto',
      padding: '0,5rem',
      boxSizing: 'border-box'
    }}>
      {/* Graphique */}
      <div style={{
        height: '250px',
        width: '250px',
        position: 'relative',
        flexShrink: 0
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
            Employés
          </div>
        </div>
      </div>

      {/* Légende avec carousel */}
      <div
        onMouseEnter={pauseAutoSlide}
        onMouseLeave={resumeAutoSlide}
        style={{
          flex: 1,
          minWidth: '260px',
          padding: '1rem',
          borderRadius: '12px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}
      >

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
          minHeight: '160px',
          maxWidth: '100%',
          overflow: 'hidden'
        }}>
          {visibleLegends.map((label, i) => (
            <div key={label} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              overflow: 'hidden',
              maxWidth: '100%'
            }}>
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
                fontWeight: '500',
                maxWidth: '80%',
                flexGrow: 1,
                display: 'inline-block'
              }}>
                {label}
              </span>
              <span style={{
                marginLeft: 'auto',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}>
                {values[start + i]}
              </span>
            </div>
          ))}
        </div>

        {/* Navigation & pagination */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '0.5rem'
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