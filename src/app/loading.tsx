export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground"
    >
      Loading…
    </div>
  );
}
