import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function BarChart({ title, data, labels, colors }) {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const getThemeColor = (variableName) => {
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  };

  const textColor = getThemeColor('--text-main');
  const mutedColor = getThemeColor('--text-muted');
  const borderColor = getThemeColor('--border-main');
  const cardColor = getThemeColor('--bg-card');

  const chartData = {
    labels: labels || [],
    datasets: [
      {
        label: title,
        data: data || [],
        backgroundColor: colors || '#008080',
        borderColor: colors || '#008080',
        borderWidth: 1,
        barPercentage: 0.45,
        categoryPercentage: 0.8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: !!title,
        text: title,
        color: textColor || (isDark ? '#f1f5f9' : '#0f172a'),
        font: { size: 14, weight: 'bold' }
      },
      tooltip: {
        backgroundColor: cardColor || (isDark ? '#1e293b' : '#ffffff'),
        titleColor: textColor || (isDark ? '#f1f5f9' : '#0f172a'),
        bodyColor: textColor || (isDark ? '#f1f5f9' : '#0f172a'),
        borderColor: borderColor || (isDark ? '#334155' : '#e2e8f0'),
        borderWidth: 1,
      }
    },
    layout: {
      padding: {
        top: 20
      }
    },
    datasets: {
      bar: {
        barPercentage: 0.45,
        categoryPercentage: 0.8,
      },
    },
    scales: {
      x: { 
        ticks: { color: mutedColor || (isDark ? '#94a3b8' : '#64748b'), font: { size: 11 } }, 
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: mutedColor || (isDark ? '#94a3b8' : '#64748b'), font: { size: 11 } },
        grid: { color: borderColor || (isDark ? '#334155' : '#e2e8f0'), opacity: 0.1 },
        grace: '10%'
      },
    },
  };

  return (
    <div className="h-72">
      <Bar 
        key={isDark ? 'dark' : 'light'}
        data={chartData} 
        options={options} 
        plugins={[]} 
      />
    </div>
  );
}

export default BarChart;
