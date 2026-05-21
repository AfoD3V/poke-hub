<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	const statCards = [
		{ label: 'Total Users', key: 'totalUsers' as const, icon: 'users' },
		{ label: 'Collection Entries', key: 'totalCollectionEntries' as const, icon: 'collection' },
		{ label: 'Chase Cards', key: 'totalChaseCards' as const, icon: 'star' },
		{ label: 'Cached Cards', key: 'totalCachedCards' as const, icon: 'database' }
	];
</script>

<svelte:head>
	<title>Admin · PokeHub</title>
</svelte:head>

<div>
	<div class="mb-10">
		<h1 class="font-geist font-black text-3xl text-white">Admin</h1>
		<p class="text-ph-muted font-geist text-sm mt-2">Platform overview and management.</p>
	</div>

	{#if data.error}
		<div class="mb-8 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 font-geist text-sm px-4 py-3">
			{data.error}
		</div>
	{/if}

	{#if data.stats}
		<!-- Stat cards -->
		<section aria-labelledby="stats-heading" class="mb-10">
			<h2 id="stats-heading" class="font-geist font-bold text-sm text-ph-muted uppercase tracking-widest mb-4">Platform Stats</h2>
			<div class="grid grid-cols-2 gap-4 max-w-lg">
				{#each statCards as card (card.key)}
					<div class="rounded-xl bg-ph-surface border border-white/4 px-5 py-4">
						<p class="font-geist text-xs text-ph-muted uppercase tracking-widest mb-1">{card.label}</p>
						<p class="font-geist font-bold text-3xl text-ph-text">{data.stats[card.key]}</p>
					</div>
				{/each}
			</div>
		</section>

		<!-- Quick links -->
		<section aria-labelledby="actions-heading" class="max-w-sm">
			<h2 id="actions-heading" class="font-geist font-bold text-sm text-ph-muted uppercase tracking-widest mb-4">Management</h2>
			<div class="flex flex-col gap-3">
				<a
					href="/admin/users"
					class="flex items-center gap-3 rounded-xl bg-ph-accent/10 border border-ph-accent/30
					       hover:bg-ph-accent/20 hover:border-ph-accent/50 transition-colors px-5 py-4 cursor-pointer
					       focus-visible:outline focus-visible:outline-2 focus-visible:outline-ph-accent"
				>
					<svg class="w-5 h-5 text-ph-accent shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
						<circle cx="9" cy="7" r="4"/>
						<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
						<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
					</svg>
					<div>
						<p class="font-geist font-medium text-ph-text text-sm">Users</p>
						<p class="font-geist text-xs text-ph-muted">{data.stats.totalUsers} registered users</p>
					</div>
				</a>

				<a
					href="/admin/cache"
					class="flex items-center gap-3 rounded-xl bg-ph-surface border border-white/5
					       hover:bg-white/5 hover:border-white/10 transition-colors px-5 py-4 cursor-pointer
					       focus-visible:outline focus-visible:outline-2 focus-visible:outline-ph-accent"
				>
					<svg class="w-5 h-5 text-ph-accent shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<ellipse cx="12" cy="5" rx="9" ry="3"/>
						<path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
						<path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
					</svg>
					<div>
						<p class="font-geist font-medium text-ph-text text-sm">Cache</p>
						<p class="font-geist text-xs text-ph-muted">{data.stats.totalCachedCards} cached cards</p>
					</div>
				</a>
			</div>
		</section>
	{/if}
</div>
