<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import CardModal from '$lib/components/CardModal.svelte';
	import type { SeriesItem, SeriesDetail, SetCardItem, TcgCard } from '$shared/tcg';

	export let series: SeriesItem[] = [];

	// ── Column state (0=series, 1=sets, 2=cards) ─────────────────────────────
	let activeColumn = 0;

	let selectedSeries: SeriesItem | null = null;
	let selectedSet: { id: string; name: string } | null = null;

	let seriesDetail: SeriesDetail | null = null;
	let setCards: SetCardItem[] = [];

	let loadingColumn2 = false;
	let loadingColumn3 = false;
	let errorColumn2: string | null = null;
	let errorColumn3: string | null = null;

	let expandedCard: TcgCard | null = null;
	let failedSeriesLogos = new Set<string>();
	let failedSetLogos = new Set<string>();

	// Pagination
	const PAGE_SIZE = 40;
	let visibleCount = PAGE_SIZE;

	$: visibleCards = setCards.slice(0, visibleCount);
	$: hasMore = visibleCount < setCards.length;

	// ── Column 1 widths driven by activeColumn ────────────────────────────────
	$: col1Style = activeColumn === 0
		? 'width:100%;min-width:100%;'
		: activeColumn === 1
		? 'width:30%;min-width:30%;'
		: 'width:0;min-width:0;overflow:hidden;';

	$: col2Style = activeColumn === 0
		? 'width:0;min-width:0;overflow:hidden;'
		: activeColumn === 1
		? 'width:70%;min-width:70%;'
		: 'width:30%;min-width:30%;';

	$: col3Style = activeColumn < 2
		? 'width:0;min-width:0;overflow:hidden;'
		: 'width:70%;min-width:70%;';

	// ── Map SetCardItem → TcgCard for the Card component ─────────────────────
	function toTcgCard(item: SetCardItem): TcgCard {
		return {
			id: item.id,
			name: item.name,
			supertype: 'Pokemon',
			set: selectedSet?.name ?? '',
			number: item.localId,
			images: {
				small: item.image ? `${item.image}/low.webp` : '',
				large: item.image ? `${item.image}/high.webp` : ''
			}
		};
	}

	// ── Series tile click → fetch series detail ───────────────────────────────
	async function selectSeries(s: SeriesItem) {
		selectedSeries = s;
		selectedSet = null;
		seriesDetail = null;
		setCards = [];
		visibleCount = PAGE_SIZE;
		activeColumn = 1;
		loadingColumn2 = true;
		errorColumn2 = null;

		try {
			const res = await fetch(`/api/series/${encodeURIComponent(s.id)}`);
			const body = await res.json();
			if (!res.ok) throw new Error(body.error || `Failed to load series (${res.status})`);
			seriesDetail = body as SeriesDetail;
		} catch (e) {
			errorColumn2 = e instanceof Error ? e.message : 'Failed to load series';
		} finally {
			loadingColumn2 = false;
		}
	}

	// ── Set tile click → fetch set cards ─────────────────────────────────────
	async function selectSet(set: { id: string; name: string }) {
		selectedSet = set;
		setCards = [];
		visibleCount = PAGE_SIZE;
		activeColumn = 2;
		loadingColumn3 = true;
		errorColumn3 = null;

		try {
			const res = await fetch(`/api/sets/${encodeURIComponent(set.id)}/cards`);
			const body = await res.json();
			if (!res.ok) throw new Error(body.error || `Failed to load cards (${res.status})`);
			setCards = body as SetCardItem[];
		} catch (e) {
			errorColumn3 = e instanceof Error ? e.message : 'Failed to load cards';
		} finally {
			loadingColumn3 = false;
		}
	}

	// ── Breadcrumb navigation ─────────────────────────────────────────────────
	function goToSeries() {
		activeColumn = 0;
		selectedSeries = null;
		selectedSet = null;
		seriesDetail = null;
		setCards = [];
		errorColumn2 = null;
		errorColumn3 = null;
	}

	function goToSets() {
		activeColumn = 1;
		selectedSet = null;
		setCards = [];
		errorColumn3 = null;
	}

	// ── Retry handlers ────────────────────────────────────────────────────────
	function retryColumn2() {
		if (selectedSeries) selectSeries(selectedSeries);
	}

	function retryColumn3() {
		if (selectedSet) selectSet(selectedSet);
	}
</script>

<!-- Breadcrumb -->
{#if activeColumn > 0}
	<nav class="flex items-center gap-2 mb-4 text-sm font-geist text-ph-muted" aria-label="breadcrumb">
		<button
			type="button"
			class="hover:text-white transition-colors"
			on:click={goToSeries}
		>
			Series
		</button>
		{#if selectedSeries}
			<span class="text-ph-border">/</span>
			{#if activeColumn === 1}
				<span class="text-ph-text">{selectedSeries.name}</span>
			{:else}
				<button
					type="button"
					class="hover:text-white transition-colors"
					on:click={goToSets}
				>
					{selectedSeries.name}
				</button>
			{/if}
		{/if}
		{#if selectedSet && activeColumn === 2}
			<span class="text-ph-border">/</span>
			<span class="text-ph-text">{selectedSet.name}</span>
		{/if}
	</nav>
{/if}

<!-- Three-column layout -->
<div class="flex gap-4 overflow-hidden" style="min-height: 400px;">

	<!-- Column 1: Series grid -->
	<div
		class="transition-all duration-300 ease-in-out overflow-y-auto shrink-0"
		style={col1Style}
	>
		<div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(min(140px, 100%), 1fr));">
			{#each series as s (s.id)}
				<button
					type="button"
					class="flex flex-col items-center gap-2 p-3 rounded-xl bg-ph-surface border border-ph-border hover:border-ph-accent hover:bg-ph-card transition-all duration-200 text-center"
					on:click={() => selectSeries(s)}
					aria-label={s.name}
				>
					{#if s.logo && !failedSeriesLogos.has(s.id)}
						<img
							src={s.logo}
							alt={s.name}
							class="w-full h-16 object-contain"
							loading="lazy"
							on:error={() => { failedSeriesLogos = new Set([...failedSeriesLogos, s.id]); }}
						/>
					{:else}
						<div class="w-full h-16 flex items-center justify-center bg-ph-card rounded-lg">
							<span class="text-xs text-ph-muted font-geist">{s.name[0]}</span>
						</div>
					{/if}
					<span class="text-xs font-geist font-medium text-ph-text leading-tight">{s.name}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Column 2: Sets grid -->
	<div
		class="transition-all duration-300 ease-in-out overflow-y-auto shrink-0"
		style={col2Style}
	>
		{#if loadingColumn2}
			<div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(min(120px, 100%), 1fr));">
				{#each Array.from({ length: 8 }) as _, i (i)}
					<div class="animate-pulse bg-ph-card rounded-xl h-32"></div>
				{/each}
			</div>
		{:else if errorColumn2}
			<div class="flex flex-col items-center gap-4 py-12 text-center">
				<p class="text-red-400 text-sm font-geist">{errorColumn2}</p>
				<button
					type="button"
					class="btn-primary w-auto px-4 py-2 text-sm"
					on:click={retryColumn2}
				>
					Retry
				</button>
			</div>
		{:else if seriesDetail}
			<div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(min(120px, 100%), 1fr));">
				{#each seriesDetail.sets as set (set.id)}
					<button
						type="button"
						class="flex flex-col items-center gap-2 p-3 rounded-xl bg-ph-surface border border-ph-border hover:border-ph-accent hover:bg-ph-card transition-all duration-200 text-center"
						on:click={() => selectSet({ id: set.id, name: set.name })}
						aria-label={set.name}
					>
						{#if set.logo && !failedSetLogos.has(set.id)}
							<img
								src={set.logo}
								alt={set.name}
								class="w-full h-14 object-contain"
								loading="lazy"
								on:error={() => { failedSetLogos = new Set([...failedSetLogos, set.id]); }}
							/>
						{:else}
							<div class="w-full h-14 flex items-center justify-center bg-ph-card rounded-lg">
								<span class="text-xs text-ph-muted font-geist">{set.name[0]}</span>
							</div>
						{/if}
						<span class="text-xs font-geist font-medium text-ph-text leading-tight">{set.name}</span>
						<span class="text-xs text-ph-muted font-geist">{set.cardCount} cards</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Column 3: Card grid -->
	<div
		class="transition-all duration-300 ease-in-out overflow-y-auto shrink-0"
		style={col3Style}
	>
		{#if loadingColumn3}
			<div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(min(140px, 100%), 1fr));">
				{#each Array.from({ length: PAGE_SIZE }) as _, i (i)}
					<div class="animate-pulse bg-ph-card rounded-xl aspect-[2.5/3.5]"></div>
				{/each}
			</div>
		{:else if errorColumn3}
			<div class="flex flex-col items-center gap-4 py-12 text-center">
				<p class="text-red-400 text-sm font-geist">{errorColumn3}</p>
				<button
					type="button"
					class="btn-primary w-auto px-4 py-2 text-sm"
					on:click={retryColumn3}
				>
					Retry
				</button>
			</div>
		{:else if setCards.length > 0}
			<div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(min(140px, 100%), 1fr));">
				{#each visibleCards as item (item.id)}
					<Card card={toTcgCard(item)} on:expand={(e) => (expandedCard = e.detail)} />
				{/each}
			</div>

			{#if hasMore}
				<div class="mt-8 flex justify-center">
					<button
						type="button"
						class="btn-primary w-auto px-8"
						on:click={() => (visibleCount += PAGE_SIZE)}
					>
						Load more
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>

{#if expandedCard}
	<CardModal card={expandedCard} on:close={() => (expandedCard = null)} />
{/if}
