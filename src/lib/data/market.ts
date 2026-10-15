import type { Company } from './types.ts';

// Static configuration only. No market prices, ratios, financials or macro observations live here.
export const companies: Company[] = [
  { ticker: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Energy', industry: 'Integrated Energy' },
  { ticker: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Financials', industry: 'Banks' },
  { ticker: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'Technology', industry: 'IT Services' },
  { ticker: 'INFY.NS', name: 'Infosys', sector: 'Technology', industry: 'IT Services' },
  { ticker: 'ICICIBANK.NS', name: 'ICICI Bank', sector: 'Financials', industry: 'Banks' },
  { ticker: 'ITC.NS', name: 'ITC', sector: 'Consumer', industry: 'Tobacco & FMCG' },
  { ticker: 'LT.NS', name: 'Larsen & Toubro', sector: 'Industrials', industry: 'Engineering & Construction' },
  { ticker: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical', sector: 'Healthcare', industry: 'Pharmaceuticals' },
  { ticker: 'BHARTIARTL.NS', name: 'Bharti Airtel', sector: 'Communication Services', industry: 'Telecom Services' },
  { ticker: 'MARUTI.NS', name: 'Maruti Suzuki India', sector: 'Consumer Discretionary', industry: 'Auto Manufacturers' }
];

export const sectors = [...new Map(companies.map((company) => [company.sector.toLowerCase(), {
  name: company.sector,
  key: company.sector.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
}])).values()];

export const commodities = [
  { symbol: 'GOLD', yahooSymbol: 'GC=F', name: 'Gold', unit: '₹/10g', category: 'Precious Metals', conversion: 'gold-10g' },
  { symbol: 'SILVER', yahooSymbol: 'SI=F', name: 'Silver', unit: '₹/kg', category: 'Precious Metals', conversion: 'silver-kg' },
  { symbol: 'COPPER', yahooSymbol: 'HG=F', name: 'Copper', unit: '₹/kg', category: 'Base Metals', conversion: 'usd-lb-to-inr-kg' },
  { symbol: 'ALUMINIUM', yahooSymbol: 'ALI=F', name: 'Aluminium', unit: '₹/kg', category: 'Base Metals', conversion: 'usd-mt-to-inr-kg' },
  { symbol: 'CRUDE', yahooSymbol: 'CL=F', name: 'Crude Oil', unit: '₹/bbl', category: 'Energy', conversion: 'usd-direct' },
  { symbol: 'NATGAS', yahooSymbol: 'NG=F', name: 'Natural Gas', unit: '₹/MMBtu', category: 'Energy', conversion: 'usd-direct' }
];

export const debt = [
  { name: 'India 2Y G-Sec', symbol: 'RBI-GS-2029', duration: 1.8, credit: 'Sovereign' },
  { name: 'India 5Y G-Sec', symbol: 'RBI-GS-2031', duration: 4.3, credit: 'Sovereign' },
  { name: 'India 10Y G-Sec', symbol: 'RBI-GS-2036', duration: 9.7, credit: 'Sovereign' },
  { name: 'US 10Y Treasury', symbol: '^TNX', duration: 8.0, credit: 'Sovereign' }
];
