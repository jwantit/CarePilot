import React from 'react';

function KPICard({ title, value, change, icon, onClick }) {
  const isIncrease = change?.type === 'increase';
  const changeValue = change?.value || 0;
  const hasChange = changeValue > 0;

  return (
    <div
      className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-xl shadow-lg p-6 hover:shadow-xl hover:border-teal-500/50 transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-cp-muted">{title}</h3>
        {icon && <div className="text-cp-muted">{icon}</div>}
      </div>
      <div className="flex items-baseline justify-between">
        <p className="text-3xl font-bold text-cp-text">{value}</p>
        {hasChange && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            isIncrease ? 'text-teal-400' : 'text-red-400'
          }`}>
            <span>{isIncrease ? '↗' : '↘'}</span>
            <span>{changeValue.toFixed(2)}%</span>
          </div>
        )}
      </div>
      {hasChange && (
        <p className="text-xs text-cp-muted mt-1">전월 대비</p>
      )}
    </div>
  );
}

export default KPICard;
