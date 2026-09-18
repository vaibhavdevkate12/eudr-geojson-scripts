'use client';

import React from 'react';

interface CurrencyBarProps {
  inrRate: number;
  onRateChange: (rate: number) => void;
}

export const CurrencyBar: React.FC<CurrencyBarProps> = ({ inrRate, onRateChange }) => {
  return (
    <div className="flex items-center gap-1.5 bg-slate-100/70 border border-slate-200/80 rounded-lg px-2.5 py-1 text-xs text-slate-700">
      <span className="font-medium text-[11px] text-slate-600">1 EUR =</span>
      <div className="flex items-center bg-white border border-slate-300 rounded px-1.5 py-0.5 shadow-2xs">
        <span className="text-slate-700 font-semibold text-[11px] mr-0.5">₹</span>
        <input
          type="number"
          step="0.1"
          value={inrRate}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && val > 0) {
              onRateChange(val);
            }
          }}
          className="w-12 bg-transparent font-mono font-medium text-slate-900 text-xs text-right focus:outline-none"
        />
        <span className="text-[10px] text-slate-400 ml-1">INR</span>
      </div>
    </div>
  );
};
