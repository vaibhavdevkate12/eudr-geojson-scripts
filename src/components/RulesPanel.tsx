'use client';

import React, { useState } from 'react';

export const RulesPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'geojson' | 'dedup' | 'tokens'>('geojson');

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs sticky top-6">
        <div className="pb-3 border-b border-slate-100">
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            EUDR Compliance Rules
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Validation & Pricing Reference
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg mt-4 mb-4 text-[11px] font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('geojson')}
            className={`py-1 rounded transition-all text-center cursor-pointer ${
              activeTab === 'geojson' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
            }`}
          >
            GeoJSON
          </button>
          <button
            onClick={() => setActiveTab('dedup')}
            className={`py-1 rounded transition-all text-center cursor-pointer ${
              activeTab === 'dedup' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Dedup
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`py-1 rounded transition-all text-center cursor-pointer ${
              activeTab === 'tokens' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Pricing
          </button>
        </div>

        {/* Tab 1: GeoJSON Spec */}
        {activeTab === 'geojson' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-900 font-semibold border-b border-slate-100 pb-2">
              <span>Geometry & Properties</span>
              <span className="text-[10px] text-slate-500 font-mono">Mandatory</span>
            </div>
            <ul className="space-y-2 text-slate-600 list-disc list-inside">
              <li>Root type must be <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">FeatureCollection</code>.</li>
              <li>Allowed: <code className="text-slate-800 font-mono text-[10px]">Point</code>, <code className="text-slate-800 font-mono text-[10px]">MultiPoint</code>, <code className="text-slate-800 font-mono text-[10px]">Polygon</code>, <code className="text-slate-800 font-mono text-[10px]">MultiPolygon</code>.</li>
              <li>Longitude [-180, 180], Latitude [-90, 90].</li>
              <li>Outer boundary rings must be closed.</li>
              <li><strong>Holes & Self-Intersections:</strong> Rejected by EUDR spec.</li>
              <li>Required properties: <code className="text-slate-800 font-mono text-[10px]">ProducerName</code>, <code className="text-slate-800 font-mono text-[10px]">ProducerCountry</code> (ISO2), <code className="text-slate-800 font-mono text-[10px]">ProductionPlace</code>, <code className="text-slate-800 font-mono text-[10px]">Area</code>.</li>
            </ul>
          </div>
        )}

        {/* Tab 2: Deduplication Engine */}
        {activeTab === 'dedup' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-900 font-semibold border-b border-slate-100 pb-2">
              <span>6-Decimal Deduplication</span>
              <span className="text-[10px] text-slate-500 font-mono">~0.1m Precision</span>
            </div>
            <ul className="space-y-2 text-slate-600 list-disc list-inside">
              <li>Coordinates rounded to 6 decimal places.</li>
              <li>Consecutive duplicate vertices removed automatically.</li>
              <li>Geometry-Only hash deduplication.</li>
              <li>Geometry + Properties hash deduplication.</li>
            </ul>
          </div>
        )}

        {/* Tab 3: Token Pricing Rules */}
        {activeTab === 'tokens' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-900 font-semibold border-b border-slate-100 pb-2">
              <span>Token Pricing Structure</span>
              <span className="text-[10px] text-slate-500 font-mono">€1.00 / Token</span>
            </div>
            <ul className="space-y-2 text-slate-600 list-disc list-inside">
              <li>Polygons &lt; 0.03 ha = <strong>1 Token minimum</strong>.</li>
              <li>Polygons &ge; 0.03 ha = <strong>1 Token per Hectare</strong> (<code className="text-slate-800 font-mono text-[10px]">ceil(ha)</code>).</li>
              <li>Points: billed based on area (minimum 1 token).</li>
              <li>Compares Declared Area vs Turf.js Geodesic Calculated Area.</li>
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
};
