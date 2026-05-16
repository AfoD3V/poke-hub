<script lang="ts">
	import type { PageData } from './$types';
	import type { TcgCard, ChaseEntry } from '$shared/tcg';
	import CardModal from '$lib/components/CardModal.svelte';

	export let data: PageData;

	// ── Chase board modal ─────────────────────────────────────────────────────
	let expandedCard: TcgCard | null = null;

	$: chaseIds = new Set((data.chaseEntries ?? []).map((e: ChaseEntry) => e.cardId));

	function hideImgOnError(e: Event) {
		const img = e.currentTarget as HTMLImageElement;
		if (img) img.style.display = 'none';
	}

	function openChaseCard(entry: ChaseEntry) {
		// Build a minimal TcgCard from the snapshot so the modal can render
		expandedCard = {
			id: entry.cardId,
			name: entry.cardSnapshot.name,
			supertype: 'Pokémon',
			set: entry.cardSnapshot.setName,
			number: '',
			images: {
				small: entry.cardSnapshot.imageSmall,
				large: entry.cardSnapshot.imageSmall
			}
		};
	}

	// ── Chase board grouping ──────────────────────────────────────────────────
	$: chaseBySet = (() => {
		const map = new Map<string, ChaseEntry[]>();
		for (const e of (data.chaseEntries ?? [])) {
			const setName = e.cardSnapshot.setName || 'Unknown Set';
			if (!map.has(setName)) map.set(setName, []);
			map.get(setName)!.push(e);
		}
		return Array.from(map.entries()).map(([setName, entries]) => ({ setName, entries }));
	})();

	// ── Rarity display order ──────────────────────────────────────────────────
	const RARITY_ORDER = ['Common', 'Uncommon', 'Rare', 'Holo Rare', 'Ultra Rare', 'Special Rare', 'Secret Rare', 'Other'];
</script>

<svelte:head>
	<title>Home · PokeHub</title>
</svelte:head>

<div>
	<!-- Heading -->
	<div class="mb-10">
		<h1 class="font-geist font-black text-3xl text-white">Welcome to PokeHub</h1>
		<p class="text-ph-muted font-geist text-sm mt-2">Your personal Pokémon TCG collection manager.</p>
	</div>

	<!-- Error banner -->
	{#if data.error}
		<div class="mb-8 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 font-geist text-sm px-4 py-3">
			{data.error}
		</div>
	{/if}

	<!-- ── Stats ──────────────────────────────────────────────────────────── -->
	<section aria-labelledby="stats-heading" class="mb-10">
		<h2 id="stats-heading" class="font-geist font-bold text-sm text-ph-muted uppercase tracking-widest mb-4">Collection Stats</h2>

		<!-- Top-line numbers -->
		<div class="grid grid-cols-2 gap-4 mb-6 max-w-sm">
			<div class="rounded-xl bg-ph-surface border border-white/4 px-5 py-4">
				<p class="font-geist text-xs text-ph-muted uppercase tracking-widest mb-1">Total Cards</p>
				<p class="font-geist font-bold text-3xl text-ph-text">{data.totalCards}</p>
			</div>
			<div class="rounded-xl bg-ph-surface border border-white/4 px-5 py-4">
				<p class="font-geist text-xs text-ph-muted uppercase tracking-widest mb-1">Unique Pokémon</p>
				<p class="font-geist font-bold text-3xl text-ph-text">{data.uniquePokemon}</p>
			</div>
		</div>

		{#if data.totalCards > 0}
			<div class="grid grid-cols-1 gap-6 max-w-lg">
				<!-- By Set -->
				{#if data.setBreakdown?.length > 0}
					<div class="rounded-xl bg-ph-surface border border-white/4 px-5 py-4">
						<p class="font-geist text-xs text-ph-muted uppercase tracking-widest mb-3">By Set</p>
						<ul class="flex flex-col gap-2">
							{#each data.setBreakdown.slice(0, 8) as { setName, count } (setName)}
								<li class="flex items-center gap-2">
									<span class="font-geist text-xs text-ph-text min-w-0 flex-1 truncate">{setName}</span>
									<div class="flex items-center gap-2 shrink-0">
										<div
											class="h-1.5 rounded-full bg-ph-accent/50"
											style="width: {Math.max(8, (count / data.setBreakdown[0].count) * 80)}px"
											aria-hidden="true"
										></div>
										<span class="font-geist text-xs text-ph-muted w-5 text-right">{count}</span>
									</div>
								</li>
							{/each}
							{#if data.setBreakdown.length > 8}
								<li class="font-geist text-xs text-ph-muted mt-1">+{data.setBreakdown.length - 8} more sets</li>
							{/if}
						</ul>
					</div>
				{/if}

				<!-- Rarity Breakdown -->
				{#if Object.keys(data.rarityBreakdown ?? {}).length > 0}
					<div class="rounded-xl bg-ph-surface border border-white/4 px-5 py-4">
						<p class="font-geist text-xs text-ph-muted uppercase tracking-widest mb-3">By Rarity</p>
						<ul class="flex flex-col gap-2">
							{#each RARITY_ORDER.filter(r => (data.rarityBreakdown ?? {})[r]) as rarity (rarity)}
								<li class="flex items-center justify-between">
									<span class="font-geist text-xs text-ph-text">{rarity}</span>
									<span class="font-geist text-xs font-semibold text-ph-muted">{data.rarityBreakdown[rarity]}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		{/if}
	</section>

	<!-- ── Chase Board ────────────────────────────────────────────────────────── -->
	{#if data.chaseEntries?.length > 0}
		<section aria-labelledby="chase-heading" class="mb-10">
			<h2 id="chase-heading" class="font-geist font-bold text-sm text-ph-muted uppercase tracking-widest mb-4 flex items-center gap-2">
				<svg class="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd"/>
				</svg>
				Chase Board
			</h2>

			<div class="flex flex-col gap-6 max-w-2xl">
				{#each chaseBySet as { setName, entries } (setName)}
					<div class="rounded-xl bg-ph-surface border border-white/4 px-5 py-4">
						<p class="font-geist text-xs font-semibold text-ph-muted uppercase tracking-wider mb-3">{setName}</p>
						<div class="flex flex-wrap gap-2">
							{#each entries as entry (entry.id)}
								<button
									class="chase-thumb"
									on:click={() => openChaseCard(entry)}
									aria-label="View {entry.cardSnapshot.name}"
									title={entry.cardSnapshot.name}
								>
									{#if entry.cardSnapshot.imageSmall}
										<img
											src={entry.cardSnapshot.imageSmall}
											alt={entry.cardSnapshot.name}
											width="48"
											height="67"
											loading="lazy"
											on:error={hideImgOnError}
										/>
									{:else}
										<div class="w-12 h-[67px] bg-ph-card rounded flex items-center justify-center">
											<span class="text-ph-muted text-xs">?</span>
										</div>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- ── Quick actions ───────────────────────────────────────────────────── -->
	<div class="flex flex-col gap-3 max-w-sm">
		<h2 class="font-geist font-bold text-sm text-ph-muted uppercase tracking-widest mb-1">Quick Actions</h2>

		<a
			href="/search"
			class="flex items-center gap-3 rounded-xl bg-ph-accent/10 border border-ph-accent/30
			       hover:bg-ph-accent/20 hover:border-ph-accent/50 transition-colors px-5 py-4
			       focus-visible:outline focus-visible:outline-2 focus-visible:outline-ph-accent"
		>
			<svg class="w-5 h-5 text-ph-accent shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<circle cx="11" cy="11" r="8"/>
				<line x1="21" y1="21" x2="16.65" y2="16.65"/>
			</svg>
			<div>
				<p class="font-geist font-medium text-ph-text text-sm">Search Cards</p>
				<p class="font-geist text-xs text-ph-muted">Find and add Pokémon cards</p>
			</div>
		</a>

		<a
			href="/collection"
			class="flex items-center gap-3 rounded-xl bg-ph-surface border border-white/5
			       hover:bg-white/5 hover:border-white/10 transition-colors px-5 py-4
			       focus-visible:outline focus-visible:outline-2 focus-visible:outline-ph-accent"
		>
			<svg class="w-5 h-5 text-ph-accent shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<rect x="2" y="3" width="20" height="14" rx="2"/>
				<line x1="8" y1="21" x2="16" y2="21"/>
				<line x1="12" y1="17" x2="12" y2="21"/>
			</svg>
			<div>
				<p class="font-geist font-medium text-ph-text text-sm">My Collection</p>
				<p class="font-geist text-xs text-ph-muted">
					{data.totalCards === 0 ? 'No cards yet — start searching!' : `${data.totalCards} card${data.totalCards === 1 ? '' : 's'} in your collection`}
				</p>
			</div>
		</a>
	</div>
</div>

<!-- Chase card modal -->
{#if expandedCard}
	<CardModal card={expandedCard} {chaseIds} on:close={() => (expandedCard = null)} />
{/if}

<style>
	.chase-thumb {
		cursor: pointer;
		border-radius: 4px;
		overflow: hidden;
		border: 1px solid transparent;
		transition: border-color 0.15s, transform 0.15s;
		display: block;
		background: none;
		padding: 0;
		min-width: 44px;
		min-height: 44px;
	}
	.chase-thumb:hover {
		border-color: rgba(251, 191, 36, 0.5);
		transform: scale(1.06);
	}
	.chase-thumb img {
		display: block;
		width: 48px;
		height: 67px;
		object-fit: cover;
		border-radius: 3px;
	}
</style>
