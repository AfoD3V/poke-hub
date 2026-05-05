<script lang="ts">
	import { page } from '$app/stores';
</script>

<!--
	Auth layout: full-screen dark background with centered card.
	Ambient purple glow from the top to set the premium tone.
-->
<div class="min-h-screen bg-ph-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
	<!-- Ambient radial glow top-center -->
	<div
		class="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full
			   bg-purple-900/20 blur-[120px] pointer-events-none"
		aria-hidden="true"
	></div>

	<!-- Subtle background grid -->
	<div
		class="absolute inset-0 pointer-events-none"
		style="background-image: linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px),
				linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px);
			   background-size: 40px 40px;"
		aria-hidden="true"
	></div>

	<!-- Auth card -->
	<div class="relative z-10 w-full max-w-[420px]">
		<!-- PokeHub wordmark -->
		<div class="text-center mb-8">
			<span class="font-syne font-extrabold text-3xl tracking-tight">
				<span class="text-ph-text">Poke</span><span class="text-ph-purple-light">Hub</span>
			</span>
			<p class="text-ph-muted text-xs font-dm mt-1 tracking-widest uppercase">Card Collection Manager</p>
		</div>

		<!-- Slot for login / register pages -->
		<slot />

		<!-- Auth navigation footer -->
		<p class="text-center text-ph-muted text-sm mt-6 font-dm">
			{#if $page.url.pathname.includes('/register')}
				Already have an account?
				<a
					href="/auth/login"
					class="text-ph-purple-light hover:text-white transition-colors duration-150 font-medium"
				>Sign in</a>
			{:else}
				New to PokeHub?
				<a
					href="/auth/register"
					class="text-ph-purple-light hover:text-white transition-colors duration-150 font-medium"
				>Create account</a>
			{/if}
		</p>
	</div>
</div>
