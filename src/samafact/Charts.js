import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
ChartJS.register(...registerables);

export const BarChart = ({ data }) => {
    const chartData = {
        labels: data.map(item => item.name),
        datasets: [{
            label: 'Entreprises créées',
            data: data.map(item => item.count),
            backgroundColor: 'rgba(67, 97, 238, 0.7)',
            borderColor: 'rgb(67, 238, 115)',
            borderWidth: 1
        }]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.dataset.label}: ${context.raw}`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        }
    };

    return <Bar data={chartData} options={options} />;
};

export const PieChart = ({ data }) => {
    const colors = [
        'rgba(67, 97, 238, 0.7)',
        'rgba(76, 240, 163, 0.7)',
        'rgba(248, 150, 30, 0.7)'
    ];

    const chartData = {
        labels: data.map(item => item.name),
        datasets: [{
            data: data.map(item => item.value),
            backgroundColor: colors,
            borderColor: colors.map(color => color.replace('0.7', '1')),
            borderWidth: 1
        }]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        }
    };

    return <Pie data={chartData} options={options} />;
};