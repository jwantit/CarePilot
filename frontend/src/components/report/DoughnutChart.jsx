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

  const doughnutLabelsPlugin = {
    id: 'doughnutLabels',
    afterDraw(chart) {
      const { ctx, chartArea, data, tooltip } = chart;
      if (!chartArea || !data.datasets?.[0]?.data?.length) return;
      
      const activeIndex = tooltip?._active?.length > 0 ? tooltip._active[0].element.index : -1;

      const values = data.datasets[0].data;
      const total = values.reduce((a, b) => Number(a) + Number(b), 0);
      if (total <= 0) return;

      const { left, right, top, bottom } = chartArea;

      const meta = chart.getDatasetMeta(0);
      if (!meta.data?.length) return;

      const centerX = (left + right) / 2;
      const centerY = (top + bottom) / 2;

      meta.data.forEach((arc, i) => {
        if (i === activeIndex) return;
        
        const value = data.datasets[0].data[i];
        if (value == null || value <= 0) return;

        const midAngle = (arc.startAngle + arc.endAngle) / 2;
        const midR = (arc.innerRadius + arc.outerRadius) / 2;
        const labelX = centerX + midR * Math.cos(midAngle);
        const labelY = centerY + midR * Math.sin(midAngle);

        const pct = ((value / total) * 100).toFixed(1);
        const countStr = value.toLocaleString();

        ctx.save();
        ctx.translate(labelX, labelY);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(`${pct}%`, 0, -10);
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(countStr, 0, 10);
        ctx.shadowBlur = 0;

        ctx.restore();
      });
    },
  };

  return (
    <div className="h-72">
      <Doughnut
        key={isDark ? 'dark' : 'light'} // 테마 변경 시 차트 강제 재렌더링
        data={chartData}
        options={options}
        plugins={[doughnutLabelsPlugin]}
      />
    </div>
  );
}

export default DoughnutChart;
