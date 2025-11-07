"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { defaultFilters, FilterState, parseFilters, stringifyFilters } from "@/lib/url-state";
import { CreditsResponse, TrendByProgram } from "@/lib/types";
import { Filters } from "@/components/Filters";
import { KpiCard } from "@/components/KpiCard";
import { TrendChart } from "@/components/TrendChart";
import { BarByProgram } from "@/components/BarByProgram";
import { DataTable } from "@/components/DataTable";
import { Insights } from "@/components/Insights";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { formatCurrency, formatPercent } from "@/lib/format";

const YEAR_DOMAIN: [number, number] = [2000, new Date().getFullYear()];

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [debouncedFilters, setDebouncedFilters] = useState<FilterState>(defaultFilters);
  const [data, setData] = useState<CreditsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const parsed = parseFilters(params);
    setFilters(parsed);
  }, [searchParams]);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(handle);
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const params = stringifyFilters(debouncedFilters);
    fetch(`/api/credits?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        const body = (await res.json()) as CreditsResponse;
        setData(body);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedFilters]);

  const handleFiltersChange = (update: Partial<FilterState>) => {
    startTransition(() => {
      const next: FilterState = {
        ...filters,
        ...update,
      };
      const params = stringifyFilters(next);
      router.replace(`?${params.toString()}`, { scroll: false });
      setFilters(next);
    });
  };

  const handleReset = () => handleFiltersChange(defaultFilters);

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}${window.location.pathname}?${stringifyFilters(filters).toString()}`;
      await navigator.clipboard.writeText(shareUrl);
    } catch (err) {
      console.error("Unable to copy URL", err);
    }
  };

  const handleExport = async () => {
    try {
      const params = stringifyFilters(filters);
      params.set("format", "csv");
      const res = await fetch(`/api/credits?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to export CSV");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ny-tax-credits.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export CSV", err);
    }
  };

  const utilizationRateByYear = useMemo(() => {
    if (!data) return {} as Record<number, number | null>;
    const map: Record<number, number | null> = {};
    data.facets.tax_year.forEach((bucket) => {
      map[bucket.value] = bucket.allowed && bucket.allowed > 0 ? bucket.utilized / bucket.allowed : null;
    });
    return map;
  }, [data]);

  const yoyChange = useMemo(() => {
    if (!data || data.facets.tax_year.length < 2) return null;
    const sorted = [...data.facets.tax_year].sort((a, b) => a.value - b.value);
    const current = sorted[sorted.length - 1];
    const previous = sorted[sorted.length - 2];
    if (!current || !previous || previous.utilized === 0) return null;
    return (current.utilized - previous.utilized) / previous.utilized;
  }, [data]);

  const topProgramShare = useMemo(() => {
    if (!data || data.totals.utilized === 0) return null;
    const top = data.facets.program_name[0];
    if (!top) return null;
    return top.utilized / data.totals.utilized;
  }, [data]);

  const growthPrograms = useMemo(() => {
    if (!data) return [] as string[];
    const grouped = data.meta.trend_by_program.reduce<Record<string, TrendByProgram[]>>((acc, item) => {
      if (!acc[item.program_name]) acc[item.program_name] = [];
      acc[item.program_name].push(item);
      return acc;
    }, {});

    return Object.entries(grouped)
      .filter(([, values]) => {
        const sorted = [...values].sort((a, b) => a.tax_year - b.tax_year);
        let streak = 1;
        for (let i = 1; i < sorted.length; i += 1) {
          if (sorted[i].utilized > sorted[i - 1].utilized) {
            streak += 1;
            if (streak >= 3) return true;
          } else {
            streak = 1;
          }
        }
        return false;
      })
      .map(([name]) => name);
  }, [data]);

  const insightItems = useMemo(() => {
    if (!data) return [] as string[];
    const items: string[] = [];
    if (yoyChange != null) {
      const direction = yoyChange >= 0 ? "rose" : "fell";
      items.push(`Utilized credits ${direction} ${formatPercent(Math.abs(yoyChange))} versus last year.`);
    }
    if (topProgramShare != null) {
      const top = data.facets.program_name[0];
      if (top) {
        items.push(`${top.value} accounts for ${formatPercent(topProgramShare)} of all utilized credits.`);
      }
    }
    if (growthPrograms.length) {
      items.push(`${growthPrograms.length} program(s) increased utilization for 3 or more consecutive years (${growthPrograms.join(", ")}).`);
    }
    return items;
  }, [data, growthPrograms, topProgramShare, yoyChange]);

  const unauthenticated = data?.meta.authenticated === false;

  const showEmpty = !loading && data && data.rows.length === 0;

  return (
    <main className="flex min-h-screen flex-col">
      <Filters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleReset}
        onShare={handleShare}
        yearDomain={YEAR_DOMAIN}
        programs={data?.facets.program_name ?? []}
        taxpayerTypes={(data?.facets.taxpayer_type ?? []).map((bucket) => bucket.value)}
        loading={loading || isPending}
        unauthenticated={unauthenticated}
      />
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            New York Economic Incentive Tax Credits
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Track how New York State economic incentive tax credits are claimed, allowed, and utilized over time, and discover which programs drive the biggest impacts.
          </p>
        </header>

        {error ? (
          <ErrorState onRetry={() => handleFiltersChange({})} />
        ) : showEmpty ? (
          <EmptyState onReset={handleReset} />
        ) : (
          <div className="space-y-12">
            <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="Total Utilized"
                value={data ? formatCurrency(data.totals.utilized) : ""}
                loading={loading}
              />
              <KpiCard
                title="Utilization Rate"
                value={data ? formatPercent(data.totals.utilization_rate ?? null) : ""}
                loading={loading}
              />
              <KpiCard
                title="YoY Change"
                value={data && yoyChange != null ? formatPercent(yoyChange) : "—"}
                description="Current year versus previous"
                loading={loading}
              />
              <KpiCard
                title="Top Program Share"
                value={data && topProgramShare != null ? formatPercent(topProgramShare) : "—"}
                description={data?.facets.program_name[0]?.value}
                loading={loading}
              />
            </section>

            <section className="grid gap-12 lg:grid-cols-5" aria-label="Visualizations">
              <div className="space-y-4 lg:col-span-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Utilization over time</h2>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Area chart</span>
                </div>
                <TrendChart
                  totalsByYear={data?.facets.tax_year ?? []}
                  trendByProgram={data?.meta.trend_by_program ?? []}
                  utilizationRateByYear={utilizationRateByYear}
                />
              </div>
              <div className="space-y-4 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Utilization by program</h2>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Bar chart</span>
                </div>
                <BarByProgram
                  data={data?.facets.program_name ?? []}
                  activePrograms={filters.program}
                  onToggleProgram={(program) => {
                    const next = filters.program.includes(program)
                      ? filters.program.filter((item) => item !== program)
                      : [...filters.program, program];
                    handleFiltersChange({ program: next });
                  }}
                />
              </div>
            </section>

            <section aria-label="Details table">
              <DataTable
                rows={data?.rows ?? []}
                sort={filters.sort}
                onSortChange={(sort) => handleFiltersChange({ sort })}
                onExport={handleExport}
                loading={loading}
              />
            </section>

            <section aria-label="Insights" className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold">Insights</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Quick takeaways generated from the selected timeframe and programs.
              </p>
              <div className="mt-4">
                <Insights items={insightItems} loading={loading} />
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
