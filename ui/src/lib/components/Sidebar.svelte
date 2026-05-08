<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

	const navLinks = [
		{ href: '/home', label: 'Home', icon: 'home' },
		{ href: '/search', label: 'Search', icon: 'search' },
		{ href: '/collection', label: 'Collection', icon: 'collection' }
	];

	$: pathname = $page.url.pathname;

	function isActive(href: string): boolean {
		return pathname === href || (href !== '/home' && pathname.startsWith(href));
	}
</script>

<aside
	class="flex flex-col h-screen w-56 shrink-0 bg-ph-surface border-r border-white/5"
	aria-label="Sidebar"
>
	<!-- Brand -->
	<div class="px-5 py-5 border-b border-white/5">
		<span class="font-syne font-extrabold text-xl tracking-tight">
			<span class="text-ph-text">Poke</span><span class="text-ph-purple-light">Hub</span>
		</span>
	</div>

	<!-- Nav links -->
	<nav aria-label="Main navigation" class="flex-1 px-3 py-4 flex flex-col gap-1">
		{#each navLinks as link}
			<a
				href={link.href}
				class="flex items-center gap-3 px-3 py-2 rounded-lg font-dm text-sm transition-colors
				       focus-visible:outline focus-visible:outline-2 focus-visible:outline-ph-purple-light
				       {isActive(link.href)
					? 'bg-ph-purple/20 text-ph-purple-light font-medium'
					: 'text-ph-muted hover:text-ph-text hover:bg-white/5'}"
				aria-current={isActive(link.href) ? 'page' : undefined}
			>
				{#if link.icon === 'home'}
					<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
						<polyline points="9 22 9 12 15 12 15 22"/>
					</svg>
				{:else if link.icon === 'search'}
					<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<circle cx="11" cy="11" r="8"/>
						<line x1="21" y1="21" x2="16.65" y2="16.65"/>
					</svg>
				{:else if link.icon === 'collection'}
					<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<rect x="2" y="3" width="20" height="14" rx="2"/>
						<line x1="8" y1="21" x2="16" y2="21"/>
						<line x1="12" y1="17" x2="12" y2="21"/>
					</svg>
				{/if}
				{link.label}
			</a>
		{/each}
	</nav>

	<!-- Logout -->
	<div class="px-3 py-4 border-t border-white/5">
		<form method="POST" action="/auth/logout" use:enhance>
			<button
				type="submit"
				class="flex items-center gap-3 w-full px-3 py-2 rounded-lg font-dm text-sm text-ph-muted
				       hover:text-red-400 hover:bg-red-950/20 transition-colors
				       focus-visible:outline focus-visible:outline-2 focus-visible:outline-ph-purple-light"
			>
				<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
					<polyline points="16 17 21 12 16 7"/>
					<line x1="21" y1="12" x2="9" y2="12"/>
				</svg>
				Sign out
			</button>
		</form>
	</div>
</aside>
