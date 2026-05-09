<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import Card from '$lib/components/Card.svelte';
	import CardModal from '$lib/components/CardModal.svelte';
	import type { TcgCard } from '$shared/tcg';

	export let data: PageData;
	export let form: ActionData;

	let expandedCard: TcgCard | null = null;
	let removingId: string | null = null;

	$: entries = data.entries ?? [];
</script>

<svelte:head>
	<title>My Collection · PokeHub</title>
</svelte:head>

<div>
	<!-- Page title + count -->
	<div class="mb-8">
		<h1 class="font-geist font-black text-3xl text-white">My Collection</h1>
		{#if entries.length > 0}
			<p class="font-geist text-sm text-ph-muted mt-1">{entries.length} card{entries.length === 1 ? '' : 's'}</p>
		{/if}
	</div>

	<!-- Error banner -->
	{#if data.error}
		<div class="mb-6 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 font-geist text-sm px-4 py-3">
			{data.error}
		</div>
	{/if}

	{#if form?.error}
		<div class="mb-6 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 font-geist text-sm px-4 py-3">
			{form.error}
		</div>
	{/if}

	<!-- Empty state -->
	{#if entries.length === 0 && !data.error}
		<div class="flex flex-col items-center justify-center py-24 gap-4 text-center">
			<div class="text-5xl opacity-20" aria-hidden="true">🃏</div>
			<p class="font-geist font-bold text-xl text-ph-muted">No cards yet</p>
			<p class="font-geist text-sm text-ph-muted/70 max-w-xs">
				Search for Pokémon cards and add them to your collection.
			</p>
			<a
				href="/search"
				class="mt-2 inline-flex items-center gap-2 bg-ph-accent px-4 py-2 rounded-lg font-geist text-sm
				       text-white hover:bg-ph-accent/80 transition-colors"
			>
				Browse Cards
			</a>
		</div>

	<!-- Card grid -->
	{:else}
		<ul
			class="grid gap-3"
			style="grid-template-columns: repeat(auto-fill, minmax(min(160px, 100%), 1fr));"
			role="list"
		>
			{#each entries as entry (entry.id)}
				<li class="relative group flex flex-col gap-2">
					<!-- Holographic card (click to expand) -->
					<div
						role="button"
						tabindex="0"
						aria-label="View {entry.card.name}"
						on:click={() => (expandedCard = entry.card)}
						on:keydown={(e) => e.key === 'Enter' && (expandedCard = entry.card)}
					>
						<Card card={entry.card} on:expand={(e) => (expandedCard = e.detail)} />
					</div>

					<!-- Language / quantity badge -->
					<div class="flex items-center justify-between px-1">
						<span class="font-geist text-xs text-ph-muted uppercase tracking-widest">
							{entry.language}
						</span>
						{#if entry.quantity > 1}
							<span class="font-geist text-xs text-ph-muted">×{entry.quantity}</span>
						{/if}
					</div>

					<!-- Remove button (appears on hover) -->
					<form
						method="POST"
						action="?/remove"
						use:enhance={() => {
							removingId = entry.id;
							return async ({ update }) => {
								await update();
								removingId = null;
							};
						}}
					>
						<input type="hidden" name="cardId" value={entry.cardId} />
						<button
							type="submit"
							disabled={removingId === entry.id}
							class="w-full opacity-0 group-hover:opacity-100 focus:opacity-100
							       transition-opacity font-geist text-xs text-red-400 hover:text-red-300
							       border border-red-800/40 hover:border-red-600/60 rounded-md py-1
							       bg-red-950/20 hover:bg-red-950/40 disabled:opacity-50 disabled:cursor-wait"
						>
							{removingId === entry.id ? 'Removing…' : 'Remove'}
						</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<!-- Card detail modal -->
{#if expandedCard}
	<CardModal card={expandedCard} on:close={() => (expandedCard = null)} />
{/if}
