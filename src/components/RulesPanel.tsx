'use client';

import React, { useState } from 'react';
import { Shield, Layers, Coins, CheckCircle2, ChevronRight, FileCheck } from 'lucide-react';

export const RulesPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'geojson' | 'dedup' | 'tokens'>('geojson');

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-4 font-sans">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs sticky top-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">EUDR Compliance Rules</h2>
            <p className="text-[11px] text-slate-500">Traceability & Verification Criteria</p>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl mt-4 mb-4 text-[11px] font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('geojson')}
            className={`py-1.5 px-2 rounded-lg transition-all text-center ${
              activeTab === 'geojson' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
            }`}
          >
            GeoJSON
          </button>
          <button
            onClick={() => setActiveTab('dedup')}
            className={`py-1.5 px-2 rounded-lg transition-all text-center ${
              activeTab === 'dedup' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Dedup
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`py-1.5 px-2 rounded-lg transition-all text-center ${
              activeTab === 'tokens' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Pricing
          </button>
        </div>

        {/* Content Tab 1: GeoJSON Rules */}
        {activeTab === 'geojson' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-900 font-semibold border-b border-slate-100 pb-2">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                Geometry & Properties
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono">
                Mandatory
              </span>
            </div>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Root type must be <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">FeatureCollection</code>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Supported: <code className="text-slate-800 font-mono text-[10px]">Point</code>, <code className="text-slate-800 font-mono text-[10px]">MultiPoint</code>, <code className="text-slate-800 font-mono text-[10px]">Polygon</code>, <code className="text-slate-800 font-mono text-[10px]">MultiPolygon</code>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Longitude [-180, 180], Latitude [-90, 90]. Outer boundary rings must be closed.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Holes & Self-Intersections:</strong> Polygons with holes (multiple rings) or self-intersections are <strong>rejected</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Strict Casing: <code className="text-slate-800 font-mono text-[10px]">ProducerName</code>, <code className="text-slate-800 font-mono text-[10px]">ProducerCountry</code> (ISO2), <code className="text-slate-800 font-mono text-[10px]">ProductionPlace</code>, <code className="text-slate-800 font-mono text-[10px]">Area</code>.
                </span>
              </li>
            </ul>
          </div>
        )}

        {/* Content Tab 2: Deduplication Engine */}
        {activeTab === 'dedup' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-900 font-semibold border-b border-slate-100 pb-2">
              <span className="flex items-center gap-1.5 text-blue-700">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                6-Decimal Precision Engine
              </span>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono">
                ~0.1m Ground
              </span>
            </div>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>6-Decimal Rounding:</strong> Coordinates are rounded to 6 decimal places.</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Vertex Cleanup:</strong> Consecutive duplicate coordinates within rings are automatically removed.</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Geometry-Only:</strong> Deduplicates based on coordinate geometry hash.</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Geometry + Properties:</strong> Deduplicates matching geometry hash AND property key-values.</span>
              </li>
            </ul>
          </div>
        )}

        {/* Content Tab 3: Token Pricing Rules */}
        {activeTab === 'tokens' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-900 font-semibold border-b border-slate-100 pb-2">
              <span className="flex items-center gap-1.5 text-amber-700">
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                Token Billing Structure
              </span>
              <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-mono">
                €1.00 / Token
              </span>
            </div>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                <span>Polygons &lt; 0.03 ha = <strong>1 Token minimum</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                <span>Polygons &ge; 0.03 ha = <strong>1 Token per Hectare</strong> (<code className="text-slate-800 font-mono text-[10px]">ceil(ha)</code>).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                <span>Point features: billed based on area (minimum 1 token).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                <span>Compares Declared Area vs Turf.js Geodesic Calculated Area.</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
};
