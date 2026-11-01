export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Banner Skeleton */}
      <div className="h-40 bg-slate-200 rounded-3xl w-full" />

      {/* KPI Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <div className="h-3 bg-slate-200 rounded w-1/2" />
            <div className="h-8 bg-slate-200 rounded w-1/3" />
          </div>
        ))}
      </div>

      {/* Two Column Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="h-80 bg-white rounded-2xl border border-slate-200 p-6" />
        <div className="lg:col-span-2 h-80 bg-white rounded-2xl border border-slate-200 p-6" />
      </div>
    </div>
  );
}
