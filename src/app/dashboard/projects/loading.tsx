export default function ProjectsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2 pb-2">
        <div className="h-8 w-80 bg-slate-200 rounded-xl" />
        <div className="h-4 w-96 bg-slate-100 rounded-lg" />
      </div>

      {/* Project Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-72 bg-slate-100 rounded" />
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-20 bg-slate-50 rounded-xl" />
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-72 bg-slate-100 rounded" />
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-20 bg-slate-50 rounded-xl" />
        </div>
      </div>

      {/* Locality Explorer Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        <div className="h-6 w-60 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
