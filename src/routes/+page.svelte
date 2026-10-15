<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowRight, BriefcaseBusiness, LineChart, RefreshCw, ShieldCheck, TrendingUp } from 'lucide-svelte';
  import Chart from '#lib/components/Chart.svelte';
  import Loading from '#lib/components/Loading.svelte';
  import StatCard from '#lib/components/StatCard.svelte';
  import { companies } from '#lib/data/market.ts';
  import { getJson, startRefresh } from '#lib/data/live.ts';
  import { inr, num, signedPct } from '#lib/data/format.ts';
  import { usePortfolio } from '#lib/stores/portfolio.svelte.ts';
  import type { CompanySnapshot, EconomySnapshot, SectorSnapshot } from '#lib/data/types.ts';

  const portfolio = usePortfolio();
  let loading = $state(true);
  let refreshing = $state(false);
  let error = $state('');
  let updatedAt = $state('');
  let companySnapshots = $state<CompanySnapshot[]>([]);
  let sectorSnapshots = $state<SectorSnapshot[]>([]);
  let economy = $state<EconomySnapshot | null>(null);

  const topSectors = $derived([...sectorSnapshots].sort((a, b) => (b.change1m ?? -Infinity) - (a.change1m ?? -Infinity)).slice(0, 5));
  const topCompanies = $derived([...companySnapshots].filter((item) => item.price != null).sort((a, b) => (b.marketCapCr ?? 0) - (a.marketCapCr ?? 0)).slice(0, 6));
  const equityRows = $derived(portfolio.allocations.filter((row) => row.assetClass === 'equity'));
  const equityReturn = $derived.by(() => {
    const rows = equityRows.map((row) => ({ row, company: companySnapshots.find((item) => item.ticker === row.symbol) })).filter((item) => item.company?.change1d != null);
    const totalWeight = rows.reduce((sum, item) => sum + item.row.weight, 0);
    return totalWeight ? rows.reduce((sum, item) => sum + item.row.weight * (item.company?.change1d ?? 0), 0) / totalWeight : null;
  });

  function updatedLabel() {
    if (!updatedAt) return 'Awaiting market data';
    return `Live data · ${new Date(updatedAt).toLocaleTimeString()}`;
  }

  async function load() {
    refreshing = true;
    error = '';
    try {
      const [market, macro] = await Promise.all([
        getJson<{ updatedAt: string; companies: CompanySnapshot[]; sectors: SectorSnapshot[] }>('/api/market/overview'),
        getJson<EconomySnapshot>('/api/economy')
      ]);
      companySnapshots = market.companies;
      sectorSnapshots = market.sectors;
      economy = macro;
      updatedAt = market.updatedAt;
    } catch (exception) {
      error = exception instanceof Error ? exception.message : 'Live data could not be loaded';
    } finally {
      loading = false;
      refreshing = false;
    }
  }

  onMount(() => {
    void load();
    return startRefresh(load, 60_000);
  });
</script>

<svelte:head><title>Dashboard | Investment Dashboard</title></svelte:head>
<div class="space-y-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <div class="badge badge-primary badge-outline">Live market terminal</div>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">Portfolio, markets, economy and valuation in one view.</h1>
      <p class="muted mt-3 max-w-3xl">Market prices, ratios and charts are fetched server-side from live data sources. The browser stores only your portfolio configuration.</p>
    </div>
    <div class="flex items-center gap-2">
      <div class="badge badge-success badge-outline gap-2"><span class="inline-block h-2 w-2 rounded-full bg-success"></span>{updatedLabel()}</div>
      <button class="btn btn-outline btn-sm" onclick={load} disabled={refreshing}><RefreshCw size={14} class={refreshing ? 'animate-spin' : ''} /> Refresh</button>
    </div>
  </div>

  {#if error}<div class="alert alert-error">{error}</div>{/if}
  {#if loading}
    <Loading label="Fetching live market data" minHeight="520px" />
  {:else if economy}
    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="NIFTY 50" value={inr(economy.nifty.value, 0)} change={signedPct(economy.nifty.change1d)} tone={(economy.nifty.change1d ?? 0) >= 0 ? 'positive' : 'negative'} icon={TrendingUp} />
      <StatCard label="SENSEX" value={num(economy.sensex.value, 0)} change={signedPct(economy.sensex.change1d)} tone={(economy.sensex.change1d ?? 0) >= 0 ? 'positive' : 'negative'} icon={LineChart} />
      <StatCard label="USD / INR" value={economy.usdInr.value == null ? '—' : `₹${economy.usdInr.value.toFixed(2)}`} change={signedPct(economy.usdInr.change1d)} icon={LineChart} />
      <StatCard label="10Y U.S. Treasury" value={economy.tenYear.value == null ? '—' : `${economy.tenYear.value.toFixed(2)}%`} change={signedPct(economy.tenYear.change1d)} icon={ShieldCheck} />
    </section>

    <section class="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <div class="card-shell p-5">
        <div class="flex items-center justify-between gap-3"><div><h2 class="section-title">NIFTY 50</h2><p class="muted mt-1">Trailing 12 months from Yahoo Finance.</p></div><span class="badge badge-ghost">Live</span></div>
        <div class="mt-4"><Chart points={economy.niftySeries} height={280} prefix="₹" /></div>
      </div>
      <div class="card-shell p-5">
        <div class="flex items-center justify-between"><div><h2 class="section-title">Portfolio signal</h2><p class="muted mt-1">Weighted one-day equity return using your current weights.</p></div><BriefcaseBusiness size={18} /></div>
        <div class="mt-7 text-4xl font-semibold {((equityReturn ?? 0) >= 0) ? 'text-success' : 'text-error'}">{equityReturn == null ? '—' : signedPct(equityReturn, 2)}</div>
        <div class="mt-2 text-sm text-base-content/55">{portfolio.byClass.equity.toFixed(1)}% of the portfolio is currently in equities.</div>
        <a href="/portfolio" class="btn btn-outline btn-sm mt-6">Edit allocation <ArrowRight size={14} /></a>
      </div>
    </section>

    <section class="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
      <div class="card-shell overflow-hidden">
        <div class="border-b border-base-300 p-5"><h2 class="section-title">Leading sectors</h2><p class="muted mt-1">Derived from the live constituent set.</p></div>
        <div class="divide-y divide-base-300">
          {#each topSectors as sector}
            <a href={`/sector/${sector.key}`} class="flex items-center justify-between p-4 transition hover:bg-base-200/60">
              <div><div class="font-medium">{sector.name}</div><div class="text-xs text-base-content/45">{sector.members} constituents · P/E {sector.pe?.toFixed(1) ?? '—'}</div></div>
              <span class={(sector.change1m ?? 0) >= 0 ? 'text-success' : 'text-error'}>{signedPct(sector.change1m)}</span>
            </a>
          {/each}
        </div>
      </div>

      <div class="card-shell overflow-hidden">
        <div class="border-b border-base-300 p-5"><h2 class="section-title">Market leaders by capitalisation</h2><p class="muted mt-1">Live quote snapshot.</p></div>
        <div class="overflow-x-auto"><table class="table data-table"><thead><tr><th>Company</th><th>Price</th><th>1D</th><th>Market cap</th><th>P/E</th></tr></thead><tbody>
          {#each topCompanies as company}
            <tr><td><a class="font-medium hover:underline" href={`/company/${company.ticker}`}>{company.name}</a><div class="text-xs text-base-content/45">{company.ticker}</div></td><td>{inr(company.price, 2)}</td><td class={(company.change1d ?? 0) >= 0 ? 'text-success' : 'text-error'}>{signedPct(company.change1d, 2)}</td><td>{company.marketCapCr == null ? '—' : `${num(company.marketCapCr, 0)} Cr`}</td><td>{company.pe == null ? '—' : `${company.pe.toFixed(1)}×`}</td></tr>
          {/each}
        </tbody></table></div>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-3">
      <StatCard label="GDP growth" value={economy.gdpGrowth.value == null ? '—' : `${economy.gdpGrowth.value.toFixed(1)}%`} change={economy.gdpGrowth.year ? `World Bank · ${economy.gdpGrowth.year}` : 'World Bank'} icon={TrendingUp} />
      <StatCard label="CPI inflation" value={economy.inflation.value == null ? '—' : `${economy.inflation.value.toFixed(1)}%`} change={economy.inflation.year ? `World Bank · ${economy.inflation.year}` : 'World Bank'} icon={LineChart} />
      <StatCard label="Repo rate" value={economy.repo.value == null ? '—' : `${economy.repo.value.toFixed(2)}%`} change={economy.repo.year ? `RBI · ${economy.repo.year}` : 'RBI'} icon={ShieldCheck} />
    </section>

    <div class="text-xs text-base-content/45">Universe: {companies.length} configured Indian equities. Market data refreshes automatically every 60 seconds while the page is open.</div>
  {/if}
</div>
