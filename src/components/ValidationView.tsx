'use client';

import React, { useState } from 'react';
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'pass' | 'fail'>('all');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const totalFiles = validations.length;
  const passedFiles = validations.filter((v) => v.result?.valid && !v.rawError).length;
  const failedFiles = totalFiles - passedFiles;
  const totalErrors = validations.reduce((sum, v) => sum + (v.result?.summary?.errorCount || (v.rawError ? 1 : 0)), 0);

  const toggleExpand = (fileName: string) => {
    setExpandedFiles((prev) => ({ ...prev, [fileName]: !prev[fileName] }));
  };

  const filteredValidations = validations.filter((v) => {
    const isValid = v.result?.valid && !v.rawError;
    if (statusFilter === 'pass') return isValid;
    if (statusFilter === 'fail') return !isValid;
    return true;
  });

  const formatErrorsAsText = (item: FileValidationItem): string => {
    const lines: string[] = [];
    lines.push(`EUDR GeoJSON Validation Errors`);
    lines.push(`====================================`);
    lines.push(`File: ${item.fileName}`);
    lines.push(`Total Features: ${item.result?.summary?.totalFeatures ?? 0}`);
    lines.push(`Error Count: ${item.result?.summary?.errorCount || (item.rawError ? 1 : 0)}`);
    lines.push(`------------------------------------`);

    if (item.rawError) {
      lines.push(`[Fatal Error] ${item.rawError}`);
    } else if (item.result?.errors) {
      item.result.errors.forEach((err, idx) => {
        const featStr = err.featureIndex !== undefined ? ` [Feature #${err.featureIndex}]` : '';
        lines.push(`${idx + 1}. Path: ${err.path}${featStr}`);
        lines.push(`   Message: ${err.message}`);
      });
    }
    return lines.join('\n');
  };

  const handleCopyErrors = (e: React.MouseEvent, item: FileValidationItem) => {
    e.stopPropagation();
    const errorText = formatErrorsAsText(item);
    navigator.clipboard.writeText(errorText);
    setCopiedFile(item.fileName);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleDownloadErrors = (e: React.MouseEvent, item: FileValidationItem) => {
    e.stopPropagation();
    const errorText = formatErrorsAsText(item);
    const blob = new Blob([errorText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Validation_Errors_${item.fileName.replace(/\.geojson|\.json/gi, '')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllErrors = () => {
    const failedItems = validations.filter((v) => !(v.result?.valid && !v.rawError));
    if (failedItems.length === 0) return;

    const lines: string[] = [];
    lines.push(`EUDR GeoJSON Validation Errors Summary`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Failed Files Count: ${failedItems.length}`);
    lines.push(`====================================\n`);

    failedItems.forEach((item, idx) => {
      lines.push(`[File #${idx + 1}] ${item.fileName}`);
      lines.push(formatErrorsAsText(item));
      lines.push(`\n------------------------------------\n`);
    });

    const errorText = lines.join('\n');
    const blob = new Blob([errorText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EUDR_All_Validation_Errors_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Files Analyzed</div>
          <div className="text-xl font-semibold text-slate-900 mt-1">{totalFiles}</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Passed Validation</div>
          <div className="text-xl font-semibold text-emerald-700 mt-1">{passedFiles}</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Failed Validation</div>
          <div className="text-xl font-semibold text-red-700 mt-1">{failedFiles}</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Total Errors</div>
          <div className="text-xl font-semibold text-amber-700 mt-1">{totalErrors}</div>
        </div>
      </div>

      {/* Filter Bar & Detailed File Report List */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Validation Report Details
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            {failedFiles > 0 && (
              <button
                onClick={handleDownloadAllErrors}
                className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-xs font-semibold transition-all cursor-pointer"
              >
                Download All Errors (.txt)
              </button>
            )}

            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg text-xs font-medium text-slate-600">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'hover:text-slate-900'
                }`}
              >
                All ({totalFiles})
              </button>
              <button
                onClick={() => setStatusFilter('pass')}
                className={`px-3 py-1 rounded transition-all cursor-pointer ${
                  statusFilter === 'pass' ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'hover:text-slate-900'
                }`}
              >
                Passed ({passedFiles})
              </button>
              <button
                onClick={() => setStatusFilter('fail')}
                className={`px-3 py-1 rounded transition-all cursor-pointer ${
                  statusFilter === 'fail' ? 'bg-white text-red-700 shadow-2xs font-semibold' : 'hover:text-slate-900'
                }`}
              >
                Failed ({failedFiles})
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredValidations.map((item) => {
            const isValid = item.result?.valid && !item.rawError;
            const isExpanded = !!expandedFiles[item.fileName];
            const errorCount = item.result?.summary?.errorCount || (item.rawError ? 1 : 0);

            return (
              <div key={item.fileName} className="transition-colors hover:bg-slate-50/60">
                <div
                  onClick={() => toggleExpand(item.fileName)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 truncate">
                    {isValid ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                        PASS
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200/80 shrink-0">
                        FAIL ({errorCount})
                      </span>
                    )}

                    <span className="font-mono text-xs font-medium text-slate-800 truncate">{item.fileName}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs shrink-0">
                    {!isValid && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleCopyErrors(e, item)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium border border-slate-200 transition-all cursor-pointer"
                        >
                          {copiedFile === item.fileName ? 'Copied!' : 'Copy Errors'}
                        </button>
                        <button
                          onClick={(e) => handleDownloadErrors(e, item)}
                          className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[11px] font-medium border border-red-200 transition-all cursor-pointer"
                        >
                          Download Errors (.txt)
                        </button>
                      </div>
                    )}
                    <span className="font-mono text-slate-500">{item.result?.summary?.totalFeatures ?? 0} features</span>
                    <span className="text-slate-400">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded Error Details */}
                {isExpanded && (
                  <div className="px-6 pb-4 pt-1 bg-slate-50/50 border-t border-slate-100">
                    {isValid ? (
                      <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-lg text-xs text-emerald-900">
                        All GeoJSON specs and EUDR property rules passed cleanly.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pt-1 pb-1">
                          <span className="text-[11px] font-semibold text-red-800 uppercase tracking-wider">
                            Validation Failures ({errorCount})
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleCopyErrors(e, item)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium border border-slate-300 transition-all cursor-pointer shadow-2xs"
                            >
                              {copiedFile === item.fileName ? 'Copied to Clipboard!' : 'Copy Errors Text'}
                            </button>
                            <button
                              onClick={(e) => handleDownloadErrors(e, item)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-medium transition-all cursor-pointer shadow-2xs"
                            >
                              Download Errors (.txt)
                            </button>
                          </div>
                        </div>

                        {item.rawError ? (
                          <div className="p-3 bg-red-50/60 border border-red-200/80 rounded-lg text-xs text-red-900">
                            {item.rawError}
                          </div>
                        ) : (
                          item.result.errors.map((err, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-white border border-red-200/90 rounded-lg text-xs space-y-1 shadow-2xs"
                            >
                              <div className="flex items-center justify-between text-slate-700">
                                <span className="font-mono text-red-700 font-semibold">
                                  Path: {err.path}
                                </span>
                                {err.featureIndex !== undefined && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                                    Feature #{err.featureIndex}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-800">{err.message}</p>
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

