// Participant dashboard skeleton loader
export default function ParticipantDashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-label="Loading dashboard">
      {/* Welcome header */}
      <div className="space-y-2">
        <div className="h-7 bg-neutral-900 w-2/5 rounded-sm" />
        <div className="h-4 bg-neutral-900 w-1/3 rounded-sm" />
      </div>

      {/* Status + quick-action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-36 bg-neutral-900 rounded-md border border-neutral-800"
          />
        ))}
      </div>

      {/* Notifications panel */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-16 bg-neutral-900 rounded-sm border border-neutral-800"
          />
        ))}
      </div>
    </div>
  );
}
