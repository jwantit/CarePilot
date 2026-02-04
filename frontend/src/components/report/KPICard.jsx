import React from 'react';

function KPICard({ title, value, change, icon, onClick }) {
  const isIncrease = change?.type === 'increase';
  const changeValue = change?.value || 0;
  const hasChange = changeValue > 0;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div className="flex items-baseline justify-between">
        <p className="text-3xl font-bold text-slate-800">{value}</p>
        {hasChange && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            isIncrease ? 'text-green-600' : 'text-red-600'
          }`}>
            <span>{isIncrease ? '↗' : '↘'}</span>
            <span>{changeValue.toFixed(2)}%</span>
          </div>
        )}
      </div>
      {hasChange && (
        <p className="text-xs text-gray-500 mt-1">전월 대비</p>
      )}
    </div>
  );
}

export default KPICard;

