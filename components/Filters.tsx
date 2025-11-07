"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { FilterState } from "@/lib/url-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FiltersProps {
  filters: FilterState;
  onChange: (update: Partial<FilterState>) => void;
  onReset: () => void;
  onShare: () => Promise<void>;
  yearDomain: [number, number];
  programs: { value: string; utilized: number }[];
  taxpayerTypes: string[];
  loading?: boolean;
  unauthenticated?: boolean;
}

export function Filters({
  filters,
  onChange,
  onReset,
  onShare,
  yearDomain,
  programs,
  taxpayerTypes,
  loading,
  unauthenticated,
}: FiltersProps) {
  const [shareCopied, setShareCopied] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sortedPrograms = useMemo(
    () =>
      [...programs]
        .sort((a, b) => b.utilized - a.utilized)
        .slice(0, 25),
    [programs]
  );

  const handleYearChange = (key: "year_from" | "year_to") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = Number(event.target.value);
      onChange({
        [key]: next,
        offset: 0,
      });
    };

  const handleProgramChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
    onChange({ program: selected, offset: 0 });
  };

  const handleTaxpayerChange = (value: string) => {
    onChange({ taxpayer_type: value === "all" ? null : value, offset: 0 });
  };

  const handleShare = async () => {
    setShareCopied(false);
    await onShare();
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
    setDrawerOpen(false);
  };

  const yearField = (
    <div className="flex w-full flex-col gap-2 sm:w-1/3">
      <label htmlFor="year-from" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Tax Year Range
      </label>
      <div className="flex items-center gap-2">
        <Input
          id="year-from"
          type="number"
          min={yearDomain[0]}
          max={filters.year_to}
          value={filters.year_from}
          onChange={handleYearChange("year_from")}
          aria-label="Start year"
          disabled={loading}
        />
        <span className="text-muted-foreground">to</span>
        <Input
          id="year-to"
          type="number"
          min={filters.year_from}
          max={yearDomain[1]}
          value={filters.year_to}
          onChange={handleYearChange("year_to")}
          aria-label="End year"
          disabled={loading}
        />
      </div>
    </div>
  );

  const programField = (
    <div className="flex w-full flex-col gap-2 sm:w-1/3">
      <label htmlFor="program-select" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Program (multi-select)
      </label>
      <select
        id="program-select"
        multiple
        value={filters.program}
        onChange={handleProgramChange}
        className="h-24 w-full rounded-md border border-input bg-background p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Program"
        disabled={loading}
      >
        {sortedPrograms.map((option) => (
          <option key={option.value} value={option.value}>
            {option.value}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">Hold Ctrl/⌘ to select multiple programs.</p>
    </div>
  );

  const taxpayerField = (
    <div className="flex w-full flex-col gap-2 sm:w-1/4">
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Taxpayer Type
      </label>
      <Select value={filters.taxpayer_type ?? "all"} onValueChange={handleTaxpayerChange} disabled={loading}>
        <SelectTrigger aria-label="Taxpayer type">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {taxpayerTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const actions = (
    <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:flex-1 sm:flex-row sm:items-center sm:justify-end">
      {unauthenticated ? (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
          Using unauthenticated public API
        </span>
      ) : null}
      <div className="flex w-full flex-row gap-2 sm:w-auto">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setDrawerOpen(false);
            onReset();
          }}
          disabled={loading}
        >
          Reset
        </Button>
        <Button type="button" onClick={handleShare} disabled={loading} aria-live="polite">
          {shareCopied ? "Link copied" : "Share"}
        </Button>
      </div>
    </div>
  );

  const desktopContent = (
    <div className="mx-auto hidden w-full max-w-6xl flex-wrap items-center gap-4 px-4 py-4 sm:flex sm:flex-nowrap">
      {yearField}
      {programField}
      {taxpayerField}
      {actions}
    </div>
  );

  const mobileContent = drawerOpen ? (
    <div className="fixed inset-0 z-30 flex sm:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      <div className="relative ml-auto flex h-full w-full max-w-sm flex-col bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Filters</h2>
          <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
            Close
          </Button>
        </div>
        <div className="mt-6 flex flex-col gap-6 overflow-y-auto">
          {yearField}
          {programField}
          {taxpayerField}
          {actions}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <section
      aria-label="Filters"
      className={cn(
        "sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        "shadow-sm"
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:hidden">
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setDrawerOpen(true)}
            disabled={loading}
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
          >
            Filters
          </Button>
          <Button type="button" onClick={handleShare} disabled={loading} aria-live="polite">
            {shareCopied ? "Link copied" : "Share"}
          </Button>
        </div>
        {unauthenticated ? (
          <span className="mt-2 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            Using unauthenticated public API
          </span>
        ) : null}
      </div>
      {desktopContent}
      {mobileContent}
    </section>
  );
}
