import { json } from '@sveltejs/kit';
import { chartPoints, toNumber, yahooFinance } from '#lib/server/yahoo.ts';

export const prerender = false;

export async function GET({ params, url }) {
  const symbol = decodeURIComponent(params.symbol);
  const range = url.searchParams.get('range') ?? '6mo';
  const months = range === '1y' ? 12 : range === '1mo' ? 1 : 6;
  const from = new Date();
  from.setMonth(from.getMonth() - months);

  try {
    const [quote, chart] = await Promise.all([
      yahooFinance.quote(symbol),
      yahooFinance.chart(symbol, { period1: from, interval: '1d' })
    ]);
    const q = quote as Record<string, unknown>;
    return json({
      symbol,
      price: toNumber(q.regularMarketPrice),
      previousClose: toNumber(q.regularMarketPreviousClose),
      marketCap: toNumber(q.marketCap),
      currency: String(q.currency ?? 'INR'),
      exchange: String(q.fullExchangeName ?? q.exchange ?? ''),
      volume: toNumber(q.regularMarketVolume),
      dayHigh: toNumber(q.regularMarketDayHigh),
      dayLow: toNumber(q.regularMarketDayLow),
      fiftyTwoWeekHigh: toNumber(q.fiftyTwoWeekHigh),
      fiftyTwoWeekLow: toNumber(q.fiftyTwoWeekLow),
      changePercent: toNumber(q.regularMarketChangePercent),
      points: chartPoints(chart)
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unable to fetch market data' }, { status: 502 });
  }
}
