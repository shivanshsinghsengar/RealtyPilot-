export default function LeadDetailLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="h-44 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
        <div className="h-4 bg-slate-200 rounded w-32" />
        <div className="h-8 bg-slate-200 rounded w-64" />
        <div className="h-4 bg-slate-100 rounded w-96" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="h-96 bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="h-6 bg-slate-200 rounded w-48" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-xl w-full" />
          ))}
        </div>
        <div className="lg:col-span-2 h-96 bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="h-6 bg-slate-200 rounded w-60" />
          <div className="h-24 bg-slate-100 rounded-2xl w-full" />
          <div className="h-32 bg-slate-100 rounded-2xl w-full" />
        </div>
      </div>
    </div>
  );
}
