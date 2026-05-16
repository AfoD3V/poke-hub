<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { SetItem } from '$shared/tcg';

	export let sets: SetItem[];

	const dispatch = createEventDispatcher<{ select: { id: string; label: string } }>();

	let query = '';
	let isOpen = false;
	let highlightedIndex = -1;

	$: isFallback = sets.length === 0;

	$: filtered = (() => {
		if (!query.trim()) return sets.slice(0, 10);
		const q = query.toLowerCase();
		return sets
			.filter((s) => {
				return (
					s.name.toLowerCase().includes(q) ||
					(s.abbreviation && s.abbreviation.toLowerCase().includes(q)) ||
					s.id.toLowerCase().startsWith(q)
				);
			})
			.slice(0, 10);
	})();

	$: activeDescendant =
		isOpen && highlightedIndex >= 0 ? `set-option-${highlightedIndex}` : undefined;

	function getLabel(s: SetItem): string {
		return s.abbreviation ? `${s.name} (${s.abbreviation})` : s.name;
	}

	function selectSet(s: SetItem) {
		const label = getLabel(s);
		query = label;
		isOpen = false;
		highlightedIndex = -1;
		dispatch('select', { id: s.id, label });
	}

	function handleInput() {
		isOpen = true;
		highlightedIndex = -1;
	}

	function handleFocus() {
		isOpen = true;
	}

	function handleBlur() {
		// Small delay so mousedown on an option fires before the listbox closes
		setTimeout(() => {
			isOpen = false;
			highlightedIndex = -1;
		}, 150);
	}

	function handleFallbackInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		dispatch('select', { id: value, label: value });
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (!isOpen && e.key !== 'ArrowDown' && e.key !== 'Enter') return;

		switch (e.key) {
			case 'ArrowDown':
				isOpen = true;
				highlightedIndex = Math.min(highlightedIndex + 1, filtered.length - 1);
				e.preventDefault();
				break;
			case 'ArrowUp':
				highlightedIndex = Math.max(highlightedIndex - 1, -1);
				e.preventDefault();
				break;
			case 'Enter':
				if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
					selectSet(filtered[highlightedIndex]);
				}
				e.preventDefault();
				break;
			case 'Escape':
				isOpen = false;
				highlightedIndex = -1;
				break;
		}
	}
</script>

{#if isFallback}
	<!-- Fallback: plain text input when sets list unavailable -->
	<input
		type="text"
		placeholder="Set ID (e.g. sv03.5)"
		class="form-input"
		aria-label="Set ID"
		on:input={handleFallbackInput}
	/>
{:else}
	<div class="relative">
		<input
			type="text"
			role="combobox"
			aria-expanded={isOpen}
			aria-autocomplete="list"
			aria-activedescendant={activeDescendant}
			aria-controls="set-picker-listbox"
			aria-label="Set"
			bind:value={query}
			placeholder="Search sets by name, abbreviation, or ID…"
			class="form-input w-full"
			on:input={handleInput}
			on:focus={handleFocus}
			on:blur={handleBlur}
			on:keydown={handleKeyDown}
		/>

		{#if isOpen}
			<ul
				id="set-picker-listbox"
				role="listbox"
				class="absolute z-10 w-full mt-1 bg-ph-surface border border-ph-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
			>
				{#if filtered.length === 0}
					<li class="px-4 py-2 text-sm font-geist text-ph-muted select-none">No sets found</li>
				{:else}
					{#each filtered as set, i (set.id)}
						<li
							id="set-option-{i}"
							role="option"
							aria-selected={highlightedIndex === i}
							class="px-4 py-2 text-sm font-geist cursor-pointer {highlightedIndex === i
								? 'bg-ph-accent text-white'
								: 'text-ph-text hover:bg-ph-border'}"
							on:mousedown|preventDefault={() => selectSet(set)}
						>
							{getLabel(set)}
						</li>
					{/each}
				{/if}
			</ul>
		{/if}
	</div>
{/if}
