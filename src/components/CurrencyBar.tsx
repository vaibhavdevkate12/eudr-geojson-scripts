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
      <div className="flex items-center bg-white border border-slate-300 rounded px-2 py-0.5 shadow-2xs">
        <span className="text-slate-700 font-semibold text-xs mr-0.5">₹</span>
        <input
          type="number"
          step="0.01"
          value={inrRate}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && val > 0) {
              onRateChange(val);
            }
          }}
          className="w-20 bg-transparent font-mono font-medium text-slate-900 text-xs text-right focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[11px] font-semibold text-slate-500 ml-1">INR</span>
      </div>
    </div>
  );
};
