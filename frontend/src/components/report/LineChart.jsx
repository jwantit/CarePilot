import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function LineChart({ title, data, labels, datasets }) {
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
    datasets: datasets || []
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: { 
          color: mutedColor || (isDark ? '#94a3b8' : '#64748b'),
          boxWidth: 12,
          padding: 20,
          font: { size: 12 }
        },
      },
      title: {
        display: !!title,
        text: title,
        color: textColor || (isDark ? '#f1f5f9' : '#0f172a'),
        font: { size: 16, weight: 'bold' }
      },
      tooltip: {
        backgroundColor: cardColor || (isDark ? '#1e293b' : '#ffffff'),
        titleColor: textColor || (isDark ? '#f1f5f9' : '#0f172a'),
        bodyColor: textColor || (isDark ? '#f1f5f9' : '#0f172a'),
        borderColor: borderColor || (isDark ? '#334155' : '#e2e8f0'),
        borderWidth: 1,
        padding: 10,
      }
    },
    layout: {
      padding: {
        top: 25,
        right: 20,
        left: 10,
        bottom: 10
      }
    },
    scales: {
      x: { 
        ticks: { color: mutedColor || (isDark ? '#94a3b8' : '#64748b'), font: { size: 11 } }, 
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        ticks: { 
          color: mutedColor || (isDark ? '#94a3b8' : '#64748b'), 
          font: { size: 11 },
          padding: 8
        },
        grid: { color: borderColor || (isDark ? '#334155' : '#e2e8f0'), opacity: 0.1 },
        grace: '15%'
      },
    },
  };

  return (
    <div className="h-72">
      <Line 
        key={isDark ? 'dark' : 'light'}
        data={chartData} 
        options={options} 
        plugins={[]} 
      />
    </div>
  );
}

export default LineChart;
