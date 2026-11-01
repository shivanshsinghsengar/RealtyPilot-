export default function InsightsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2 pb-2">
        <div className="h-8 w-80 bg-slate-200 rounded-xl" />
        <div className="h-4 w-96 bg-slate-100 rounded-lg" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3">
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="h-8 w-16 bg-slate-200 rounded-xl" />
            <div className="h-3 w-36 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Funnel Skeleton */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-4">
        <div className="h-6 w-60 bg-slate-200 rounded" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-48 bg-slate-200 rounded" />
              <div className="h-3 w-full bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Priority Queue Table Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        <div className="h-6 w-48 bg-slate-200 rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
