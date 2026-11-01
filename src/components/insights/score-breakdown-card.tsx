import { LeadScoreResult } from "@/lib/scoring/engine";
import {
  Flame,
  Sun,
  Snowflake,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  ShieldAlert,
} from "lucide-react";

interface ScoreBreakdownCardProps {
  scoreResult: LeadScoreResult;
  isOptedOut?: boolean;
}

export function ScoreBreakdownCard({ scoreResult, isOptedOut = false }: ScoreBreakdownCardProps) {
  const { score, tier, tierLabel, breakdown, nextBestAction } = scoreResult;

  const getTierIcon = () => {
    switch (tier) {
      case "hot":
        return <Flame className="h-5 w-5 text-rose-500 animate-pulse" />;
      case "warm":
        return <Sun className="h-5 w-5 text-amber-500" />;
      default:
        return <Snowflake className="h-5 w-5 text-sky-500" />;
    }
  };

  const getTierBadgeClass = () => {
    switch (tier) {
      case "hot":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "warm":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-sky-50 text-sky-700 border-sky-200";
    }
  };

  const getScoreColor = () => {
    if (score >= 80) return "text-rose-600";
    if (score >= 50) return "text-amber-600";
    return "text-sky-600";
  };

  const getProgressBarColor = () => {
    if (score >= 80) return "bg-rose-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-sky-500";
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
      {/* Top Header & Score Gauge */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Lead Health & Quality
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border capitalize ${getTierBadgeClass()}`}
            >
              {getTierIcon()}
              {tier} Lead
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-700 mt-1">
            {tierLabel}
          </h3>
        </div>

        {/* Big Score Display */}
        <div className="text-right">
          <div className="text-2xl font-black font-mono tracking-tight leading-none">
            <span className={getScoreColor()}>{score}</span>
            <span className="text-slate-300 text-sm font-bold"> / 100</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor()}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>0 (Cold)</span>
          <span>50 (Warm)</span>
          <span>80+ (Hot)</span>
        </div>
      </div>

      {/* DPDP Opt-out Alert if applicable */}
      {isOptedOut && (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <div>
            <span className="font-bold">DPDP Act Ceiling:</span> Score is capped because buyer has opted out from communications.
          </div>
        </div>
      )}

      {/* Recommended Next Best Action */}
      <div className="p-3.5 rounded-2xl bg-brand-50/60 border border-brand-100/80 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-brand-900">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <span>Recommended Next Action</span>
        </div>
        <p className="text-xs text-brand-800 leading-relaxed font-medium">
          {nextBestAction}
        </p>
      </div>

      {/* Factor Breakdown */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
          Score Breakdown Factors
        </span>

        <div className="space-y-2">
          {breakdown.map((f) => (
            <div
              key={f.id}
              className="p-2.5 rounded-xl bg-slate-50/60 border border-slate-100 flex items-start justify-between gap-2 text-xs"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  {f.status === "achieved" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : f.status === "partial" ? (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  ) : (
                    <HelpCircle className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                  )}
                  <span>{f.factor}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal pl-5">
                  {f.description}
                </p>
              </div>

              <span className="font-mono font-bold text-slate-700 shrink-0 text-right">
                +{f.points} / {f.maxPoints}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
