<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let value = 'en';

	const dispatch = createEventDispatcher<{ change: string }>();

	const LANGUAGES = [
		{ code: 'en', label: 'English' },
		{ code: 'ja', label: 'Japanese' },
		{ code: 'fr', label: 'French' },
		{ code: 'de', label: 'German' },
		{ code: 'es', label: 'Spanish' },
		{ code: 'it', label: 'Italian' },
		{ code: 'pt', label: 'Portuguese' }
	];

	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		value = target.value;
		dispatch('change', value);
	}
</script>

<select
	bind:value
	on:change={handleChange}
	class="form-input w-auto bg-ph-surface border border-ph-border text-ph-text text-sm font-geist rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ph-accent"
	aria-label="Search language"
>
	{#each LANGUAGES as lang (lang.code)}
		<option value={lang.code}>{lang.label}</option>
	{/each}
</select>
