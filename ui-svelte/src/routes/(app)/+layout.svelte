<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { LayoutData } from './$types';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { initWs, destroyWs } from '$lib/ws';

	export let data: LayoutData;

	onMount(() => initWs());
	onDestroy(() => destroyWs());
</script>

<div class="flex h-screen bg-ph-bg overflow-hidden">
	<Sidebar isAdmin={data.isAdmin} />
	<main class="flex-1 overflow-y-auto">
		<div class="max-w-5xl mx-auto px-8 py-10">
			<slot />
		</div>
	</main>
</div>

<Toast />
