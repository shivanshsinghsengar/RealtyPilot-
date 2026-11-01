"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { loginAction, signupAction, AuthActionResult } from "@/app/auth/actions";
import { Building2, Shield, Lock, Mail, User, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

function SubmitButton({ isSignup }: { isSignup: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:opacity-60 transition-all shadow-md shadow-brand-600/20"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>{isSignup ? "Creating Account..." : "Signing In..."}</span>
        </>
      ) : (
        <>
          <span>{isSignup ? "Create Staff Account" : "Sign In to CRM"}</span>
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [loginState, loginDispatch] = useFormState<AuthActionResult | null, FormData>(
    loginAction,
    null
  );
  const [signupState, signupDispatch] = useFormState<AuthActionResult | null, FormData>(
    signupAction,
    null
  );

  const activeState = isSignup ? signupState : loginState;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-brand-500 items-center justify-center text-white shadow-xl shadow-brand-500/20 mb-2">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            RealtyPilot CRM
          </h1>
          <p className="text-sm text-slate-400">
            AI Sales Acceleration &bull; Bhopal, Madhya Pradesh
          </p>
        </div>

        {/* Auth Card */}
        <div className="mt-8 bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-100">
          {/* Mode Switch Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setIsSignup(false)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                !isSignup
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Staff Login
            </button>
            <button
              type="button"
              onClick={() => setIsSignup(true)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                isSignup
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              New Staff Signup
            </button>
          </div>

          {/* Error Alert */}
          {activeState?.error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs sm:text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Notice</p>
                <p className="text-xs text-red-600 mt-0.5">{activeState.error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form
            action={isSignup ? signupDispatch : loginDispatch}
            className="space-y-4"
          >
            {isSignup && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      name="full_name"
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    />
                  </div>
                  {signupState?.fieldErrors?.full_name && (
                    <p className="text-xs text-red-500 mt-1">
                      {signupState.fieldErrors.full_name[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Staff Role
                  </label>
                  <select
                    name="role"
                    defaultValue="sales_rep"
                    className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  >
                    <option value="sales_rep">Sales Representative</option>
                    <option value="manager">Sales Manager</option>
                    <option value="admin">CRM Administrator</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="agent@realtypilot.in"
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
              {activeState?.fieldErrors?.email && (
                <p className="text-xs text-red-500 mt-1">
                  {activeState.fieldErrors.email[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  name="password"
                  type="password"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  required
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
              {activeState?.fieldErrors?.password && (
                <p className="text-xs text-red-500 mt-1">
                  {activeState.fieldErrors.password[0]}
                </p>
              )}
            </div>

            <div className="pt-2">
              <SubmitButton isSignup={isSignup} />
            </div>
          </form>

          {/* Security & RLS notice */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Shield className="h-3.5 w-3.5 text-brand-600" />
            <span>Supabase Auth &bull; 256-bit SSL &bull; RLS Guarded</span>
          </div>
        </div>

        {/* Development Quick Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Authorized real estate personnel only &bull; Bhopal Residential Operations
          </p>
        </div>
      </div>
    </div>
  );
}
