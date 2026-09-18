'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LoginPage } from '../components/LoginPage';
import { FileUploader } from '../components/FileUploader';
import { RulesPanel } from '../components/RulesPanel';
import { CurrencyBar } from '../components/CurrencyBar';
import { ValidationView, FileValidationItem } from '../components/ValidationView';
import { CalculationView } from '../components/CalculationView';
import { validateGeoJSON } from '../utils/geojsonValidator';
import { runCalculation, FileInputData } from '../utils/calculationEngine';
import { Calculator, CheckCircle2, LogOut, Clock, User, ShieldCheck } from 'lucide-react';

const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 Hours in milliseconds
const STORAGE_AUTH_KEY = 'eudr_session_auth';
const STORAGE_TIMESTAMP_KEY = 'eudr_session_timestamp';
const STORAGE_USER_KEY = 'eudr_session_user';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionUser, setSessionUser] = useState<string>('info@emertech.io');
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState<string>('');
  const [remainingTimeStr, setRemainingTimeStr] = useState<string>('2h 00m');

  const [files, setFiles] = useState<FileInputData[]>([]);
  const [inrRate, setInrRate] = useState<number>(110);
  const [activeTab, setActiveTab] = useState<'validation' | 'calculation'>('validation');

  // Ensure client-side mounting to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);

    const authState = localStorage.getItem(STORAGE_AUTH_KEY);
    const loginTimeStr = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
    const savedUser = localStorage.getItem(STORAGE_USER_KEY);

    if (authState === 'true' && loginTimeStr) {
      const loginTime = parseInt(loginTimeStr, 10);
      const elapsed = Date.now() - loginTime;

      if (!isNaN(loginTime) && elapsed < SESSION_DURATION_MS) {
        setIsAuthenticated(true);
        if (savedUser) setSessionUser(savedUser);
      } else {
        clearSession('Your 2-hour session has expired. Please sign in again.');
      }
    }
  }, []);

  // Timer loop to check session expiry every 5 seconds and update remaining time
  useEffect(() => {
    if (!isAuthenticated || !isMounted) return;

    const updateTimer = () => {
      const loginTimeStr = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
      if (!loginTimeStr) return;

      const loginTime = parseInt(loginTimeStr, 10);
      const elapsed = Date.now() - loginTime;
      const remaining = SESSION_DURATION_MS - elapsed;

      if (remaining <= 0) {
        clearSession('Your 2-hour session has expired. Auto-logout initiated.');
      } else {
        const remainingMinutes = Math.floor(remaining / 60000);
        const hours = Math.floor(remainingMinutes / 60);
        const mins = remainingMinutes % 60;
        setRemainingTimeStr(`${hours}h ${mins.toString().padStart(2, '0')}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isMounted]);

  const handleLoginSuccess = (userEmail: string) => {
    const now = Date.now();
    localStorage.setItem(STORAGE_AUTH_KEY, 'true');
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, now.toString());
    localStorage.setItem(STORAGE_USER_KEY, userEmail);

    setSessionUser(userEmail);
    setSessionExpiredMsg('');
    setIsAuthenticated(true);
  };

  const clearSession = (reasonMessage?: string) => {
    localStorage.removeItem(STORAGE_AUTH_KEY);
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);

    setIsAuthenticated(false);
    setFiles([]);
    if (reasonMessage) {
      setSessionExpiredMsg(reasonMessage);
    }
  };

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

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="animate-pulse flex items-center gap-2 text-xs font-semibold text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 animate-spin" />
          <span>Loading EUDR Portal...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        onAuthenticated={() => handleLoginSuccess('info@emertech.io')}
        sessionExpiredNotice={sessionExpiredMsg}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 sm:p-6 flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Navbar / Top Bar */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 shrink-0">
              <img
                src="/emertech-logo.svg"
                alt="Emertech Innovations"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  EUDR GeoJSON Compliance Portal
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/80">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated GeoJSON validation, 6-decimal vertex deduplication & token estimation
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            {/* Currency Input */}
            <CurrencyBar inrRate={inrRate} onRateChange={(rate) => setInrRate(rate)} />

            {/* Session Timer Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs text-slate-700 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{remainingTimeStr}</span>
            </div>

            {/* User Profile Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 font-medium">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">{sessionUser}</span>
            </div>

            {/* Logout */}
            <button
              onClick={() => clearSession()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-medium transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* 2-Column Workbench Layout */}
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* Left Sidebar: Verification Rules Documentation */}
          <RulesPanel />

          {/* Right Workspace Main Content */}
          <main className="flex-1 w-full space-y-5">
            {/* File Upload Workbench */}
            <FileUploader files={files} onFilesLoaded={handleFilesLoaded} onClear={handleClear} />

            {/* Step Tabs & Workspace Results */}
            {files.length > 0 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <button
                    onClick={() => setActiveTab('validation')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'validation'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Step 1: File Validation ({fileValidations.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('calculation')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'calculation'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    <Calculator className="w-4 h-4" />
                    Step 2: Token & Cost Calculation
                  </button>
                </div>

                {/* Active Workbench Tab */}
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

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full text-center py-4 mt-8 text-xs text-slate-400 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Emertech Innovations • EUDR Deforestation Traceability System</span>
        <span>2-Hour Session Security Active</span>
      </footer>
    </div>
  );
}
