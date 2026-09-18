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

const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;
const STORAGE_AUTH_KEY = 'eudr_session_auth';
const STORAGE_TIMESTAMP_KEY = 'eudr_session_timestamp';
const STORAGE_USER_KEY = 'eudr_session_user';
const DEFAULT_INR_RATE = 110.13; // 1 EUR = 1 / 0.00908 INR = 110.13

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionUser, setSessionUser] = useState<string>('info@emertech.io');
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState<string>('');
  const [remainingTimeStr, setRemainingTimeStr] = useState<string>('2h 00m');

  const [files, setFiles] = useState<FileInputData[]>([]);
  const [inrRate, setInrRate] = useState<number>(DEFAULT_INR_RATE);
  const [activeTab, setActiveTab] = useState<'validation' | 'calculation'>('validation');

  useEffect(() => {
    setIsMounted(true);

    // Fetch live currency rate from Frankfurter API
    const fetchLiveRate = async () => {
      try {
        const res = await fetch('https://api.frankfurter.dev/v2/rate/inr/eur');
        if (res.ok) {
          const data = await res.json();
          if (data && data.rate && typeof data.rate === 'number' && data.rate > 0) {
            const calculatedInr = Math.round((1 / data.rate) * 100) / 100;
            setInrRate(calculatedInr);
          }
        }
      } catch {
        // Fallback remains DEFAULT_INR_RATE (110.13)
      }
    };
    fetchLiveRate();

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

  const calculationReport = useMemo(() => {
    return runCalculation(files, inrRate);
  }, [files, inrRate]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <span className="text-xs text-slate-400 font-medium">Loading...</span>
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
    <div className="min-h-screen bg-slate-50/60 text-slate-900 font-sans flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/emertech-logo.svg"
              alt="Emertech Innovations"
              className="h-7 w-auto object-contain"
            />
            <span className="text-slate-300 text-sm font-light">/</span>
            <span className="text-xs font-semibold text-slate-800 tracking-tight">
              EUDR GeoJSON Portal
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <CurrencyBar inrRate={inrRate} onRateChange={(rate) => setInrRate(rate)} />

            <span className="hidden md:inline text-slate-500 text-[11px] font-medium">
              {sessionUser}
            </span>

            <button
              onClick={() => clearSession()}
              className="px-2.5 py-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 border border-red-200/80 rounded-md text-xs font-semibold transition-all cursor-pointer ml-1"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 space-y-6">
        {/* Workspace Hero Uploader & Rules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Dropzone Uploader (2 Columns) */}
          <div className="lg:col-span-2">
            <FileUploader files={files} onFilesLoaded={handleFilesLoaded} onClear={handleClear} />
          </div>

          {/* Rules Reference Panel (1 Column) */}
          <div>
            <RulesPanel />
          </div>
        </div>

        {/* Results Workspace Tabs */}
        {files.length > 0 && (
          <div className="pt-4 space-y-6">
            <div className="flex items-center gap-1 border-b border-slate-200 pb-0 text-xs font-medium">
              <button
                onClick={() => setActiveTab('validation')}
                className={`pb-2.5 px-4 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'validation'
                    ? 'border-slate-900 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Step 1: File Validation ({fileValidations.length})
              </button>

              <button
                onClick={() => setActiveTab('calculation')}
                className={`pb-2.5 px-4 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'calculation'
                    ? 'border-slate-900 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Step 2: Token & Cost Estimation
              </button>
            </div>

            {/* Active Workspace View */}
            <div>
              {activeTab === 'validation' ? (
                <ValidationView validations={fileValidations} />
              ) : (
                <CalculationView report={calculationReport} inrRate={inrRate} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200/60 bg-white py-4 text-center text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Emertech Innovations • EUDR Deforestation Traceability System</span>
          <span>v1.2.0 • Production</span>
        </div>
      </footer>
    </div>
  );
}

