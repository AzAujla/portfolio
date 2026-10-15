<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { Building2, Calculator, FileText, RefreshCw, TrendingUp } from 'lucide-svelte';
  import Chart from '#lib/components/Chart.svelte';
  import Loading from '#lib/components/Loading.svelte';
  import { companies } from '#lib/data/market.ts';
  import { getJson, startRefresh } from '#lib/data/live.ts';
  import { inr, num, pct, signedPct } from '#lib/data/format.ts';
  import { peerValuation, simpleDcf } from '#lib/valuation.ts';
  import type { CompanySnapshot } from '#lib/data/types.ts';

  const ticker = $derived(page.params.ticker);
  let loading = $state(true);
  let refreshing = $state(false);
  let error = $state('');
  let tab = $state<'overview' | 'financials' | 'valuation'>('overview');
  let company = $state<CompanySnapshot | null>(null);
  let peers = $state<CompanySnapshot[]>([]);
  let reinvestmentRate = $state(0.35);
  let costOfEquity = $state(0.115);
  let terminalGrowth = $state(0.045);

  const dcf = $derived(company ? simpleDcf(company, reinvestmentRate, costOfEquity, terminalGrowth) : null);
  const peer = $derived(company ? peerValuation(company, peers) : null);
  const peerValues = $derived([peer?.peValue, peer?.pbValue, peer?.evValue].filter((value): value is number => value != null && value > 0));
  const blendedFairValue = $derived.by(() => {
    if (dcf?.fairValue == null && !peerValues.length) return null;
    const values = [dcf?.fairValue, ...peerValues].filter((value): value is number => value != null && value > 0);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  });
  const upside = $derived(company?.price != null && blendedFairValue != null ? blendedFairValue / company.price - 1 : null);
  const selectedMeta = $derived(companies.find((item) => item.ticker === ticker));

  async function load() {
    loading = true;
    refreshing = true;
    error = '';
    try {
      const payload = await getJson<{ company: CompanySnapshot; peers: CompanySnapshot[] }>(`/api/company/${encodeURIComponent(ticker)}`);
      company = payload.company;
      peers = payload.peers;
    } catch (exception) {
      company = null;
      peers = [];
      error = exception instanceof Error ? exception.message : 'Unable to load live company data';
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

<svelte:head><title>{company?.name ?? selectedMeta?.name ?? 'Company'} | Investment Dashboard</title></svelte:head>
<div class="space-y-6">
  <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><div class="badge badge-outline">Live company terminal</div><h1 class="mt-2 text-3xl font-semibold">{company?.name ?? selectedMeta?.name ?? ticker}</h1><p class="muted mt-1">{ticker} · {company?.sector ?? selectedMeta?.sector ?? '—'} · {company?.industry ?? selectedMeta?.industry ?? '—'}</p></div><div class="flex gap-2"><select class="select select-bordered" value={ticker} onchange={(event) => { const next = (event.currentTarget as HTMLSelectElement).value; window.location.href = `/company/${next}`; }} aria-label="Select company">{#each companies as item}<option value={item.ticker}>{item.name}</option>{/each}</select><button class="btn btn-outline" onclick={load} disabled={refreshing}><RefreshCw size={15} class={refreshing ? 'animate-spin' : ''}/> Refresh</button></div></div>
  {#if error}<div class="alert alert-error">{error}</div>{/if}
  {#if loading}<Loading label="Fetching live quote, fundamentals and valuation inputs" minHeight="620px" />{:else if company}
    <section class="card-shell p-6"><div class="flex flex-wrap items-start justify-between gap-6"><div class="flex items-center gap-4"><div class="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-content text-lg font-semibold">{company.ticker.slice(0,2)}</div><div><div class="badge badge-outline">{company.exchange || 'Market'}</div><h2 class="mt-2 text-2xl font-semibold">{company.name}</h2><p class="muted">{company.industry}</p></div></div><div class="text-right"><div class="text-3xl font-semibold">{inr(company.price, 2)}</div><div class={(company.change1d ?? 0) >= 0 ? 'text-sm text-success' : 'text-sm text-error'}>{signedPct(company.change1d, 2)} vs previous close</div></div></div><div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><div class="rounded-xl bg-base-200 p-4"><div class="muted">Market cap</div><div class="font-semibold">{company.marketCapCr == null ? '—' : `${num(company.marketCapCr, 0)} Cr`}</div></div><div class="rounded-xl bg-base-200 p-4"><div class="muted">52W high</div><div class="font-semibold">{inr(company.fiftyTwoWeekHigh, 2)}</div></div><div class="rounded-xl bg-base-200 p-4"><div class="muted">52W low</div><div class="font-semibold">{inr(company.fiftyTwoWeekLow, 2)}</div></div><div class="rounded-xl bg-base-200 p-4"><div class="muted">P/E</div><div class="font-semibold">{company.pe?.toFixed(1) ?? '—'}×</div></div><div class="rounded-xl bg-base-200 p-4"><div class="muted">ROE</div><div class="font-semibold">{pct(company.roe)}</div></div></div></section>

    <div role="tablist" class="tabs tabs-boxed w-fit"><button role="tab" class="tab gap-2" class:tab-active={tab === 'overview'} onclick={() => (tab = 'overview')}><Building2 size={15}/>Overview</button><button role="tab" class="tab gap-2" class:tab-active={tab === 'financials'} onclick={() => (tab = 'financials')}><FileText size={15}/>Financials & Ratios</button><button role="tab" class="tab gap-2" class:tab-active={tab === 'valuation'} onclick={() => (tab = 'valuation')}><Calculator size={15}/>Valuation</button></div>

    {#if tab === 'overview'}
      <section class="grid gap-5 xl:grid-cols-[1.3fr_.7fr]"><div class="card-shell p-5"><div class="flex items-center gap-2"><TrendingUp size={17}/><div><h2 class="section-title">Price history</h2><p class="muted mt-1">Trailing 12 months.</p></div></div><div class="mt-4"><Chart points={company.points} height={340} prefix="₹"/></div></div><div class="card-shell p-5"><h2 class="section-title">Business snapshot</h2><p class="mt-4 text-sm leading-6 text-base-content/65">{company.description || `${company.name} is classified by Yahoo Finance as ${company.industry}.`}</p><div class="mt-6 space-y-3 text-sm"><div class="flex justify-between"><span class="muted">Revenue</span><span>{company.revenueCr == null ? '—' : `${num(company.revenueCr, 0)} Cr`}</span></div><div class="flex justify-between"><span class="muted">Net profit</span><span>{company.profitCr == null ? '—' : `${num(company.profitCr, 0)} Cr`}</span></div><div class="flex justify-between"><span class="muted">Debt</span><span>{company.debtCr == null ? '—' : `${num(company.debtCr, 0)} Cr`}</span></div><div class="flex justify-between"><span class="muted">Cash</span><span>{company.cashCr == null ? '—' : `${num(company.cashCr, 0)} Cr`}</span></div><div class="flex justify-between"><span class="muted">Dividend yield</span><span>{pct(company.dividendYield)}</span></div></div></div></section>
    {/if}

    {#if tab === 'financials'}
      <section class="space-y-5"><div class="grid gap-4 md:grid-cols-4 xl:grid-cols-6"><div class="card-shell p-4"><div class="muted">ROE</div><div class="metric-value">{pct(company.roe)}</div></div><div class="card-shell p-4"><div class="muted">ROA</div><div class="metric-value">{pct(company.roa)}</div></div><div class="card-shell p-4"><div class="muted">P/E</div><div class="metric-value">{company.pe?.toFixed(1) ?? '—'}×</div></div><div class="card-shell p-4"><div class="muted">P/B</div><div class="metric-value">{company.pb?.toFixed(1) ?? '—'}×</div></div><div class="card-shell p-4"><div class="muted">EV/EBITDA</div><div class="metric-value">{company.evEbitda?.toFixed(1) ?? '—'}×</div></div><div class="card-shell p-4"><div class="muted">Margin</div><div class="metric-value">{pct(company.profitMargin)}</div></div></div><div class="card-shell overflow-hidden"><div class="border-b border-base-300 p-5"><h2 class="section-title">Annual financial history</h2><p class="muted mt-1">Latest financial periods available from Yahoo Finance.</p></div><div class="overflow-x-auto"><table class="table data-table"><thead><tr><th>Year</th><th>Revenue</th><th>Profit</th><th>EBITDA</th><th>Margin</th></tr></thead><tbody>{#each company.financialHistory ?? [] as row}<tr><td>{new Date(row.date).getFullYear()}</td><td>{row.revenueCr == null ? '—' : `${num(row.revenueCr, 0)} Cr`}</td><td>{row.profitCr == null ? '—' : `${num(row.profitCr, 0)} Cr`}</td><td>{row.ebitdaCr == null ? '—' : `${num(row.ebitdaCr, 0)} Cr`}</td><td>{pct(row.profitMargin)}</td></tr>{/each}{#if !(company.financialHistory?.length)}<tr><td colspan="5" class="text-center text-base-content/45">No annual financial history was returned by the data source.</td></tr>{/if}</tbody></table></div></div></section>
    {/if}

    {#if tab === 'valuation'}
      <section class="space-y-5"><div class="grid gap-4 lg:grid-cols-4"><div class="card-shell p-5"><div class="muted">Simple DCF</div>
        <div class="mt-2 text-3xl font-semibold">{dcf ? inr(dcf.fairValue, 2) : '—'}</div><div class="mt-1 text-xs text-base-content/45">Profit × reinvestment × ROE model</div></div><div class="card-shell p-5"><div class="muted">Peer P/E</div><div class="mt-2 text-3xl font-semibold">{peer?.peValue == null ? '—' : inr(peer.peValue, 2)}</div><div class="mt-1 text-xs text-base-content/45">Peer multiple {peer?.peMultiple?.toFixed(1) ?? '—'}×</div></div><div class="card-shell p-5"><div class="muted">Peer P/B</div><div class="mt-2 text-3xl font-semibold">{peer?.pbValue == null ? '—' : inr(peer.pbValue, 2)}</div><div class="mt-1 text-xs text-base-content/45">Peer multiple {peer?.pbMultiple?.toFixed(1) ?? '—'}×</div></div><div class="card-shell p-5"><div class="muted">Blended value</div><div class="mt-2 text-3xl font-semibold">{blendedFairValue == null ? '—' : inr(blendedFairValue, 2)}</div><div class={`mt-1 text-sm ${(upside ?? 0) >= 0 ? 'text-success' : 'text-error'}`}>{upside == null ? '—' : `${upside >= 0 ? '+' : ''}${(upside * 100).toFixed(1)}% implied`}</div></div></div>
        <div class="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><div class="card-shell p-5"><h2 class="section-title">DCF assumptions</h2><div class="space-y-5 mt-5"><label class="form-control"><div class="label"><span class="label-text">Reinvestment rate</span><span class="label-text-alt">{(reinvestmentRate * 100).toFixed(0)}%</span></div><input type="range" min="0" max="1" step="0.01" bind:value={reinvestmentRate} class="range range-primary"/></label><label class="form-control"><div class="label"><span class="label-text">Cost of equity</span><span class="label-text-alt">{(costOfEquity * 100).toFixed(1)}%</span></div><input type="range" min="0.05" max="0.25" step="0.005" bind:value={costOfEquity} class="range range-primary"/></label><label class="form-control"><div class="label"><span class="label-text">Terminal growth</span><span class="label-text-alt">{(terminalGrowth * 100).toFixed(1)}%</span></div><input type="range" min="0" max="0.08" step="0.005" bind:value={terminalGrowth} class="range range-primary"/></label></div>{#if !dcf}<div class="alert alert-warning mt-5">DCF requires live profit, ROE, debt, cash and share-count data.</div>{/if}</div><div class="card-shell p-5"><h2 class="section-title">DCF forecast</h2>{#if dcf}<div class="overflow-x-auto mt-4"><table class="table data-table"><thead><tr><th>Year</th><th>Projected profit</th><th>Present value</th></tr></thead><tbody>{#each dcf.forecast as row}<tr><td>{row.year}</td><td>{num(row.profit, 0)} Cr</td><td>{num(row.profit / (1 + costOfEquity) ** row.year, 0)} Cr</td></tr>{/each}</tbody></table></div>{:else}<div class="grid min-h-48 place-items-center text-sm text-base-content/45">No sufficient live fundamentals for DCF.</div>{/if}</div></div>
        <div class="card-shell overflow-hidden"><div class="border-b border-base-300 p-5"><h2 class="section-title">Peer valuation</h2><p class="muted mt-1">Peers are the other configured companies in the same sector.</p></div><div class="overflow-x-auto"><table class="table data-table"><thead><tr><th>Peer</th><th>P/E</th><th>P/B</th><th>EV/EBITDA</th><th>ROE</th><th>1D</th></tr></thead><tbody>{#each peers as peerCompany}<tr><td><a class="font-medium hover:underline" href={`/company/${peerCompany.ticker}`}>{peerCompany.name}</a></td><td>{peerCompany.pe?.toFixed(1) ?? '—'}×</td><td>{peerCompany.pb?.toFixed(1) ?? '—'}×</td><td>{peerCompany.evEbitda?.toFixed(1) ?? '—'}×</td><td>{pct(peerCompany.roe)}</td><td class={(peerCompany.change1d ?? 0) >= 0 ? 'text-success' : 'text-error'}>{signedPct(peerCompany.change1d, 2)}</td></tr>{/each}{#if !peers.length}<tr><td colspan="6" class="text-center text-base-content/45">No live peers available.</td></tr>{/if}</tbody></table></div></div>
      </section>
    {/if}
  {/if}
</div>
