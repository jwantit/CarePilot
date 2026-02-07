import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

function DoughnutChart({ title, data, labels, colors }) {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const values = data || [];
  const total = values.reduce((a, b) => a + b, 0);

  // 테마에 따른 색상값 가져오기
  const getThemeColor = (variableName) => {
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  };

  const cardColor = getThemeColor('--bg-card');
  const borderColor = getThemeColor('--border-main');
  const textColor = getThemeColor('--text-main');
  const mutedColor = getThemeColor('--text-muted');

  const chartData = {
    labels: labels || [],
    datasets: [
      {
        data: values,
        backgroundColor: colors || [
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#3b82f6',
        ],
        borderWidth: 2,
        borderColor: cardColor || (isDark ? '#1e293b' : '#ffffff'),
        hoverBorderWidth: 3,
        hoverBorderColor: borderColor || (isDark ? '#334155' : '#e2e8f0'),
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    layout: {
      padding: 8,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: mutedColor || (isDark ? '#94a3b8' : '#64748b'),
          font: { size: 12 },
          padding: 14,
          usePointStyle: true,
        },
      },
      title: {
        display: !!title,
        text: title,
        color: textColor || (isDark ? '#f1f5f9' : '#0f172a'),
      },
      tooltip: {
        enabled: true,
        backgroundColor: cardColor || (isDark ? '#1e293b' : '#ffffff'),
        titleColor: textColor || (isDark ? '#f1f5f9' : '#0f172a'),
        bodyColor: textColor || (isDark ? '#f1f5f9' : '#0f172a'),
        borderColor: borderColor || (isDark ? '#334155' : '#e2e8f0'),
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          title: (context) => {
            return context[0].label;
          },
          label: (context) => {
            const value = context.parsed || 0;
            const percentage = ((value / total) * 100).toFixed(1);
            return ` ${value.toLocaleString()}건 (${percentage}%)`;
          }
        }
      },
    },
  };

  return (
    <div className="h-72">
      <Doughnut
        key={isDark ? 'dark' : 'light'} // 테마 변경 시 차트 강제 재렌더링
        data={chartData}
        options={options}
        plugins={[]}
      />
    </div>
  );
}

export default DoughnutChart;
