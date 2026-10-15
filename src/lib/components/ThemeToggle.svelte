<script lang="ts">
  import { Moon, Sun } from 'lucide-svelte';
  import { browser } from '$app/environment';

  let theme = $state<'light' | 'dark'>('light');

  if (browser) {
    const stored = localStorage.getItem('investment-dashboard:theme') as 'light' | 'dark' | null;
    theme = stored ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
  }

  const toggle = () => {
    theme = theme === 'light' ? 'dark' : 'light';
    if (browser) {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem('investment-dashboard:theme', theme);
    }
  };
</script>

<button class="btn btn-ghost btn-square" onclick={toggle} aria-label="Toggle light and dark theme">
  {#if theme === 'dark'}<Sun size={18} />{:else}<Moon size={18} />{/if}
</button>
