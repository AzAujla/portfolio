import { json } from '@sveltejs/kit';
import { chartPoints, yahooFinance } from '#lib/server/yahoo.ts';

export const prerender = false;

export async function GET({ params, url }) {
  const symbol = decodeURIComponent(params.symbol);
  const months = Math.min(Math.max(Number(url.searchParams.get('months') ?? 12), 1), 60);
  const from = new Date();
  from.setMonth(from.getMonth() - months);

  try {
    const chart = await yahooFinance.chart(symbol, { period1: from, interval: '1d' });
    return json({ symbol, points: chartPoints(chart) });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unable to fetch history' }, { status: 502 });
  }
}
