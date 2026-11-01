export default function InboxLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2 pb-2">
        <div className="h-8 w-60 bg-slate-200 rounded-xl" />
        <div className="h-4 w-96 bg-slate-100 rounded-lg" />
      </div>

      {/* Inbox Two-Pane Skeleton */}
      <div className="h-[calc(100vh-10rem)] min-h-[550px] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Left pane skeleton */}
        <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 p-4 space-y-4">
          <div className="h-6 w-32 bg-slate-200 rounded" />
          <div className="h-9 w-full bg-slate-100 rounded-xl" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="h-10 w-10 rounded-full bg-slate-200 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                  <div className="h-3 w-40 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right pane skeleton */}
        <div className="flex-1 flex flex-col justify-between p-6">
          <div className="h-12 border-b border-slate-100 flex items-center justify-between pb-3">
            <div className="h-5 w-40 bg-slate-200 rounded" />
            <div className="h-6 w-20 bg-slate-100 rounded-full" />
          </div>
          <div className="space-y-4 py-8">
            <div className="h-12 w-64 bg-slate-100 rounded-2xl rounded-tl-sm" />
            <div className="h-14 w-80 bg-slate-200 rounded-2xl rounded-tr-sm ml-auto" />
            <div className="h-10 w-56 bg-slate-100 rounded-2xl rounded-tl-sm" />
          </div>
          <div className="h-20 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
