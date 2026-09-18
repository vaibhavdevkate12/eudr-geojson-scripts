'use client';

import React, { useState } from 'react';

interface LoginPageProps {
  onAuthenticated: () => void;
  sessionExpiredNotice?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onAuthenticated, sessionExpiredNotice }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail === 'info@emertech.io' && password === 'passwoRd') {
      setErrorMsg('');
      onAuthenticated();
    } else if (cleanEmail !== 'info@emertech.io' && password !== 'passwoRd') {
      setErrorMsg('Invalid email address and password. Please check your credentials.');
    } else if (cleanEmail !== 'info@emertech.io') {
      setErrorMsg('Unauthorized email address. Only registered organization emails are permitted.');
    } else {
      setErrorMsg('Incorrect password. Please verify your password and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-6 font-sans text-slate-900">
      {/* Top Brand Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <img
            src="/emertech-logo.svg"
            alt="Emertech Innovations"
            className="h-9 w-auto object-contain"
          />
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>EUDR Deforestation Compliance System</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md mx-auto my-auto">
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-200/50 p-8">
          <div className="text-left mb-6">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Sign in to EUDR Portal
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter your corporate credentials to access verification & token tools.
            </p>
          </div>

          {/* Session Expired Banner Notice */}
          {sessionExpiredNotice && (
            <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <span className="font-semibold block">Session Timeout (2 Hours)</span>
              <span className="text-amber-800">{sessionExpiredNotice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="name@company.com"
                className={`w-full px-3.5 py-2.5 bg-slate-50/50 border ${
                  errorMsg ? 'border-red-400 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-600'
                } rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white text-xs transition-all`}
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="••••••••••••"
                  className={`w-full pl-3.5 pr-16 py-2.5 bg-slate-50/50 border ${
                    errorMsg ? 'border-red-400 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-600'
                  } rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white text-xs transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium rounded-xl shadow-xs transition-all text-xs mt-2 cursor-pointer"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Emertech Security Portal</span>
            <span className="text-slate-500">v1.2.0 • Production</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center py-2 text-xs text-slate-400">
        © {new Date().getFullYear()} Emertech Innovations. All rights reserved.
      </footer>
    </div>
  );
};

