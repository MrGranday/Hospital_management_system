"use client";

export default function FinanceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-destructive">
      <h2 className="text-lg font-semibold">Finance Error</h2>
      <p className="mt-2 text-sm">{error.message || "An unexpected error occurred in finance."}</p>
      <button
        onClick={reset}
        className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
      >
        Try again
      </button>
    </div>
  );
}
