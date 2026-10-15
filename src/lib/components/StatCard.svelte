<script lang="ts">
  import type { Component } from 'svelte';

  interface Props {
    label: string;
    value: string;
    change?: string;
    icon?: Component;
    tone?: 'neutral' | 'positive' | 'negative';
  }
  let { label, value, change, icon, tone = 'neutral' }: Props = $props();
  let Icon = $derived(icon);
</script>

<div class="card-shell p-4">
  <div class="flex items-start justify-between gap-3">
    <div class="muted">{label}</div>
    {#if Icon}<Icon size={17} class="text-primary" />{/if}
  </div>
  <div class="mt-3 metric-value">{value}</div>
  {#if change}<div class={`mt-1 text-xs ${tone === 'positive' ? 'text-success' : tone === 'negative' ? 'text-error' : 'text-base-content/50'}`}>{change}</div>{/if}
</div>
