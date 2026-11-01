import Link from "next/link";
import { LocalityExplorer } from "@/components/projects/locality-explorer";
import {
  Building,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Bhopal Projects & Locality Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Grounded real-estate inventory, RERA registrations, and verified distances from Google Places
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/visits"
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-600/20 transition-all flex items-center gap-1.5"
          >
            <Calendar className="h-4 w-4" />
            <span>Book Site Visit</span>
          </Link>
        </div>
      </div>

      {/* Bhopal Projects Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project 1: Narmada Greens */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4 hover:border-brand-200 transition-all">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Narmada Greens
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  Ready for Registry
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <MapPin className="h-3.5 w-3.5 text-brand-600" />
                <span>Kolar Road, Bhopal, Madhya Pradesh</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Price Range
              </div>
              <div className="text-base font-extrabold text-brand-600">
                ₹25L &ndash; ₹60L
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">RERA ID</span>
              <span className="font-mono font-bold text-slate-900">P-BHP-23-4102</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Plot Sizes</span>
              <span className="font-bold text-slate-900">1000 - 2400 sq.ft</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Rate / sq.ft</span>
              <span className="font-bold text-slate-900">₹2,500/sq.ft</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Bank Loans</span>
              <span className="font-bold text-emerald-600">SBI &bull; HDFC &bull; ICICI</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="font-bold text-slate-900">Key Features:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                40ft wide main entrance road
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                Underground electrical cabling
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                Landscaped central park & temple
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                24/7 guarded security gate
              </span>
            </div>
          </div>
        </div>

        {/* Project 2: Bhojpal Enclave */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4 hover:border-brand-200 transition-all">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Bhojpal Enclave
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                  Dec 2026 Possession
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <MapPin className="h-3.5 w-3.5 text-brand-600" />
                <span>Hoshangabad Road (NH-46), Bhopal, Madhya Pradesh</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Price Range
              </div>
              <div className="text-base font-extrabold text-brand-600">
                ₹32L &ndash; ₹65L
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">RERA ID</span>
              <span className="font-mono font-bold text-slate-900">P-BHP-24-4890</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Plot Sizes</span>
              <span className="font-bold text-slate-900">1200 - 2400 sq.ft</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Rate / sq.ft</span>
              <span className="font-bold text-slate-900">₹2,650/sq.ft</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Bank Loans</span>
              <span className="font-bold text-emerald-600">All Nationalized Banks</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="font-bold text-slate-900">Key Features:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                Exclusive Resident Clubhouse
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                Direct NH-46 Highway frontage
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                Swimming pool & kids play area
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                4.2 km from AIIMS Bhopal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Locality & Connectivity Intelligence Component */}
      <LocalityExplorer />
    </div>
  );
}
