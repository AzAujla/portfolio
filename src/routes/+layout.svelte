<script lang="ts">
  import '../app.css';
  import AppShell from '#lib/components/AppShell.svelte';
  let { children } = $props();
</script>

<svelte:head>
  <meta name="description" content="Local-first SvelteKit investment research and portfolio dashboard." />
</svelte:head>

<AppShell>
    {@render children()}
</AppShell>
