import React from 'react';
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
  const chartData = {
    labels: labels || [],
    datasets: [
      {
        label: title,
        data: data || [],
        backgroundColor: colors || '#008080',
        borderColor: colors || '#008080',
        borderWidth: 1,
      },
    ],
  };

  const textColor = '#94a3b8';

  const barLabelsPlugin = {
    id: 'barLabels',
    afterDraw(chart) {
      const { ctx, data } = chart;
      ctx.save();
      
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (meta.hidden) return;

        meta.data.forEach((element, index) => {
          const dataValue = dataset.data[index];
          if (dataValue === undefined || dataValue === null || dataValue === 0) return;

          const { x, y } = element.tooltipPosition();
          
          ctx.fillStyle = '#f1f5f9';
          ctx.font = 'bold 13px sans-serif'; // 11px -> 13px
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          
          // 그림자 효과
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 3;
          
          ctx.fillText(dataValue.toLocaleString(), x, y - 5);
        });
      });
      
      ctx.restore();
    }
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
        color: '#f1f5f9',
        font: { size: 14, weight: 'bold' }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f1f5f9',
        bodyColor: '#f1f5f9',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      }
    },
    layout: {
      padding: {
        top: 20
      }
    },
    scales: {
      x: { 
        ticks: { color: textColor, font: { size: 11 } }, 
        grid: { display: false } 
      },
      y: {
        beginAtZero: true,
        ticks: { color: textColor, font: { size: 11 } },
        grid: { color: 'rgba(148,163,184,0.1)' },
        grace: '10%'
      },
    },
  };

  return (
    <div className="h-72">
      <Bar data={chartData} options={options} plugins={[barLabelsPlugin]} />
    </div>
  );
}

export default BarChart;

