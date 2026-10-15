<script lang="ts">
  import { BarChart3, BriefcaseBusiness, Building2, ChevronLeft, ChevronRight, CircleDollarSign, Factory, Landmark, Menu, PieChart, Search, SlidersHorizontal, TrendingUp, X } from 'lucide-svelte';
  import ThemeToggle from './ThemeToggle.svelte';
  import type { Component } from 'svelte';

  interface Props { children?: import('svelte').Snippet; }
  let { children }: Props = $props();
  let collapsed = $state(false);
  let mobileOpen = $state(false);

  const nav: { href: string; label: string; icon: Component; group: string }[] = [
    { href: '/', label: 'Dashboard', icon: PieChart, group: 'Overview' },
    { href: '/economy', label: 'Economy', icon: Landmark, group: 'Markets' },
    { href: '/industry', label: 'Industry', icon: Factory, group: 'Markets' },
    { href: '/company/TCS.NS', label: 'Company', icon: Building2, group: 'Markets' },
    { href: '/debt', label: 'Debt', icon: BarChart3, group: 'Markets' },
    { href: '/commodities', label: 'Commodities', icon: CircleDollarSign, group: 'Markets' },
    { href: '/portfolio', label: 'Portfolio Allocation', icon: BriefcaseBusiness, group: 'Portfolio' },
    { href: '/allocation-history', label: 'Allocation History', icon: TrendingUp, group: 'Portfolio' }
  ];

  const groups = $derived([...new Set(nav.map((item) => item.group))]);
</script>

<div class="min-h-screen dashboard-grid bg-base-200/60">
  <div class="drawer lg:drawer-open">
    <input id="app-drawer" class="drawer-toggle" type="checkbox" bind:checked={mobileOpen} />
    <div class="drawer-content min-h-screen">
      <header class="sticky top-0 z-30 border-b border-base-300 bg-base-100/90 backdrop-blur">
        <div class="navbar mx-auto max-w-[1900px] px-4 md:px-6">
          <div class="navbar-start gap-2">
            <label for="app-drawer" class="btn btn-ghost btn-square lg:hidden" aria-label="Open menu"><Menu size={20} /></label>
            <button class="btn btn-ghost btn-square hidden lg:inline-flex" onclick={() => (collapsed = !collapsed)} aria-label="Collapse sidebar">
              {#if collapsed}<ChevronRight size={19} />{:else}<ChevronLeft size={19} />{/if}
            </button>
            <div>
              <div class="text-lg font-semibold tracking-tight">Investment Dashboard</div>
              <div class="hidden text-[10px] uppercase tracking-[0.2em] text-base-content/40 sm:block">Research & Portfolio Terminal</div>
            </div>
          </div>
          <div class="navbar-end gap-1">
            <div class="hidden items-center gap-2 rounded-lg border border-base-300 bg-base-200/50 px-3 py-1.5 md:flex">
              <Search size={15} class="text-base-content/50" />
              <span class="text-xs text-base-content/50">Market intelligence</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-[1900px] px-4 pb-20 pt-5 md:px-6 lg:pt-7">
        {@render children?.()}
      </main>

      <div class="pointer-events-none fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
        <div class="pointer-events-auto rounded-full border border-base-300 bg-base-100/95 px-4 py-2 text-xs font-medium text-base-content/60 shadow-lg backdrop-blur">© Azeem Partap Singh 2026</div>
      </div>
    </div>

    <div class={`drawer-side z-40 ${collapsed ? 'lg:w-[76px]' : ''}`}>
      <label for="app-drawer" class="drawer-overlay"></label>
      <aside class={`min-h-full border-r border-base-300 bg-base-100 transition-all ${collapsed ? 'w-[76px]' : 'w-72'}`}>
        <div class="flex h-16 items-center justify-between border-b border-base-300 px-4">
          <div class="flex items-center gap-2 overflow-hidden">
            <div class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-content"><SlidersHorizontal size={18} /></div>
            {#if !collapsed}
              <div><div class="font-semibold">Investment Office</div><div class="text-[10px] uppercase tracking-[0.18em] text-base-content/45">MBA Research Terminal</div></div>
            {/if}
          </div>
          <button class="btn btn-ghost btn-xs lg:hidden" onclick={() => (mobileOpen = false)} aria-label="Close menu"><X size={16} /></button>
        </div>

        <div class="p-3">
          {#each groups as group}
            <div class="mb-2 mt-4 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-base-content/40 first:mt-0">{group}</div>
            <nav class="space-y-1">
              {#each nav.filter((item) => item.group === group) as item}
                {@const Icon = item.icon}
                <a href={item.href} class="btn btn-ghost w-full justify-start gap-3 rounded-xl text-sm font-medium" title={item.label} onclick={() => (mobileOpen = false)}>
                  <Icon size={17} />
                  {#if !collapsed}<span class="truncate">{item.label}</span>{/if}
                </a>
              {/each}
            </nav>
          {/each}

          {#if !collapsed}
            <div class="mt-8 rounded-xl border border-base-300 bg-base-200/40 p-3">
              <div class="text-xs font-semibold">Data mode</div>
              <div class="mt-1 text-[11px] leading-5 text-base-content/50">Local portfolio state. Market quote endpoints use Yahoo Finance server-side when available.</div>
            </div>
          {/if}
        </div>
      </aside>
    </div>
  </div>
</div>
