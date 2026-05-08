<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
</script>

<div class="flex h-screen bg-ph-bg overflow-hidden">
	<Sidebar />
	<main class="flex-1 overflow-y-auto">
		<slot />
	</main>
</div>
