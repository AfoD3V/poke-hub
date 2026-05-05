<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';

	export let form: ActionData;

	let loading = false;
	let showPassword = false;
</script>

<svelte:head>
	<title>Sign In — PokeHub</title>
</svelte:head>

<div
	class="bg-ph-card border border-ph-border rounded-2xl p-8 shadow-glow-purple
		    transition-shadow duration-300 hover:shadow-glow-purple-hover"
>
	<div class="mb-7">
		<h1 class="font-syne font-bold text-xl text-ph-text leading-tight">Welcome back</h1>
		<p class="text-ph-muted text-sm mt-1 font-dm">Sign in to your collection</p>
	</div>

	<!-- Error message -->
	{#if form?.error}
		<div
			role="alert"
			class="mb-5 px-4 py-3 rounded-lg bg-red-950/50 border border-red-800/60
				   text-red-400 text-sm font-dm flex items-center gap-2"
		>
			<svg
				class="w-4 h-4 shrink-0"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="8" x2="12" y2="12" />
				<line x1="12" y1="16" x2="12.01" y2="16" />
			</svg>
			{form.error}
		</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				await update();
				loading = false;
			};
		}}
	>
		<div class="space-y-5">
			<!-- Email -->
			<div>
				<label for="email" class="auth-label">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					class="form-input"
					placeholder="trainer@pokehub.app"
					autocomplete="email"
					required
					value={form?.email ?? ''}
				/>
			</div>

			<!-- Password -->
			<div>
				<label for="password" class="auth-label">Password</label>
				<div class="relative">
					<input
						id="password"
						name="password"
						type={showPassword ? 'text' : 'password'}
						class="form-input pr-10"
						placeholder="••••••••"
						autocomplete="current-password"
						required
					/>
					<button
						type="button"
						class="absolute right-3 top-1/2 -translate-y-1/2 text-ph-muted
							   hover:text-ph-text transition-colors"
						on:click={() => (showPassword = !showPassword)}
						aria-label={showPassword ? 'Hide password' : 'Show password'}
					>
						{#if showPassword}
							<!-- Eye-off icon -->
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
								<path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
								<line x1="1" y1="1" x2="23" y2="23" />
							</svg>
						{:else}
							<!-- Eye icon -->
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
								<circle cx="12" cy="12" r="3" />
							</svg>
						{/if}
					</button>
				</div>
			</div>
		</div>

		<!-- Submit -->
		<button type="submit" class="btn-primary mt-8" disabled={loading}>
			{#if loading}
				<span class="flex items-center justify-center gap-2">
					<svg
						class="animate-spin w-4 h-4"
						fill="none"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
					</svg>
					Signing in…
				</span>
			{:else}
				Sign In
			{/if}
		</button>
	</form>
</div>
