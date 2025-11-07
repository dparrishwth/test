"use client";

import { useMemo, useState } from "react";
import { CreditRow } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent } from "@/lib/format";

interface DataTableProps {
  rows: CreditRow[];
  sort: string;
  onSortChange: (sort: string) => void;
  onExport: () => Promise<void>;
  loading?: boolean;
}

const PAGE_SIZE = 10;

export function DataTable({ rows, sort, onSortChange, onExport, loading }: DataTableProps) {
  const [page, setPage] = useState(0);

  const sortedRows = useMemo(() => rows, [rows]);

  const pageRows = sortedRows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));

  const toggleSort = (field: string) => () => {
    const [currentField, direction] = sort.split(" ");
    if (currentField === field) {
      onSortChange(`${field} ${direction === "asc" ? "desc" : "asc"}`);
    } else {
      onSortChange(`${field} asc`);
    }
    setPage(0);
  };

  const [sortField, sortDirection] = sort.split(" ");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Detailed Records</h2>
        <Button onClick={onExport} disabled={loading} variant="outline">
          Export CSV
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                role="button"
                tabIndex={0}
                onClick={toggleSort("tax_year")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleSort("tax_year")();
                  }
                }}
                aria-sort={sortField === "tax_year" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
              >
                Year
              </TableHead>
              <TableHead
                role="button"
                tabIndex={0}
                onClick={toggleSort("program_name")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleSort("program_name")();
                  }
                }}
                aria-sort={sortField === "program_name" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
              >
                Program
              </TableHead>
              <TableHead
                role="button"
                tabIndex={0}
                onClick={toggleSort("allowed_amount")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleSort("allowed_amount")();
                  }
                }}
                aria-sort={sortField === "allowed_amount" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
              >
                Allowed
              </TableHead>
              <TableHead
                role="button"
                tabIndex={0}
                onClick={toggleSort("utilized_amount")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleSort("utilized_amount")();
                  }
                }}
                aria-sort={sortField === "utilized_amount" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
              >
                Utilized
              </TableHead>
              <TableHead>Utilization Rate</TableHead>
              <TableHead
                role="button"
                tabIndex={0}
                onClick={toggleSort("claimed_amount")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleSort("claimed_amount")();
                  }
                }}
                aria-sort={sortField === "claimed_amount" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
              >
                Claimed
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => {
              const rate = row.allowed_amount > 0 ? row.utilized_amount / row.allowed_amount : null;
              return (
                <TableRow key={`${row.tax_year}-${row.program_name}-${row.taxpayer_type}`}>
                  <TableCell>{row.tax_year}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{row.program_name}</span>
                      <span className="text-xs text-muted-foreground">{row.taxpayer_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(row.allowed_amount)}</TableCell>
                  <TableCell>{formatCurrency(row.utilized_amount)}</TableCell>
                  <TableCell>{formatPercent(rate)}</TableCell>
                  <TableCell>{formatCurrency(row.claimed_amount)}</TableCell>
                </TableRow>
              );
            })}
            {!pageRows.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  No records for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-2 text-sm">
        <span>
          Page {page + 1} of {pageCount}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.min(prev + 1, pageCount - 1))}
            disabled={page >= pageCount - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
