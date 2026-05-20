<script lang="ts">
	import type { PageData } from './$types';
	import type { TcgCard, ChaseEntry } from '$shared/tcg';
	import CardModal from '$lib/components/CardModal.svelte';

	export let data: PageData;

	// ── Tab state ─────────────────────────────────────────────────────────────
	let activeTab: 'overview' | 'chase' = 'overview';

	// ── Chase board modal ─────────────────────────────────────────────────────
	let expandedCard: TcgCard | null = null;

	$: chaseIds = new Set((data.chaseEntries ?? []).map((e: ChaseEntry) => e.cardId));

	function hideImgOnError(e: Event) {
		const img = e.currentTarget as HTMLImageElement;
		if (img) img.style.display = 'none';
	}

	function openChaseCard(entry: ChaseEntry) {
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
	function resolveSetId(entry: ChaseEntry): string {
		if (entry.cardSnapshot.setId) return entry.cardSnapshot.setId;
		const lastDash = entry.cardId.lastIndexOf('-');
		return lastDash > 0 ? entry.cardId.slice(0, lastDash) : '';
	}

	$: chaseBySet = (() => {
		const map = new Map<string, { entries: ChaseEntry[]; setId: string }>();
		for (const e of (data.chaseEntries ?? [])) {
			const setName = e.cardSnapshot.setName || 'Unknown Set';
			if (!map.has(setName)) map.set(setName, { entries: [], setId: resolveSetId(e) });
			map.get(setName)!.entries.push(e);
		}
		return Array.from(map.entries()).map(([setName, { entries, setId }]) => ({
			setName,
			setLogo: (data.setLogos ?? {})[setId] ?? '',
			setId,
			entries
		}));
	})();

	// ── Rarity display order ──────────────────────────────────────────────────
	const RARITY_ORDER = ['Common', 'Uncommon', 'Rare', 'Holo Rare', 'Ultra Rare', 'Special Rare', 'Secret Rare', 'Other'];

	// ── Themed panel colors (horizontal fade across the full panel) ──────────
	const SET_THEME: Record<string, string> = {
		base:   'rgba(140, 12, 12, 0.55)',
		jungle: 'rgba(12, 100, 30, 0.55)',
		fossil: 'rgba(100, 90, 20, 0.55)',
		neo:    'rgba(12, 30, 140, 0.55)',
		hgss:   'rgba(20, 70, 130, 0.55)',
		bw:     'rgba(50, 50, 50, 0.55)',
		xy:     'rgba(80, 12, 140, 0.55)',
		sm:     'rgba(12, 100, 70, 0.55)',
		swsh:   'rgba(12, 80, 120, 0.55)',
		sv:     'rgba(90, 12, 140, 0.55)'
	};

	// Full-panel horizontal gradient: theme color on the left, fading to dark surface
	function panelGradient(setId: string): string {
		const prefix = Object.keys(SET_THEME).find((k) => setId.startsWith(k));
		const color = prefix ? SET_THEME[prefix] : 'rgba(40, 32, 100, 0.55)';
		const surface = '#12121e';
		return `linear-gradient(to right, ${color} 0%, rgba(18,18,30,0) 85%), ${surface}`;
	}

</script>

<svelte:head>
	<title>Home · PokeHub</title>
</svelte:head>

<div>
	<div class="mb-8">
		<h1 class="font-geist font-black text-3xl text-white">Welcome to PokeHub</h1>
		<p class="text-ph-muted font-geist text-sm mt-2">Your personal Pokémon TCG collection manager.</p>
	</div>

	{#if data.error}
		<div class="mb-6 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 font-geist text-sm px-4 py-3">
			{data.error}
		</div>
	{/if}

	<div class="tab-bar" role="tablist" aria-label="Home sections">
		<button
			role="tab"
			aria-selected={activeTab === 'overview'}
			class="tab-btn"
			class:tab-active={activeTab === 'overview'}
			on:click={() => (activeTab = 'overview')}
		>
			Overview
		</button>
		<button
			role="tab"
			aria-selected={activeTab === 'chase'}
			class="tab-btn"
			class:tab-active={activeTab === 'chase'}
			on:click={() => (activeTab = 'chase')}
		>
			Chase Board
			{#if (data.chaseEntries?.length ?? 0) > 0}
				<span class="tab-badge">{data.chaseEntries.length}</span>
			{/if}
		</button>
	</div>

	{#if activeTab === 'overview'}
		<section aria-labelledby="stats-heading" class="mb-10">
			<h2 id="stats-heading" class="font-geist font-bold text-sm text-ph-muted uppercase tracking-widest mb-4">Collection Stats</h2>

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
	{/if}

	{#if activeTab === 'chase'}
		{#if (data.chaseEntries?.length ?? 0) === 0}
			<div class="chase-empty">
				<svg class="w-10 h-10 text-ph-muted mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
				</svg>
				<p class="font-geist text-ph-muted text-sm">No cards on your Chase Board yet.</p>
				<p class="font-geist text-ph-muted/60 text-xs mt-1">Search for cards and mark them as "Chasing" to track them here.</p>
			</div>
		{:else}
			<div class="flex flex-col gap-4">
				{#each chaseBySet as { setName, setLogo, setId, entries } (setName)}
					<div class="chase-set-card" style="background: {panelGradient(setId)}">
						<div class="chase-set-identity">
							{#if setLogo}
								<img
									src={setLogo}
									alt="{setName} logo"
									class="chase-set-logo-img"
									on:error={hideImgOnError}
								/>
							{/if}
							<p class="chase-set-name">{setName}</p>
							<span class="chase-count-pill">· {entries.length} card{entries.length === 1 ? '' : 's'}</span>
						</div>

						<div class="chase-cards-row">
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
											loading="lazy"
											on:error={hideImgOnError}
										/>
									{:else}
										<div class="chase-thumb-placeholder">?</div>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

{#if expandedCard}
	<CardModal card={expandedCard} {chaseIds} on:close={() => (expandedCard = null)} />
{/if}

<style>
	/* ── Tab bar ──────────────────────────────────────────────────────────────── */
	.tab-bar {
		display: flex;
		gap: 0;
		margin-bottom: 28px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.tab-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 18px;
		font-family: var(--font-geist, sans-serif);
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.03em;
		color: rgba(255, 255, 255, 0.45);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s;
	}

	.tab-btn:hover {
		color: rgba(255, 255, 255, 0.75);
	}

	.tab-active {
		color: #fff;
		border-bottom-color: var(--color-ph-accent, #a78bfa);
	}

	.tab-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 6px;
		border-radius: 999px;
		background: var(--color-ph-accent, #a78bfa);
		color: #fff;
		font-size: 11px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	/* ── Chase Board empty state ──────────────────────────────────────────────── */
	.chase-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 24px;
		text-align: center;
	}

	/* ── Chase Board panels ───────────────────────────────────────────────────── */
	.chase-set-card {
		display: flex;
		align-items: stretch;
		border-radius: 16px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	/* Left panel: logo + set name + pill.
	   Effects (background masks, tints, blurs, and ::before pseudo-sheens) completely removed. */
	.chase-set-identity {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 7px;
		width: 160px;
		min-width: 160px;
		padding: 20px 16px;
		border-right: 1px solid rgba(255, 255, 255, 0.07);
		
		/* Fully transparent context */
		background: transparent;
		position: relative;
	}

	.chase-set-logo-img {
		height: 48px;
		max-width: 120px;
		width: 100%;
		object-fit: contain;
		display: block;
		filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.6));
		position: relative;
		z-index: 2;
	}

	.chase-set-name {
		font-family: var(--font-geist, sans-serif);
		font-size: 9px;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.55);
		text-align: center;
		line-height: 1.3;
		margin: 0;
		position: relative;
		z-index: 2;
	}

	.chase-count-pill {
		font-family: var(--font-geist, sans-serif);
		font-size: 10px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.4);
		letter-spacing: 0.05em;
		position: relative;
		z-index: 2;
	}

	/* Right panel: flex-wrap card grid */
	.chase-cards-row {
		display: flex;
		flex-wrap: wrap;
		align-content: flex-start;
		gap: 10px;
		flex: 1;
		padding: 16px;
		position: relative;
	}

	/* Card thumbnails */
	.chase-thumb {
		position: relative;
		cursor: pointer;
		flex-shrink: 0;
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		transition: border-color 0.15s, transform 0.25s cubic-bezier(0.2, 0.7, 0.3, 1);
		display: block;
		background: none;
		padding: 0;
		overflow: visible;
	}

	.chase-thumb:hover {
		border-color: rgba(255, 255, 255, 0.25);
		transform: perspective(800px) rotateY(-6deg) rotateX(4deg) translateY(-8px) scale(1.04);
		z-index: 2;
	}

	.chase-thumb img {
		display: block;
		width: 72px;
		height: 100px;
		object-fit: cover;
		border-radius: 5px;
	}

	.chase-thumb-placeholder {
		width: 72px;
		height: 100px;
		background: rgba(255, 255, 255, 0.04);
		border-radius: 5px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		color: rgba(255, 255, 255, 0.2);
	}
</style>