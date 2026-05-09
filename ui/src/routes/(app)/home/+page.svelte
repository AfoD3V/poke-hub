<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
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

	<!-- Stats -->
	<div class="grid grid-cols-2 gap-4 mb-10 max-w-sm">
		<div class="rounded-xl bg-ph-surface border border-white/4 px-5 py-4">
			<p class="font-geist text-xs text-ph-muted uppercase tracking-widest mb-1">Total Cards</p>
			<p class="font-geist font-bold text-3xl text-ph-text">{data.totalCards}</p>
		</div>
		<div class="rounded-xl bg-ph-surface border border-white/4 px-5 py-4">
			<p class="font-geist text-xs text-ph-muted uppercase tracking-widest mb-1">Unique Pokémon</p>
			<p class="font-geist font-bold text-3xl text-ph-text">{data.uniquePokemon}</p>
		</div>
	</div>

	<!-- Quick actions -->
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
