import { json } from '@sveltejs/kit';
import { companies } from '#lib/data/market.ts';
import { chartPoints, crore, safeQuoteSummary, toNumber, yahooFinance } from '#lib/server/yahoo.ts';
import type { Company, CompanySnapshot, FinancialYear } from '#lib/data/types.ts';

export const prerender = false;

const asRecord = (value: unknown) => (value && typeof value === 'object' ? value as Record<string, unknown> : {});

function makeSnapshot(meta: Company, quote: unknown, summary: unknown, points: ReturnType<typeof chartPoints>, financialHistory: FinancialYear[] = []): CompanySnapshot {
  const q = asRecord(quote);
  const s = asRecord(summary);
  const detail = asRecord(s.summaryDetail);
  const stats = asRecord(s.defaultKeyStatistics);
  const financial = asRecord(s.financialData);
  const profile = asRecord(s.summaryProfile);

  const marketCap = toNumber(q.marketCap);
  const price = toNumber(q.regularMarketPrice);
  const previousClose = toNumber(q.regularMarketPreviousClose);

  return {
    ...meta,
    currency: String(q.currency ?? 'INR'),
    exchange: String(q.fullExchangeName ?? q.exchange ?? ''),
    marketState: String(q.marketState ?? ''),
    price,
    previousClose,
    change1d: toNumber(q.regularMarketChangePercent) ?? (price != null && previousClose ? (price / previousClose - 1) * 100 : null),
    marketCapCr: crore(marketCap),
    pe: toNumber(detail.trailingPE) ?? toNumber(q.trailingPE),
    forwardPe: toNumber(detail.forwardPE) ?? toNumber(q.forwardPE),
    pb: toNumber(stats.priceToBook) ?? toNumber(q.priceToBook),
    evEbitda: toNumber(stats.enterpriseToEbitda) ?? toNumber(q.enterpriseToEbitda),
    roe: toNumber(financial.returnOnEquity),
    roa: toNumber(financial.returnOnAssets),
    revenueCr: crore(financial.totalRevenue),
    ebitdaCr: crore(financial.ebitda),
    profitCr: crore(financial.netIncomeToCommon) ?? crore(stats.netIncomeToCommon),
    debtCr: crore(financial.totalDebt),
    cashCr: crore(financial.totalCash),
    sharesCr: crore(stats.sharesOutstanding),
    growth: toNumber(financial.revenueGrowth),
    dividendYield: toNumber(detail.dividendYield),
    dayHigh: toNumber(q.regularMarketDayHigh),
    dayLow: toNumber(q.regularMarketDayLow),
    fiftyTwoWeekHigh: toNumber(q.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: toNumber(q.fiftyTwoWeekLow),
    volume: toNumber(q.regularMarketVolume),
    beta: toNumber(stats.beta),
    profitMargin: toNumber(financial.profitMargins),
    fiftyTwoWeekChange: (() => { const value = toNumber(q.fiftyTwoWeekChange); return value == null ? null : value * 100; })(),
    description: String(profile.longBusinessSummary ?? profile.description ?? '') || null,
    points,
    financialHistory
  };
}

async function loadCompany(meta: Company) {
  const [quote, summary, chart] = await Promise.all([
    yahooFinance.quote(meta.ticker),
    safeQuoteSummary(meta.ticker),
    yahooFinance.chart(meta.ticker, {
      period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      interval: '1d'
    })
  ]);

  let financialHistory: FinancialYear[] = [];
  try {
    const history = await yahooFinance.fundamentalsTimeSeries(meta.ticker, {
      period1: new Date(Date.now() - 6 * 365 * 24 * 60 * 60 * 1000),
      type: 'annual',
      module: 'financials'
    });
    financialHistory = history.map((row) => {
      const item = row as Record<string, unknown>;
      return {
        date: new Date(String(item.date)).toISOString(),
        revenueCr: crore(item.totalRevenue),
        profitCr: crore(item.netIncomeCommonStockholders ?? item.netIncome),
        ebitdaCr: crore(item.EBITDA),
        profitMargin: toNumber(item.normalizedIncome) && toNumber(item.totalRevenue) ? (Number(item.normalizedIncome) / Number(item.totalRevenue)) : null
      };
    });
  } catch {
    financialHistory = [];
  }

  return makeSnapshot(meta, quote, summary, chartPoints(chart), financialHistory);
}

export async function GET({ params }) {
  const symbol = decodeURIComponent(params.symbol);
  const meta = companies.find((company) => company.ticker === symbol);
  if (!meta) return json({ error: `Unknown company: ${symbol}` }, { status: 404 });

  try {
    const company = await loadCompany(meta);
    const peersMeta = companies.filter((item) => item.sector === meta.sector && item.ticker !== meta.ticker);
    const peers = await Promise.all(peersMeta.map(loadCompany));
    return json({ updatedAt: new Date().toISOString(), company, peers });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unable to load company data' }, { status: 502 });
  }
}
