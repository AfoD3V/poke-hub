<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let newPassword = '';
	let confirmDelete = false;
	let confirmDeleteCollection: string | null = null;
	let confirmDeleteChase: string | null = null;

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
	}
</script>

<svelte:head>
	<title>{data.user.email} · Admin · PokeHub</title>
</svelte:head>

<div>
	<!-- Breadcrumb + heading -->
	<div class="mb-8">
		<div class="flex items-center gap-2 mb-1">
			<a href="/admin" class="font-geist text-sm text-ph-muted hover:text-ph-text transition-colors">Admin</a>
			<span class="text-ph-muted/40">/</span>
			<a href="/admin/users" class="font-geist text-sm text-ph-muted hover:text-ph-text transition-colors">Users</a>
			<span class="text-ph-muted/40">/</span>
			<span class="font-geist text-sm text-ph-text truncate max-w-xs">{data.user.email}</span>
		</div>
		<h1 class="font-geist font-black text-3xl text-white">{data.user.displayName ?? data.user.email}</h1>
		<div class="flex items-center gap-3 mt-2">
			<span class="font-geist text-sm text-ph-muted">{data.user.email}</span>
			{#if data.user.isAdmin}
				<span class="inline-flex items-center rounded-full bg-ph-accent/15 border border-ph-accent/30 px-2 py-0.5 font-geist text-xs font-semibold text-ph-accent">Admin</span>
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 max-w-2xl">

		<!-- Profile edit -->
		<section aria-labelledby="profile-heading" class="rounded-xl bg-ph-surface border border-white/4 px-6 py-5">
			<h2 id="profile-heading" class="font-geist font-bold text-sm text-ph-muted uppercase tracking-widest mb-4">Profile</h2>

			{#if form?.updateSuccess}
				<div class="mb-4 rounded-lg bg-green-900/30 border border-green-700/40 text-green-300 font-geist text-sm px-4 py-2">
					Profile updated.
				</div>
			{/if}
			{#if form?.updateError}
				<div class="mb-4 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 font-geist text-sm px-4 py-2">
					{form.updateError}
				</div>
			{/if}

			<form method="POST" action="?/updateUser" use:enhance class="flex flex-col gap-4">
				<div class="flex flex-col gap-1.5">
					<label for="displayName" class="font-geist text-xs text-ph-muted uppercase tracking-widest">Display Name</label>
					<input
						id="displayName"
						name="displayName"
						type="text"
						value={data.user.displayName ?? ''}
						placeholder="No name set"
						class="rounded-lg bg-ph-card border border-white/8 text-ph-text placeholder-ph-muted
						       font-geist text-sm px-4 py-2.5
						       focus:outline-none focus:border-ph-accent/50 transition-colors"
					/>
				</div>

				<div class="flex items-center gap-3">
					<label for="isAdminToggle" class="font-geist text-xs text-ph-muted uppercase tracking-widest">Admin</label>
					<div class="relative inline-flex items-center gap-2">
						<input type="hidden" name="isAdmin" value="false" />
						<input
							id="isAdminToggle"
							type="checkbox"
							name="isAdmin"
							value="true"
							checked={data.user.isAdmin}
							class="sr-only peer"
						/>
						<div class="w-10 h-5 bg-white/10 rounded-full peer peer-checked:bg-ph-accent transition-colors
						            after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4
						            after:bg-white after:rounded-full after:transition-transform
						            peer-checked:after:translate-x-5">
						</div>
						<span class="font-geist text-sm text-ph-text" aria-hidden="true">{data.user.isAdmin ? 'Yes' : 'No'}</span>
					</div>
				</div>

				<div>
					<button
						type="submit"
						class="font-geist text-sm font-medium text-ph-text bg-ph-accent/20 border border-ph-accent/40
						       hover:bg-ph-accent/30 hover:border-ph-accent/60 transition-colors px-4 py-2 rounded-lg cursor-pointer"
					>
						Save Changes
					</button>
				</div>
			</form>
		</section>

		<!-- Reset password -->
		<section aria-labelledby="password-heading" class="rounded-xl bg-ph-surface border border-white/4 px-6 py-5">
			<h2 id="password-heading" class="font-geist font-bold text-sm text-ph-muted uppercase tracking-widest mb-4">Reset Password</h2>

			{#if form?.resetSuccess}
				<div class="mb-4 rounded-lg bg-green-900/30 border border-green-700/40 text-green-300 font-geist text-sm px-4 py-2">
					Password reset successfully.
				</div>
			{/if}
			{#if form?.resetError}
				<div class="mb-4 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 font-geist text-sm px-4 py-2">
					{form.resetError}
				</div>
			{/if}

			<form method="POST" action="?/resetPassword" use:enhance={() => {
				return ({ update }) => { newPassword = ''; update(); };
			}} class="flex gap-3">
				<label for="newPassword" class="sr-only">New password</label>
				<input
					id="newPassword"
					name="newPassword"
					type="password"
					bind:value={newPassword}
					placeholder="New password (min 8 chars)"
					class="flex-1 rounded-lg bg-ph-card border border-white/8 text-ph-text placeholder-ph-muted
					       font-geist text-sm px-4 py-2.5
					       focus:outline-none focus:border-ph-accent/50 transition-colors"
				/>
				<button
					type="submit"
					disabled={newPassword.length < 8}
					class="font-geist text-sm font-medium text-ph-text bg-ph-accent/20 border border-ph-accent/40
					       hover:bg-ph-accent/30 hover:border-ph-accent/60 transition-colors px-4 py-2 rounded-lg cursor-pointer
					       disabled:opacity-40 disabled:cursor-not-allowed"
				>
					Reset
				</button>
			</form>
		</section>

		<!-- Collection entries -->
		<section aria-labelledby="collection-heading" class="rounded-xl bg-ph-surface border border-white/4 overflow-hidden">
			<div class="px-6 py-4 border-b border-white/4">
				<h2 id="collection-heading" class="font-geist font-bold text-sm text-ph-muted uppercase tracking-widest">
					Collection
					<span class="ml-2 font-normal text-ph-muted/60">({data.collection.length})</span>
				</h2>
			</div>

			{#if form?.collectionError}
				<div class="mx-6 my-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 font-geist text-sm px-4 py-2">
					{form.collectionError}
				</div>
			{/if}

			{#if data.collection.length === 0}
				<p class="px-6 py-8 font-geist text-sm text-ph-muted text-center">No cards in collection.</p>
			{:else}
				<table class="w-full">
					<thead>
						<tr class="border-b border-white/4">
							<th class="px-6 py-3 text-left font-geist text-xs text-ph-muted uppercase tracking-widest font-semibold">Card ID</th>
							<th class="px-4 py-3 text-left font-geist text-xs text-ph-muted uppercase tracking-widest font-semibold">Lang</th>
							<th class="px-4 py-3 text-right font-geist text-xs text-ph-muted uppercase tracking-widest font-semibold">Qty</th>
							<th class="px-4 py-3 text-left font-geist text-xs text-ph-muted uppercase tracking-widest font-semibold">Added</th>
							<th class="px-4 py-3"></th>
						</tr>
					</thead>
					<tbody>
						{#each data.collection as entry (entry.id)}
							<tr class="border-b border-white/4 hover:bg-white/2 transition-colors">
								<td class="px-6 py-2.5 font-geist text-sm text-ph-text font-mono">{entry.cardId}</td>
								<td class="px-4 py-2.5 font-geist text-sm text-ph-muted">{entry.language}</td>
								<td class="px-4 py-2.5 font-geist text-sm text-ph-muted text-right">{entry.quantity}</td>
								<td class="px-4 py-2.5 font-geist text-sm text-ph-muted">{formatDate(entry.addedAt)}</td>
								<td class="px-4 py-2.5 text-right">
									{#if confirmDeleteCollection === entry.id}
										<form method="POST" action="?/removeCollectionEntry" use:enhance={() => {
											return ({ update }) => { confirmDeleteCollection = null; update(); };
										}} class="inline-flex gap-1">
											<input type="hidden" name="entryId" value={entry.id} />
											<button type="submit" class="font-geist text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-500/40 cursor-pointer transition-colors">
												Confirm
											</button>
											<button type="button" on:click={() => confirmDeleteCollection = null} class="font-geist text-xs text-ph-muted px-2 py-1 cursor-pointer">
												Cancel
											</button>
										</form>
									{:else}
										<button
											type="button"
											on:click={() => confirmDeleteCollection = entry.id}
											class="font-geist text-xs text-ph-muted hover:text-red-400 transition-colors px-2 py-1 rounded border border-white/8 hover:border-red-500/40 cursor-pointer"
										>
											Remove
										</button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</section>

		<!-- Chase entries -->
		<section aria-labelledby="chase-heading" class="rounded-xl bg-ph-surface border border-white/4 overflow-hidden">
			<div class="px-6 py-4 border-b border-white/4">
				<h2 id="chase-heading" class="font-geist font-bold text-sm text-ph-muted uppercase tracking-widest">
					Chase List
					<span class="ml-2 font-normal text-ph-muted/60">({data.chase.length})</span>
				</h2>
			</div>

			{#if form?.chaseError}
				<div class="mx-6 my-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 font-geist text-sm px-4 py-2">
					{form.chaseError}
				</div>
			{/if}

			{#if data.chase.length === 0}
				<p class="px-6 py-8 font-geist text-sm text-ph-muted text-center">No chase cards.</p>
			{:else}
				<table class="w-full">
					<thead>
						<tr class="border-b border-white/4">
							<th class="px-6 py-3 text-left font-geist text-xs text-ph-muted uppercase tracking-widest font-semibold">Card</th>
							<th class="px-4 py-3 text-left font-geist text-xs text-ph-muted uppercase tracking-widest font-semibold">Set</th>
							<th class="px-4 py-3 text-left font-geist text-xs text-ph-muted uppercase tracking-widest font-semibold">Added</th>
							<th class="px-4 py-3"></th>
						</tr>
					</thead>
					<tbody>
						{#each data.chase as entry (entry.id)}
							<tr class="border-b border-white/4 hover:bg-white/2 transition-colors">
								<td class="px-6 py-2.5 font-geist text-sm text-ph-text">{entry.cardSnapshot.name}</td>
								<td class="px-4 py-2.5 font-geist text-sm text-ph-muted">{entry.cardSnapshot.setName}</td>
								<td class="px-4 py-2.5 font-geist text-sm text-ph-muted">{formatDate(entry.addedAt)}</td>
								<td class="px-4 py-2.5 text-right">
									{#if confirmDeleteChase === entry.id}
										<form method="POST" action="?/removeChaseEntry" use:enhance={() => {
											return ({ update }) => { confirmDeleteChase = null; update(); };
										}} class="inline-flex gap-1">
											<input type="hidden" name="entryId" value={entry.id} />
											<button type="submit" class="font-geist text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-500/40 cursor-pointer transition-colors">
												Confirm
											</button>
											<button type="button" on:click={() => confirmDeleteChase = null} class="font-geist text-xs text-ph-muted px-2 py-1 cursor-pointer">
												Cancel
											</button>
										</form>
									{:else}
										<button
											type="button"
											on:click={() => confirmDeleteChase = entry.id}
											class="font-geist text-xs text-ph-muted hover:text-red-400 transition-colors px-2 py-1 rounded border border-white/8 hover:border-red-500/40 cursor-pointer"
										>
											Remove
										</button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</section>

		<!-- Danger zone -->
		<section aria-labelledby="danger-heading" class="rounded-xl bg-red-950/20 border border-red-900/30 px-6 py-5">
			<h2 id="danger-heading" class="font-geist font-bold text-sm text-red-400 uppercase tracking-widest mb-3">Danger Zone</h2>
			<p class="font-geist text-sm text-ph-muted mb-4">
				Permanently delete this user and all their data. This cannot be undone.
			</p>

			{#if form?.deleteError}
				<div class="mb-4 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 font-geist text-sm px-4 py-2">
					{form.deleteError}
				</div>
			{/if}

			{#if confirmDelete}
				<form method="POST" action="?/deleteUser" use:enhance class="flex items-center gap-3">
					<p class="font-geist text-sm text-red-300">Are you sure?</p>
					<button type="submit" class="font-geist text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors px-4 py-2 rounded-lg cursor-pointer">
						Delete Forever
					</button>
					<button type="button" on:click={() => confirmDelete = false} class="font-geist text-sm text-ph-muted hover:text-ph-text transition-colors cursor-pointer">
						Cancel
					</button>
				</form>
			{:else}
				<button
					type="button"
					on:click={() => confirmDelete = true}
					class="font-geist text-sm font-medium text-red-400 border border-red-700/40 hover:border-red-500 hover:text-red-300 transition-colors px-4 py-2 rounded-lg cursor-pointer"
				>
					Delete User
				</button>
			{/if}
		</section>
	</div>
</div>
