export type FilterState = {
  year_from: number;
  year_to: number;
  program: string[];
  taxpayer_type: string | null;
  limit: number;
  offset: number;
  sort: string;
};

const DEFAULT_STATE: FilterState = {
  year_from: 2013,
  year_to: new Date().getFullYear() - 1,
  program: [],
  taxpayer_type: null,
  limit: 25,
  offset: 0,
  sort: "tax_year asc",
};

export const parseFilters = (params: URLSearchParams): FilterState => {
  const yearFrom = Number(params.get("year_from")) || DEFAULT_STATE.year_from;
  const yearTo = Number(params.get("year_to")) || DEFAULT_STATE.year_to;
  const program = params.getAll("program");
  const taxpayerType = params.get("taxpayer_type");
  const limit = Number(params.get("limit")) || DEFAULT_STATE.limit;
  const offset = Number(params.get("offset")) || DEFAULT_STATE.offset;
  const sort = params.get("sort") || DEFAULT_STATE.sort;

  return {
    year_from: yearFrom,
    year_to: yearTo,
    program,
    taxpayer_type: taxpayerType ?? null,
    limit,
    offset,
    sort,
  };
};

export const stringifyFilters = (filters: FilterState) => {
  const params = new URLSearchParams();
  params.set("year_from", String(filters.year_from));
  params.set("year_to", String(filters.year_to));
  filters.program.forEach((program) => params.append("program", program));
  if (filters.taxpayer_type) {
    params.set("taxpayer_type", filters.taxpayer_type);
  }
  params.set("limit", String(filters.limit));
  params.set("offset", String(filters.offset));
  params.set("sort", filters.sort);
  return params;
};

export const defaultFilters = DEFAULT_STATE;
