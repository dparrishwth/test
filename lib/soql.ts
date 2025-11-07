export type SortDirection = "asc" | "desc";

const ALLOWED_FIELDS = new Set([
  "tax_year",
  "program_name",
  "allowed_amount",
  "utilized_amount",
  "claimed_amount",
  "taxpayer_type",
]);

export const sanitizeField = (field: string) => {
  if (ALLOWED_FIELDS.has(field)) return field;
  return "tax_year";
};

export const sanitizeSort = (sort: string | null | undefined) => {
  if (!sort) return "tax_year asc";
  const [field, dir] = sort.split(/\s+/);
  const cleanField = sanitizeField(field);
  const direction: SortDirection = dir === "desc" ? "desc" : "asc";
  return `${cleanField} ${direction}`;
};

export const buildBetween = (field: string, from?: number, to?: number) => {
  const cleanField = sanitizeField(field);
  if (from == null || to == null) return "";
  return `${cleanField} between ${from} and ${to}`;
};

export const buildIn = (field: string, values?: string[]) => {
  const cleanField = sanitizeField(field);
  if (!values || values.length === 0) return "";
  const escaped = values
    .filter(Boolean)
    .map((value) => `'${value.replace(/'/g, "''")}'`)
    .join(", ");
  if (!escaped) return "";
  return `${cleanField} in (${escaped})`;
};

export const combineWheres = (parts: string[]) => {
  const filtered = parts.filter(Boolean);
  if (!filtered.length) return "";
  return filtered.join(" AND ");
};

export const withLimitOffset = (baseUrl: URL, limit?: number, offset?: number) => {
  if (limit && limit > 0) baseUrl.searchParams.set("$limit", String(Math.min(limit, 5000)));
  if (offset && offset > 0) baseUrl.searchParams.set("$offset", String(offset));
  return baseUrl;
};

export const selectColumns = [
  "tax_year",
  "program_name",
  "allowed_amount",
  "utilized_amount",
  "claimed_amount",
  "taxpayer_type",
];

export const buildBaseUrl = () => {
  return new URL("https://data.ny.gov/resource/4skq-w2i6.json");
};
