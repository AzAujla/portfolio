<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { ArrowLeft, Building2, RefreshCw } from 'lucide-svelte';
  import Loading from '#lib/components/Loading.svelte';
  import { getJson, startRefresh } from '#lib/data/live.ts';
  import { inr, num, signedPct } from '#lib/data/format.ts';
  import type { CompanySnapshot, SectorSnapshot } from '#lib/data/types.ts';

  const key = $derived(page.params.key);
  let loading = $state(true);
  let refreshing = $state(false);
  let error = $state('');
  let sector = $state<SectorSnapshot | null>(null);
  let members = $state<CompanySnapshot[]>([]);

  async function load() {
    refreshing = true;
    error = '';
    try {
      const payload = await getJson<{ sectors: SectorSnapshot[]; companies: CompanySnapshot[] }>('/api/market/overview');
      sector = payload.sectors.find((item) => item.key === key) ?? null;
      members = sector ? payload.companies.filter((company) => company.sector === sector!.name) : [];
    } catch (exception) {
      error = exception instanceof Error ? exception.message : 'Unable to load sector data';
    } finally {
      loading = false;
      refreshing = false;
    }
  }

  onMount(() => {
    void load();
    return startRefresh(load, 120_000);
  });
</script>

<svelte:head><title>{sector?.name ?? 'Sector'} | Investment Dashboard</title></svelte:head>
<div class="space-y-6">
  <div class="flex items-center justify-between gap-3"><a href="/industry" class="btn btn-ghost btn-sm"><ArrowLeft size={15}/> Industry</a><button class="btn btn-outline btn-sm" onclick={load} disabled={refreshing}><RefreshCw size={14} class={refreshing ? 'animate-spin' : ''}/> Refresh</button></div>
  {#if error}<div class="alert alert-error">{error}</div>{/if}
  {#if loading}<Loading label="Fetching live sector data" minHeight="500px" />{:else if sector}
    <section class="card-shell p-6"><div class="flex flex-wrap items-start justify-between gap-5"><div><div class="badge badge-primary badge-outline">Live sector</div><h1 class="mt-2 text-3xl font-semibold">{sector.name}</h1><p class="muted mt-1">Constituent performance, breadth and valuation from live market data.</p></div><div class={(sector.change1m ?? 0) >= 0 ? 'text-right text-success' : 'text-right text-error'}><div class="text-2xl font-semibold">{signedPct(sector.change1m)}</div><div class="muted">1 month</div></div></div><div class="mt-6 grid gap-3 md:grid-cols-5"><div class="rounded-xl bg-base-200 p-4"><div class="muted">1D</div><div class="mt-1 font-semibold">{signedPct(sector.change1d)}</div></div><div class="rounded-xl bg-base-200 p-4"><div class="muted">1Y</div><div class="mt-1 font-semibold">{signedPct(sector.change1y)}</div></div><div class="rounded-xl bg-base-200 p-4"><div class="muted">Median P/E</div><div class="mt-1 font-semibold">{sector.pe?.toFixed(1) ?? '—'}×</div></div><div class="rounded-xl bg-base-200 p-4"><div class="muted">Breadth</div><div class="mt-1 font-semibold">{sector.breadth == null ? '—' : `${(sector.breadth * 100).toFixed(0)}%`}</div></div><div class="rounded-xl bg-base-200 p-4"><div class="muted">Constituents</div><div class="mt-1 font-semibold">{sector.members}</div></div></div></section>

    <section class="card-shell overflow-hidden"><div class="border-b border-base-300 p-5"><div class="flex items-center gap-2"><Building2 size={17}/><div><h2 class="section-title">Sector constituents</h2><p class="muted mt-1">All values are live or latest published company data.</p></div></div></div><div class="overflow-x-auto"><table class="table data-table"><thead><tr><th>Company</th><th>Price</th><th>1D</th><th>P/E</th><th>P/B</th><th>52W</th><th>Market cap</th></tr></thead><tbody>{#each members as company}<tr><td><a class="font-medium hover:underline" href={`/company/${company.ticker}`}>{company.name}</a><div class="text-xs text-base-content/45">{company.ticker}</div></td><td>{inr(company.price, 2)}</td><td class={(company.change1d ?? 0) >= 0 ? 'text-success' : 'text-error'}>{signedPct(company.change1d, 2)}</td><td>{company.pe?.toFixed(1) ?? '—'}×</td><td>{company.pb?.toFixed(1) ?? '—'}×</td><td>{company.fiftyTwoWeekHigh != null && company.fiftyTwoWeekLow != null ? `${inr(company.fiftyTwoWeekLow, 0)} – ${inr(company.fiftyTwoWeekHigh, 0)}` : '—'}</td><td>{company.marketCapCr == null ? '—' : `${num(company.marketCapCr, 0)} Cr`}</td></tr>{/each}</tbody></table></div></section>
  {:else}<div class="alert alert-warning">That sector is not part of the configured live universe.</div>{/if}
</div>
