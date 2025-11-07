export type CreditRow = {
  tax_year: number;
  program_name: string;
  allowed_amount: number;
  utilized_amount: number;
  claimed_amount: number;
  taxpayer_type: string;
};

export type CreditsTotals = {
  allowed: number;
  utilized: number;
  claimed: number;
  utilization_rate: number | null;
};

export type FacetBucket<T extends string | number> = {
  value: T;
  count?: number;
  utilized: number;
  allowed?: number;
};

export type TrendByProgram = {
  tax_year: number;
  program_name: string;
  utilized: number;
};

export type CreditsResponse = {
  rows: CreditRow[];
  totals: CreditsTotals;
  facets: {
    program_name: FacetBucket<string>[];
    taxpayer_type: FacetBucket<string>[];
    tax_year: FacetBucket<number>[];
  };
  meta: {
    authenticated: boolean;
    limit: number;
    offset: number;
    sort: string;
    trend_by_program: TrendByProgram[];
  };
};
