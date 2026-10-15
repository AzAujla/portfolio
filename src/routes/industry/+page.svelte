<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowRight, Factory, Gauge, RefreshCw, TrendingUp } from 'lucide-svelte';
  import Loading from '#lib/components/Loading.svelte';
  import { getJson, startRefresh } from '#lib/data/live.ts';
  import { signedPct } from '#lib/data/format.ts';
  import type { CompanySnapshot, SectorSnapshot } from '#lib/data/types.ts';
  import { sectors } from '#lib/data/market.ts';

  let loading = $state(true);
  let refreshing = $state(false);
  let error = $state('');
  let selected = $state(sectors[0]?.key ?? '');
  let snapshots = $state<SectorSnapshot[]>([]);
  let companies = $state<CompanySnapshot[]>([]);
  const active = $derived(snapshots.find((sector) => sector.key === selected) ?? snapshots[0]);

  async function load() {
    refreshing = true;
    error = '';
    try {
      const payload = await getJson<{ sectors: SectorSnapshot[]; companies: CompanySnapshot[] }>('/api/market/overview');
      snapshots = payload.sectors;
      companies = payload.companies;
      if (!selected && payload.sectors[0]) selected = payload.sectors[0].key;
    } catch (exception) {
      error = exception instanceof Error ? exception.message : 'Unable to load sector data';
    } finally {
      loading = false;
      refreshing = false;
    }
  }

  const activeMembers = $derived(active ? companies.filter((company) => company.sector === active.name) : []);

  onMount(() => {
    void load();
    return startRefresh(load, 120_000);
  });
</script>

<svelte:head><title>Industry | Investment Dashboard</title></svelte:head>
<div class="space-y-6">
  <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><div class="badge badge-outline">Live sector analytics</div><h1 class="mt-2 text-3xl font-semibold">Industry Dashboard</h1><p class="muted mt-1">Select an industry to inspect its live constituent performance and valuation.</p></div><button class="btn btn-outline btn-sm" onclick={load} disabled={refreshing}><RefreshCw size={14} class={refreshing ? 'animate-spin' : ''}/> Refresh</button></div>
  {#if error}<div class="alert alert-error">{error}</div>{/if}
  {#if loading}<Loading label="Fetching live sector data" minHeight="500px" />{:else if active}
    <section class="card-shell p-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><div class="badge badge-primary badge-outline">{active.name}</div><h2 class="mt-3 text-2xl font-semibold">Industry snapshot</h2><p class="muted mt-1">Returns and ratios are calculated from the current configured constituents.</p></div><label class="form-control w-full md:w-80"><div class="label pb-1"><span class="label-text text-xs font-semibold uppercase tracking-wide">Select industry</span></div><select class="select select-bordered" bind:value={selected}>{#each snapshots as sector}<option value={sector.key}>{sector.name}</option>{/each}</select></label></div>
      <div class="mt-6 grid gap-4 md:grid-cols-5"><div class="rounded-xl bg-base-200 p-4"><div class="muted">1D</div><div class="mt-2 text-2xl font-semibold">{signedPct(active.change1d)}</div></div><div class="rounded-xl bg-base-200 p-4"><div class="muted">1M</div><div class="mt-2 text-2xl font-semibold">{signedPct(active.change1m)}</div></div><div class="rounded-xl bg-base-200 p-4"><div class="muted">1Y</div><div class="mt-2 text-2xl font-semibold">{signedPct(active.change1y)}</div></div><div class="rounded-xl bg-base-200 p-4"><div class="muted">Median P/E</div><div class="mt-2 text-2xl font-semibold">{active.pe?.toFixed(1) ?? '—'}×</div></div><div class="rounded-xl bg-base-200 p-4"><div class="muted">Breadth</div><div class="mt-2 text-2xl font-semibold">{active.breadth == null ? '—' : `${(active.breadth * 100).toFixed(0)}%`}</div></div></div>
    </section>

    <section class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {#each snapshots as sector}
        <button class="card-shell p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md" onclick={() => (selected = sector.key)}><div class="flex items-center justify-between"><div class="flex items-center gap-2"><Factory size={17}/><span class="font-semibold">{sector.name}</span></div><TrendingUp size={16} class="text-primary"/></div><div class="mt-6 grid grid-cols-3 gap-3 text-sm"><div><div class="muted">1D</div><div class="mt-1 font-semibold">{signedPct(sector.change1d)}</div></div><div><div class="muted">1M</div><div class="mt-1 font-semibold">{signedPct(sector.change1m)}</div></div><div><div class="muted">P/E</div><div class="mt-1 font-semibold">{sector.pe?.toFixed(1) ?? '—'}×</div></div></div><div class="mt-5 flex items-center justify-between text-xs text-base-content/45"><span><Gauge size={13} class="inline"/> Breadth {sector.breadth == null ? '—' : `${(sector.breadth * 100).toFixed(0)}%`}</span><span>{sector.members} constituents</span></div></button>
      {/each}
    </section>

    <section class="card-shell overflow-hidden"><div class="border-b border-base-300 p-5"><div class="flex items-center justify-between"><div><h2 class="section-title">{active.name} constituents</h2><p class="muted mt-1">Live quote snapshot.</p></div><a href={`/sector/${active.key}`} class="btn btn-outline btn-sm">Detailed sector <ArrowRight size={14}/></a></div></div><div class="overflow-x-auto"><table class="table data-table"><thead><tr><th>Company</th><th>Price</th><th>1D</th><th>Market cap</th><th>P/E</th><th>P/B</th></tr></thead><tbody>{#each activeMembers as company}<tr><td><a class="font-medium hover:underline" href={`/company/${company.ticker}`}>{company.name}</a><div class="text-xs text-base-content/45">{company.ticker}</div></td><td>{company.price == null ? '—' : `₹${company.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}</td><td class={(company.change1d ?? 0) >= 0 ? 'text-success' : 'text-error'}>{signedPct(company.change1d, 2)}</td><td>{company.marketCapCr == null ? '—' : `${company.marketCapCr.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`}</td><td>{company.pe?.toFixed(1) ?? '—'}×</td><td>{company.pb?.toFixed(1) ?? '—'}×</td></tr>{/each}</tbody></table></div></section>
  {/if}
</div>
