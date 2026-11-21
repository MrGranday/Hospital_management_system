export default function PharmacyLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-24 rounded-lg bg-muted" />
        <div className="h-24 rounded-lg bg-muted" />
        <div className="h-24 rounded-lg bg-muted" />
      </div>
      <div className="h-64 rounded-lg bg-muted" />
    </div>
  );
}
