import { json } from '@sveltejs/kit';
import { debt } from '#lib/data/market.ts';
import { toNumber, yahooFinance } from '#lib/server/yahoo.ts';
import type { DebtSnapshot } from '#lib/data/types.ts';

export const prerender = false;

async function rbiRates() {
  const response = await fetch('https://m.rbi.org.in/home.aspx', { headers: { 'user-agent': 'investment-dashboard/1.0' } });
  if (!response.ok) throw new Error('RBI request failed');
  const html = await response.text();
  const text = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  const find = (coupon: string, year: string) => {
    const match = text.match(new RegExp(`${coupon.replace('.', '\\.')}%\\s+GS\\s+${year}\\s*\\|?\\s*:?\\s*([0-9.]+)%`, 'i'));
    return match ? Number(match[1]) : null;
  };
  return {
    two: find('6.03', '2029'),
    five: find('6.36', '2031'),
    ten: find('6.94', '2036')
  };
}

export async function GET() {
  try {
    const [rbi, quote] = await Promise.all([
      rbiRates(),
      yahooFinance.quote('^TNX', { fields: ['regularMarketPrice', 'regularMarketPreviousClose', 'regularMarketChangePercent'] })
    ]);
    const us10 = quote as Record<string, unknown>;
    const output: DebtSnapshot[] = [
      { ...debt[0], yield: rbi.two, change: null, source: 'Reserve Bank of India' },
      { ...debt[1], yield: rbi.five, change: null, source: 'Reserve Bank of India' },
      { ...debt[2], yield: rbi.ten, change: null, source: 'Reserve Bank of India' },
      {
        ...debt[3],
        yield: toNumber(us10.regularMarketPrice),
        change: toNumber(us10.regularMarketChangePercent),
        source: 'Yahoo Finance'
      }
    ];
    return json({ updatedAt: new Date().toISOString(), debt: output });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unable to load live debt data' }, { status: 502 });
  }
}
