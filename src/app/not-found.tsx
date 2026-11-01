import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 text-center">
        <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center font-bold text-lg">
          404
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Page not found</h2>
          <p className="text-xs sm:text-sm text-slate-600">
            The requested RealtyPilot page or CRM resource does not exist.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs sm:text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
