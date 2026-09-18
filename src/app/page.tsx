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
import { Calculator, CheckCircle2, LogOut, Clock, AlertCircle } from 'lucide-react';

const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 Hours in milliseconds
const STORAGE_AUTH_KEY = 'eudr_session_auth';
const STORAGE_TIMESTAMP_KEY = 'eudr_session_timestamp';
const STORAGE_USER_KEY = 'eudr_session_user';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionUser, setSessionUser] = useState<string>('info@emertech.io');
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState<string>('');
  const [remainingTimeStr, setRemainingTimeStr] = useState<string>('2h 00m');

  const [files, setFiles] = useState<FileInputData[]>([]);
  const [inrRate, setInrRate] = useState<number>(110);
  const [activeTab, setActiveTab] = useState<'validation' | 'calculation'>('validation');

  // Check and restore session on initial load
  useEffect(() => {
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
        // Expired
        clearSession('Your 2-hour session has expired. Please sign in again.');
      }
    }
  }, []);

  // Timer loop to check session expiry every 5 seconds and update remaining time
  useEffect(() => {
    if (!isAuthenticated) return;

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
  }, [isAuthenticated]);

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

  if (!isAuthenticated) {
    return (
      <LoginPage
        onAuthenticated={() => handleLoginSuccess('info@emertech.io')}
        sessionExpiredNotice={sessionExpiredMsg}
      />
    );
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
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span>
                  Logged in as <strong className="text-slate-800">{sessionUser}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Session: {remainingTimeStr} left
                </span>
              </div>
            </div>
          </div>

          {/* Top Right Controls: Currency Bar & Logout */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Currency Rate Input Box */}
            <CurrencyBar inrRate={inrRate} onRateChange={(rate) => setInrRate(rate)} />

            <button
              onClick={() => clearSession()}
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
