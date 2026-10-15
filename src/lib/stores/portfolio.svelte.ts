import { browser } from '$app/environment';
import { companies, commodities } from '../data/market.ts';
import type { Allocation, AllocationSnapshot, AssetClass } from '../data/types.ts';

const defaultAllocations: Allocation[] = [
  { id: crypto.randomUUID(), assetClass: 'equity', symbol: 'RELIANCE.NS', name: 'Reliance Industries', weight: 18 },
  { id: crypto.randomUUID(), assetClass: 'equity', symbol: 'HDFCBANK.NS', name: 'HDFC Bank', weight: 16 },
  { id: crypto.randomUUID(), assetClass: 'equity', symbol: 'TCS.NS', name: 'TCS', weight: 12 },
  { id: crypto.randomUUID(), assetClass: 'equity', symbol: 'ICICIBANK.NS', name: 'ICICI Bank', weight: 10 },
  { id: crypto.randomUUID(), assetClass: 'debt', symbol: 'INDIA-10Y', name: 'India 10Y G-Sec', weight: 20 },
  { id: crypto.randomUUID(), assetClass: 'commodity', symbol: 'GOLD', name: 'Gold', weight: 14 },
  { id: crypto.randomUUID(), assetClass: 'commodity', symbol: 'SILVER', name: 'Silver', weight: 10 }
];

const storageKey = 'investment-dashboard:portfolio:v1';
const historyKey = 'investment-dashboard:allocation-history:v1';

let allocations = $state<Allocation[]>(defaultAllocations);
let history = $state<AllocationSnapshot[]>([]);

function load() {
  if (!browser) return;
  try {
    const saved = localStorage.getItem(storageKey);
    const savedHistory = localStorage.getItem(historyKey);
    if (saved) allocations = JSON.parse(saved);
    if (savedHistory) history = JSON.parse(savedHistory);
  } catch {
    // Keep defaults when local persistence is unavailable or corrupted.
  }
}

load();

function persist() {
  if (!browser) return;
  localStorage.setItem(storageKey, JSON.stringify(allocations));
  localStorage.setItem(historyKey, JSON.stringify(history));
}

export function usePortfolio() {
  const totalWeight = $derived(allocations.reduce((sum, row) => sum + Number(row.weight || 0), 0));
  const byClass = $derived({
    equity: allocations.filter((x) => x.assetClass === 'equity').reduce((sum, x) => sum + x.weight, 0),
    debt: allocations.filter((x) => x.assetClass === 'debt').reduce((sum, x) => sum + x.weight, 0),
    commodity: allocations.filter((x) => x.assetClass === 'commodity').reduce((sum, x) => sum + x.weight, 0)
  });

  const add = (assetClass: AssetClass, symbol: string, name: string) => {
    if (allocations.some((x) => x.symbol === symbol && x.assetClass === assetClass)) return;
    allocations.push({ id: crypto.randomUUID(), assetClass, symbol, name, weight: 0 });
  };

  const remove = (id: string) => {
    allocations = allocations.filter((x) => x.id !== id);
  };

  const setWeight = (id: string, weight: number) => {
    const row = allocations.find((x) => x.id === id);
    if (row) row.weight = Math.max(0, Math.min(100, Number.isFinite(weight) ? weight : 0));
  };

  const save = (reason: string) => {
    const snapshot: AllocationSnapshot = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      reason,
      allocations: JSON.parse(JSON.stringify(allocations))
    };
    history.unshift(snapshot);
    history = history.slice(0, 100);
    persist();
  };

  const reset = () => {
    allocations = JSON.parse(JSON.stringify(defaultAllocations));
    persist();
  };

  return {
    get allocations() {
      return allocations;
    },
    get history() {
      return history;
    },
    get totalWeight() {
      return totalWeight;
    },
    get byClass() {
      return byClass;
    },
    add,
    remove,
    setWeight,
    save,
    reset,
    companyOptions: companies,
    commodityOptions: commodities
  };
}
