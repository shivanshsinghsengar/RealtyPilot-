import { getServerEnv } from "@/lib/env.server";
import { formatInIST, toUTCString } from "@/lib/utils/date";
import { CheckCircle2, AlertTriangle, ShieldCheck, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

const APP_TIMEZONE_LABEL = "Asia/Kolkata (IST, UTC+05:30)";

export default function HomePage() {
  const now = new Date();
  const utcNow = toUTCString(now);
  const istNow = formatInIST(now, "dd MMM yyyy, hh:mm:ss a 'IST'");

  const env = getServerEnv();

  const stackItems = [
    {
      name: "Next.js 14 App Router + TS",
      status: "Active & Configured",
      isReady: true,
      desc: "Full TypeScript strict mode, path aliases (@/*), React Server Components",
    },
    {
      name: "Tailwind CSS + Mobile UI",
      status: "Active & Styled",
      isReady: true,
      desc: "Custom Bhopal real estate brand palette, mobile-responsive layout",
    },
    {
      name: "Date & Time Engine",
      status: "Active (UTC / IST)",
      isReady: true,
      desc: `Storage standard: UTC (${utcNow}) | Display: Asia/Kolkata (${istNow})`,
    },
    {
      name: "Supabase Connection & SSR",
      status: env.isSupabaseReal ? "Connected" : "Pending Credentials (Phase 1)",
      isReady: env.isSupabaseReal,
      desc: env.isSupabaseReal
        ? "Connected with browser client, server client, and elevated admin client."
        : "Configured with local development placeholders. Ready for your Supabase keys.",
    },
    {
      name: "Gemini AI Sales Engine",
      status: env.hasGeminiKey ? "Key Configured" : "Phase 6 Ready",
      isReady: env.hasGeminiKey,
      desc: "Strict RERA and plot data validation. No price or availability hallucination.",
    },
    {
      name: "Meta WhatsApp Cloud API",
      status: env.hasWhatsAppData ? "Configured" : "Phase 5 Ready",
      isReady: env.hasWhatsAppData,
      desc: "Official Cloud API with SHA256 webhook signature verification and DPDP opt-out.",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0QzMyLjY4NiAxNCAzMCAxNi42ODYgMzAgMjBzMi42ODYgNiA2IDYgNi0yLjY4NiA2LTYtMi42ODYtNi02LTZ6TTYgMzRjLTMuMzE0IDAtNiAyLjY4Ni02IDZzMi42ODYgNiA2IDYgNi0yLjY4NiA2LTYtMi42ODYtNi02LTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Luxury Header - Hero Style */}
        <header className="text-center mb-12 sm:mb-16 space-y-6 animate-fade-in">
          {/* Logo & Brand */}
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
              <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl border-2 border-amber-300/20 transform group-hover:scale-105 transition-transform duration-300">
                <span className="text-white font-bold text-2xl sm:text-3xl drop-shadow-lg">RP</span>
              </div>
            </div>
          </div>

          {/* Main Title */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight">
              <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 bg-clip-text text-transparent">
                RealtyPilot
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 font-light tracking-wide max-w-2xl mx-auto">
              Luxury Real Estate CRM & AI-Powered Sales Platform
            </p>
            <p className="text-sm text-slate-400 flex items-center justify-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              Premium Properties • Bhopal, Madhya Pradesh
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center pt-4">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-semibold text-white">System Active</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">Phase 0 Complete</span>
            </div>
          </div>
        </header>

        {/* Timestamp Banner - Luxury Style */}
        <div className="bg-gradient-to-r from-slate-800/80 via-slate-800/60 to-slate-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10 mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <Clock className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
                  System Timezone
                </p>
                <p className="text-base sm:text-lg font-semibold text-white">
                  {istNow}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{APP_TIMEZONE_LABEL}</p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-700/50 backdrop-blur-sm">
              <p className="text-xs text-slate-400 font-mono">UTC: {utcNow}</p>
            </div>
          </div>
        </div>

        {/* Stack Status Grid - Premium Cards */}
        <section className="space-y-6 mb-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="h-1 w-12 bg-gradient-to-r from-amber-400 to-transparent rounded-full"></span>
              System Architecture
            </h2>
            <a
              href="/api/health"
              target="_blank"
              rel="noreferrer"
              className="group px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/50 text-sm font-medium text-slate-300 hover:text-amber-300 transition-all duration-300 flex items-center gap-2"
            >
              Health Check
              <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stackItems.map((item, idx) => (
              <div
                key={item.name}
                className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-amber-400/30 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 overflow-hidden"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-600/0 group-hover:from-amber-500/5 group-hover:to-amber-600/10 transition-all duration-500 rounded-2xl"></div>
                
                <div className="relative space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <h3 className="font-bold text-white text-base sm:text-lg group-hover:text-amber-300 transition-colors duration-300">
                        {item.name}
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    <div className={`p-2.5 rounded-xl backdrop-blur-sm ${
                      item.isReady 
                        ? 'bg-emerald-500/10 border border-emerald-500/20' 
                        : 'bg-amber-500/10 border border-amber-500/20'
                    }`}>
                      {item.isReady ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Status</span>
                    <span className={`text-sm font-semibold px-3 py-1 rounded-lg ${
                      item.isReady 
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Phase Roadmap Card - Premium Glass Effect */}
        <section className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6 mb-12">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30">
              <ShieldCheck className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Execution Roadmap</h2>
              <p className="text-sm text-slate-400">Strict guidelines & security protocols</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="group relative bg-gradient-to-br from-amber-500/5 to-amber-600/5 rounded-2xl p-6 border border-amber-500/20 hover:border-amber-400/40 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative space-y-3">
                <div className="inline-block px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Phase 1 Next</span>
                </div>
                <h4 className="font-bold text-white text-base">Database Schema & RLS</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  8 tables, Row-Level Security policies, and 10 fake Bhopal residential leads seed.
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 rounded-2xl p-6 border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative space-y-3">
                <div className="inline-block px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Core Rules</span>
                </div>
                <h4 className="font-bold text-white text-base">DPDP & Verification</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Opt-out tracking, zero fabricated prices/dates, Meta webhook HMAC validation.
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-blue-500/5 to-blue-600/5 rounded-2xl p-6 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative space-y-3">
                <div className="inline-block px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Server-Only</span>
                </div>
                <h4 className="font-bold text-white text-base">Zero Client Leaks</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Supabase service role, Gemini API, and WhatsApp credentials never bundled in JS.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer - Elegant */}
        <footer className="text-center pt-8 pb-4 border-t border-white/5">
          <p className="text-slate-400 text-sm">
            <span className="font-semibold text-amber-300">RealtyPilot</span> • Premium Residential Plots & Duplexes
          </p>
          <p className="text-slate-500 text-xs mt-1">
            Bhopal, Madhya Pradesh • India
          </p>
        </footer>
      </div>
    </main>
  );
}
