'use client';

import React, { useState } from 'react';
import { Mail, KeyRound, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onAuthenticated: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onAuthenticated }) => {
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
      setErrorMsg('Invalid email and password. Please check your credentials.');
    } else if (cleanEmail !== 'info@emertech.io') {
      setErrorMsg('Invalid email address. Authorized email is required.');
    } else {
      setErrorMsg('Incorrect password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs mb-4">
            <img
              src="/emertech-logo.svg"
              alt="Emertech Innovations"
              className="h-10 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            EUDR GeoJSON Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1.5">
            Sign in to access verification & token calculation tools
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="info@emertech.io"
                className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${
                  errorMsg ? 'border-red-400 focus:ring-red-500' : 'border-slate-300 focus:ring-emerald-500'
                } rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent text-sm transition-all`}
                autoFocus
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Enter password..."
                className={`w-full pl-11 pr-11 py-3 bg-slate-50 border ${
                  errorMsg ? 'border-red-400 focus:ring-red-500' : 'border-slate-300 focus:ring-emerald-500'
                } rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent text-sm transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-sm mt-2"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Sign In to System</span>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Emertech Innovations • EUDR Compliance System
          </p>
        </div>
      </div>
    </div>
  );
};
