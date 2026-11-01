import { runSecurityAudit } from "@/lib/security/audit";
import { SecurityChecklistCard } from "@/components/security/security-checklist-card";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const report = await runSecurityAudit();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Security & DPDP Compliance Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time verification of secrets isolation, database RLS policies, webhook HMAC security, and DPDP compliance
          </p>
        </div>
      </div>

      {/* Security Card Component */}
      <SecurityChecklistCard initialReport={report} />
    </div>
  );
}
