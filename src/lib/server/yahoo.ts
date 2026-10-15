import YahooFinance from 'yahoo-finance2';

export const yahooFinance = new YahooFinance({
  queue: {
    concurrency: 4,
    interval: 100
  }
});

export const toNumber = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const crore = (value: unknown): number | null => {
  const n = toNumber(value);
  return n == null ? null : n / 10_000_000;
};

export const safeDiv = (a: number | null, b: number | null): number | null => {
  if (a == null || b == null || b === 0) return null;
  return a / b;
};

export function chartPoints(chart: { quotes?: Array<{ date?: Date | string | number; close?: number | null }> }) {
  return (chart.quotes ?? [])
    .map((point) => ({
      date: (() => { const raw = point.date ?? Date.now(); const value = typeof raw === 'number' && raw < 1_000_000_000_000 ? raw * 1000 : raw; return new Date(value).toISOString(); })(),
      value: toNumber(point.close)
    }))
    .filter((point): point is { date: string; value: number } => point.value != null && point.value > 0);
}

export function percentChange(points: Array<{ value: number }>, lookback: number) {
  if (points.length < 2) return null;
  const current = points.at(-1)?.value;
  const base = points[Math.max(0, points.length - 1 - lookback)]?.value;
  if (current == null || base == null || base === 0) return null;
  return (current / base - 1) * 100;
}

export async function safeQuoteSummary(symbol: string) {
  try {
    return await yahooFinance.quoteSummary(symbol, {
      modules: ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData', 'summaryProfile', 'quoteType']
    });
  } catch {
    return null;
  }
}
