// Admin dashboard skeleton loader — shown during RSC data fetch
export default function AdminDashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-label="Loading dashboard">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-neutral-900 w-1/3 rounded-sm" />
        <div className="h-4 bg-neutral-900 w-1/2 rounded-sm" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 bg-neutral-900 rounded-md border border-neutral-800"
          />
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-neutral-900 rounded-md border border-neutral-800" />
        <div className="h-64 bg-neutral-900 rounded-md border border-neutral-800" />
      </div>

      {/* Table skeleton */}
      <div className="h-96 bg-neutral-900 rounded-md border border-neutral-800" />
    </div>
  );
}
