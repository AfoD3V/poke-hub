<script lang="ts">
	import type { TcgCard } from '$shared/tcg';

	export let card: TcgCard;

	let container: HTMLDivElement;

	/**
	 * Updates CSS custom properties on mouse move to drive the holographic
	 * shine and perspective rotation. Normalises pointer position to a
	 * 0..100 range inside the card bounding box.
	 */
	function handleMouseMove(event: MouseEvent): void {
		if (!container) return;
		const rect = container.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width) * 100;
		const y = ((event.clientY - rect.top) / rect.height) * 100;
		container.style.setProperty('--mx', `${x}%`);
		container.style.setProperty('--my', `${y}%`);
	}

	function handleMouseLeave(): void {
		if (!container) return;
		container.style.setProperty('--mx', '50%');
		container.style.setProperty('--my', '50%');
	}

	const rarityToHue = (rarity?: string): number => {
		if (!rarity) return 280;
		const lower = rarity.toLowerCase();
		if (lower.includes('secret') || lower.includes('rainbow')) return 40;
		if (lower.includes('ultra') || lower.includes('hyper')) return 180;
		if (lower.includes('rare')) return 280;
		return 200;
	};

	$: holoHue = rarityToHue(card.rarity);
</script>

<div
	class="card-wrapper group"
	style="--holo-hue: {holoHue}"
	on:mousemove={handleMouseMove}
	on:mouseleave={handleMouseLeave}
	role="listitem"
>
	<div bind:this={container} class="card-container">
		<div class="card-image">
			{#if card.images?.small}
				<img src={card.images.small} alt={card.name} loading="lazy" />
			{:else}
				<div class="fallback" aria-label="No image available">
					<span>{card.name}</span>
				</div>
			{/if}
		</div>

		<!-- Holographic shine overlay -->
		<div class="shine-overlay" aria-hidden="true" />

		<!-- Foil grain texture -->
		<div class="grain-overlay" aria-hidden="true" />
	</div>

	<div class="card-info">
		<h3 class="card-name">{card.name}</h3>
		<p class="card-meta">{card.set} · {card.number}</p>
	</div>
</div>

<style>
	.card-wrapper {
		perspective: 1200px;
		cursor: pointer;
	}

	.card-container {
		position: relative;
		border-radius: 0.75rem;
		overflow: hidden;
		transform-style: preserve-3d;
		transition: transform 0.15s ease-out;
		will-change: transform;

		/* subtle tilt based on cursor */
		transform: rotateX(calc((var(--my, 50%) - 50%) * 0.24deg))
			rotateY(calc((var(--mx, 50%) - 50%) * -0.24deg));
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
	}

	.card-wrapper:hover .card-container {
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6),
			0 0 0 1px hsla(var(--holo-hue), 80%, 60%, 0.35);
	}

	.card-image img {
		width: 100%;
		height: auto;
		display: block;
		border-radius: 0.75rem;
	}

	.fallback {
		width: 100%;
		aspect-ratio: 2.5 / 3.5;
		background: linear-gradient(135deg, #1a1a2e, #16213e);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #a0a0b0;
		font-size: 0.875rem;
		border-radius: 0.75rem;
	}

	/* Holographic shine layer */
	.shine-overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: 0.75rem;
		mix-blend-mode: color-dodge;
		opacity: 0;
		transition: opacity 0.3s ease;
		background: radial-gradient(
			farthest-corner circle at var(--mx, 50%) var(--my, 50%),
			hsla(var(--holo-hue), 100%, 70%, 0.6) 0%,
			hsla(calc(var(--holo-hue) + 40), 100%, 60%, 0.4) 25%,
			hsla(calc(var(--holo-hue) + 80), 100%, 65%, 0.35) 45%,
			hsla(calc(var(--holo-hue) + 160), 100%, 60%, 0.25) 65%,
			transparent 100%
		);
	}

	.card-wrapper:hover .shine-overlay {
		opacity: 1;
	}

	/* Subtle foil grain */
	.grain-overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: 0.75rem;
		opacity: 0;
		mix-blend-mode: overlay;
		transition: opacity 0.3s ease;
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.12'/%3E%3C/svg%3E");
	}

	.card-wrapper:hover .grain-overlay {
		opacity: 0.4;
	}

	.card-info {
		margin-top: 0.75rem;
		text-align: center;
	}

	.card-name {
		font-family: 'Syne', sans-serif;
		font-weight: 700;
		font-size: 0.9rem;
		color: #e2e2ea;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-meta {
		font-family: 'DM Sans', sans-serif;
		font-size: 0.75rem;
		color: #8c8c9e;
		margin-top: 0.25rem;
	}
</style>
