"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sprout,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Check,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = "Please enter your email address.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        errors.email = "Please enter a valid email address (e.g. farmer@example.com).";
      }
    }

    if (!password) {
      errors.password = "Please enter your password.";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setErrorMessage(errors.email || errors.password || "Please check your input.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Login failed. Please check your credentials.");
      }

      // Successful login
      router.push(data.redirectUrl || callbackUrl);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail("farmer@farmpulse.co.ke");
    setPassword("Password123!");
    setErrorMessage(null);
    setFieldErrors({});
  };

  return (
    <div className="min-h-screen bg-[#FBFDF9] flex flex-col lg:flex-row">
      {/* =========================================================================
          LEFT COLUMN: AUTH FORM
      ========================================================================= */}
      <div className="w-full lg:w-[48%] xl:w-[45%] flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 min-h-screen">
        {/* Top: Brand Header */}
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#1B4332] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5 text-[#D8F3DC]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                Mavuno<span className="text-[#2D6A4F]">Flow</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">
                Farm Management
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Login Form */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              Welcome back
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#64748B]">
              Log in to your farm dashboard, record feed, and view production.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#CBD5E1] shadow-xl space-y-5">
            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-[#0F172A] mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="farmer@example.com"
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border ${
                    fieldErrors.email ? "border-red-400 focus:ring-red-400" : "border-[#CBD5E1] focus:ring-[#1B4332]"
                  } rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-xs font-bold text-[#0F172A]">
                    Password
                  </label>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("For demo access, use the Demo Farmer Account button below.");
                    }}
                    className="text-[11px] font-semibold text-[#1B4332] hover:underline"
                  >
                    Forgot Password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="••••••••"
                    className={`w-full px-3.5 py-2.5 pr-10 text-sm bg-white border ${
                      fieldErrors.password ? "border-red-400 focus:ring-red-400" : "border-[#CBD5E1] focus:ring-[#1B4332]"
                    } rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#D8F3DC]" />
                    <span>Logging In...</span>
                  </>
                ) : (
                  <>
                    <span>Log In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Button */}
            <div className="pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={fillDemoAccount}
                className="w-full py-2.5 px-3 bg-[#D8F3DC]/60 hover:bg-[#D8F3DC] text-[#1B4332] border border-[#B7E4C7] rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
                <span>Fill Demo Farmer Account (John Kiprop)</span>
              </button>
            </div>

            <div className="text-center text-xs text-[#64748B]">
              <span>Don't have a MavunoFlow account? </span>
              <Link href="/register" className="font-bold text-[#1B4332] hover:underline">
                Create one now
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom: Footer Info */}
        <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#94A3B8]">
          <span>© 2026 MavunoFlow</span>
          <span className="flex items-center gap-1.5 text-[#2D6A4F] font-medium">
            <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" /> Secure Kenyan Agribusiness Platform
          </span>
        </div>
      </div>

      {/* =========================================================================
          RIGHT COLUMN: FARMER PLANTING IMAGE SHOWCASE
      ========================================================================= */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative overflow-hidden flex-col justify-between p-10 xl:p-14 bg-[#1B4332]">
        {/* Farmer Planting Seedling Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/auth-side.jpg"
            alt="Hands of an African farmer gently planting a healthy seedling into fertile soil"
            fill
            priority
            quality={92}
            className="object-cover object-center"
          />
          {/* Subtle Deep Gradient Overlays for Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B2319]/95 via-[#1B4332]/50 to-[#0B2319]/35" />
          <div className="absolute inset-0 bg-[#0B2319]/25 backdrop-blur-[1px]" />
        </div>

        {/* Top Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[#D8F3DC] text-xs font-semibold shadow-lg">
            <Sprout className="w-3.5 h-3.5 text-[#52B788]" />
            <span>Rooted in African Agriculture</span>
          </div>

          <span className="text-xs font-bold text-white/80 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
            KES • M-Pesa Ready
          </span>
        </div>

        {/* Bottom Quote & Stats Overlay */}
        <div className="relative z-10 max-w-xl space-y-5">
          <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-3xl p-6 sm:p-8 text-white space-y-4 shadow-2xl">
            <div className="space-y-2">
              <h2 className="text-2xl xl:text-3xl font-black leading-tight tracking-tight text-white drop-shadow-sm">
                Nurture every crop, track every feed, measure every harvest.
              </h2>
              <p className="text-xs sm:text-sm text-[#D8F3DC]/90 leading-relaxed font-normal">
                Join Kenyan commercial and smallholder farmers using MavunoFlow for precision feed management, daily milk and egg records, and transparent farm profit calculations.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-white/15 text-xs text-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#52B788]/20 flex items-center justify-center text-[#52B788] shrink-0">
                  <Check className="w-3 h-3 text-[#52B788]" />
                </div>
                <span>Automated Feed Depletion</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#52B788]/20 flex items-center justify-center text-[#52B788] shrink-0">
                  <Check className="w-3 h-3 text-[#52B788]" />
                </div>
                <span>Low Stock Reserve Alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#52B788]/20 flex items-center justify-center text-[#52B788] shrink-0">
                  <Check className="w-3 h-3 text-[#52B788]" />
                </div>
                <span>Yield & FCR Intelligence</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#52B788]/20 flex items-center justify-center text-[#52B788] shrink-0">
                  <Check className="w-3 h-3 text-[#52B788]" />
                </div>
                <span>Offline Record Keeping</span>
              </div>
            </div>

            {/* Farmer Signature Card */}
            <div className="pt-3 border-t border-white/15 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#52B788] text-[#0B2319] flex items-center justify-center font-black text-xs shadow-md">
                  JK
                </div>
                <div>
                  <p className="text-xs font-bold text-white">John Kiprop</p>
                  <p className="text-[11px] text-[#D8F3DC]/80">Mavuno Farm, Kajiado County</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#B7E4C7] font-semibold block">Commercial Poultry & Dairy</span>
                <span className="text-[10px] text-white/70">Verified Farmer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
