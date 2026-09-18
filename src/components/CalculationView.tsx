'use client';

import React, { useState } from 'react';
import { CalculationReport, CategorySummary } from '../utils/calculationEngine';
import { Layers, Search, MapPin, Hexagon, Download, Calculator } from 'lucide-react';

interface CalculationViewProps {
  report: CalculationReport;
  inrRate: number;
}

export const CalculationView: React.FC<CalculationViewProps> = ({ report, inrRate }) => {
  const [dedupMode, setDedupMode] = useState<'geometryOnly' | 'geometryAndProperties'>('geometryOnly');
  const [searchQuery, setSearchQuery] = useState('');

  const activeCategory: CategorySummary & { uniqueEntries: any[] } =
    dedupMode === 'geometryOnly' ? report.geometryOnly : report.geometryAndProperties;

  const filteredEntries = activeCategory.uniqueEntries.filter((entry) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      entry.firstSeenFile.toLowerCase().includes(q) ||
      entry.featureType.toLowerCase().includes(q) ||
      entry.geometryHash.toLowerCase().includes(q) ||
      JSON.stringify(entry.properties).toLowerCase().includes(q)
    );
  });

  const exportReport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `EUDR_Token_Estimation_Report_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Deduplication Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            Deduplication Analysis Mode
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Switch between Geometry-only coordinates hash or Geometry + Properties hash.
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 w-full sm:w-auto text-xs font-medium text-slate-600">
          <button
            onClick={() => setDedupMode('geometryOnly')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all ${
              dedupMode === 'geometryOnly'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Geometry-Only Uniqueness
          </button>
          <button
            onClick={() => setDedupMode('geometryAndProperties')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all ${
              dedupMode === 'geometryAndProperties'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Geometry + Properties Uniqueness
          </button>
        </div>
      </div>

      {/* Summary Cards Grid: Declared vs Calculated Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Declared Area Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                Basis Option 1
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">Declared Area Basis</h4>
            </div>
            <span className="text-[11px] text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg font-mono">
              properties.Area
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Hectares</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {activeCategory.declaredAreaHa.toLocaleString()} <span className="text-xs text-slate-500 font-normal">ha</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Tokens</div>
              <div className="text-lg font-bold text-emerald-600 mt-0.5">
                {activeCategory.declaredTokens.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Total Cost (EUR):</span>
              <span className="font-mono font-bold text-slate-900">
                €{activeCategory.declaredCostEur.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200/80 pt-1.5">
              <span className="text-slate-600 font-medium">Total Cost (INR @ ₹{inrRate}/€):</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">
                ₹{activeCategory.declaredCostInr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Calculated Area Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                Basis Option 2
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">Turf Geodesic Area Basis</h4>
            </div>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-mono">
              Turf.js Geodesic
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Hectares</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {activeCategory.calculatedAreaHa.toLocaleString()} <span className="text-xs text-slate-500 font-normal">ha</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Tokens</div>
              <div className="text-lg font-bold text-emerald-600 mt-0.5">
                {activeCategory.calculatedTokens.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Total Cost (EUR):</span>
              <span className="font-mono font-bold text-slate-900">
                €{activeCategory.calculatedCostEur.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200/80 pt-1.5">
              <span className="text-slate-600 font-medium">Total Cost (INR @ ₹{inrRate}/€):</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">
                ₹{activeCategory.calculatedCostInr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Breakdown Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <div className="text-slate-500 font-medium">Unique Features</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{activeCategory.totalUniqueFeatures}</div>
        </div>
        <div>
          <div className="text-slate-500 font-medium flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            Point Features
          </div>
          <div className="text-lg font-bold text-blue-600 mt-0.5">{activeCategory.pointCount}</div>
        </div>
        <div>
          <div className="text-slate-500 font-medium flex items-center gap-1">
            <Hexagon className="w-3.5 h-3.5 text-emerald-600" />
            Polygon Features
          </div>
          <div className="text-lg font-bold text-emerald-600 mt-0.5">{activeCategory.polygonCount}</div>
        </div>
        <div>
          <div className="text-slate-500 font-medium">Polygons &ge; 0.03 ha</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{activeCategory.largePolygonCountCalculated}</div>
        </div>
      </div>

      {/* Unique Features Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-emerald-600" />
              Unique Feature Breakdown Table
            </h3>
            <span className="text-xs text-slate-500">({filteredEntries.length} items)</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search file, type..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <button
              onClick={exportReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 sticky top-0 backdrop-blur-md">
              <tr>
                <th className="py-2.5 px-3.5">#</th>
                <th className="py-2.5 px-3.5">Source File</th>
                <th className="py-2.5 px-3.5">Geometry Type</th>
                <th className="py-2.5 px-3.5 text-right">Declared Area</th>
                <th className="py-2.5 px-3.5 text-right">Calculated Area</th>
                <th className="py-2.5 px-3.5 text-right">Tokens</th>
                <th className="py-2.5 px-3.5 text-right">Cost (€ EUR)</th>
                <th className="py-2.5 px-3.5 text-right">Cost (₹ INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredEntries.map((entry, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 text-slate-800">
                  <td className="py-2 px-3.5 text-slate-400">{idx + 1}</td>
                  <td className="py-2 px-3.5 font-semibold text-slate-900 max-w-xs truncate">{entry.firstSeenFile}</td>
                  <td className="py-2 px-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-emerald-700 font-semibold border border-slate-200/80">
                      {entry.featureType}
                    </span>
                  </td>
                  <td className="py-2 px-3.5 text-right text-slate-700">{entry.declaredAreaHa.toFixed(4)} ha</td>
                  <td className="py-2 px-3.5 text-right font-semibold text-emerald-700">{entry.calculatedAreaHa.toFixed(4)} ha</td>
                  <td className="py-2 px-3.5 text-right font-bold text-slate-900">{entry.calculatedTokens}</td>
                  <td className="py-2 px-3.5 text-right text-amber-700 font-semibold">€{entry.calculatedTokens.toFixed(2)}</td>
                  <td className="py-2 px-3.5 text-right text-emerald-700 font-bold">
                    ₹{(entry.calculatedTokens * inrRate).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
