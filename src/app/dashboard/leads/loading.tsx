export default function LeadsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between pb-2">
        <div className="space-y-2">
          <div className="h-7 bg-slate-200 rounded-xl w-64" />
          <div className="h-4 bg-slate-100 rounded w-96" />
        </div>
        <div className="h-10 bg-slate-200 rounded-xl w-28" />
      </div>

      {/* Tabs / Filter Skeleton */}
      <div className="h-14 bg-white rounded-2xl border border-slate-200 p-3" />

      {/* Table Skeleton */}
      <div className="h-96 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-xl w-full" />
        ))}
      </div>
    </div>
  );
}
