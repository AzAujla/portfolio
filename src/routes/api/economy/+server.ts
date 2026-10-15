import { json } from '@sveltejs/kit';
import { chartPoints, toNumber, yahooFinance } from '#lib/server/yahoo.ts';
import type { EconomySnapshot } from '#lib/data/types.ts';

export const prerender = false;

async function worldBank(indicator: string) {
  const response = await fetch(`https://api.worldbank.org/v2/country/IND/indicator/${indicator}?format=json&per_page=20`);
  if (!response.ok) throw new Error(`World Bank request failed for ${indicator}`);
  const payload = await response.json() as [unknown, Array<{ value: number | null; date: string }>];
  const row = (payload[1] ?? []).find((item) => item.value != null);
  return { value: row?.value ?? null, year: row?.date ?? null };
}

async function rbiCurrentRates() {
  const response = await fetch('https://m.rbi.org.in/home.aspx', { headers: { 'user-agent': 'investment-dashboard/1.0' } });
  if (!response.ok) throw new Error('RBI request failed');
  const html = await response.text();
  const text = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  const repo = text.match(/Policy\s+Repo\s+Rate\s*\|?\s*:?\s*([0-9.]+)%/i);
  const gs10 = text.match(/6\.94%\s+GS\s+2036\s*\|?\s*:?\s*([0-9.]+)%/i);
  const updated = text.match(/As at\s+([0-9:.apm\- ]+)/i);
  return {
    repo: repo ? Number(repo[1]) : null,
    gs10: gs10 ? Number(gs10[1]) : null,
    updatedAt: updated?.[1]?.trim() ?? null
  };
}

export async function GET() {
  try {
    const [quotes, niftyChart, fxChart, gdp, inflation, unemployment, rbi] = await Promise.all([
      yahooFinance.quote(['^NSEI', '^BSESN', 'USDINR=X', '^TNX'], {
        fields: ['symbol', 'regularMarketPrice', 'regularMarketPreviousClose', 'regularMarketChangePercent', 'currency']
      }),
      yahooFinance.chart('^NSEI', { period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), interval: '1d' }),
      yahooFinance.chart('USDINR=X', { period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), interval: '1d' }),
      worldBank('NY.GDP.MKTP.KD.ZG'),
      worldBank('FP.CPI.TOTL.ZG'),
      worldBank('SL.UEM.TOTL.ZS'),
      rbiCurrentRates()
    ]);

    const bySymbol = Object.fromEntries(quotes.map((quote) => [quote.symbol, quote]));
    const observation = (symbol: string) => {
      const quote = bySymbol[symbol] as Record<string, unknown> | undefined;
      return {
        value: toNumber(quote?.regularMarketPrice),
        change1d: toNumber(quote?.regularMarketChangePercent),
        source: 'Yahoo Finance'
      };
    };

    const result: EconomySnapshot = {
      gdpGrowth: { value: gdp.value, year: gdp.year, source: 'World Bank' },
      inflation: { value: inflation.value, year: inflation.year, source: 'World Bank' },
      unemployment: { value: unemployment.value, year: unemployment.year, source: 'World Bank' },
      repo: { value: rbi.repo, year: rbi.updatedAt, source: 'Reserve Bank of India' },
      usdInr: observation('USDINR=X'),
      tenYear: observation('^TNX'),
      nifty: observation('^NSEI'),
      sensex: observation('^BSESN'),
      niftySeries: chartPoints(niftyChart),
      fxSeries: chartPoints(fxChart),
      updatedAt: new Date().toISOString(),
      rbiUpdatedAt: rbi.updatedAt
    };

    return json(result);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unable to load live economy data' }, { status: 502 });
  }
}
