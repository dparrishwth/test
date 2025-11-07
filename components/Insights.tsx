"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface InsightsProps {
  items: string[];
  loading?: boolean;
}

export function Insights({ items, loading }: InsightsProps) {
  if (loading) {
    return (
      <div className="space-y-3" aria-live="polite">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (!items.length) {
    return <p className="text-sm text-muted-foreground">No notable changes detected.</p>;
  }

  return (
    <ul className="list-disc space-y-2 pl-5 text-sm">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
