import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  onRetry: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/40 bg-destructive/5 p-12 text-center">
      <h3 className="text-lg font-semibold text-destructive">Unable to load data</h3>
      <p className="mt-2 max-w-md text-sm text-destructive/80">
        The Socrata API did not respond as expected. Please try again. If the problem persists, check your network connection or Socrata status.
      </p>
      <Button className="mt-6" onClick={onRetry} variant="secondary">
        Retry
      </Button>
    </div>
  );
}
