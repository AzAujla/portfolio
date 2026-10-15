<script lang="ts">
  import { format } from './chart-utils.ts';
  import type { PricePoint } from '#lib/data/types.ts';

  interface Props {
    points?: PricePoint[];
    height?: number;
    prefix?: string;
    suffix?: string;
  }

  let { points = [], height = 280, prefix = '', suffix = '' }: Props = $props();
  let width = $state(900);
  let host: HTMLDivElement;

  $effect(() => {
    if (!host) return;
    const observer = new ResizeObserver(([entry]) => {
      width = Math.max(320, Math.floor(entry.contentRect.width));
    });
    observer.observe(host);
    return () => observer.disconnect();
  });

  const geometry = $derived.by(() => {
    if (!points.length) return null;
    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(max - min, max * 0.01, 1);
    const left = 10;
    const right = width - 10;
    const top = 14;
    const bottom = height - 20;
    const x = (i: number) => left + (i / Math.max(points.length - 1, 1)) * (right - left);
    const y = (v: number) => bottom - ((v - (min - range * 0.08)) / (range * 1.16)) * (bottom - top);
    const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
    const area = `${left},${bottom} ${line} ${right},${bottom}`;
    return { min, max, line, area };
  });
</script>

<div bind:this={host} class="w-full" style={`height:${height}px`}>
  {#if geometry}
    <svg class="h-full w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Price history chart">
      <defs>
        <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="currentColor" stop-opacity="0.18" />
          <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path d={`M ${geometry.area}`} fill="url(#area-gradient)" class="text-primary" />
      <polyline points={geometry.line} fill="none" stroke="currentColor" stroke-width="2.5" class="text-primary" vector-effect="non-scaling-stroke" />
      <text x="12" y="15" class="fill-current text-[11px] text-base-content/50">{prefix}{format(geometry.max)}{suffix}</text>
      <text x="12" y={height - 5} class="fill-current text-[11px] text-base-content/50">{prefix}{format(geometry.min)}{suffix}</text>
    </svg>
  {:else}
    <div class="grid h-full place-items-center text-sm text-base-content/45">No chart data.</div>
  {/if}
</div>
