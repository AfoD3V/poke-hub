<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

	export let isAdmin: boolean = false;

	const navLinks = [
		{ href: '/home', label: 'Home', icon: 'home' },
		{ href: '/search', label: 'Search', icon: 'search' },
		{ href: '/collection', label: 'Collection', icon: 'collection' }
	];

	const adminLinks = [
		{ href: '/admin', label: 'Dashboard', icon: 'dashboard' },
		{ href: '/admin/users', label: 'Users', icon: 'users' },
		{ href: '/admin/cache', label: 'Cache', icon: 'cache' }
	];

	$: pathname = $page.url.pathname;

	function isActive(href: string, path: string): boolean {
		if (href === '/admin') return path === '/admin';
		return path === href || (href !== '/home' && path.startsWith(href));
	}
</script>

<aside
	class="flex flex-col h-screen w-56 shrink-0 bg-ph-bg"
	style="box-shadow: 1px 0 0 0 rgba(255,255,255,0.05)"
	aria-label="Sidebar"
>
	<!-- Brand -->
	<div class="px-5 py-5 border-b border-white/5">
		<span class="font-black text-xl tracking-tight">
			<span class="text-ph-text">Poke</span><span class="text-ph-accent">Hub</span>
		</span>
	</div>

	<!-- Nav links -->
	<nav aria-label="Main navigation" class="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
		{#each navLinks as link (link.href)}
			<a
				href={link.href}
				class="flex items-center gap-3 py-2 pr-3 rounded-r-lg text-sm transition-colors
				       focus-visible:outline focus-visible:outline-2 focus-visible:outline-ph-accent
				       {isActive(link.href, pathname)
					? 'border-l-2 border-ph-accent text-ph-text font-medium pl-[10px]'
					: 'border-l-2 border-transparent text-ph-muted hover:text-ph-text pl-[10px]'}"
				aria-current={isActive(link.href, pathname) ? 'page' : undefined}
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

		<!-- Admin section -->
		{#if isAdmin}
			<div class="mt-4 mb-1 px-[10px]">
				<p class="text-[10px] font-semibold uppercase tracking-widest text-ph-muted/60">Admin</p>
			</div>
			{#each adminLinks as link (link.href)}
				<a
					href={link.href}
					class="flex items-center gap-3 py-2 pr-3 rounded-r-lg text-sm transition-colors
					       focus-visible:outline focus-visible:outline-2 focus-visible:outline-ph-accent
					       {isActive(link.href, pathname)
						? 'border-l-2 border-ph-accent text-ph-text font-medium pl-[10px]'
						: 'border-l-2 border-transparent text-ph-muted hover:text-ph-text pl-[10px]'}"
					aria-current={isActive(link.href, pathname) ? 'page' : undefined}
				>
					{#if link.icon === 'dashboard'}
						<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<rect x="3" y="3" width="7" height="7" rx="1"/>
							<rect x="14" y="3" width="7" height="7" rx="1"/>
							<rect x="3" y="14" width="7" height="7" rx="1"/>
							<rect x="14" y="14" width="7" height="7" rx="1"/>
						</svg>
					{:else if link.icon === 'users'}
						<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
							<circle cx="9" cy="7" r="4"/>
							<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
							<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
						</svg>
					{:else if link.icon === 'cache'}
						<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<ellipse cx="12" cy="5" rx="9" ry="3"/>
							<path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
							<path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
						</svg>
					{/if}
					{link.label}
				</a>
			{/each}
		{/if}
	</nav>

	<!-- Logout -->
	<div class="py-4 border-t border-white/5">
		<form method="POST" action="/auth/logout" use:enhance>
			<button
				type="submit"
				class="flex items-center gap-3 w-full py-2 pr-3 pl-[10px] rounded-r-lg text-sm text-ph-muted
				       border-l-2 border-transparent hover:text-ph-accent hover:border-ph-accent transition-colors
				       focus-visible:outline focus-visible:outline-2 focus-visible:outline-ph-accent"
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
