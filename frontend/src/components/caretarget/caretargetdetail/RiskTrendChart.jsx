// RiskTrendChart.jsx
import React from 'react';
import { Line } from 'react-chartjs-2';
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


const RiskTrendChart = ({ trendList }) => {
  const chartData = {
    labels: trendList.length > 0 ? trendList.map(item => item.date) : ['데이터 없음'],
    datasets: [{
      label: '위험도 지수',
      data: trendList.length > 0 ? trendList.map(item => item.score) : [0],
      fill: true,
      borderColor: '#14b8a6', // teal-400
      backgroundColor: 'rgba(20, 184, 166, 0.1)', // teal-400 with opacity
      tension: 0.45,
      pointRadius: 3,
      pointBackgroundColor: '#0f172a', // slate-900
      pointBorderColor: '#14b8a6', // teal-400
      pointBorderWidth: 2,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { 
        beginAtZero: true, 
        max: 100, 
        ticks: { 
          stepSize: 25,
          color: '#94a3b8' // slate-400
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)' // slate-400 with opacity
        }
      },
      x: { 
        ticks: { 
          autoSkip: true, 
          maxTicksLimit: 7,
          color: '#94a3b8' // slate-400
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)' // slate-400 with opacity
        }
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-sm shadow-lg hover:shadow-xl transition-shadow p-10 flex-1 flex flex-col">
      <div className="flex justify-between items-start mb-8">
        <h3 className="font-black text-slate-200 text-sm tracking-widest uppercase flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-red-400 rounded-sm animate-pulse"></div> 위험도 추이
        </h3>
      </div>
      <div className="flex-1 min-h-[280px]">
        {trendList.length > 0 ? <Line data={chartData} options={chartOptions} /> : <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 rounded-sm border border-slate-700 flex items-center justify-center text-slate-500 text-xs font-bold">데이터가 없습니다.</div>}
      </div>
    </div>
  );
};

// AiAnalysisBox.jsx
const AiAnalysisBox = ({ aiMemo }) => (
  <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-sm shadow-lg hover:shadow-xl transition-shadow p-10">
    <h3 className="font-black text-teal-400 text-sm tracking-widest uppercase mb-6 flex items-center gap-2"><div className="w-5 h-[2px] bg-teal-400"></div> AI 분석 요약</h3>
    <div className="p-8 bg-gradient-to-br from-teal-500/10 to-teal-600/10 rounded-sm border border-teal-500/30 shadow-md">
      <p className="text-[15px] text-teal-300 font-bold italic leading-relaxed">"{aiMemo || "리포트가 없습니다."}"</p>
    </div>
  </div>
);

export { RiskTrendChart, AiAnalysisBox };