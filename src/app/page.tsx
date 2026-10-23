"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sprout,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Scale,
  WifiOff,
  QrCode,
  FileSpreadsheet,
  CheckCircle2,
  Menu,
  X,
  Egg,
  Milk,
  Fish,
  Layers,
  ChevronRight,
  Clock,
  ShieldCheck,
  Smartphone,
  BarChart3,
  Receipt,
  Users,
  Wallet,
  Calendar,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FBFDF9] text-[#1E293B] flex flex-col font-sans selection:bg-[#2D6A4F] selection:text-white">
      {/* =========================================================================
          1. NAVIGATION BAR
      ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#FBFDF9]/90 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#1B4332] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5 text-[#D8F3DC]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-[#1B4332]">
                  MavunoFlow
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#D8F3DC] text-[#1B4332]">
                  KE
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] font-medium hidden sm:block">
                Farm Financial Visibility
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#475569]">
            <a href="#how-it-works" className="hover:text-[#1B4332] transition-colors">
              How It Works
            </a>
            <a href="#enterprises" className="hover:text-[#1B4332] transition-colors">
              Enterprises
            </a>
            <a href="#visibility" className="hover:text-[#1B4332] transition-colors">
              Financial Clarity
            </a>
            <a href="#offline" className="hover:text-[#1B4332] transition-colors">
              Offline Mode
            </a>
            <a href="#receipts" className="hover:text-[#1B4332] transition-colors">
              Receipts
            </a>
          </nav>

          {/* Auth Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-bold text-[#1B4332] hover:bg-[#D8F3DC]/50 rounded-xl transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 text-sm font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5 group"
            >
              <span>Start Your Farm</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#475569] hover:bg-[#E2E8F0]/50"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-3 border-t border-[#E2E8F0] mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-2 text-sm font-semibold text-[#475569]">
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#E2E8F0]/50"
              >
                How It Works
              </a>
              <a
                href="#enterprises"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#E2E8F0]/50"
              >
                Enterprises
              </a>
              <a
                href="#visibility"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#E2E8F0]/50"
              >
                Financial Clarity
              </a>
              <a
                href="#offline"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#E2E8F0]/50"
              >
                Offline Mode
              </a>
              <a
                href="#receipts"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#E2E8F0]/50"
              >
                Digital Receipts
              </a>
            </div>
            <div className="pt-2 border-t border-[#E2E8F0] flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full py-2.5 text-center text-sm font-bold text-[#1B4332] bg-white border border-[#CBD5E1] rounded-xl"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="w-full py-2.5 text-center text-sm font-bold text-white bg-[#1B4332] rounded-xl shadow-sm"
              >
                Start Your Farm
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* =========================================================================
            2. HERO SECTION
        ========================================================================= */}
        <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 px-4 sm:px-8 border-b border-[#E2E8F0] min-h-[580px] flex items-center">
          {/* Authentic Brooder Chicks Background */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/hero-bg.jpg"
              alt="Day-old chicks in poultry brooder under heat lamps"
              fill
              priority
              quality={90}
              sizes="100vw"
              className="object-cover object-center transform scale-105"
            />
            {/* Multi-layered gradient overlay:
                - Left-to-right gradient ensuring text remains 100% crisp and readable
                - Top & bottom fade for seamless transition with the navbar and next section
                - Preserves the warm golden glow of the brooding lamp and chicks */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FBFDF9] via-[#FBFDF9]/92 to-[#FBFDF9]/75 sm:from-[#FBFDF9]/95 sm:via-[#FBFDF9]/88 sm:to-[#FBFDF9]/55" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FBFDF9] via-transparent to-[#FBFDF9]/40" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#1B4332_1px,transparent_1px)] [background-size:16px_16px]" />
          </div>

          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Left: Copy & Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D8F3DC]/95 backdrop-blur-xs text-[#1B4332] text-xs font-bold tracking-wide border border-[#1B4332]/15 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" />
                Designed for Kenyan & African Farmers
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0F172A] tracking-tight leading-[1.12]">
                Know Your Farm. <br />
                <span className="text-[#1B4332]">Know Your Numbers.</span> <br />
                Grow Smarter.
              </h1>

              <p className="text-base sm:text-lg text-[#334155] max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                MavunoFlow gives farmers a simple way to track expenses, sales, income and farm performance — so you can spend less time guessing and make better decisions about your farm.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-7 py-3.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-base font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Start Your Farm</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/login"
                  className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-[#F1F5F9] text-[#1B4332] border border-[#CBD5E1] text-base font-bold rounded-xl transition-all text-center"
                >
                  Log In
                </Link>
              </div>

              {/* Trust badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-[#64748B] font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" /> No accounting jargon
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" /> Works offline on mobile
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" /> Free trial setup
                </span>
              </div>
            </div>

            {/* Right: Polished Hero Dashboard Preview (Not a stock photo) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Floating Decorative Badges */}
                <div className="absolute -top-4 -left-4 z-20 bg-white border border-[#CBD5E1] px-3.5 py-2 rounded-2xl shadow-lg flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#D8F3DC] text-[#1B4332] flex items-center justify-center font-bold text-sm">
                    🐔
                  </div>
                  <div>
                    <p className="text-[10px] text-[#64748B] font-bold uppercase">Poultry Unit</p>
                    <p className="text-xs font-black text-[#1B4332]">+KSh 52,400</p>
                  </div>
                </div>

                <div className="absolute -bottom-4 -right-4 z-20 bg-white border border-[#CBD5E1] px-3.5 py-2 rounded-2xl shadow-lg flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                    🐄
                  </div>
                  <div>
                    <p className="text-[10px] text-[#64748B] font-bold uppercase">Dairy Herd</p>
                    <p className="text-xs font-black text-[#0F172A]">+KSh 28,100</p>
                  </div>
                </div>

                {/* Main Realistic Farm Preview Card */}
                <div className="bg-white rounded-3xl border border-[#CBD5E1] shadow-2xl overflow-hidden">
                  {/* Card Header */}
                  <div className="bg-[#1B4332] p-5 text-white flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-lg tracking-tight">MavunoFlow</span>
                        <span className="text-[10px] font-bold bg-[#D8F3DC] text-[#1B4332] px-2 py-0.5 rounded">
                          LIVE DEMO
                        </span>
                      </div>
                      <p className="text-xs text-[#D8F3DC]/90 mt-0.5 font-medium">
                        Green Valley Farm · Nakuru, Kenya
                      </p>
                    </div>
                    <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20">
                      This Month
                    </span>
                  </div>

                  {/* Monthly Financial Health Summary */}
                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-3 gap-2.5 bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E2E8F0] text-center">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Revenue</p>
                        <p className="text-sm sm:text-base font-black text-[#1B4332] mt-0.5">KSh 248,500</p>
                      </div>
                      <div className="border-x border-[#E2E8F0]">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Expenses</p>
                        <p className="text-sm sm:text-base font-black text-[#DC2626] mt-0.5">KSh 161,200</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Net Profit</p>
                        <p className="text-sm sm:text-base font-black text-[#2D6A4F] mt-0.5">+KSh 87,300</p>
                      </div>
                    </div>

                    {/* Enterprise Margin Breakdown */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-[#475569]">
                        <span>Enterprise Performance</span>
                        <span className="text-[11px] text-[#64748B]">Operating Margins</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🐔</span>
                            <span className="text-xs font-bold text-[#0F172A]">Poultry (Broilers & Layers)</span>
                          </div>
                          <span className="text-xs font-black text-[#1B4332]">+KSh 52,400</span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-blue-50/60 rounded-xl border border-blue-100">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🐄</span>
                            <span className="text-xs font-bold text-[#0F172A]">Dairy Cattle (Morning Milk)</span>
                          </div>
                          <span className="text-xs font-black text-blue-900">+KSh 28,100</span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-amber-50/60 rounded-xl border border-amber-100">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🐐</span>
                            <span className="text-xs font-bold text-[#0F172A]">Dairy Goats & Sheep</span>
                          </div>
                          <span className="text-xs font-black text-amber-900">+KSh 6,800</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Log Visual Trigger */}
                    <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                      <span className="text-[#64748B] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#1B4332]" /> Log entry in &lt; 30 seconds
                      </span>
                      <span className="font-bold text-[#1B4332] flex items-center gap-0.5">
                        Live Preview <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. THE MAVUNOFLOW STORY — THE REAL FARMING PROBLEM
        ========================================================================= */}
        <section className="py-16 sm:py-24 px-4 sm:px-8 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#2D6A4F] bg-[#D8F3DC] px-3 py-1 rounded-full">
                The Practical Reality
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
                Running a farm is more than producing. <br />
                It's managing the numbers.
              </h2>
              <p className="text-base text-[#64748B] leading-relaxed">
                Most farmers in Kenya work tirelessly on production. They know their animals, crops, and fields inside out — yet when the month ends, the true financial picture remains a fog.
              </p>
            </div>

            {/* Contrast: What Farmers Know vs What They Struggle to Answer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Left: What You Already Know */}
              <div className="p-6 sm:p-8 bg-[#F8FAFC] rounded-3xl border border-[#E2E8F0] space-y-5">
                <div className="w-10 h-10 rounded-2xl bg-slate-200 text-[#475569] flex items-center justify-center font-bold">
                  🌾
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0F172A]">What you already know every day</h3>
                  <p className="text-xs text-[#64748B] mt-1">Field operations and daily livestock numbers:</p>
                </div>
                <ul className="space-y-3 text-sm text-[#475569]">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
                    How many animals or birds you currently keep
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
                    How many bags of mash or pellets were delivered
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
                    How many litres of morning and evening milk you collected
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
                    How many crates of eggs were gathered from the pens
                  </li>
                </ul>
              </div>

              {/* Right: The Critical Questions Farmers Struggle to Answer */}
              <div className="p-6 sm:p-8 bg-emerald-50/70 rounded-3xl border border-emerald-200 space-y-5">
                <div className="w-10 h-10 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center font-bold">
                  ❓
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1B4332]">The financial questions that keep you guessing</h3>
                  <p className="text-xs text-[#2D6A4F] mt-1">Without dedicated farm-first visibility:</p>
                </div>
                <ul className="space-y-3 text-sm text-[#0F172A] font-medium">
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold shrink-0">✕</span>
                    How much did the farm actually spend on feed and vet drugs this month?
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold shrink-0">✕</span>
                    Which enterprise is making money and which is quietly eating profits?
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold shrink-0">✕</span>
                    Where are operational costs sneaking up week after week?
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold shrink-0">✕</span>
                    Which buyers and shops still owe the farm money for past deliveries?
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold shrink-0">✕</span>
                    Did this month actually perform better than last month?
                  </li>
                </ul>
              </div>
            </div>

            {/* MavunoFlow Bridge Banner */}
            <div className="p-6 bg-[#1B4332] rounded-3xl text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="space-y-1">
                <p className="text-base font-extrabold tracking-tight">MavunoFlow bridges this gap in seconds.</p>
                <p className="text-xs text-[#D8F3DC]/90">
                  Built specifically around the practical workflow of farmers — from the boma to the ledger.
                </p>
              </div>
              <Link
                href="/register"
                className="px-5 py-2.5 bg-[#D8F3DC] text-[#1B4332] hover:bg-white text-xs font-black rounded-xl shrink-0 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. HOW MAVUNOFLOW WORKS — 4 PRACTICAL STEPS
        ========================================================================= */}
        <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-8 bg-[#FBFDF9] border-b border-[#E2E8F0]">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#2D6A4F] bg-[#D8F3DC] px-3 py-1 rounded-full">
                Simple 4-Step Process
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
                How MavunoFlow Works
              </h2>
              <p className="text-sm text-[#64748B]">
                Designed so you can spend less time typing and more time in the field.
              </p>
            </div>

            {/* Journey Diagram Header */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-black tracking-wider uppercase text-[#1B4332] overflow-x-auto py-2">
              <span className="bg-white border border-[#CBD5E1] px-3 py-1.5 rounded-lg shadow-xs">YOUR FARM</span>
              <span>→</span>
              <span className="bg-white border border-[#CBD5E1] px-3 py-1.5 rounded-lg shadow-xs">YOUR RECORDS</span>
              <span>→</span>
              <span className="bg-white border border-[#CBD5E1] px-3 py-1.5 rounded-lg shadow-xs">YOUR NUMBERS</span>
              <span>→</span>
              <span className="bg-[#1B4332] text-white px-3 py-1.5 rounded-lg shadow-xs">BETTER DECISIONS</span>
            </div>

            {/* 4 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="bg-white p-6 rounded-3xl border border-[#CBD5E1] shadow-xs space-y-4 relative">
                <div className="text-3xl font-black text-[#1B4332]/20 font-mono">01</div>
                <h3 className="text-base font-extrabold text-[#0F172A]">Set Up Your Farm</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Tell MavunoFlow what you farm (Poultry, Dairy, Crops, Fish, etc.) and where you operate. We set up your enterprise ledgers in under 2 minutes.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-6 rounded-3xl border border-[#CBD5E1] shadow-xs space-y-4 relative">
                <div className="text-3xl font-black text-[#1B4332]/20 font-mono">02</div>
                <h3 className="text-base font-extrabold text-[#0F172A]">Record What Happens</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Log expenses, sales, income, customer debts, and casual wages in under 30 seconds straight from your phone — even when internet connection drops.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-6 rounded-3xl border border-[#CBD5E1] shadow-xs space-y-4 relative">
                <div className="text-3xl font-black text-[#1B4332]/20 font-mono">03</div>
                <h3 className="text-base font-extrabold text-[#0F172A]">Understand Your Numbers</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  MavunoFlow automatically computes revenue, expenses, net profit/loss, cash collections, and per-enterprise unit costs without complex spreadsheets.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-white p-6 rounded-3xl border border-[#CBD5E1] shadow-xs space-y-4 relative">
                <div className="text-3xl font-black text-[#1B4332]/20 font-mono">04</div>
                <h3 className="text-base font-extrabold text-[#0F172A]">Stay on Top of Your Farm</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Receive automated weekly farm email digests, generate verifiable digital QR receipts for your buyers, and track debtors before debts turn bad.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. AGRICULTURAL ENTERPRISES SECTION
        ========================================================================= */}
        <section id="enterprises" className="py-16 sm:py-24 px-4 sm:px-8 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#2D6A4F] bg-[#D8F3DC] px-3 py-1 rounded-full">
                Multi-Enterprise Support
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
                One farm. Multiple enterprises. One clear picture.
              </h2>
              <p className="text-sm text-[#64748B]">
                African farms are rarely single-commodity. Track each of your agricultural operations independently or see the whole farm combined.
              </p>
            </div>

            {/* 6 Enterprise Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Poultry */}
              <div className="p-6 rounded-3xl border border-[#E2E8F0] bg-[#FBFDF9] hover:border-[#2D6A4F] hover:shadow-md transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl">
                  🐔
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Poultry</h3>
                  <p className="text-xs text-[#1B4332] font-semibold">Broilers · Layers · Kienyeji · Breeding</p>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Track egg tray counts, live bird sales, feed conversion costs, vaccines, mortality, and cost per tray of eggs.
                </p>
              </div>

              {/* Dairy Cattle */}
              <div className="p-6 rounded-3xl border border-[#E2E8F0] bg-[#FBFDF9] hover:border-[#2D6A4F] hover:shadow-md transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center text-2xl">
                  🐄
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Dairy & Cattle</h3>
                  <p className="text-xs text-[#1B4332] font-semibold">Milk · Beef · Feedlot · Ranching</p>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Monitor daily milk yield sales, dairy meal expenses, veterinary treatments, deworming, and feed cost per litre of milk.
                </p>
              </div>

              {/* Fish Farming */}
              <div className="p-6 rounded-3xl border border-[#E2E8F0] bg-[#FBFDF9] hover:border-[#2D6A4F] hover:shadow-md transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center text-2xl">
                  🐟
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Fish Farming</h3>
                  <p className="text-xs text-[#1B4332] font-semibold">Tilapia · Catfish · Ponds · Cages</p>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Record fingerlings stocking, floating pellet purchases, harvest cycles, pond maintenance, and feed cost per kg of fish.
                </p>
              </div>

              {/* Piggery */}
              <div className="p-6 rounded-3xl border border-[#E2E8F0] bg-[#FBFDF9] hover:border-[#2D6A4F] hover:shadow-md transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center text-2xl">
                  🐖
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Piggery</h3>
                  <p className="text-xs text-[#1B4332] font-semibold">Breeding · Fattening · Pork</p>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Track sow farrowing, weaners, sow & weaner meal expenses, iron injections, and live weight porker sales.
                </p>
              </div>

              {/* Goats & Sheep */}
              <div className="p-6 rounded-3xl border border-[#E2E8F0] bg-[#FBFDF9] hover:border-[#2D6A4F] hover:shadow-md transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-800 flex items-center justify-center text-2xl">
                  🐐
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Goats & Sheep</h3>
                  <p className="text-xs text-[#1B4332] font-semibold">Dairy Goats · Meat · Breeding</p>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Log goat milk yields, buck sales, dewormers, mineral lick salt blocks, and breeding stock value.
                </p>
              </div>

              {/* Crops & Fodder */}
              <div className="p-6 rounded-3xl border border-[#E2E8F0] bg-[#FBFDF9] hover:border-[#2D6A4F] hover:shadow-md transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl">
                  🌱
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Crops & Mixed Farming</h3>
                  <p className="text-xs text-[#1B4332] font-semibold">Crops · Fodder · Silage · Hay</p>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Record Boma Rhodes hay bales, maize silage, horticultural produce, fertilizer top-dressing, and harvesting labour.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            6. FINANCIAL VISIBILITY SECTION (REALISTIC KENYAN SAMPLE NUMBERS)
        ========================================================================= */}
        <section id="visibility" className="py-16 sm:py-24 px-4 sm:px-8 bg-[#FBFDF9] border-b border-[#E2E8F0]">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#2D6A4F] bg-[#D8F3DC] px-3 py-1 rounded-full">
                Financial Visibility
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
                Clear Answers to Critical Questions
              </h2>
              <p className="text-sm text-[#64748B]">
                MavunoFlow visualizes your cost drivers and enterprise surpluses with zero mathematical complexity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Card A: Where is my money going? */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#CBD5E1] shadow-xs space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">
                      Expense Breakdown
                    </span>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">
                      Sample Data
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-[#0F172A] mt-1">WHERE IS MY MONEY GOING?</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">Top cost drivers across your farm operations</p>
                </div>

                {/* Progress bars */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-[#0F172A]">Feed (Pellets, Mash, Fodder)</span>
                      <span className="text-[#1B4332]">58%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-[#1B4332] h-3 rounded-full" style={{ width: "58%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-[#0F172A]">Labour & Wages</span>
                      <span className="text-[#2D6A4F]">16%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-[#2D6A4F] h-3 rounded-full" style={{ width: "16%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-[#0F172A]">Veterinary, Drugs & Vaccines</span>
                      <span className="text-emerald-600">9%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-emerald-600 h-3 rounded-full" style={{ width: "9%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-[#0F172A]">Transport & Logistics</span>
                      <span className="text-teal-600">7%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-teal-600 h-3 rounded-full" style={{ width: "7%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-[#0F172A]">Other (Fuel, Utilities, Supplies)</span>
                      <span className="text-slate-500">10%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-slate-400 h-3 rounded-full" style={{ width: "10%" }} />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-[#64748B] italic pt-2 border-t border-[#E2E8F0]">
                  Illustrative sample data based on typical Kenyan commercial livestock farms.
                </p>
              </div>

              {/* Card B: Which enterprise is performing? */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#CBD5E1] shadow-xs space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">
                      Net Margins
                    </span>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">
                      Sample Data
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-[#0F172A] mt-1">WHICH ENTERPRISE IS PERFORMING?</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">Operating profit after deducting direct enterprise costs</p>
                </div>

                <div className="space-y-3.5">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🐔</span>
                      <div>
                        <p className="text-sm font-extrabold text-[#0F172A]">Poultry</p>
                        <p className="text-[11px] text-emerald-800">Layers eggs & live culls</p>
                      </div>
                    </div>
                    <span className="text-base font-black text-[#1B4332]">+KSh 52,400</span>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🐄</span>
                      <div>
                        <p className="text-sm font-extrabold text-[#0F172A]">Dairy Cattle</p>
                        <p className="text-[11px] text-blue-800">Milk yields & manure</p>
                      </div>
                    </div>
                    <span className="text-base font-black text-blue-900">+KSh 28,100</span>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🐐</span>
                      <div>
                        <p className="text-sm font-extrabold text-[#0F172A]">Goats & Sheep</p>
                        <p className="text-[11px] text-amber-800">Meat goats & dairy milk</p>
                      </div>
                    </div>
                    <span className="text-base font-black text-amber-900">+KSh 6,800</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#64748B] italic pt-2 border-t border-[#E2E8F0]">
                  Know exactly which venture to expand, optimize, or reconsider before the season ends.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            7. OFFLINE-FIRST ARCHITECTURE
        ========================================================================= */}
        <section id="offline" className="py-16 sm:py-24 px-4 sm:px-8 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#2D6A4F] bg-[#D8F3DC] px-3 py-1 rounded-full">
                Zero Connectivity Worries
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
                Your farm doesn't stop when the internet does.
              </h2>
              <p className="text-sm text-[#64748B]">
                In rural and field conditions where mobile networks are spotty, MavunoFlow saves your records locally on your phone and synchronizes automatically the moment connection returns.
              </p>
            </div>

            {/* Offline Sync Flow Visual */}
            <div className="bg-[#F8FAFC] border border-[#CBD5E1] p-6 sm:p-10 rounded-3xl shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center text-center">
                <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] space-y-1.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                    <WifiOff className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-[#0F172A]">No Internet</p>
                  <p className="text-[11px] text-[#64748B]">Network drops in field</p>
                </div>

                <div className="hidden sm:block text-[#64748B] font-bold text-lg">→</div>

                <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] space-y-1.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#1B4332] flex items-center justify-center mx-auto">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-[#0F172A]">Record Expense</p>
                  <p className="text-[11px] text-[#64748B]">Normal Quick-Log form</p>
                </div>

                <div className="hidden sm:block text-[#64748B] font-bold text-lg">→</div>

                <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] space-y-1.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mx-auto">
                    <Layers className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-[#0F172A]">Saved on Device</p>
                  <p className="text-[11px] text-[#64748B]">Encrypted in IndexedDB</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-[#1B4332] font-bold">
                <span className="flex items-center gap-1.5 bg-[#D8F3DC] px-4 py-2 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" /> Internet Returns → Automatically Synced with Database
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            8. DIGITAL RECEIPTS & QR CODE VERIFICATION
        ========================================================================= */}
        <section id="receipts" className="py-16 sm:py-24 px-4 sm:px-8 bg-[#FBFDF9] border-b border-[#E2E8F0]">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: Copy */}
            <div className="lg:col-span-7 space-y-5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#2D6A4F] bg-[#D8F3DC] px-3 py-1 rounded-full">
                Instant Proof of Sale
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
                Every transaction leaves a record.
              </h2>
              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
                MavunoFlow automatically generates a professional digital receipt for your sales and purchases, complete with a unique sequential receipt number and a scannable QR code.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#D8F3DC] text-[#1B4332] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A]">Sell to professional businesses</h4>
                    <p className="text-xs text-[#64748B]">
                      Provide official receipts to hotels, supermarkets, restaurants, and distributors who require documented invoices.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#D8F3DC] text-[#1B4332] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A]">Scannable QR Verification</h4>
                    <p className="text-xs text-[#64748B]">
                      Anyone can scan the QR code with a smartphone camera to verify authenticity without seeing private farm passwords or sensitive internal notes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#D8F3DC] text-[#1B4332] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A]">Share via WhatsApp or Print</h4>
                    <p className="text-xs text-[#64748B]">
                      Send directly to buyers on WhatsApp or print thermal/A4 slips directly in the field.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Realistic Receipt Slip Mockup */}
            <div className="lg:col-span-5">
              <div className="max-w-sm mx-auto bg-white rounded-3xl border border-[#CBD5E1] shadow-xl p-6 space-y-4">
                {/* Receipt Header */}
                <div className="text-center pb-3 border-b border-dashed border-[#CBD5E1] space-y-1">
                  <div className="inline-flex items-center gap-1.5 font-black text-sm text-[#1B4332]">
                    <Sprout className="w-4 h-4 text-[#2D6A4F]" />
                    <span>MavunoFlow Official Receipt</span>
                  </div>
                  <p className="text-xs font-bold text-[#0F172A]">Baraka Agri-Ventures</p>
                  <p className="text-[11px] text-[#64748B]">Nakuru County · Verified Authenticity</p>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Receipt No:</span>
                    <span className="font-mono font-bold text-[#0F172A]">FP-20261006-D544BC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Transaction:</span>
                    <span className="font-bold text-[#1B4332]">SALE / INCOME</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Enterprise:</span>
                    <span className="font-bold text-[#0F172A]">Poultry (Eggs)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Quantity:</span>
                    <span className="font-bold text-[#0F172A]">100 Trays @ KSh 350</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Payment:</span>
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">M-PESA (PAID)</span>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-3 pb-3 border-y border-dashed border-[#CBD5E1] flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Total Amount</span>
                  <span className="text-lg font-black text-[#1B4332]">KSh 35,000</span>
                </div>

                {/* QR Code Graphic */}
                <div className="pt-1 flex flex-col items-center justify-center space-y-2">
                  <div className="w-24 h-24 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl flex items-center justify-center p-2">
                    <QrCode className="w-20 h-20 text-[#1B4332]" />
                  </div>
                  <p className="text-[10px] text-[#64748B] text-center font-mono">
                    Scan to verify authenticity online
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            9. WEEKLY FARM DIGEST SECTION
        ========================================================================= */}
        <section className="py-16 sm:py-24 px-4 sm:px-8 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#2D6A4F] bg-[#D8F3DC] px-3 py-1 rounded-full">
                Automated Insights
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
                Start your week knowing how your farm performed.
              </h2>
              <p className="text-sm text-[#64748B]">
                Every Monday at 07:00 AM, MavunoFlow compiles a clean 7-day performance report and delivers it directly to your email.
              </p>
            </div>

            {/* Weekly Digest Visual Card */}
            <div className="max-w-md mx-auto bg-[#F8FAFC] rounded-3xl border border-[#CBD5E1] shadow-lg p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                <div>
                  <span className="text-[10px] font-bold text-[#2D6A4F] uppercase tracking-wider">
                    WEEKLY FARM DIGEST
                  </span>
                  <h3 className="text-base font-black text-[#0F172A]">YOUR WEEK AT A GLANCE</h3>
                </div>
                <span className="text-xs font-bold bg-[#D8F3DC] text-[#1B4332] px-2.5 py-1 rounded-full">
                  Monday 07:00 AM
                </span>
              </div>

              {/* 7-Day Numbers */}
              <div className="grid grid-cols-3 gap-2 text-center bg-white p-3 rounded-2xl border border-[#E2E8F0]">
                <div>
                  <p className="text-[10px] text-[#64748B] font-bold uppercase">Revenue</p>
                  <p className="text-xs sm:text-sm font-black text-[#1B4332]">KSh 82,500</p>
                </div>
                <div className="border-x border-[#E2E8F0]">
                  <p className="text-[10px] text-[#64748B] font-bold uppercase">Expenses</p>
                  <p className="text-xs sm:text-sm font-black text-[#DC2626]">KSh 51,200</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#64748B] font-bold uppercase">Net Profit</p>
                  <p className="text-xs sm:text-sm font-black text-[#2D6A4F]">+KSh 31,300</p>
                </div>
              </div>

              {/* Trend highlight */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#2D6A4F]" />
                <span>↑ Revenue up 12% compared to previous week</span>
              </div>

              {/* Top Highlights */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 bg-white rounded-xl border border-[#E2E8F0]">
                  <span className="text-[#64748B]">Top Expense:</span>
                  <span className="font-bold text-[#0F172A]">Feed — KSh 29,400</span>
                </div>
                <div className="flex justify-between p-2.5 bg-white rounded-xl border border-[#E2E8F0]">
                  <span className="text-[#64748B]">Best Performing:</span>
                  <span className="font-bold text-[#1B4332]">Poultry Enterprise</span>
                </div>
              </div>

              <p className="text-[11px] text-[#64748B] text-center italic">
                Includes 1-page printable PDF attachment for farm files and cooperative loans.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            10. FINAL CALL TO ACTION SECTION
        ========================================================================= */}
        <section className="py-20 sm:py-28 px-4 sm:px-8 bg-[#1B4332] text-white relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#D8F3DC] bg-white/10 px-3.5 py-1.5 rounded-full border border-white/20">
              Ready to take control?
            </span>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Your farm already generates the data. <br />
              MavunoFlow helps you make sense of it.
            </h2>

            <p className="text-base sm:text-lg text-[#D8F3DC]/90 max-w-2xl mx-auto font-normal leading-relaxed">
              Start keeping clearer records and understand your farm's financial performance. Set up your farm profile in under 2 minutes.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 bg-[#D8F3DC] hover:bg-white text-[#1B4332] text-base font-black rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
              >
                <span>Create Your Farm</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-transparent hover:bg-white/10 text-white border border-white/30 text-base font-bold rounded-xl transition-all"
              >
                Already have an account? Log In
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          11. FOOTER
      ========================================================================= */}
      <footer className="bg-[#0F172A] text-slate-400 py-12 px-4 sm:px-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Sprout className="w-5 h-5 text-[#D8F3DC]" />
              <span className="font-extrabold text-base text-white">MavunoFlow</span>
            </div>
            <p className="text-slate-400 font-medium">
              Better Records. Better Decisions. Greater Yields.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-semibold text-slate-300">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#enterprises" className="hover:text-white transition-colors">
              Enterprises
            </a>
            <Link href="/login" className="hover:text-white transition-colors">
              Login
            </Link>
            <Link href="/register" className="hover:text-white transition-colors">
              Register
            </Link>
          </div>

          <div className="text-center sm:text-right text-slate-500">
            <p>© {new Date().getFullYear()} MavunoFlow. Built for modern African agriculture.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
