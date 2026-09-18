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
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-12 bg-white font-sans text-slate-900">
      {/* Left Column: Realistic EUDR Forest Image Panel */}
      <div className="relative hidden md:flex md:col-span-6 lg:col-span-7 flex-col justify-between p-10 lg:p-14 bg-slate-950 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-85"
          style={{ backgroundImage: "url('/eudr-bg.png')" }}
        />

        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-slate-950/40" />

        {/* Top Left Simple Professional Text */}
        <div className="relative z-10">
          <span className="text-xs font-semibold text-white/80 tracking-wider uppercase">
            EUDR Compliance System
          </span>
        </div>

        {/* Minimal Hero Text Box at Bottom */}
        <div className="relative z-10 max-w-md space-y-1.5">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Deforestation Traceability Portal
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            Automated GeoJSON verification and satellite forest monitoring.
          </p>
        </div>
      </div>

      {/* Right Column: Login Form & Branding */}
      <div className="md:col-span-6 lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-white border-l border-slate-100">
        {/* Brand Header */}
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/emertech-logo.svg"
              alt="Emertech Innovations"
              className="h-9 w-auto object-contain"
            />
          </div>
        </div>

        {/* Main Login Form Container */}
        <div className="w-full max-w-sm mx-auto my-auto py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Sign in to EUDR Portal
            </h1>
            <p className="text-xs text-slate-500 mt-1.5">
              Enter your corporate credentials to access verification & token tools.
            </p>
          </div>

          {/* Session Expired Banner Notice */}
          {sessionExpiredNotice && (
            <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200/90 rounded-xl text-xs text-amber-900">
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
                className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                  errorMsg ? 'border-red-400 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-600'
                } rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white text-xs transition-all`}
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="••••••••••••"
                  className={`w-full pl-3.5 pr-16 py-2.5 bg-slate-50 border ${
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
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl shadow-xs transition-all text-xs mt-2 cursor-pointer"
            >
              Sign In
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Emertech Security Portal</span>
            <span className="text-slate-500">v1.2.0 • Production</span>
          </div>
        </div>

        {/* Right Footer */}
        <footer className="text-xs text-slate-400">
          © {new Date().getFullYear()} Emertech Innovations. All rights reserved.
        </footer>
      </div>
    </div>
  );
};
