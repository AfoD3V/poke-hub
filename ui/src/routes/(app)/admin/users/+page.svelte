<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import type { AdminUser } from '$shared/admin';

	export let data: PageData;
	export let form: ActionData;

	let search = '';
	let confirmDeleteId: string | null = null;

	$: filtered = search.trim()
		? data.users.filter(
				(u: AdminUser) =>
					u.email.toLowerCase().includes(search.toLowerCase()) ||
					(u.displayName ?? '').toLowerCase().includes(search.toLowerCase())
			)
		: data.users;

	$: totalPages = Math.ceil(data.total / data.pageSize);

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
	}
</script>

<svelte:head>
	<title>Users · Admin · PokeHub</title>
</svelte:head>

<div>
	<!-- Header -->
	<div class="mb-8 flex items-center justify-between">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<a href="/admin" class="font-geist text-sm text-ph-muted hover:text-ph-text transition-colors">Admin</a>
				<span class="text-ph-muted/40">/</span>
				<span class="font-geist text-sm text-ph-text">Users</span>
			</div>
			<h1 class="font-geist font-black text-3xl text-white">Users</h1>
			<p class="text-ph-muted font-geist text-sm mt-1">{data.total} registered users</p>
		</div>
	</div>

	{#if form?.error}
		<div class="mb-6 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 font-geist text-sm px-4 py-3">
			{form.error}
		</div>
	{/if}

	{#if data.error}
		<div class="mb-6 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 font-geist text-sm px-4 py-3">
			{data.error}
		</div>
	{/if}

	<!-- Search -->
	<div class="mb-6">
		<label for="user-search" class="sr-only">Search users</label>
		<input
			id="user-search"
			type="search"
			bind:value={search}
			placeholder="Search by email or name…"
			class="w-full max-w-sm rounded-lg bg-ph-surface border border-white/8 text-ph-text placeholder-ph-muted
			       font-geist text-sm px-4 py-2.5
			       focus:outline-none focus:border-ph-accent/50 transition-colors"
		/>
	</div>

	<!-- Table -->
	<div class="rounded-xl bg-ph-surface border border-white/4 overflow-hidden">
		<table class="w-full" role="grid">
			<thead>
				<tr class="border-b border-white/5">
					<th class="px-5 py-3 text-left font-geist text-xs text-ph-muted uppercase tracking-widest font-semibold">Email</th>
					<th class="px-5 py-3 text-left font-geist text-xs text-ph-muted uppercase tracking-widest font-semibold">Name</th>
					<th class="px-5 py-3 text-left font-geist text-xs text-ph-muted uppercase tracking-widest font-semibold">Role</th>
					<th class="px-5 py-3 text-right font-geist text-xs text-ph-muted uppercase tracking-widest font-semibold">Cards</th>
					<th class="px-5 py-3 text-right font-geist text-xs text-ph-muted uppercase tracking-widest font-semibold">Chase</th>
					<th class="px-5 py-3 text-left font-geist text-xs text-ph-muted uppercase tracking-widest font-semibold">Joined</th>
					<th class="px-5 py-3 text-right font-geist text-xs text-ph-muted uppercase tracking-widest font-semibold">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each filtered as user (user.id)}
					<tr class="border-b border-white/4 hover:bg-white/2 transition-colors">
						<td class="px-5 py-3">
							<a href="/admin/users/{user.id}" class="font-geist text-sm text-ph-text hover:text-ph-accent transition-colors">
								{user.email}
							</a>
						</td>
						<td class="px-5 py-3">
							<span class="font-geist text-sm text-ph-muted">{user.displayName ?? '—'}</span>
						</td>
						<td class="px-5 py-3">
							{#if user.isAdmin}
								<span class="inline-flex items-center rounded-full bg-ph-accent/15 border border-ph-accent/30 px-2 py-0.5 font-geist text-xs font-semibold text-ph-accent">
									Admin
								</span>
							{:else}
								<span class="font-geist text-xs text-ph-muted">User</span>
							{/if}
						</td>
						<td class="px-5 py-3 text-right font-geist text-sm text-ph-muted">{user.collectionCount}</td>
						<td class="px-5 py-3 text-right font-geist text-sm text-ph-muted">{user.chaseCount}</td>
						<td class="px-5 py-3 font-geist text-sm text-ph-muted">{formatDate(user.createdAt)}</td>
						<td class="px-5 py-3 text-right">
							<div class="flex items-center justify-end gap-2">
								<a
									href="/admin/users/{user.id}"
									class="font-geist text-xs text-ph-muted hover:text-ph-text transition-colors px-2 py-1 rounded border border-white/8 hover:border-white/20 cursor-pointer"
								>
									Edit
								</a>
								{#if confirmDeleteId === user.id}
									<form method="POST" action="?/deleteUser" use:enhance={() => {
										return ({ update }) => { confirmDeleteId = null; update(); };
									}}>
										<input type="hidden" name="userId" value={user.id} />
										<button
											type="submit"
											class="font-geist text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded border border-red-500/40 hover:border-red-400 cursor-pointer"
										>
											Confirm
										</button>
									</form>
									<button
										type="button"
										on:click={() => confirmDeleteId = null}
										class="font-geist text-xs text-ph-muted px-2 py-1 cursor-pointer"
									>
										Cancel
									</button>
								{:else}
									<button
										type="button"
										on:click={() => confirmDeleteId = user.id}
										class="font-geist text-xs text-ph-muted hover:text-red-400 transition-colors px-2 py-1 rounded border border-white/8 hover:border-red-500/40 cursor-pointer"
									>
										Delete
									</button>
								{/if}
							</div>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="7" class="px-5 py-10 text-center font-geist text-sm text-ph-muted">
							{search ? 'No users match your search.' : 'No users found.'}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	{#if totalPages > 1}
		<div class="mt-6 flex items-center justify-between">
			<p class="font-geist text-sm text-ph-muted">
				Page {data.page} of {totalPages}
			</p>
			<div class="flex gap-2">
				{#if data.page > 1}
					<a
						href="?page={data.page - 1}"
						class="font-geist text-sm text-ph-muted hover:text-ph-text transition-colors px-3 py-1.5 rounded-lg border border-white/8 hover:border-white/20 cursor-pointer"
					>
						Previous
					</a>
				{/if}
				{#if data.page < totalPages}
					<a
						href="?page={data.page + 1}"
						class="font-geist text-sm text-ph-muted hover:text-ph-text transition-colors px-3 py-1.5 rounded-lg border border-white/8 hover:border-white/20 cursor-pointer"
					>
						Next
					</a>
				{/if}
			</div>
		</div>
	{/if}
</div>
