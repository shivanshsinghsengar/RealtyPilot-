export default function RootLoading() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6 text-center animate-pulse">
        <div className="h-12 w-12 rounded-xl bg-brand-200 mx-auto" />
        <div className="space-y-3">
          <div className="h-5 bg-slate-200 rounded-md w-3/4 mx-auto" />
          <div className="h-3 bg-slate-100 rounded-md w-1/2 mx-auto" />
        </div>
        <div className="space-y-2 pt-4">
          <div className="h-10 bg-slate-100 rounded-xl w-full" />
          <div className="h-10 bg-slate-100 rounded-xl w-full" />
        </div>
        <p className="text-xs text-slate-400 font-medium">Loading RealtyPilot...</p>
      </div>
    </main>
  );
}
