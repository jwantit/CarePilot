import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

function DoughnutChart({ title, data, labels, colors }) {
  const values = data || [];
  const total = values.reduce((a, b) => a + b, 0);

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
        borderColor: '#334155',
        hoverBorderWidth: 3,
        hoverBorderColor: '#475569',
      },
    ],
  };

  const textColor = '#94a3b8';
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
          color: textColor,
          font: { size: 12 },
          padding: 14,
          usePointStyle: true,
        },
      },
      title: {
        display: !!title,
        text: title,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f1f5f9', // 초록색(teal) 제거하고 흰색 계열로 변경
        bodyColor: '#f1f5f9',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          title: (context) => {
            return context[0].label; // 제목은 데이터 라벨로
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
      
      // 툴팁이 활성화된 인덱스 확인 (더 확실한 방법)
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
        // 호버된 조각이거나 값이 없으면 라벨을 그리지 않음
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
        ctx.font = 'bold 20px sans-serif'; // 18px -> 20px
        ctx.fillText(`${pct}%`, 0, -10);
        ctx.font = 'bold 14px sans-serif'; // 12px -> 14px (bold 추가)
        ctx.fillText(countStr, 0, 10);
        ctx.shadowBlur = 0;

        ctx.restore();
      });
    },
  };

  return (
    <div className="h-72">
      <Doughnut
        data={chartData}
        options={options}
        plugins={[doughnutLabelsPlugin]}
      />
    </div>
  );
}

export default DoughnutChart;
