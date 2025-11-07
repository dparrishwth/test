import { NextRequest, NextResponse } from "next/server";
import {
  buildBaseUrl,
  buildBetween,
  buildIn,
  combineWheres,
  sanitizeSort,
  selectColumns,
  withLimitOffset,
} from "@/lib/soql";

export const runtime = "edge";
export const revalidate = 600;

const MAX_YEAR = new Date().getFullYear();
const MIN_YEAR = 2000;

const fetchJSON = async <T>(url: URL): Promise<T> => {
  const headers: Record<string, string> = {};
  if (process.env.SOCRATA_APP_TOKEN) {
    headers["X-App-Token"] = process.env.SOCRATA_APP_TOKEN;
  }
  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Socrata request failed (${res.status}): ${text}`);
  }
  return (await res.json()) as T;
};

type RawRow = {
  tax_year?: string;
  program_name?: string;
  allowed_amount?: string;
  utilized_amount?: string;
  claimed_amount?: string;
  taxpayer_type?: string;
};

const normalizeNumber = (value?: string) => {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseIntSafe = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return fallback;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const yearFrom = Math.min(
      Math.max(parseIntSafe(searchParams.get("year_from"), 2013), MIN_YEAR),
      MAX_YEAR
    );
    const yearTo = Math.min(
      Math.max(parseIntSafe(searchParams.get("year_to"), yearFrom), MIN_YEAR),
      MAX_YEAR
    );
    const program = searchParams.getAll("program").slice(0, 25);
    const taxpayerType = searchParams.get("taxpayer_type");
    const limit = Math.min(Math.max(parseIntSafe(searchParams.get("limit"), 25), 1), 5000);
    const offset = Math.max(parseIntSafe(searchParams.get("offset"), 0), 0);
    const sort = sanitizeSort(searchParams.get("sort"));
    const format = searchParams.get("format");

    const whereClause = combineWheres([
      buildBetween("tax_year", yearFrom, yearTo),
      buildIn("program_name", program),
      taxpayerType ? buildIn("taxpayer_type", [taxpayerType]) : "",
    ]);

    const dataUrl = withLimitOffset(buildBaseUrl(), limit, offset);
    dataUrl.searchParams.set("$select", selectColumns.join(", "));
    dataUrl.searchParams.set("$order", sort);
    if (whereClause) {
      dataUrl.searchParams.set("$where", whereClause);
    }

    const rows = await fetchJSON<RawRow[]>(dataUrl);

    const normalizedRows = rows.map((row) => ({
      tax_year: Number(row.tax_year ?? 0),
      program_name: row.program_name ?? "Unknown",
      allowed_amount: normalizeNumber(row.allowed_amount),
      utilized_amount: normalizeNumber(row.utilized_amount),
      claimed_amount: normalizeNumber(row.claimed_amount),
      taxpayer_type: row.taxpayer_type ?? "Unspecified",
    }));

    if (format === "csv") {
      const header = [
        "tax_year",
        "program_name",
        "allowed_amount",
        "utilized_amount",
        "claimed_amount",
        "taxpayer_type",
      ];
      const csvLines = [
        header.join(","),
        ...normalizedRows.map((row) =>
          [
            row.tax_year,
            `"${row.program_name.replace(/"/g, '""')}"`,
            row.allowed_amount,
            row.utilized_amount,
            row.claimed_amount,
            `"${row.taxpayer_type.replace(/"/g, '""')}"`,
          ].join(",")
        ),
      ];
      return new NextResponse(csvLines.join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Cache-Control": "s-maxage=600, stale-while-revalidate=86400",
          "X-Authenticated": Boolean(process.env.SOCRATA_APP_TOKEN).toString(),
        },
      });
    }

    const totalsUrl = buildBaseUrl();
    totalsUrl.searchParams.set(
      "$select",
      "sum(allowed_amount) as allowed,sum(utilized_amount) as utilized,sum(claimed_amount) as claimed"
    );
    if (whereClause) totalsUrl.searchParams.set("$where", whereClause);

    const totalsData = await fetchJSON<
      { allowed?: string; utilized?: string; claimed?: string }[]
    >(totalsUrl);

    const totals = totalsData[0] ?? {};
    const allowed = normalizeNumber(totals.allowed);
    const utilized = normalizeNumber(totals.utilized);
    const claimed = normalizeNumber(totals.claimed);

    const programFacetUrl = buildBaseUrl();
    programFacetUrl.searchParams.set(
      "$select",
      "program_name,count(*) as count,sum(utilized_amount) as utilized"
    );
    programFacetUrl.searchParams.set("$group", "program_name");
    programFacetUrl.searchParams.set("$order", "utilized desc");
    programFacetUrl.searchParams.set("$limit", "50");
    if (whereClause) programFacetUrl.searchParams.set("$where", whereClause);

    const programFacets = await fetchJSON<
      { program_name?: string; count?: string; utilized?: string }[]
    >(programFacetUrl);

    const taxpayerFacetUrl = buildBaseUrl();
    taxpayerFacetUrl.searchParams.set(
      "$select",
      "taxpayer_type,count(*) as count,sum(utilized_amount) as utilized"
    );
    taxpayerFacetUrl.searchParams.set("$group", "taxpayer_type");
    if (whereClause) taxpayerFacetUrl.searchParams.set("$where", whereClause);

    const taxpayerFacets = await fetchJSON<
      { taxpayer_type?: string; count?: string; utilized?: string }[]
    >(taxpayerFacetUrl);

    const yearFacetUrl = buildBaseUrl();
    yearFacetUrl.searchParams.set(
      "$select",
      "tax_year,sum(utilized_amount) as utilized,sum(allowed_amount) as allowed"
    );
    yearFacetUrl.searchParams.set("$group", "tax_year");
    yearFacetUrl.searchParams.set("$order", "tax_year asc");
    if (whereClause) yearFacetUrl.searchParams.set("$where", whereClause);

    const yearFacets = await fetchJSON<
      { tax_year?: string; utilized?: string; allowed?: string }[]
    >(yearFacetUrl);

    const trendProgramUrl = buildBaseUrl();
    trendProgramUrl.searchParams.set(
      "$select",
      "tax_year,program_name,sum(utilized_amount) as utilized"
    );
    trendProgramUrl.searchParams.set("$group", "tax_year,program_name");
    trendProgramUrl.searchParams.set("$order", "tax_year asc");
    if (whereClause) trendProgramUrl.searchParams.set("$where", whereClause);

    const trendProgram = await fetchJSON<
      { tax_year?: string; program_name?: string; utilized?: string }[]
    >(trendProgramUrl);

    const response = NextResponse.json(
      {
        rows: normalizedRows,
        totals: {
          allowed,
          utilized,
          claimed,
          utilization_rate: allowed > 0 ? utilized / allowed : null,
        },
        facets: {
          program_name: programFacets.map((item) => ({
            value: item.program_name ?? "Unknown",
            count: Number(item.count ?? 0),
            utilized: normalizeNumber(item.utilized),
          })),
          taxpayer_type: taxpayerFacets.map((item) => ({
            value: item.taxpayer_type ?? "Unspecified",
            count: Number(item.count ?? 0),
            utilized: normalizeNumber(item.utilized),
          })),
          tax_year: yearFacets.map((item) => ({
            value: Number(item.tax_year ?? 0),
            utilized: normalizeNumber(item.utilized),
            allowed: normalizeNumber(item.allowed),
          })),
        },
        meta: {
          authenticated: Boolean(process.env.SOCRATA_APP_TOKEN),
          limit,
          offset,
          sort,
          trend_by_program: trendProgram.map((item) => ({
            tax_year: Number(item.tax_year ?? 0),
            program_name: item.program_name ?? "Unknown",
            utilized: normalizeNumber(item.utilized),
          })),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "s-maxage=600, stale-while-revalidate=86400",
          "X-Authenticated": Boolean(process.env.SOCRATA_APP_TOKEN).toString(),
        },
      }
    );
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load credits data" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
