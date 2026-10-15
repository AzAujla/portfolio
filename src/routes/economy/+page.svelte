<script lang="ts">
  import { onMount } from 'svelte';
  import { Globe2, Landmark, LineChart, RefreshCw, TrendingDown, TrendingUp } from 'lucide-svelte';
  import Chart from '#lib/components/Chart.svelte';
  import Loading from '#lib/components/Loading.svelte';
  import StatCard from '#lib/components/StatCard.svelte';
  import { getJson, startRefresh } from '#lib/data/live.ts';
  import { signedPct } from '#lib/data/format.ts';
  import type { EconomySnapshot } from '#lib/data/types.ts';

  let loading = $state(true);
  let refreshing = $state(false);
  let error = $state('');
  let data = $state<EconomySnapshot | null>(null);

  async function load() {
    refreshing = true;
    error = '';
    try {
      data = await getJson<EconomySnapshot>('/api/economy');
    } catch (exception) {
      error = exception instanceof Error ? exception.message : 'Unable to load live economic data';
    } finally {
      loading = false;
      refreshing = false;
    }
  }

  onMount(() => {
    void load();
    return startRefresh(load, 300_000);
  });
</script>

<svelte:head><title>Economy | Investment Dashboard</title></svelte:head>
<div class="space-y-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div class="badge badge-outline">Macro dashboard</div><h1 class="mt-2 text-3xl font-semibold">Economy Dashboard</h1><p class="muted mt-1">Market variables are live. Low-frequency macro indicators show their latest published observation.</p></div><button class="btn btn-outline btn-sm" onclick={load} disabled={refreshing}><RefreshCw size={14} class={refreshing ? 'animate-spin' : ''}/> Refresh</button></div>
  {#if error}<div class="alert alert-error">{error}</div>{/if}
  {#if loading}<Loading label="Fetching live economic data" minHeight="500px" />{:else if data}
    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <StatCard label="GDP growth" value={data.gdpGrowth.value == null ? '—' : `${data.gdpGrowth.value.toFixed(1)}%`} change={data.gdpGrowth.year ? `${data.gdpGrowth.source} · ${data.gdpGrowth.year}` : data.gdpGrowth.source} icon={TrendingUp}/>
      <StatCard label="Inflation" value={data.inflation.value == null ? '—' : `${data.inflation.value.toFixed(1)}%`} change={data.inflation.year ? `${data.inflation.source} · ${data.inflation.year}` : data.inflation.source} icon={TrendingDown}/>
      <StatCard label="Unemployment" value={data.unemployment.value == null ? '—' : `${data.unemployment.value.toFixed(1)}%`} change={data.unemployment.year ? `${data.unemployment.source} · ${data.unemployment.year}` : data.unemployment.source} icon={Globe2}/>
      <StatCard label="Repo rate" value={data.repo.value == null ? '—' : `${data.repo.value.toFixed(2)}%`} change={data.repo.year ? `${data.repo.source} · ${data.repo.year}` : data.repo.source} icon={Landmark}/>
      <StatCard label="USD / INR" value={data.usdInr.value == null ? '—' : `₹${data.usdInr.value.toFixed(2)}`} change={signedPct(data.usdInr.change1d, 2)} icon={LineChart}/>
    </section>

    <section class="grid gap-5 xl:grid-cols-2">
      <div class="card-shell p-5"><div class="flex items-center justify-between"><div><h2 class="section-title">NIFTY 50</h2><p class="muted mt-1">Trailing 12 months.</p></div><span class="badge badge-success badge-outline">Live</span></div><div class="mt-5"><Chart points={data.niftySeries} height={290} prefix="₹"/></div></div>
      <div class="card-shell p-5"><div class="flex items-center justify-between"><div><h2 class="section-title">USD / INR</h2><p class="muted mt-1">Trailing 12 months.</p></div><span class="badge badge-success badge-outline">Live</span></div><div class="mt-5"><Chart points={data.fxSeries} height={290} prefix="₹"/></div></div>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div class="card-shell p-5"><div class="muted">NIFTY 50</div><div class="metric-value">{data.nifty.value == null ? '—' : data.nifty.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div><div class="text-sm {(data.nifty.change1d ?? 0) >= 0 ? 'text-success' : 'text-error'}">{signedPct(data.nifty.change1d, 2)}</div></div>
      <div class="card-shell p-5"><div class="muted">SENSEX</div><div class="metric-value">{data.sensex.value == null ? '—' : data.sensex.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div><div class="text-sm {(data.sensex.change1d ?? 0) >= 0 ? 'text-success' : 'text-error'}">{signedPct(data.sensex.change1d, 2)}</div></div>
      <div class="card-shell p-5"><div class="muted">10Y U.S. Treasury</div><div class="metric-value">{data.tenYear.value == null ? '—' : `${data.tenYear.value.toFixed(2)}%`}</div><div class="text-sm {(data.tenYear.change1d ?? 0) >= 0 ? 'text-error' : 'text-success'}">{signedPct(data.tenYear.change1d, 2)}</div></div>
      <div class="card-shell p-5"><div class="muted">Last refreshed</div><div class="mt-2 text-xl font-semibold">{new Date(data.updatedAt).toLocaleTimeString()}</div><div class="text-xs text-base-content/45">Yahoo Finance + World Bank + RBI</div></div>
    </section>
  {/if}
</div>
