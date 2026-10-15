<script lang="ts">
  import { History, Trash2 } from 'lucide-svelte';
  import { usePortfolio } from '#lib/stores/portfolio.svelte.ts';
  import { num } from '#lib/data/format.ts';

  const portfolio = usePortfolio();
  const formatDate = (value: string) => new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
</script>

<svelte:head><title>Allocation History | Investment Dashboard</title></svelte:head>
<div class="space-y-6">
  <div><div class="badge badge-outline">Audit trail</div><h1 class="mt-2 text-3xl font-semibold">Allocation History</h1><p class="muted mt-1">Every saved change records the selected securities, weights and note.</p></div>
  {#if portfolio.history.length === 0}
    <section class="card-shell p-10 text-center"><History size={28} class="mx-auto text-base-content/30"/><h2 class="mt-4 text-lg font-semibold">No saved allocation changes yet</h2><p class="muted mt-1">Make a change on Portfolio Allocation and press Save.</p><a href="/portfolio" class="btn btn-primary btn-sm mt-5">Open portfolio editor</a></section>
  {:else}
    <section class="space-y-4">{#each portfolio.history as snapshot}<article class="card-shell overflow-hidden"><div class="flex flex-col gap-3 border-b border-base-300 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div class="flex items-center gap-2"><span class="badge badge-primary">Saved</span><span class="font-semibold">{snapshot.reason}</span></div><div class="mt-1 text-xs text-base-content/45">{formatDate(snapshot.timestamp)}</div></div><div class="text-right"><div class="text-sm font-semibold">{snapshot.allocations.reduce((sum, x) => sum + x.weight, 0).toFixed(1)}%</div><div class="text-xs text-base-content/45">Total allocation</div></div></div><div class="overflow-x-auto"><table class="table table-sm"><thead><tr><th>Security</th><th>Class</th><th>Weight</th></tr></thead><tbody>{#each snapshot.allocations as row}<tr><td><div class="font-medium">{row.name}</div><div class="text-xs text-base-content/40">{row.symbol}</div></td><td class="capitalize">{row.assetClass}</td><td>{num(row.weight, 1)}%</td></tr>{/each}</tbody></table></div></article>{/each}</section>
  {/if}
</div>
