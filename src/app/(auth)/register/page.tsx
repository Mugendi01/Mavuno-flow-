"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Sprout,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage("Please fill in your name, email address, and password.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create account. Please try again.");
      }

      // Successful registration -> session cookie set -> proceed directly to /onboarding
      router.push("/onboarding");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFDF9] flex flex-col lg:flex-row">
      {/* =========================================================================
          LEFT COLUMN: REGISTRATION FORM
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

        {/* Center: Register Form */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              Start your farm journey
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#64748B]">
              Create your account first. We'll then guide you to set up your livestock, crops, and feed stores.
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
                <label htmlFor="fullName" className="block text-xs font-bold text-[#0F172A] mb-1">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Mike Mwangi"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-bold text-[#0F172A] mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@example.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-xs font-bold text-[#0F172A] mb-1">
                  Phone Number <span className="font-normal text-[#64748B]">(for M-Pesa & SMS alerts)</span>
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+254 700 000 000"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="password" className="block text-xs font-bold text-[#0F172A] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full px-3.5 py-2.5 pr-9 text-sm bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-bold text-[#0F172A] mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#D8F3DC]" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-[#E2E8F0] text-center text-xs text-[#64748B]">
              <span>Already have an account? </span>
              <Link href="/login" className="font-bold text-[#1B4332] hover:underline">
                Log in instead
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom: Footer Info */}
        <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#94A3B8]">
          <span>© 2026 MavunoFlow</span>
          <span className="flex items-center gap-1.5 text-[#2D6A4F] font-medium">
            <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" /> 100% Data Privacy & Control
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
            <span>Built for Modern Kenyan Agribusiness</span>
          </div>

          <span className="text-xs font-bold text-white/80 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
            Free 14-Day Trial
          </span>
        </div>

        {/* Bottom Card Overlay */}
        <div className="relative z-10 max-w-xl space-y-5">
          <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-3xl p-6 sm:p-8 text-white space-y-4 shadow-2xl">
            <div className="space-y-2">
              <h2 className="text-2xl xl:text-3xl font-black leading-tight tracking-tight text-white drop-shadow-sm">
                Plant the seeds of a profitable, well-run farm.
              </h2>
              <p className="text-xs sm:text-sm text-[#D8F3DC]/90 leading-relaxed font-normal">
                Take control of your farm's bottom line. Track feed costs, daily production outputs, debtor balances, and digital receipts effortlessly.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-white/15 text-xs text-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#52B788]/20 flex items-center justify-center text-[#52B788] shrink-0">
                  <Check className="w-3 h-3 text-[#52B788]" />
                </div>
                <span>Multi-Enterprise Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#52B788]/20 flex items-center justify-center text-[#52B788] shrink-0">
                  <Check className="w-3 h-3 text-[#52B788]" />
                </div>
                <span>Poultry & Dairy Metrics</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#52B788]/20 flex items-center justify-center text-[#52B788] shrink-0">
                  <Check className="w-3 h-3 text-[#52B788]" />
                </div>
                <span>Auto Inventory Warnings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#52B788]/20 flex items-center justify-center text-[#52B788] shrink-0">
                  <Check className="w-3 h-3 text-[#52B788]" />
                </div>
                <span>Cash Flow & Receivables</span>
              </div>
            </div>

            {/* Platform Guarantee */}
            <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs text-[#D8F3DC]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#52B788]" />
                <span>Enterprise Grade Security</span>
              </div>
              <span className="text-[11px] text-[#A7D7C5]">Works offline in remote areas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
