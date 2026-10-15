export type AssetClass = 'equity' | 'debt' | 'commodity';

export interface Company {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
}

export interface PricePoint {
  date: string;
  value: number;
}

export interface CompanySnapshot extends Company {
  currency: string;
  exchange: string;
  marketState: string;
  price: number | null;
  previousClose: number | null;
  change1d: number | null;
  marketCapCr: number | null;
  pe: number | null;
  forwardPe: number | null;
  pb: number | null;
  evEbitda: number | null;
  roe: number | null;
  roa: number | null;
  revenueCr: number | null;
  ebitdaCr: number | null;
  profitCr: number | null;
  debtCr: number | null;
  cashCr: number | null;
  sharesCr: number | null;
  growth: number | null;
  dividendYield: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  volume: number | null;
  beta: number | null;
  profitMargin: number | null;
  description?: string | null;
  fiftyTwoWeekChange: number | null;
  points: PricePoint[];
  financialHistory?: FinancialYear[];
}

export interface FinancialYear {
  date: string;
  revenueCr: number | null;
  profitCr: number | null;
  ebitdaCr: number | null;
  profitMargin: number | null;
}

export interface SectorSnapshot {
  name: string;
  key: string;
  members: number;
  change1d: number | null;
  change1m: number | null;
  change1y: number | null;
  pe: number | null;
  roe: number | null;
  breadth: number | null;
}

export interface EconomyObservation {
  value: number | null;
  year?: string | null;
  source: string;
}

export interface EconomySnapshot {
  gdpGrowth: EconomyObservation;
  inflation: EconomyObservation;
  unemployment: EconomyObservation;
  repo: EconomyObservation;
  usdInr: EconomyObservation & { change1d: number | null };
  tenYear: EconomyObservation & { change1d: number | null };
  nifty: EconomyObservation & { change1d: number | null };
  sensex: EconomyObservation & { change1d: number | null };
  niftySeries: PricePoint[];
  fxSeries: PricePoint[];
  updatedAt: string;
  rbiUpdatedAt: string | null;
}

export interface CommoditySnapshot {
  symbol: string;
  yahooSymbol: string;
  name: string;
  price: number | null;
  change: number | null;
  unit: string;
  category: string;
  currency: string;
}

export interface DebtSnapshot {
  name: string;
  symbol: string;
  yield: number | null;
  change: number | null;
  duration: number | null;
  credit: string;
  source: string;
}

export interface Allocation {
  id: string;
  assetClass: AssetClass;
  symbol: string;
  name: string;
  weight: number;
}

export interface AllocationSnapshot {
  id: string;
  timestamp: string;
  reason: string;
  allocations: Allocation[];
}
