"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard caught error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-6 sm:p-8 border border-red-100 shadow-sm space-y-6 text-center">
        <div className="h-12 w-12 rounded-xl bg-red-50 text-red-600 mx-auto flex items-center justify-center">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Dashboard Failed to Load</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {error.message || "Unable to fetch CRM metrics or recent leads. Please check connection."}
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
