import { json } from '@sveltejs/kit';
import { commodities } from '#lib/data/market.ts';
import { toNumber, yahooFinance } from '#lib/server/yahoo.ts';
import type { CommoditySnapshot } from '#lib/data/types.ts';

export const prerender = false;

const TROY_OUNCE_GRAMS = 31.1034768;
const POUND_KG = 0.45359237;

export async function GET() {
  try {
    const symbols = [...commodities.map((item) => item.yahooSymbol), 'USDINR=X'];
    const quotes = await yahooFinance.quote(symbols, {
      fields: ['symbol', 'regularMarketPrice', 'regularMarketPreviousClose', 'regularMarketChangePercent', 'currency']
    });
    const bySymbol = Object.fromEntries(quotes.map((quote) => [quote.symbol, quote]));
    const usdInr = toNumber((bySymbol['USDINR=X'] as Record<string, unknown> | undefined)?.regularMarketPrice) ?? 0;

    const output: CommoditySnapshot[] = commodities.map((commodity) => {
      const quote = bySymbol[commodity.yahooSymbol] as Record<string, unknown> | undefined;
      const raw = toNumber(quote?.regularMarketPrice);
      const change = toNumber(quote?.regularMarketChangePercent);
      let price: number | null = null;
      if (raw != null && usdInr > 0) {
        switch (commodity.conversion) {
          case 'gold-10g': price = raw * usdInr * 10 / TROY_OUNCE_GRAMS; break;
          case 'silver-kg': price = raw * usdInr * 1000 / TROY_OUNCE_GRAMS; break;
          case 'usd-lb-to-inr-kg': price = raw * usdInr / POUND_KG; break;
          case 'usd-mt-to-inr-kg': price = raw * usdInr / 1000; break;
          default: price = raw * usdInr;
        }
      }
      return {
        symbol: commodity.symbol,
        yahooSymbol: commodity.yahooSymbol,
        name: commodity.name,
        price,
        change,
        unit: commodity.unit,
        category: commodity.category,
        currency: 'INR'
      };
    });

    return json({ updatedAt: new Date().toISOString(), commodities: output, usdInr });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unable to load live commodity data' }, { status: 502 });
  }
}
