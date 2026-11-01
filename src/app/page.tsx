import { getServerEnv } from "@/lib/env.server";
import { formatInIST, toUTCString } from "@/lib/utils/date";
import { CheckCircle2, AlertTriangle, ShieldCheck, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-brand-500/20">
                RP
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  RealtyPilot
                </h1>
                <p className="text-sm text-slate-500">
                  Real Estate CRM & AI Sales Platform &bull; Bhopal, M.P.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse"></span>
              Phase 0 Complete
            </span>
          </div>
        </header>

        {/* Timestamp Banner */}
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-brand-400 shrink-0" />
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                System Timezone Standard (DPDP / Operations)
              </p>
              <p className="text-sm sm:text-base font-semibold text-white">
                {istNow} <span className="text-xs text-slate-400 font-normal">({APP_TIMEZONE_LABEL})</span>
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 font-mono">
            DB UTC Storage: {utcNow}
          </div>
        </div>

        {/* Stack Status Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Architecture Baseline & Status
            </h2>
            <a
              href="/api/health"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-brand-700 hover:text-brand-800 hover:underline flex items-center gap-1"
            >
              Inspect /api/health JSON &rarr;
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stackItems.map((item) => (
              <div
                key={item.name}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  {item.isReady ? (
                    <span className="p-1 rounded-full bg-emerald-50 text-emerald-600 shrink-0">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                  ) : (
                    <span className="p-1 rounded-full bg-amber-50 text-amber-600 shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Status</span>
                  <span
                    className={`font-semibold ${
                      item.isReady ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Phase Roadmap Card */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-600" />
            Execution Roadmap & Strict Guidelines
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                Phase 1 Next
              </div>
              <h4 className="font-semibold text-slate-900 text-sm">
                Database Schema & RLS
              </h4>
              <p className="text-xs text-slate-600">
                8 tables, Row-Level Security policies, and 10 fake Bhopal residential leads seed.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Core Rules
              </div>
              <h4 className="font-semibold text-slate-900 text-sm">
                DPDP & Verification
              </h4>
              <p className="text-xs text-slate-600">
                Opt-out tracking, zero fabricated prices/dates, Meta webhook HMAC validation.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Server-Only Secrets
              </div>
              <h4 className="font-semibold text-slate-900 text-sm">
                Zero Client Leaks
              </h4>
              <p className="text-xs text-slate-600">
                Supabase service role, Gemini API, and WhatsApp credentials never bundled in JS.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 py-4">
          RealtyPilot &bull; Residential Plots & Duplexes &bull; Bhopal, Madhya Pradesh
        </footer>
      </div>
    </main>
  );
}

const APP_TIMEZONE_LABEL = "Asia/Kolkata (IST, UTC+05:30)";
