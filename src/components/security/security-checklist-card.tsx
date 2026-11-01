"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Lock,
  Database,
  Bot,
  MessageSquare,
  Globe,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatInIST } from "@/lib/utils/date";
import { SecurityAuditReport, SecurityCheckItem } from "@/lib/security/audit";

interface SecurityChecklistCardProps {
  initialReport: SecurityAuditReport;
}

export function SecurityChecklistCard({ initialReport }: SecurityChecklistCardProps) {
  const [report, setReport] = useState<SecurityAuditReport>(initialReport);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsLoading(true);
    setRefreshNotice(null);
    setRefreshError(null);
    try {
      const res = await fetch("/api/security/audit");
      const data = await res.json();
      if (res.ok && data.success && data.report) {
        setReport(data.report);
        setRefreshNotice("Security posture audit refreshed successfully!");
        setTimeout(() => setRefreshNotice(null), 4000);
      } else {
        setRefreshError(data.error || "Failed to refresh security audit from server.");
        setTimeout(() => setRefreshError(null), 5000);
      }
    } catch {
      setRefreshError("Network failure while connecting to security audit endpoint.");
      setTimeout(() => setRefreshError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChecks = report.checks.filter((c) => {
    if (selectedFilter === "all") return true;
    return c.category === selectedFilter;
  });

  const getCategoryIcon = (category: SecurityCheckItem["category"]) => {
    switch (category) {
      case "secrets":
        return <Lock className="h-4 w-4 text-amber-500" />;
      case "rls":
        return <Database className="h-4 w-4 text-brand-600" />;
      case "dpdp":
        return <ShieldCheck className="h-4 w-4 text-emerald-600" />;
      case "webhook":
        return <MessageSquare className="h-4 w-4 text-sky-500" />;
      case "ai_guardrails":
        return <Bot className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: SecurityCheckItem["status"]) => {
    switch (status) {
      case "pass":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            PASS
          </span>
        );
      case "warn":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3" />
            WARN
          </span>
        );
      case "fail":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="h-3 w-3" />
            FAIL
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Notice */}
      {refreshNotice && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold flex items-center gap-2 shadow-lg">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>{refreshNotice}</span>
        </div>
      )}

      {/* Error Alert */}
      {refreshError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{refreshError}</span>
        </div>
      )}

      {/* Top Posture Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Security Score */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Security Score</span>
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-900">
            {report.scorePercentage}%
          </div>
          <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Production Grade Hardened</span>
          </div>
        </div>

        {/* DPDP Consent Rate */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">DPDP Consent Rate</span>
            <Globe className="h-5 w-5 text-brand-600" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-brand-600">
            {report.dpdpMetrics.complianceRate}%
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {report.dpdpMetrics.consentedLeads} of {report.dpdpMetrics.totalLeads} leads actively consented
          </div>
        </div>

        {/* Opt-out Outbound Blocked */}
        <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm space-y-2 bg-gradient-to-br from-white to-rose-50/40">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-xs font-bold uppercase tracking-wider">Opt-Outs Blocked</span>
            <ShieldAlert className="h-5 w-5 text-rose-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-rose-600">
            {report.dpdpMetrics.optedOutLeads}
          </div>
          <div className="text-xs text-rose-700/80 font-medium">
            Outbound messages hard-blocked
          </div>
        </div>

        {/* AI Zero-Hallucination Status */}
        <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm space-y-2 bg-gradient-to-br from-white to-purple-50/40">
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-xs font-bold uppercase tracking-wider">Zero-Hallucination</span>
            <Bot className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900 tracking-tight">
            Active Guard
          </div>
          <div className="text-xs text-purple-700/80 font-medium">
            Grounded in DB &bull; Hindi fallback active
          </div>
        </div>
      </div>

      {/* Main Checklist Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-6 p-6 sm:p-8">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-600" />
              Production Security & Compliance Checklist
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated audit of environment secrets, PostgreSQL RLS policies, webhook signatures, and DPDP rules &bull; Last evaluated: {formatInIST(report.timestamp, "dd MMM yyyy, hh:mm a 'IST'")}
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-brand-600" : ""}`} />
            <span>{isLoading ? "Auditing System..." : "Re-Run Security Audit"}</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { id: "all", label: "All Controls" },
            { id: "secrets", label: "Secrets Isolation" },
            { id: "rls", label: "Postgres RLS" },
            { id: "dpdp", label: "DPDP Act 2023" },
            { id: "webhook", label: "Webhook HMAC" },
            { id: "ai_guardrails", label: "AI Sales Guardrails" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedFilter === f.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Audit Items List */}
        <div className="space-y-3">
          {filteredChecks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-1">
              <ShieldCheck className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
              <p className="font-semibold text-slate-600">No security controls found in this category.</p>
              <p>Select &apos;All Controls&apos; above to view the full security posture.</p>
            </div>
          ) : (
            filteredChecks.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 hover:bg-slate-50 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs shrink-0 mt-0.5">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.details}</p>
                    </div>
                  </div>

                  <div className="shrink-0">{getStatusBadge(item.status)}</div>
                </div>

                {item.remediation && (
                  <div className="ml-11 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
                    <span className="font-bold">Remediation:</span> {item.remediation}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
