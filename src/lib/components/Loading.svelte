<script lang="ts">
  interface Props {
    label?: string;
    minHeight?: string;
  }
  let { label = 'Loading data…', minHeight = '180px' }: Props = $props();
</script>

<div class="grid w-full place-items-center text-base-content/50" style={`min-height:${minHeight}`}>
  <div class="flex flex-col items-center gap-3">
    <span class="loading loading-spinner loading-md text-primary"></span>
    <span class="text-xs font-medium uppercase tracking-wider">{label}</span>
  </div>
</div>
