"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FacetBucket } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface BarByProgramProps {
  data: FacetBucket<string>[];
  activePrograms: string[];
  onToggleProgram: (program: string) => void;
}

export function BarByProgram({ data, activePrograms, onToggleProgram }: BarByProgramProps) {
  const chartData = data
    .slice(0, 15)
    .map((item) => ({
      program: item.value,
      utilized: item.utilized,
      active: activePrograms.includes(item.value),
    }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 24, left: 80, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(value) => `$${Number(value) / 1_000_000}M`} />
          <YAxis type="category" dataKey="program" width={200} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Bar
            dataKey="utilized"
            name="Utilized"
            fill="hsl(221, 83%, 53%)"
            onClick={(dataPoint) => onToggleProgram(dataPoint.program as string)}
            className="cursor-pointer"
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.program}
                fill={entry.active ? "hsl(221, 83%, 53%)" : "hsl(215, 16%, 60%)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
