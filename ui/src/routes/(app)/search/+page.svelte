<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/Card.svelte';
	import CardModal from '$lib/components/CardModal.svelte';
	import type { TcgCard } from '$shared/tcg';

	export let data: PageData;

	let expandedCard: TcgCard | null = null;

	const PAGE_SIZE = 20;

	// ── Shared state ──────────────────────────────────────────────────────────
	let mode: 'name' | 'set' = (data as { mode?: string }).mode === 'set' ? 'set' : 'name';
	let cards: TcgCard[] = data.cards ?? [];
	let loading    = false;
	let error: string | null = data.error ?? null;

	// ── Name-mode state ───────────────────────────────────────────────────────
	let query      = data.query      ?? '';
	let totalCount = data.totalCount ?? 0;
	let page       = 1;
	let loadingMore = false;

	// ── Set-mode state ────────────────────────────────────────────────────────
	let setId      = (data as { setId?: string }).setId      ?? '';
	let cardNumber = (data as { cardNumber?: string }).cardNumber ?? '';

	// ── Derived ───────────────────────────────────────────────────────────────
	$: hasMore  = mode === 'name' && cards.length < totalCount && !error;
	$: remaining = totalCount - cards.length;

	// ── Mode switching ────────────────────────────────────────────────────────
	function switchMode(next: 'name' | 'set') {
		if (next === mode) return;
		mode   = next;
		cards  = [];
		error  = null;

		const url = new URL(window.location.href);
		if (next === 'name') {
			url.searchParams.delete('mode');
			url.searchParams.delete('setId');
			url.searchParams.delete('cardNumber');
			if (query) url.searchParams.set('q', query);
		} else {
			url.searchParams.set('mode', 'set');
			url.searchParams.delete('q');
			url.searchParams.delete('page');
		}
		window.history.replaceState({}, '', url);
	}

	// ── Name-mode handlers ────────────────────────────────────────────────────

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
			syncNameUrl(query.trim(), null);
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

	/** Update the address bar so the URL stays shareable (name mode). */
	function syncNameUrl(q: string, p: number | null) {
		const next = new URL(window.location.href);
		next.searchParams.set('q', q);
		if (p && p > 1) {
			next.searchParams.set('page', String(p));
		} else {
			next.searchParams.delete('page');
		}
		window.history.replaceState({}, '', next);
	}

	// ── Set-mode handler ──────────────────────────────────────────────────────

	/** Look up a single card by set ID + card number. */
	async function handleSetSearch(event: SubmitEvent) {
		event.preventDefault();
		if (!setId.trim() || !cardNumber.trim()) return;

		loading = true;
		error   = null;
		cards   = [];

		try {
			const url = new URL('/api/cards/by-set', window.location.origin);
			url.searchParams.set('setId', setId.trim());
			url.searchParams.set('cardNumber', cardNumber.trim());

			const res  = await fetch(url.toString());
			const body = await res.json();

			if (!res.ok) {
				throw new Error(body.error || `Lookup failed (${res.status})`);
			}

			const card = body as TcgCard | null;
			cards = card ? [card] : [];
			if (!card) {
				error = `No card found for set "${setId.trim()}" #${cardNumber.trim()}.`;
			}

			syncSetUrl(setId.trim(), cardNumber.trim());
		} catch (e) {
			error = e instanceof Error ? e.message : 'Something went wrong';
			cards = [];
		} finally {
			loading = false;
		}
	}

	/** Update the address bar so the URL stays shareable (set mode). */
	function syncSetUrl(sid: string, num: string) {
		const next = new URL(window.location.href);
		next.searchParams.set('mode', 'set');
		next.searchParams.set('setId', sid);
		next.searchParams.set('cardNumber', num);
		window.history.replaceState({}, '', next);
	}
</script>

<svelte:head>
	<title>Search — PokeHub</title>
</svelte:head>

<div>
	<div class="mb-8">
		<h1 class="font-geist font-black text-3xl text-white">Card Search</h1>
		<p class="text-ph-muted text-sm mt-2 font-geist">Find cards across all TCG sets</p>
	</div>

	<!-- Segmented mode toggle -->
	<div class="flex rounded-lg bg-ph-surface border border-ph-border p-1 gap-1 mb-8">
		<button
			type="button"
			class={mode === 'name'
				? 'flex-1 py-2 px-4 rounded-md text-sm font-geist font-semibold text-white bg-ph-accent transition-colors duration-200'
				: 'flex-1 py-2 px-4 rounded-md text-sm font-geist font-semibold text-ph-muted hover:text-ph-text transition-colors duration-200'}
			on:click={() => switchMode('name')}
			aria-pressed={mode === 'name'}
		>
			By Name
		</button>
		<button
			type="button"
			class={mode === 'set'
				? 'flex-1 py-2 px-4 rounded-md text-sm font-geist font-semibold text-white bg-ph-accent transition-colors duration-200'
				: 'flex-1 py-2 px-4 rounded-md text-sm font-geist font-semibold text-ph-muted hover:text-ph-text transition-colors duration-200'}
			on:click={() => switchMode('set')}
			aria-pressed={mode === 'set'}
		>
			By Set &amp; Number
		</button>
	</div>

	<!-- ── Name search form ─────────────────────────────────────────────────── -->
	{#if mode === 'name'}
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

	<!-- ── Set & number search form ─────────────────────────────────────────── -->
	{:else}
		<form on:submit={handleSetSearch} class="mb-8">
			<div class="flex gap-3 items-end">
				<div class="flex flex-col gap-1 flex-1">
					<label for="set-id" class="text-xs font-geist font-medium text-ph-muted uppercase tracking-wide">
						Set ID
					</label>
					<input
						id="set-id"
						type="text"
						bind:value={setId}
						placeholder="e.g. swsh3"
						class="form-input"
						aria-label="Set ID"
					/>
				</div>
				<div class="flex flex-col gap-1 flex-1">
					<label for="card-number" class="text-xs font-geist font-medium text-ph-muted uppercase tracking-wide">
						Card Number
					</label>
					<input
						id="card-number"
						type="text"
						bind:value={cardNumber}
						placeholder="e.g. 136"
						class="form-input"
						aria-label="Card number"
					/>
				</div>
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
						Look up
					{/if}
				</button>
			</div>
		</form>
	{/if}

	<!-- Error state -->
	{#if error}
		<div
			role="alert"
			class="mb-6 px-4 py-3 rounded-lg bg-red-950/50 border border-red-800/60 text-red-400 text-sm font-geist flex items-center gap-2"
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
		<div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(min(160px, 100%), 1fr));">
			{#each Array.from({ length: PAGE_SIZE }) as _, i (i)}
				<div class="animate-pulse bg-ph-card rounded-xl aspect-[2.5/3.5]"></div>
			{/each}
		</div>
	{:else if cards.length > 0}

		<!-- Result count — only shown in name mode (set mode always returns 0 or 1) -->
		{#if mode === 'name'}
			<p class="text-sm text-ph-muted font-geist mb-6">
				Showing <span class="text-ph-text font-medium">{cards.length}</span>
				of <span class="text-ph-text font-medium">{totalCount}</span>
				result{totalCount === 1 ? '' : 's'}
			</p>
		{/if}

		<!-- Card grid -->
		<div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(min(160px, 100%), 1fr));">
			{#each cards as card (card.id)}
				<Card {card} on:expand={(e) => (expandedCard = e.detail)} />
			{/each}

			<!-- Inline load-more skeletons — keep grid flow intact while fetching -->
			{#if loadingMore}
				{#each Array.from({ length: PAGE_SIZE }) as _, i (i)}
					<div class="animate-pulse bg-ph-card rounded-xl aspect-[2.5/3.5]"></div>
				{/each}
			{/if}
		</div>

		<!-- Load more — name mode only -->
		{#if mode === 'name'}
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
					<p class="text-xs text-ph-muted font-geist">
						{remaining} more card{remaining === 1 ? '' : 's'} available
					</p>
				</div>
			{:else if totalCount > 0}
				<p class="mt-8 text-xs text-ph-muted text-center font-geist">
					All {totalCount} cards loaded
				</p>
			{/if}
		{/if}

	{:else if !loading && !error && (mode === 'name' ? query : setId && cardNumber)}
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
			{#if mode === 'name'}
				<p class="text-ph-muted font-geist">No cards found for "{query}".</p>
			{:else}
				<p class="text-ph-muted font-geist">No card found in set "{setId}" with number "{cardNumber}".</p>
			{/if}
		</div>
	{/if}
</div>

{#if expandedCard}
	<CardModal card={expandedCard} on:close={() => (expandedCard = null)} />
{/if}
