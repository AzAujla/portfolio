import type { CompanySnapshot } from './data/types.ts';

export interface DcfResult {
  fairValue: number;
  terminalValue: number;
  presentValue: number;
  forecast: { year: number; profit: number }[];
}

export function projectProfit(profit: number, reinvestmentRate: number, roe: number, years = 5) {
  const forecast: { year: number; profit: number }[] = [];
  let current = profit;
  for (let year = 1; year <= years; year += 1) {
    // User-specified model: incremental growth = profit × reinvestment rate × ROE.
    current = current + current * reinvestmentRate * roe;
    forecast.push({ year, profit: current });
  }
  return forecast;
}

export function simpleDcf(
  company: Pick<CompanySnapshot, 'profitCr' | 'roe' | 'debtCr' | 'cashCr' | 'sharesCr'>,
  reinvestmentRate = 0.35,
  costOfEquity = 0.115,
  terminalGrowth = 0.045
): DcfResult | null {
  const { profitCr, roe, debtCr, cashCr, sharesCr } = company;
  if ([profitCr, roe, debtCr, cashCr, sharesCr].some((value) => value == null) || sharesCr === 0 || costOfEquity <= terminalGrowth) return null;

  const forecast = projectProfit(profitCr, reinvestmentRate, roe);
  const presentValue = forecast.reduce((sum, point) => sum + point.profit / (1 + costOfEquity) ** point.year, 0);
  const lastProfit = forecast.at(-1)?.profit ?? profitCr;
  const terminalValue = (lastProfit * (1 + terminalGrowth)) / (costOfEquity - terminalGrowth);
  const enterprise = presentValue + terminalValue / (1 + costOfEquity) ** 5;
  const fairValue = (enterprise - debtCr + cashCr) / sharesCr;
  return { fairValue, terminalValue, presentValue, forecast };
}

export function peerValuation(company: CompanySnapshot, peers: CompanySnapshot[]) {
  const median = (values: number[]) => {
    if (!values.length) return null;
    const a = [...values].sort((x, y) => x - y);
    const mid = Math.floor(a.length / 2);
    return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
  };

  const pe = median(peers.map((x) => x.pe).filter((x): x is number => x != null && x > 0));
  const pb = median(peers.map((x) => x.pb).filter((x): x is number => x != null && x > 0));
  const ev = median(peers.map((x) => x.evEbitda).filter((x): x is number => x != null && x > 0));

  return {
    peMultiple: pe,
    pbMultiple: pb,
    evEbitdaMultiple: ev,
    peValue: pe != null && company.profitCr != null && company.sharesCr ? pe * (company.profitCr / company.sharesCr) : null,
    pbValue: pb != null && company.sharesCr && company.marketCapCr != null ? pb * (company.marketCapCr / company.sharesCr) : null,
    evValue: ev != null && company.ebitdaCr != null && company.sharesCr && company.debtCr != null && company.cashCr != null
      ? ev * (company.ebitdaCr / company.sharesCr) - (company.debtCr - company.cashCr) / company.sharesCr
      : null
  };
}
