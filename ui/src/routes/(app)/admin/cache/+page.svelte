<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let search = '';
	let confirmFlushAll = false;
	let confirmFlushId: string | null = null;

	$: entries = data.cache?.entries ?? [];
	$: filtered = search.trim()
		? entries.filter((e) => e.cardId.toLowerCase().includes(search.toLowerCase()))
		: entries;

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Cache · Admin · PokeHub</title>
</svelte:head>

<div>
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center gap-2 mb-1">
			<a href="/admin" class="font-geist text-sm text-ph-muted hover:text-ph-text transition-colors">Admin</a>
			<span class="text-ph-muted/40">/</span>
			<span class="font-geist text-sm text-ph-text">Cache</span>
		</div>
		<div class="flex items-start justify-between">
			<div>
				<h1 class="font-geist font-black text-3xl text-white">Cache</h1>
				<p class="text-ph-muted font-geist text-sm mt-1">
					{data.cache?.total ?? 0} cached card{(data.cache?.total ?? 0) === 1 ? '' : 's'}
				</p>
			</div>

			<!-- Flush all -->
			{#if (data.cache?.total ?? 0) > 0}
				<div>
					{#if form?.flushSuccess}
						<p class="font-geist text-sm text-green-400">Flushed {form.deleted} entries.</p>
					{:else if confirmFlushAll}
						<form method="POST" action="?/flushAll" use:enhance={() => {
							return ({ update }) => { confirmFlushAll = false; update(); };
						}} class="flex items-center gap-2">
							<span class="font-geist text-sm text-red-300">Flush all {data.cache?.total} entries?</span>
							<button type="submit" class="font-geist text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors px-3 py-1.5 rounded-lg cursor-pointer">
								Confirm
							</button>
							<button type="button" on:click={() => confirmFlushAll = false} class="font-geist text-sm text-ph-muted hover:text-ph-text transition-colors cursor-pointer">
								Cancel
							</button>
						</form>
					{:else}
						<button
							type="button"
							on:click={() => confirmFlushAll = true}
							class="font-geist text-sm font-medium text-red-400 border border-red-700/40 hover:border-red-500 hover:text-red-300 transition-colors px-4 py-2 rounded-lg cursor-pointer"
						>
							Flush All
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	{#if data.error}
		<div class="mb-6 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 font-geist text-sm px-4 py-3">
			{data.error}
		</div>
	{/if}

	{#if form?.flushError}
		<div class="mb-6 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 font-geist text-sm px-4 py-3">
			{form.flushError}
		</div>
	{/if}

	{#if form?.flushEntrySuccess}
		<div class="mb-6 rounded-lg bg-green-900/30 border border-green-700/40 text-green-300 font-geist text-sm px-4 py-3">
			Flushed cache for <code class="font-mono">{form.cardId}</code>.
		</div>
	{/if}

	<!-- Search -->
	{#if entries.length > 0}
		<div class="mb-6">
			<label for="cache-search" class="sr-only">Search cache entries</label>
			<input
				id="cache-search"
				type="search"
				bind:value={search}
				placeholder="Search by card ID…"
				class="w-full max-w-sm rounded-lg bg-ph-surface border border-white/8 text-ph-text placeholder-ph-muted
				       font-geist text-sm px-4 py-2.5
				       focus:outline-none focus:border-ph-accent/50 transition-colors"
			/>
		</div>
	{/if}

	<!-- Cache table -->
	{#if entries.length === 0}
		<div class="rounded-xl bg-ph-surface border border-white/4 px-6 py-12 text-center">
			<p class="font-geist text-sm text-ph-muted">Cache is empty.</p>
		</div>
	{:else}
		<div class="rounded-xl bg-ph-surface border border-white/4 overflow-hidden">
			<table class="w-full">
				<thead>
					<tr class="border-b border-white/4">
						<th class="px-6 py-3 text-left font-geist text-xs text-ph-muted uppercase tracking-widest font-semibold">Card ID</th>
						<th class="px-6 py-3 text-left font-geist text-xs text-ph-muted uppercase tracking-widest font-semibold">Cached At</th>
						<th class="px-6 py-3 text-right font-geist text-xs text-ph-muted uppercase tracking-widest font-semibold">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each filtered as entry (entry.cardId)}
						<tr class="border-b border-white/4 hover:bg-white/2 transition-colors">
							<td class="px-6 py-2.5 font-geist text-sm text-ph-text font-mono">{entry.cardId}</td>
							<td class="px-6 py-2.5 font-geist text-sm text-ph-muted">{formatDate(entry.fetchedAt)}</td>
							<td class="px-6 py-2.5 text-right">
								{#if confirmFlushId === entry.cardId}
									<form method="POST" action="?/flushEntry" use:enhance={() => {
										return ({ update }) => { confirmFlushId = null; update(); };
									}} class="inline-flex gap-1">
										<input type="hidden" name="cardId" value={entry.cardId} />
										<button type="submit" class="font-geist text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-500/40 cursor-pointer transition-colors">
											Confirm
										</button>
										<button type="button" on:click={() => confirmFlushId = null} class="font-geist text-xs text-ph-muted px-2 py-1 cursor-pointer">
											Cancel
										</button>
									</form>
								{:else}
									<button
										type="button"
										on:click={() => confirmFlushId = entry.cardId}
										class="font-geist text-xs text-ph-muted hover:text-red-400 transition-colors px-2 py-1 rounded border border-white/8 hover:border-red-500/40 cursor-pointer"
									>
										Flush
									</button>
								{/if}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="3" class="px-6 py-8 text-center font-geist text-sm text-ph-muted">
								No entries match your search.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if filtered.length !== entries.length}
			<p class="mt-3 font-geist text-xs text-ph-muted">Showing {filtered.length} of {entries.length} entries.</p>
		{/if}
	{/if}
</div>
