'use client';

import React, { useState, useMemo } from 'react';
import { LoginPage } from '../components/LoginPage';
import { FileUploader } from '../components/FileUploader';
import { RulesPanel } from '../components/RulesPanel';
import { CurrencyBar } from '../components/CurrencyBar';
import { ValidationView, FileValidationItem } from '../components/ValidationView';
import { CalculationView } from '../components/CalculationView';
import { validateGeoJSON } from '../utils/geojsonValidator';
import { runCalculation, FileInputData } from '../utils/calculationEngine';
import { Calculator, CheckCircle2, LogOut } from 'lucide-react';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [files, setFiles] = useState<FileInputData[]>([]);
  const [inrRate, setInrRate] = useState<number>(110);
  const [activeTab, setActiveTab] = useState<'validation' | 'calculation'>('validation');

  const handleFilesLoaded = (newFiles: FileInputData[]) => {
    setFiles(newFiles);
  };

  const handleClear = () => {
    setFiles([]);
  };

  // Compute file validations
  const fileValidations: FileValidationItem[] = useMemo(() => {
    return files.map((file) => {
      if (file.error) {
        return {
          fileName: file.name,
          result: { valid: false, summary: { totalFeatures: 0, errorCount: 1 }, errors: [] },
          rawError: file.error,
        };
      }
      const valResult = validateGeoJSON(file.geojson);
      return {
        fileName: file.name,
        result: valResult,
      };
    });
  }, [files]);

  // Compute calculation report
  const calculationReport = useMemo(() => {
    return runCalculation(files, inrRate);
  }, [files, inrRate]);

  if (!isAuthenticated) {
    return <LoginPage onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs shrink-0">
              <img
                src="/emertech-logo.svg"
                alt="Emertech Innovations"
                className="h-9 w-auto object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                EUDR GeoJSON Verification & Token Calculator
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Logged in as <span className="font-semibold text-slate-700">info@emertech.io</span>
              </p>
            </div>
          </div>

          {/* Top Right Controls: Currency Bar & Logout */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Currency Rate Input Box */}
            <CurrencyBar inrRate={inrRate} onRateChange={(rate) => setInrRate(rate)} />

            <button
              onClick={() => setIsAuthenticated(false)}
              className="flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-semibold transition-all shrink-0"
            >
              <LogOut className="w-4 h-4 text-slate-500 hover:text-red-600" />
              Sign Out
            </button>
          </div>
        </header>

        {/* 2-Column Main Layout: Verification Rules on Left Side */}
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* Left Column: Verification Rules */}
          <RulesPanel />

          {/* Right Main Content */}
          <main className="flex-1 w-full space-y-6">
            {/* File & Folder Uploader */}
            <FileUploader files={files} onFilesLoaded={handleFilesLoaded} onClear={handleClear} />

            {/* Step Navigation Tabs & Results */}
            {files.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <button
                    onClick={() => setActiveTab('validation')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'validation'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Step 1: File Validation ({fileValidations.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('calculation')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'calculation'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    <Calculator className="w-4 h-4" />
                    Step 2: Token & Cost Calculation
                  </button>
                </div>

                {/* Active View */}
                {activeTab === 'validation' ? (
                  <ValidationView validations={fileValidations} />
                ) : (
                  <CalculationView report={calculationReport} inrRate={inrRate} />
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
