'use client';

import React from 'react';
import { CircleDollarSign } from 'lucide-react';

interface CurrencyBarProps {
  inrRate: number;
  onRateChange: (rate: number) => void;
}

export const CurrencyBar: React.FC<CurrencyBarProps> = ({ inrRate, onRateChange }) => {
  return (
    <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/80 rounded-xl px-3 py-1.5 shadow-sm">
      <div className="flex items-center gap-1.5 text-xs text-emerald-900 font-medium">
        <CircleDollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>1 EUR (€) =</span>
      </div>

      <div className="flex items-center bg-white border border-emerald-300 rounded-lg px-2 py-0.5 shadow-inner">
        <span className="text-amber-600 font-bold text-xs mr-0.5">₹</span>
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
          className="w-16 bg-transparent font-bold text-slate-800 text-xs text-right focus:outline-none font-mono"
        />
        <span className="text-[10px] text-slate-500 font-semibold ml-1">INR</span>
      </div>
    </div>
  );
};
