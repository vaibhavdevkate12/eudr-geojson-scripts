'use client';

import React from 'react';
import { ArrowRightLeft } from 'lucide-react';

interface CurrencyBarProps {
  inrRate: number;
  onRateChange: (rate: number) => void;
}

export const CurrencyBar: React.FC<CurrencyBarProps> = ({ inrRate, onRateChange }) => {
  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-xs">
      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
        <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>1 EUR (€) =</span>
      </div>

      <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2 py-0.5">
        <span className="text-amber-700 font-semibold text-xs mr-0.5">₹</span>
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
          className="w-14 bg-transparent font-mono font-semibold text-slate-900 text-xs text-right focus:outline-none"
        />
        <span className="text-[10px] text-slate-400 font-medium ml-1">INR</span>
      </div>
    </div>
  );
};
