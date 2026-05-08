<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/Card.svelte';
	import CardModal from '$lib/components/CardModal.svelte';
	import type { TcgCard } from '$shared/tcg';

	export let data: PageData;

	let expandedCard: TcgCard | null = null;

	const PAGE_SIZE = 20;

	let query      = data.query      ?? '';
	let cards: TcgCard[] = data.cards ?? [];
	let totalCount = data.totalCount ?? 0;
	let page       = 1;
	let loading    = false;
	let loadingMore = false;
	let error: string | null = data.error ?? null;

	$: hasMore = cards.length < totalCount && !error;
	$: remaining = totalCount - cards.length;

	/** Run a fresh search — resets pagination and replaces the card list. */
	async function handleSearch(event: SubmitEvent) {
		event.preventDefault();
		if (!query.trim()) return;

		loading = true;
		error   = null;
		page    = 1;

		try {
			const result = await fetchPage(query.trim(), 1);
			cards      = result.cards;
			totalCount = result.totalCount;
			syncUrl(query.trim(), null);
		} catch (e) {
			error      = e instanceof Error ? e.message : 'Something went wrong';
			cards      = [];
			totalCount = 0;
		} finally {
			loading = false;
		}
	}

	/** Append the next page of results to the existing card list. */
	async function loadMore() {
		if (loadingMore || !hasMore) return;
		loadingMore = true;
		const nextPage = page + 1;

		try {
			const result = await fetchPage(query.trim(), nextPage);
			cards  = [...cards, ...result.cards];
			page   = nextPage;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load more cards';
		} finally {
			loadingMore = false;
		}
	}

	/** Fetch a single page from the backend proxy. */
	async function fetchPage(q: string, p: number) {
		const url = new URL('/api/cards/search', window.location.origin);
		url.searchParams.set('q', q);
		url.searchParams.set('page', String(p));
		url.searchParams.set('pageSize', String(PAGE_SIZE));

		const res  = await fetch(url.toString());
		const body = await res.json();

		if (!res.ok) {
			throw new Error(body.error || `Search failed (${res.status})`);
		}
		return body as { cards: TcgCard[]; totalCount: number };
	}

	/** Update the address bar so the URL stays shareable. */
	function syncUrl(q: string, p: number | null) {
		const next = new URL(window.location.href);
		next.searchParams.set('q', q);
		if (p && p > 1) {
			next.searchParams.set('page', String(p));
		} else {
			next.searchParams.delete('page');
		}
		window.history.replaceState({}, '', next);
	}
</script>

<svelte:head>
	<title>Search — PokeHub</title>
</svelte:head>

<div>
	<div class="mb-8">
		<h1 class="font-dm font-bold text-3xl text-ph-text">Card Search</h1>
		<p class="text-ph-muted text-sm mt-2 font-dm">Find cards across all TCG sets</p>
	</div>

	<form on:submit={handleSearch} class="flex gap-3 mb-8">
		<input
			type="text"
			bind:value={query}
			placeholder="Search for a Pokémon (e.g. Charizard)..."
			class="form-input flex-1"
			aria-label="Search query"
		/>
		<button type="submit" class="btn-primary w-auto whitespace-nowrap" disabled={loading}>
			{#if loading}
				<span class="flex items-center gap-2">
					<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
						/>
					</svg>
					Searching…
				</span>
			{:else}
				Search
			{/if}
		</button>
	</form>

	<!-- Error state -->
	{#if error}
		<div
			role="alert"
			class="mb-6 px-4 py-3 rounded-lg bg-red-950/50 border border-red-800/60 text-red-400 text-sm font-dm flex items-center gap-2"
		>
			<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="8" x2="12" y2="12" />
				<line x1="12" y1="16" x2="12.01" y2="16" />
			</svg>
			{error}
		</div>
	{/if}

	<!-- Loading skeleton — only shown on fresh searches, not load-more -->
	{#if loading}
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
			{#each Array.from({ length: PAGE_SIZE }) as _, i (i)}
				<div class="animate-pulse bg-ph-card rounded-xl aspect-[2.5/3.5]" />
			{/each}
		</div>
	{:else if cards.length > 0}

		<!-- Result count -->
		<p class="text-sm text-ph-muted font-dm mb-6">
			Showing <span class="text-ph-text font-medium">{cards.length}</span>
			of <span class="text-ph-text font-medium">{totalCount}</span>
			result{totalCount === 1 ? '' : 's'}
		</p>

		<!-- Card grid -->
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
			{#each cards as card (card.id)}
				<Card {card} on:expand={(e) => (expandedCard = e.detail)} />
			{/each}

			<!-- Inline load-more skeletons — keep grid flow intact while fetching -->
			{#if loadingMore}
				{#each Array.from({ length: PAGE_SIZE }) as _, i (i)}
					<div class="animate-pulse bg-ph-card rounded-xl aspect-[2.5/3.5]" />
				{/each}
			{/if}
		</div>

		<!-- Load more -->
		{#if hasMore}
			<div class="mt-10 flex flex-col items-center gap-2">
				<button
					class="btn-primary w-auto px-8"
					on:click={loadMore}
					disabled={loadingMore}
				>
					{#if loadingMore}
						<span class="flex items-center gap-2">
							<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
							</svg>
							Loading…
						</span>
					{:else}
						Load more
					{/if}
				</button>
				<p class="text-xs text-ph-muted font-dm">
					{remaining} more card{remaining === 1 ? '' : 's'} available
				</p>
			</div>
		{:else if totalCount > 0}
			<p class="mt-8 text-xs text-ph-muted text-center font-dm">
				All {totalCount} cards loaded
			</p>
		{/if}

	{:else if !loading && !error && query}
		<!-- Empty state -->
		<div class="text-center mt-16">
			<svg
				class="w-12 h-12 mx-auto text-ph-muted mb-4"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<rect x="3" y="3" width="18" height="18" rx="3" />
				<path d="M3 9h18" />
				<path d="M9 21V9" />
			</svg>
			<p class="text-ph-muted font-dm">No cards found for "{query}".</p>
		</div>
	{/if}
</div>

{#if expandedCard}
	<CardModal card={expandedCard} on:close={() => (expandedCard = null)} />
{/if}
