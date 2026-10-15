<script lang="ts">
  import { onMount } from 'svelte';
  import { Plus, RefreshCw, RotateCcw, Save, Trash2, WalletCards } from 'lucide-svelte';
  import { usePortfolio } from '#lib/stores/portfolio.svelte.ts';
  import { inr } from '#lib/data/format.ts';
  import { getJson, startRefresh } from '#lib/data/live.ts';
  import type { Allocation, AssetClass, CompanySnapshot, CommoditySnapshot, DebtSnapshot } from '#lib/data/types.ts';
  import { companies, commodities, debt } from '#lib/data/market.ts';

  const portfolio = usePortfolio();
  let assetClass = $state<AssetClass>('equity');
  let selection = $state('');
  let reason = $state('Portfolio rebalance');
  let saved = $state(false);
  let loading = $state(true);
  let refreshing = $state(false);
  let error = $state('');
  let liveCompanies = $state<CompanySnapshot[]>([]);
  let liveCommodities = $state<CommoditySnapshot[]>([]);
  let liveDebt = $state<DebtSnapshot[]>([]);

  const options = $derived(assetClass === 'equity'
    ? companies.map((x) => ({ value: x.ticker, label: x.name }))
    : assetClass === 'commodity'
      ? commodities.map((x) => ({ value: x.symbol, label: x.name }))
      : debt.map((x) => ({ value: x.symbol, label: x.name })));

  const reference = (row: Allocation) => {
    if (row.assetClass === 'equity') {
      const company = liveCompanies.find((item) => item.ticker === row.symbol);
      return company?.price == null ? '—' : inr(company.price, 2);
    }
    if (row.assetClass === 'commodity') {
      const commodity = liveCommodities.find((item) => item.symbol === row.symbol);
      return commodity?.price == null ? '—' : inr(commodity.price, 0);
    }
    const bond = liveDebt.find((item) => item.symbol === row.symbol);
    return bond?.yield == null ? '—' : `${bond.yield.toFixed(2)}%`;
  };

  async function loadLive() {
    refreshing = true;
    error = '';
    try {
      const [market, commodityPayload, debtPayload] = await Promise.all([
        getJson<{ companies: CompanySnapshot[] }>('/api/market/overview'),
        getJson<{ commodities: CommoditySnapshot[] }>('/api/commodities'),
        getJson<{ debt: DebtSnapshot[] }>('/api/debt')
      ]);
      liveCompanies = market.companies;
      liveCommodities = commodityPayload.commodities;
      liveDebt = debtPayload.debt;
    } catch (exception) {
      error = exception instanceof Error ? exception.message : 'Live reference prices could not be loaded';
    } finally {
      loading = false;
      refreshing = false;
    }
  }

  const addSelection = () => {
    const option = options.find((x) => x.value === selection);
    if (!option) return;
    portfolio.add(assetClass, option.value, option.label);
    selection = '';
  };

  const save = () => {
    portfolio.save(reason.trim() || 'Portfolio rebalance');
    saved = true;
    setTimeout(() => (saved = false), 2500);
  };

  onMount(() => {
    void loadLive();
    return startRefresh(loadLive, 120_000);
  });
</script>

<svelte:head><title>Portfolio Allocation | Investment Dashboard</title></svelte:head>
<div class="space-y-6">
  <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div class="badge badge-outline">Portfolio construction</div><h1 class="mt-2 text-3xl font-semibold">Portfolio Allocation</h1><p class="muted mt-1">Set weights across individual equities, debt instruments and commodities. Reference prices/yields are live.</p></div><div class="flex gap-2"><button class="btn btn-outline" onclick={portfolio.reset}><RotateCcw size={15}/> Reset</button><button class="btn btn-primary" onclick={save}><Save size={15}/> Save allocation</button></div></div>
  {#if saved}<div class="alert alert-success">Allocation saved. A new history snapshot was created.</div>{/if}
  {#if error}<div class="alert alert-warning">{error}</div>{/if}

  <section class="grid gap-4 md:grid-cols-3"><div class="card-shell p-5"><div class="muted">Total weight</div><div class={`mt-2 text-3xl font-semibold ${Math.abs(portfolio.totalWeight - 100) < 0.01 ? 'text-success' : 'text-warning'}`}>{portfolio.totalWeight.toFixed(1)}%</div><div class="mt-1 text-xs text-base-content/50">Target 100%</div></div><div class="card-shell p-5"><div class="muted">Equities</div><div class="mt-2 text-3xl font-semibold">{portfolio.byClass.equity.toFixed(1)}%</div></div><div class="card-shell p-5"><div class="muted">Debt + commodities</div><div class="mt-2 text-3xl font-semibold">{(portfolio.byClass.debt + portfolio.byClass.commodity).toFixed(1)}%</div></div></section>

  <section class="card-shell p-5"><div class="flex flex-col gap-4 xl:flex-row xl:items-end"><label class="form-control flex-1"><div class="label pb-1"><span class="label-text text-xs font-semibold uppercase">Asset class</span></div><select class="select select-bordered" bind:value={assetClass} onchange={() => (selection = '')}><option value="equity">Equity</option><option value="debt">Debt</option><option value="commodity">Commodity</option></select></label><label class="form-control flex-[2]"><div class="label pb-1"><span class="label-text text-xs font-semibold uppercase">Add security</span></div><select class="select select-bordered" bind:value={selection}><option value="">Select security…</option>{#each options as option}<option value={option.value}>{option.label}</option>{/each}</select></label><button class="btn btn-primary" onclick={addSelection} disabled={!selection}><Plus size={16}/> Add</button></div><label class="form-control mt-4"><div class="label pb-1"><span class="label-text text-xs font-semibold uppercase">Change note</span></div><input class="input input-bordered" bind:value={reason} /></label></section>

  <section class="card-shell overflow-hidden"><div class="border-b border-base-300 p-5"><div class="flex items-center justify-between"><div class="flex items-center gap-2"><WalletCards size={17}/><h2 class="section-title">Selected securities</h2></div><button class="btn btn-ghost btn-sm" onclick={loadLive} disabled={refreshing}><RefreshCw size={14} class={refreshing ? 'animate-spin' : ''}/> Update references</button></div></div><div class="overflow-x-auto"><table class="table"><thead><tr><th>Class</th><th>Security</th><th>Weight</th><th>Live reference</th><th></th></tr></thead><tbody>{#each portfolio.allocations as row}<tr><td><span class="badge badge-ghost capitalize">{row.assetClass}</span></td><td><div class="font-medium">{row.name}</div><div class="text-xs text-base-content/45">{row.symbol}</div></td><td class="w-52"><div class="join"><input class="input input-bordered join-item w-28" type="number" min="0" max="100" step="0.1" value={row.weight} oninput={(event) => portfolio.setWeight(row.id, Number((event.currentTarget as HTMLInputElement).value))}/><span class="btn join-item no-animation">%</span></div></td><td>{loading ? 'Loading…' : reference(row)}</td><td><button class="btn btn-ghost btn-square btn-sm text-error" onclick={() => portfolio.remove(row.id)} aria-label={`Remove ${row.name}`}><Trash2 size={16}/></button></td></tr>{/each}</tbody></table></div></section>
  <div class="text-xs text-base-content/45">Weights and allocation history are local browser state. Market reference values are fetched from live server-side data sources.</div>
</div>
