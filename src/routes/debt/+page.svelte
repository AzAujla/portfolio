<script lang="ts">
  import { onMount } from 'svelte';
  import { BarChart3, CalendarDays, RefreshCw, ShieldCheck } from 'lucide-svelte';
  import Loading from '#lib/components/Loading.svelte';
  import { getJson, startRefresh } from '#lib/data/live.ts';
  import type { DebtSnapshot } from '#lib/data/types.ts';

  let loading = $state(true);
  let refreshing = $state(false);
  let error = $state('');
  let debt = $state<DebtSnapshot[]>([]);

  async function load() {
    refreshing = true;
    error = '';
    try {
      debt = (await getJson<{ debt: DebtSnapshot[] }>('/api/debt')).debt;
    } catch (exception) {
      error = exception instanceof Error ? exception.message : 'Unable to load debt data';
    } finally {
      loading = false;
      refreshing = false;
    }
  }

  const tenYear = $derived(debt.find((item) => item.name === 'India 10Y G-Sec'));
  const us10 = $derived(debt.find((item) => item.name === 'US 10Y Treasury'));

  onMount(() => {
    void load();
    return startRefresh(load, 300_000);
  });
</script>

<svelte:head><title>Debt | Investment Dashboard</title></svelte:head>
<div class="space-y-6">
  <div class="flex items-end justify-between gap-3"><div><div class="badge badge-outline">Rates dashboard</div><h1 class="mt-2 text-3xl font-semibold">Debt Dashboard</h1><p class="muted mt-1">Indian government securities are sourced from RBI; U.S. 10Y is sourced from Yahoo Finance.</p></div><button class="btn btn-outline btn-sm" onclick={load} disabled={refreshing}><RefreshCw size={14} class={refreshing ? 'animate-spin' : ''}/> Refresh</button></div>
  {#if error}<div class="alert alert-error">{error}</div>{/if}
  {#if loading}<Loading label="Fetching live yield data" minHeight="420px" />{:else}
    <section class="grid gap-4 md:grid-cols-3"><div class="card-shell p-5"><ShieldCheck size={18} class="text-primary"/><div class="mt-4 muted">India 10Y G-Sec</div><div class="mt-1 text-3xl font-semibold">{tenYear?.yield == null ? '—' : `${tenYear.yield.toFixed(2)}%`}</div><div class="text-xs text-base-content/45">RBI benchmark observation</div></div><div class="card-shell p-5"><BarChart3 size={18} class="text-primary"/><div class="mt-4 muted">India 5Y G-Sec</div><div class="mt-1 text-3xl font-semibold">{debt[1]?.yield == null ? '—' : `${debt[1].yield.toFixed(2)}%`}</div><div class="text-xs text-base-content/45">RBI benchmark observation</div></div><div class="card-shell p-5"><CalendarDays size={18} class="text-primary"/><div class="mt-4 muted">US 10Y Treasury</div><div class="mt-1 text-3xl font-semibold">{us10?.yield == null ? '—' : `${us10.yield.toFixed(2)}%`}</div><div class="text-xs text-base-content/45">Yahoo Finance</div></div></section>
    <section class="card-shell overflow-hidden"><div class="overflow-x-auto"><table class="table data-table"><thead><tr><th>Instrument</th><th>Yield</th><th>Daily change</th><th>Duration</th><th>Credit</th><th>Source</th></tr></thead><tbody>{#each debt as row}<tr><td class="font-medium">{row.name}</td><td>{row.yield == null ? '—' : `${row.yield.toFixed(2)}%`}</td><td class={(row.change ?? 0) <= 0 ? 'text-success' : 'text-error'}>{row.change == null ? '—' : `${row.change > 0 ? '+' : ''}${row.change.toFixed(2)}%`}</td><td>{row.duration == null ? '—' : `${row.duration.toFixed(1)} yrs`}</td><td><span class="badge badge-ghost">{row.credit}</span></td><td class="text-xs text-base-content/50">{row.source}</td></tr>{/each}</tbody></table></div></section>
  {/if}
</div>
