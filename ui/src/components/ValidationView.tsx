'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, FileText, Check, AlertCircle } from 'lucide-react';
import { ValidationResult } from '../utils/geojsonValidator';

export interface FileValidationItem {
  fileName: string;
  result: ValidationResult;
  rawError?: string;
}

interface ValidationViewProps {
  validations: FileValidationItem[];
}

export const ValidationView: React.FC<ValidationViewProps> = ({ validations }) => {
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});

  const totalFiles = validations.length;
  const passedFiles = validations.filter((v) => v.result?.valid && !v.rawError).length;
  const failedFiles = totalFiles - passedFiles;
  const totalErrors = validations.reduce((sum, v) => sum + (v.result?.summary?.errorCount || (v.rawError ? 1 : 0)), 0);

  const toggleExpand = (fileName: string) => {
    setExpandedFiles((prev) => ({ ...prev, [fileName]: !prev[fileName] }));
  };

  return (
    <div className="space-y-6">
      {/* Summary Header Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Files Checked</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalFiles}</div>
        </div>
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Passed Validation
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{passedFiles}</div>
        </div>
        <div className="bg-red-50/60 border border-red-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-red-800 font-semibold flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            Failed Validation
          </div>
          <div className="text-2xl font-bold text-red-700 mt-1">{failedFiles}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Validation Errors</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{totalErrors}</div>
        </div>
      </div>

      {/* File-by-file Validation Accordion */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            File Validation Report Details
          </h3>
          <span className="text-xs text-slate-500">
            Click files to view exact error paths and details
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {validations.map((item) => {
            const isValid = item.result?.valid && !item.rawError;
            const isExpanded = !!expandedFiles[item.fileName];
            const errorCount = item.result?.summary?.errorCount || (item.rawError ? 1 : 0);

            return (
              <div key={item.fileName} className="transition-colors hover:bg-slate-50/80">
                <div
                  onClick={() => toggleExpand(item.fileName)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 truncate">
                    {isValid ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                        <Check className="w-3.5 h-3.5" /> PASS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 shrink-0">
                        <XCircle className="w-3.5 h-3.5" /> FAIL ({errorCount} {errorCount === 1 ? 'error' : 'errors'})
                      </span>
                    )}

                    <span className="font-mono text-sm font-medium text-slate-800 truncate">{item.fileName}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
                    <span>{item.result?.summary?.totalFeatures ?? 0} Features</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expanded Error Details */}
                {isExpanded && (
                  <div className="px-6 pb-4 pt-1 bg-slate-50/50 border-t border-slate-100">
                    {isValid ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>All GeoJSON specifications and EUDR property requirements passed cleanly!</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {item.rawError ? (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                            <span>{item.rawError}</span>
                          </div>
                        ) : (
                          item.result.errors.map((err, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-white border border-red-200 rounded-xl text-xs space-y-1 shadow-xs"
                            >
                              <div className="flex items-center justify-between text-slate-700">
                                <span className="font-mono text-red-700 font-bold">
                                  Path: {err.path}
                                </span>
                                {err.featureIndex !== undefined && (
                                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                                    Feature #{err.featureIndex}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-800 font-medium">{err.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
