"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FacetBucket, TrendByProgram } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/format";

interface TrendChartProps {
  totalsByYear: FacetBucket<number>[];
  trendByProgram: TrendByProgram[];
  utilizationRateByYear: Record<number, number | null>;
}

export function TrendChart({ totalsByYear, trendByProgram, utilizationRateByYear }: TrendChartProps) {
  const programs = useMemo(() => {
    const sorted = [...trendByProgram].sort((a, b) => b.utilized - a.utilized);
    return Array.from(new Set(sorted.map((item) => item.program_name))).slice(0, 5);
  }, [trendByProgram]);

  const chartData = useMemo(() => {
    const byYear: Record<number, Record<string, number>> = {};
    totalsByYear.forEach((bucket) => {
      byYear[bucket.value] = {
        year: bucket.value,
        total: bucket.utilized,
      } as Record<string, number>;
    });
    trendByProgram.forEach((item) => {
      if (!byYear[item.tax_year]) {
        byYear[item.tax_year] = { year: item.tax_year, total: 0 };
      }
      if (programs.includes(item.program_name)) {
        byYear[item.tax_year][item.program_name] =
          (byYear[item.tax_year][item.program_name] ?? 0) + item.utilized;
      }
    });
    return Object.values(byYear).sort((a, b) => (a.year as number) - (b.year as number));
  }, [totalsByYear, trendByProgram, programs]);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            {programs.map((program, index) => (
              <linearGradient key={program} id={`color-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={`hsl(${210 + index * 20}, 90%, 50%)`} stopOpacity={0.8} />
                <stop offset="95%" stopColor={`hsl(${210 + index * 20}, 90%, 50%)`} stopOpacity={0.1} />
              </linearGradient>
            ))}
            <linearGradient id="color-total" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" tickFormatter={(value) => `${value}`} />
          <YAxis tickFormatter={(value) => `$${Number(value) / 1_000_000}M`} width={80} />
          <Tooltip
            cursor={{ stroke: "hsl(210, 40%, 80%)" }}
            formatter={(value: number, name) => [formatCurrency(value), name === "total" ? "Total Utilized" : name]}
            labelFormatter={(label: number) => {
              const rate = utilizationRateByYear[label];
              const rateText = rate != null ? `Utilization rate ${formatPercent(rate)}` : "Utilization rate n/a";
              return `${label} • ${rateText}`;
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="total"
            name="Total Utilized"
            stroke="hsl(221, 83%, 53%)"
            fill="url(#color-total)"
            strokeWidth={2}
          />
          {programs.map((program, index) => (
            <Area
              key={program}
              type="monotone"
              dataKey={program}
              stackId="program"
              stroke={`hsl(${210 + index * 20}, 83%, 55%)`}
              fill={`url(#color-${index})`}
              strokeWidth={1.5}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
