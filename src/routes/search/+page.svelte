import type { PageData } from './$types';
	import Card from '$lib/components/Card.svelte';
	import type { TcgCard } from '$shared/tcg';

	export let data: PageData;

	let query = data.query ?? '';
	let cards: TcgCard[] = data.cards ?? [];
	let totalCount = data.totalCount ?? 0;
	let loading = false;
	let error: string | null = data.error ?? null;

	async function handleSearch(event: SubmitEvent) {
		event.preventDefault();
		loading = true;
		error = null;

		try {
			const url = new URL('/api/cards/search', window.location.origin);
			url.searchParams.set('q', query);
			const res = await fetch(url.toString());
			const body = await res.json();

			if (!res.ok) {
				throw new Error(body.error || `Search failed (${res.status})`);
			}

			cards = body.cards;
			totalCount = body.totalCount;

			// sync URL bar for shareability without full reload
			const newUrl = new URL(window.location.href);
			newUrl.searchParams.set('q', query);
			window.history.replaceState({}, '', newUrl);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Something went wrong';
			cards = [];
			totalCount = 0;
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Search — PokeHub</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="font-syne text-3xl font-bold text-ph-text">Card Search</h1>
		<p class="text-ph-muted text-sm mt-1 font-dm">Find cards across all TCG sets</p>
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

	<!-- Loading skeleton -->
	{#if loading && cards.length === 0}
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
			{#each Array.from({ length: 10 }) as _, i (i)}
				<div class="animate-pulse bg-ph-card rounded-xl aspect-[2.5/3.5]" />
			{/each}
		</div>
	{:else if cards.length > 0}
		<!-- Results grid -->
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
			{#each cards as card (card.id)}
				<Card {card} />
			{/each}
		</div>
		<p class="mt-6 text-sm text-ph-muted text-center font-dm">
			{totalCount} result{totalCount === 1 ? '' : 's'} found
		</p>
	{:else if !loading && !error && query}
		<!-- Empty state (only when no error) -->
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
			<p class="text-ph-muted font-dm">No cards found for “{query}”.</p>
		</div>
	{/if}
</div>
