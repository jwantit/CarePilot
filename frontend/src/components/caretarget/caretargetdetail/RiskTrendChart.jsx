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
      borderColor: '#008080',
      backgroundColor: 'rgba(0, 128, 128, 0.03)',
      tension: 0.45,
      pointRadius: 3,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#008080',
      pointBorderWidth: 2,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { stepSize: 25 } },
      x: { ticks: { autoSkip: true, maxTicksLimit: 7 } }
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 flex-1 flex flex-col">
      <div className="flex justify-between items-start mb-8">
        <h3 className="font-black text-slate-800 text-sm tracking-widest uppercase flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div> 위험도 추이
        </h3>
      </div>
      <div className="flex-1 min-h-[280px]">
        {trendList.length > 0 ? <Line data={chartData} options={chartOptions} /> : <div className="w-full h-full bg-slate-50/50 rounded-3xl flex items-center justify-center text-slate-300 text-xs font-bold">데이터가 없습니다.</div>}
      </div>
    </div>
  );
};

// AiAnalysisBox.jsx
const AiAnalysisBox = ({ aiMemo }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
    <h3 className="font-black text-[#008080] text-sm tracking-widest uppercase mb-6 flex items-center gap-2"><div className="w-5 h-[2px] bg-[#008080]"></div> AI 분석 요약</h3>
    <div className="p-8 bg-[#008080]/5 rounded-[2rem] border border-[#008080]/10">
      <p className="text-[15px] text-[#006666] font-bold italic leading-relaxed">"{aiMemo || "리포트가 없습니다."}"</p>
    </div>
  </div>
);

export { RiskTrendChart, AiAnalysisBox };