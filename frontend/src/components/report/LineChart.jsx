import React from 'react';
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
  const chartData = {
    labels: labels || [],
    datasets: datasets || []
  };

  const textColor = '#94a3b8';
  
  const lineLabelsPlugin = {
    id: 'lineLabels',
    afterDraw(chart) {
      const { ctx, data } = chart;
      ctx.save();
      
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (meta.hidden) return;

        meta.data.forEach((element, index) => {
          const dataValue = dataset.data[index];
          if (dataValue === undefined || dataValue === null) return;

          const { x, y } = element.tooltipPosition();
          
          ctx.fillStyle = dataset.borderColor || '#ffffff';
          ctx.font = 'bold 14px sans-serif'; // 12px -> 14px
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          
          // 가독성을 위해 그림자 효과 추가
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 3;
          
          // 데이터 포인트 위에 건수 표시
          ctx.fillText(dataValue.toLocaleString(), x, y - 8);
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
        position: 'top',
        align: 'end',
        labels: { 
          color: textColor,
          boxWidth: 12,
          padding: 20,
          font: { size: 12 }
        },
      },
      title: {
        display: !!title,
        text: title,
        color: '#f1f5f9',
        font: { size: 16, weight: 'bold' }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f1f5f9',
        bodyColor: '#f1f5f9',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
      }
    },
    layout: {
      padding: {
        top: 25, // 라벨 공간 확보
        right: 20,
        left: 10,
        bottom: 10
      }
    },
    scales: {
      x: { 
        ticks: { color: textColor, font: { size: 11 } }, 
        grid: { display: false } // X축 그리드 제거로 깔끔하게
      },
      y: {
        beginAtZero: true,
        ticks: { 
          color: textColor, 
          font: { size: 11 },
          padding: 8
        },
        grid: { color: 'rgba(148,163,184,0.1)' },
        // 라벨이 잘리지 않도록 상단 여백 확보
        grace: '15%'
      },
    },
  };

  return (
    <div className="h-72">
      <Line data={chartData} options={options} plugins={[lineLabelsPlugin]} />
    </div>
  );
}

export default LineChart;

