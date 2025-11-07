import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onReset: () => void;
}

export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
      <h3 className="text-lg font-semibold">No data for the selected filters</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Try broadening your filters or reset to the default view to explore the statewide trend.
      </p>
      <Button className="mt-6" onClick={onReset}>
        Reset filters
      </Button>
    </div>
  );
}
