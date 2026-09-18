'use client';

import React from 'react';
import { ShieldCheck, Layers, Coins, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

export const RulesPanel: React.FC = () => {
  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sticky top-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">EUDR Verification Rules</h2>
            <p className="text-[11px] text-slate-500">System Standards & Compliance</p>
          </div>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Section 1: GeoJSON & EUDR Validation */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>1. GeoJSON Structure</span>
            </div>
            <ul className="space-y-1.5 text-slate-600 pl-1">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Root must be <code className="text-emerald-800 bg-emerald-100/60 px-1 py-0.5 rounded font-mono text-[10px]">FeatureCollection</code>.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Allowed geometries: <code className="text-slate-800 font-mono text-[10px]">Point</code>, <code className="text-slate-800 font-mono text-[10px]">MultiPoint</code>, <code className="text-slate-800 font-mono text-[10px]">Polygon</code>, <code className="text-slate-800 font-mono text-[10px]">MultiPolygon</code>.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Coordinates: Lon [-180, 180], Lat [-90, 90].</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Rings must be closed. <strong>Holes & crossing lines are rejected.</strong></span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Required property casing: <code className="text-slate-800 font-mono text-[10px]">ProducerName</code>, <code className="text-slate-800 font-mono text-[10px]">ProducerCountry</code> (ISO2), <code className="text-slate-800 font-mono text-[10px]">Area</code>.</span>
              </li>
            </ul>
          </div>

          {/* Section 2: Deduplication */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-blue-700 font-bold">
              <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>2. Deduplication Engine</span>
            </div>
            <ul className="space-y-1.5 text-slate-600 pl-1">
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 font-bold">•</span>
                <span><strong>6-Decimal Rounding:</strong> Coordinates rounded to 6 decimals (~0.1m precision).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 font-bold">•</span>
                <span><strong>Vertex Cleanup:</strong> Consecutive duplicate coordinates removed.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 font-bold">•</span>
                <span>Deduplicates by Geometry Hash & Geometry+Properties Hash.</span>
              </li>
            </ul>
          </div>

          {/* Section 3: Token Pricing */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-800 font-bold">
              <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>3. Token Pricing Rules</span>
            </div>
            <ul className="space-y-1.5 text-slate-600 pl-1">
              <li className="flex items-start gap-1.5">
                <span className="text-amber-600 font-bold">•</span>
                <span>Polygon &lt; 0.03 ha = <strong>1 token</strong>.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-600 font-bold">•</span>
                <span>Polygon &ge; 0.03 ha = <strong>1 token per hectare</strong> (<code className="text-slate-800 font-mono text-[10px]">ceil(ha)</code>).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-600 font-bold">•</span>
                <span>Points: billed based on area (minimum 1 token).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-600 font-bold">•</span>
                <span>Base Cost: <strong>€1.00 / Token</strong>. Real-time INR conversion.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
};
