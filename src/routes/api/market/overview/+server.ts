import { json } from '@sveltejs/kit';
import { companies, sectors } from '#lib/data/market.ts';
import { chartPoints, percentChange, toNumber, yahooFinance } from '#lib/server/yahoo.ts';
import type { CompanySnapshot, SectorSnapshot } from '#lib/data/types.ts';

export const prerender = false;

function metadata(ticker: string) {
  const company = companies.find((company) => company.ticker === ticker);

  if (!company) {
    throw new Error(`Unknown company: ${ticker}`);
  }

  return company;
}

function median(values: number[]): number | null {
  if (!values.length) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export async function GET() {
  try {
    const symbols = companies.map((company) => company.ticker);

    /*
     * quote() is used only for live market/price data.
     *
     * Do NOT pass enterpriseToEbitda or fiftyTwoWeekChange here.
     * Those are not valid quote fields in the current yahoo-finance2 schema.
     */
    const quotes = await yahooFinance.quote(symbols);

    /*
     * EV/EBITDA, ROE and ROA come from quoteSummary.
     *
     * Request only the modules we actually need.
     */
    const fundamentals = await Promise.all(
      symbols.map(async (ticker) => {
        try {
          return {
            ticker,
            data: await yahooFinance.quoteSummary(ticker, {
              modules: ['defaultKeyStatistics', 'financialData']
            })
          };
        } catch (error) {
          console.warn(`Failed to load fundamentals for ${ticker}:`, error);

          return {
            ticker,
            data: null
          };
        }
      })
    );

    const fundamentalsByTicker = new Map(
      fundamentals.map(({ ticker, data }) => [ticker, data])
    );

    const snapshots = await Promise.all(
      symbols.map(async (ticker) => {
        const quote = quotes.find((item) => item.symbol === ticker);
        const summary = fundamentalsByTicker.get(ticker);
        const meta = metadata(ticker);

        let points = [];

        try {
          const chart = await yahooFinance.chart(ticker, {
            period1: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
            interval: '1d'
          });

          points = chartPoints(chart);
        } catch (error) {
          console.warn(`Failed to load chart for ${ticker}:`, error);
        }

        const price = toNumber(quote?.regularMarketPrice);
        const previousClose = toNumber(quote?.regularMarketPreviousClose);

        const marketCap = toNumber(quote?.marketCap);

        /*
         * yahoo-finance2 returns this as a decimal:
         *
         * 0.1234 = +12.34%
         *
         * Your UI expects percentage points, so multiply by 100.
         */
        const fiftyTwoWeekChangePercent = toNumber(
          quote?.fiftyTwoWeekChangePercent
        );

        const evEbitda = toNumber(
          summary?.defaultKeyStatistics?.enterpriseToEbitda
        );

        const roe = toNumber(
          summary?.financialData?.returnOnEquity
        );

        const roa = toNumber(
          summary?.financialData?.returnOnAssets
        );

        const snapshot: CompanySnapshot = {
          ...meta,

          currency: String(quote?.currency ?? 'INR'),

          exchange: String(
            quote?.fullExchangeName ??
              quote?.exchange ??
              ''
          ),

          marketState: String(
            quote?.marketState ??
              ''
          ),

          price,
          previousClose,

          change1d: toNumber(
            quote?.regularMarketChangePercent
          ),

          marketCapCr:
            marketCap == null
              ? null
              : marketCap / 10_000_000,

          pe: toNumber(
            quote?.trailingPE
          ),

          forwardPe: toNumber(
            quote?.forwardPE
          ),

          pb: toNumber(
            quote?.priceToBook
          ),

          evEbitda,

          roe,
          roa,

          /*
           * These remain null here because they are not supplied
           * by the quote endpoint. You can populate them from
           * fundamentalsTimeSeries in the company endpoint.
           */
          revenueCr: null,
          ebitdaCr: null,
          profitCr: null,
          debtCr: null,
          cashCr: null,
          sharesCr: null,
          growth: null,
          dividendYield: null,

          dayHigh: toNumber(
            quote?.regularMarketDayHigh
          ),

          dayLow: toNumber(
            quote?.regularMarketDayLow
          ),

          fiftyTwoWeekHigh: toNumber(
            quote?.fiftyTwoWeekHigh
          ),

          fiftyTwoWeekLow: toNumber(
            quote?.fiftyTwoWeekLow
          ),

          volume: toNumber(
            quote?.regularMarketVolume
          ),

          beta: toNumber(
            summary?.defaultKeyStatistics?.beta
          ),

          profitMargin: toNumber(
            summary?.financialData?.profitMargins
          ),

          fiftyTwoWeekChange:
            fiftyTwoWeekChangePercent == null
              ? null
              : fiftyTwoWeekChangePercent * 100,

          points
        };

        return snapshot;
      })
    );

    const valid = snapshots.filter(
      (snapshot) => snapshot.price != null
    );

    const sectorSnapshots: SectorSnapshot[] = sectors.map(
      (sector) => {
        const members = valid.filter(
          (company) => company.sector === sector.name
        );

        const peValues = members
          .map((company) => company.pe)
          .filter(
            (value): value is number =>
              value != null && value > 0
          );

        const roeValues = members
          .map((company) => company.roe)
          .filter(
            (value): value is number =>
              value != null
          );

        const change1dValues = members
          .map((company) => company.change1d)
          .filter(
            (value): value is number =>
              value != null
          );

        const change1mValues = members
          .map((company) =>
            percentChange(company.points, 20)
          )
          .filter(
            (value): value is number =>
              value != null
          );

        const change1yValues = members
          .map((company) => company.fiftyTwoWeekChange)
          .filter(
            (value): value is number =>
              value != null
          );

        return {
          ...sector,

          members: members.length,

          change1d:
            change1dValues.length > 0
              ? change1dValues.reduce(
                  (sum, value) => sum + value,
                  0
                ) / change1dValues.length
              : null,

          change1m:
            change1mValues.length > 0
              ? change1mValues.reduce(
                  (sum, value) => sum + value,
                  0
                ) / change1mValues.length
              : null,

          change1y:
            change1yValues.length > 0
              ? change1yValues.reduce(
                  (sum, value) => sum + value,
                  0
                ) / change1yValues.length
              : null,

          pe: median(peValues),

          roe:
            roeValues.length > 0
              ? roeValues.reduce(
                  (sum, value) => sum + value,
                  0
                ) / roeValues.length
              : null,

          breadth:
            members.length > 0
              ? members.filter(
                  (company) =>
                    (company.change1d ?? 0) > 0
                ).length / members.length
              : null
        };
      }
    );

    return json({
      updatedAt: new Date().toISOString(),
      companies: snapshots,
      sectors: sectorSnapshots
    });
  } catch (error) {
    console.error('Market overview failed:', error);

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load live market data'
      },
      {
        status: 502
      }
    );
  }
}
