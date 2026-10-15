<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowDownRight, ArrowUpRight, CircleDollarSign, RefreshCw } from 'lucide-svelte';
  import Loading from '#lib/components/Loading.svelte';
  import { getJson, startRefresh } from '#lib/data/live.ts';
  import { inr } from '#lib/data/format.ts';
  import type { CommoditySnapshot } from '#lib/data/types.ts';

  let loading = $state(true);
  let refreshing = $state(false);
  let error = $state('');
  let commodities = $state<CommoditySnapshot[]>([]);

  async function load() {
    refreshing = true;
    error = '';
    try {
      commodities = (await getJson<{ commodities: CommoditySnapshot[] }>('/api/commodities')).commodities;
    } catch (exception) {
      error = exception instanceof Error ? exception.message : 'Unable to load commodity data';
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

<svelte:head><title>Commodities | Investment Dashboard</title></svelte:head>
<div class="space-y-6">
  <div class="flex items-end justify-between gap-3"><div><div class="badge badge-outline">Live commodities</div><h1 class="mt-2 text-3xl font-semibold">Commodity Dashboard</h1><p class="muted mt-1">Yahoo Finance futures converted into INR display units.</p></div><button class="btn btn-outline btn-sm" onclick={load} disabled={refreshing}><RefreshCw size={14} class={refreshing ? 'animate-spin' : ''}/> Refresh</button></div>
  {#if error}<div class="alert alert-error">{error}</div>{/if}
  {#if loading}<Loading label="Fetching live commodity prices" minHeight="420px" />{:else}<section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{#each commodities as commodity}<article class="card-shell p-5"><div class="flex items-center justify-between"><div class="flex items-center gap-2"><CircleDollarSign size={17} class="text-primary"/><div><div class="font-semibold">{commodity.name}</div><div class="text-xs text-base-content/45">{commodity.category} · {commodity.yahooSymbol}</div></div></div>{#if (commodity.change ?? 0) >= 0}<ArrowUpRight size={17} class="text-success" />{:else}<ArrowDownRight size={17} class="text-error" />{/if}</div><div class="mt-7 text-3xl font-semibold">{commodity.price == null ? '—' : inr(commodity.price, 0)}</div><div class="mt-1 flex items-center justify-between"><span class="text-xs text-base-content/45">{commodity.unit}</span><span class={(commodity.change ?? 0) >= 0 ? 'text-sm text-success' : 'text-sm text-error'}>{commodity.change == null ? '—' : `${commodity.change >= 0 ? '+' : ''}${commodity.change.toFixed(2)}%`}</span></div></article>{/each}</section><div class="text-xs text-base-content/45">Commodity futures may be delayed when the source exchange is closed. No synthetic fallback values are used.</div>{/if}
</div>
