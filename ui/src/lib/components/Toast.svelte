<script lang="ts">
	import { toasts } from '$lib/ws';
</script>

{#if $toasts.length > 0}
	<div
		class="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"
		aria-live="polite"
		aria-label="Notifications"
	>
		{#each $toasts as toast (toast.id)}
			<div
				class="flex items-center gap-3 bg-ph-surface border border-ph-accent/40
				       text-ph-text font-geist text-sm px-4 py-3 rounded-xl shadow-glow-red
				       animate-in slide-in-from-bottom-2 duration-200"
			>
				<span class="text-ph-accent shrink-0" aria-hidden="true">
					<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="20 6 9 17 4 12"/>
					</svg>
				</span>
				{toast.message}
			</div>
		{/each}
	</div>
{/if}
