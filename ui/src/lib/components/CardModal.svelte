<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { spring } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import type { TcgCard } from '$shared/tcg';

	export let card: TcgCard;

	const dispatch = createEventDispatcher<{ close: void }>();

	// ── Add-to-collection state ───────────────────────────────────────────────
	type AddState = 'idle' | 'loading' | 'success' | 'error';
	let addState: AddState = 'idle';
	let addError = '';

	async function addToCollection() {
		if (addState === 'loading' || addState === 'success') return;
		addState = 'loading';
		addError = '';
		try {
			const res = await fetch('/api/collection/add', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ cardId: card.id, card })
			});
			if (!res.ok) {
				const body = await res.json() as { error?: string };
				throw new Error(body.error ?? `Request failed (${res.status})`);
			}
			addState = 'success';
		} catch (e) {
			addError = e instanceof Error ? e.message : 'Failed to add card';
			addState = 'error';
		}
	}

	// ── Math helpers ──────────────────────────────────────────────────────────
	const round  = (v: number, p = 3) => parseFloat(v.toFixed(p));
	const clamp  = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
	const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) =>
		round(tMin + (tMax - tMin) * ((v - fMin) / (fMax - fMin)));

	// ── Rarity normalisation (mirrors Card.svelte) ────────────────────────────
	function resolveRarity(raw: string): string {
		const r = raw.toLowerCase().trim();
		if (r.endsWith('reverse holo'))                                          return r;
		if (r === 'rare holo cosmos')                                            return 'rare holo cosmos';
		if (r === 'rare holo v')                                                 return 'rare holo v';
		if (r === 'rare holo vmax' || r === 'rare holo vstar')                   return 'rare holo vmax';
		if (r.startsWith('rare holo'))                                           return 'rare holo';
		if (r === 'rare rainbow')                                                return 'rare rainbow';
		if (r === 'rare secret' || r === 'hyper rare' || r === 'ace spec rare')  return 'rare secret';
		if (r === 'rare ultra'  || r === 'double rare' || r === 'ultra rare')    return 'rare ultra';
		if (r === 'rare shiny'  || r === 'rare shiny gx' || r === 'rare shining' || r === 'legend') return 'rare ultra';
		if (r === 'rare prime'  || r === 'rare prism star')                      return 'rare holo';
		if (r === 'special illustration rare' || r === 'illustration rare')      return 'illustration rare';
		if (r === 'amazing rare')                                                return 'amazing rare';
		return r;
	}

	$: dataRarity   = resolveRarity(card.rarity ?? '');
	$: subtypesStr  = (card.subtypes  ?? []).join(' ').toLowerCase();
	$: supertypeStr = (card.supertype ?? '').toLowerCase();
	$: typesStr     = (card.types     ?? []).join(' ').toLowerCase();

	// ── Flip state ────────────────────────────────────────────────────────────
	let flipped  = false;
	let closing  = false;

	// ── Independent spring stores for the modal card ──────────────────────────
	const seed = { x: Math.random(), y: Math.random() };
	const SI = { stiffness: 0.066, damping: 0.25 };
	const SS = { stiffness: 0.01,  damping: 0.06  };

	const springRotate = spring({ x: 0,  y: 0  }, SI);
	const springGlare  = spring({ x: 50, y: 50, o: 0 }, SI);
	const springBg     = spring({ x: 50, y: 50 }, SI);
	let interacting = false;

	function interact(e: PointerEvent) {
		interacting = true;
		const el   = e.currentTarget as HTMLElement;
		const rect = el.getBoundingClientRect();
		const pct  = {
			x: clamp(round((100 / rect.width)  * (e.clientX - rect.left))),
			y: clamp(round((100 / rect.height) * (e.clientY - rect.top))),
		};
		const center = { x: pct.x - 50, y: pct.y - 50 };
		springRotate.stiffness = SI.stiffness; springRotate.damping = SI.damping;
		springGlare.stiffness  = SI.stiffness; springGlare.damping  = SI.damping;
		springBg.stiffness     = SI.stiffness; springBg.damping     = SI.damping;
		springRotate.set({ x: round(-(center.x / 3.5)), y: round(center.y / 3.5) });
		springGlare.set({ x: pct.x, y: pct.y, o: 1 });
		springBg.set({ x: adjust(pct.x, 0, 100, 37, 63), y: adjust(pct.y, 0, 100, 33, 67) });
	}

	function interactEnd() {
		interacting = false;
		springRotate.stiffness = SS.stiffness; springRotate.damping = SS.damping;
		springGlare.stiffness  = SS.stiffness; springGlare.damping  = SS.damping;
		springBg.stiffness     = SS.stiffness; springBg.damping     = SS.damping;
		springRotate.set({ x: 0,  y: 0  }, { soft: 1 });
		springGlare.set({ x: 50, y: 50, o: 0 }, { soft: 1 });
		springBg.set({ x: 50, y: 50 }, { soft: 1 });
	}

	$: dynStyles = `
		--pointer-x:           ${$springGlare.x}%;
		--pointer-y:           ${$springGlare.y}%;
		--pointer-from-center: ${clamp(Math.sqrt(($springGlare.y-50)**2+($springGlare.x-50)**2)/50,0,1)};
		--pointer-from-top:    ${$springGlare.y / 100};
		--pointer-from-left:   ${$springGlare.x / 100};
		--card-opacity:        ${$springGlare.o};
		--rotate-x:            ${$springRotate.x}deg;
		--rotate-y:            ${$springRotate.y}deg;
		--background-x:        ${$springBg.x}%;
		--background-y:        ${$springBg.y}%;
		--seedx:               ${seed.x};
		--seedy:               ${seed.y};
	`;

	// ── Lifecycle ─────────────────────────────────────────────────────────────
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}

	function close() {
		if (closing) return;
		closing = true;
		interactEnd();
		flipped = false;
		// Wait for flip-back animation then emit close
		setTimeout(() => dispatch('close'), 650);
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		// Trigger flip after two rAF to let the DOM settle
		requestAnimationFrame(() => requestAnimationFrame(() => { flipped = true; }));
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

<!-- Backdrop: click-to-close on the overlay itself (not its children) -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
	class="overlay"
	on:click={(e) => e.target === e.currentTarget && close()}
	on:keydown={(e) => e.key === 'Escape' && close()}
	transition:fade={{ duration: 220 }}
	role="dialog"
	aria-modal="true"
	aria-label="Card detail — {card.name}"
	tabindex="-1"
>
	<!-- ── Close button — top-right corner of overlay ─────────────────────── -->
	<button class="close-btn" on:click={close} aria-label="Close">×</button>

	<!-- ── 3-D flip container — absolute, slightly left of centre ────────── -->
	<!--
		The drop-shadow MUST be on an outer wrapper — applying filter directly
		to the flip-wrap flattens transform-style:preserve-3d for its children,
		silently disabling backface-visibility:hidden on both face elements.
	-->
	<div class="flip-shadow-wrap">
		<div class="flip-wrap" class:flipped>

		<!-- BACK FACE (visible on open) -->
		<!--
			IMPORTANT: overflow:hidden must NOT be on .face itself — it creates a
			CSS stacking context that breaks backface-visibility:hidden.
			border-radius clipping lives on the img element instead.
		-->
		<div class="face face--back">
			<div class="face-inner">
				<img
					src="https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg"
					alt="Card back"
					width="660"
					height="921"
					draggable="false"
				/>
			</div>
		</div>

		<!-- FRONT FACE (revealed after flip, with full holo) -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="face face--front card {typesStr}"
			class:interacting
			data-rarity={dataRarity}
			data-subtypes={subtypesStr}
			data-supertype={supertypeStr}
			style={dynStyles}
			on:pointermove={interact}
			on:pointerleave={interactEnd}
		>
			<div class="face-inner">
				<div class="card__perspective">
					<div class="card__rotator">
						<img
							src={card.images.large ?? card.images.small}
							alt={card.name}
							width="660"
							height="921"
							draggable="false"
						/>
						<div class="card__shine" aria-hidden="true"></div>
						<div class="card__glare"  aria-hidden="true"></div>
					</div>
				</div>
			</div>
		</div>
		</div><!-- /flip-wrap -->
	</div><!-- /flip-shadow-wrap -->

	<!-- ── Info panel — floating aside, right side of overlay ────────────── -->
	<aside class="info-panel">
		<div class="info-scroll">
			<h2 class="card-title">{card.name}</h2>

			{#if card.rarity}
				<span class="rarity-pill">{card.rarity}</span>
			{/if}

			<p class="set-line">{card.set} &middot; #{card.number}</p>

			<dl class="stats">
				{#if card.hp}
					<div class="stat-row">
						<dt>HP</dt>
						<dd>{card.hp}</dd>
					</div>
				{/if}
				{#if card.types?.length}
					<div class="stat-row">
						<dt>Type</dt>
						<dd>{card.types.join(' / ')}</dd>
					</div>
				{/if}
				{#if card.supertype}
					<div class="stat-row">
						<dt>Category</dt>
						<dd>{card.supertype}</dd>
					</div>
				{/if}
				{#if card.subtypes?.length}
					<div class="stat-row">
						<dt>Stage</dt>
						<dd>{card.subtypes.join(', ')}</dd>
					</div>
				{/if}
				{#if card.artist}
					<div class="stat-row">
						<dt>Artist</dt>
						<dd>{card.artist}</dd>
					</div>
				{/if}
			</dl>

			{#if card.flavorText}
				<p class="flavor">"{card.flavorText}"</p>
			{/if}
		</div>

		<!-- Add to collection -->
		<div class="action-row">
			<button
				class="add-btn"
				class:add-btn--success={addState === 'success'}
				class:add-btn--error={addState === 'error'}
				disabled={addState === 'loading' || addState === 'success'}
				on:click={addToCollection}
				aria-label="Add {card.name} to collection"
			>
				{#if addState === 'idle' || addState === 'error'}
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
					</svg>
					{addState === 'error' ? 'Retry' : 'Add to Collection'}
				{:else if addState === 'loading'}
					<svg class="w-4 h-4 spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					Adding…
				{:else}
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<polyline points="20 6 9 17 4 12"/>
					</svg>
					Added!
				{/if}
			</button>
			{#if addState === 'error'}
				<p class="add-error">{addError}</p>
			{/if}
			{#if addState === 'success'}
				<a href="/collection" class="collection-link">View Collection →</a>
			{/if}
		</div>
	</aside>
</div>

<style>
	/* ── Overlay — sole positioning parent ──────────────────────────────────*/
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(4, 4, 14, 0.88);
		backdrop-filter: blur(12px);
	}

	/* ── Flip shadow wrapper — floating card, slightly left of centre ────────*/
	/* filter lives here, NOT on flip-wrap: filter on a preserve-3d element
	   flattens 3D space and breaks backface-visibility on child faces */
	.flip-shadow-wrap {
		position: absolute;
		top: 50%;
		left: 32%;
		transform: translate(-50%, -50%);
		width: min(320px, 40vw);
		aspect-ratio: 0.718;
		filter: drop-shadow(0 30px 60px rgba(0,0,0,0.85));
	}
	@media (max-width: 680px) {
		.flip-shadow-wrap {
			left: 50%;
			top: 35%;
			width: min(260px, 72vw);
		}
	}

	/* ── Flip wrap ───────────────────────────────────────────────────────────*/
	.flip-wrap {
		position: absolute;
		inset: 0;
		transform-style: preserve-3d;
		/* Start showing back face — will rotate to reveal front */
		transform: rotateY(0deg);
		transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
		/* NO filter here — filter flattens preserve-3d and breaks backface-visibility */
	}
	.flip-wrap.flipped {
		transform: rotateY(180deg);
	}

	/* ── Both faces ──────────────────────────────────────────────────────────*/
	/*
	   CRITICAL: .face must NOT have overflow:hidden or clip-path — both create
	   a CSS stacking context that silently disables backface-visibility:hidden,
	   causing both faces to render simultaneously on top of each other.
	   The clipping/rounding lives on .face-inner (a plain nested div) instead.
	*/
	.face {
		position: absolute;
		inset: 0;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
	}

	/* No overflow:hidden here — the tilt (card__rotator) extends the card beyond
	   face-inner's bounds at steep angles; clipping there is the "invisible frame" bug.
	   The flip is governed by backface-visibility on .face, not by overflow clipping.
	   Rounded corners are applied directly on the img elements instead. */
	.face-inner {
		position: absolute;
		inset: 0;
	}

	.face-inner img {
		width: 100%; height: 100%;
		object-fit: cover;
		display: block;
		border-radius: 4.55% / 3.5%;
		user-select: none;
		-webkit-user-drag: none;
	}

	/* Back face: standard orientation */
	.face--back { transform: rotateY(0deg); }

	/* Front face: starts inverted, readable when container is at 180° */
	.face--front {
		transform: rotateY(-180deg);
	}

	/* ── Front face card holo setup ──────────────────────────────────────────*/
	.card {
		/* Sunpillar palette */
		--sunpillar-1: hsl(2,   100%, 73%);
		--sunpillar-2: hsl(53,  100%, 69%);
		--sunpillar-3: hsl(93,  100%, 69%);
		--sunpillar-4: hsl(176, 100%, 76%);
		--sunpillar-5: hsl(228, 100%, 74%);
		--sunpillar-6: hsl(283, 100%, 73%);
		--sunpillar-clr-1: var(--sunpillar-1);
		--sunpillar-clr-2: var(--sunpillar-2);
		--sunpillar-clr-3: var(--sunpillar-3);
		--sunpillar-clr-4: var(--sunpillar-4);
		--sunpillar-clr-5: var(--sunpillar-5);
		--sunpillar-clr-6: var(--sunpillar-6);
		/* Vivid colors for regular holo scanlines */
		--red: #f80e35; --yellow: #eedf10; --green: #21e985;
		--blue: #0dbde9; --violet: #c929f1;
		/* Texture images */
		--grain:    url("/img/grain.webp");
		--glitter:  url("/img/glitter.png");
		--glittersize: 25%;
		/* Geometry */
		--card-aspect:  0.718;
		--card-radius:  4.55% / 3.5%;
		--space: 5%;
		--angle: 133deg;
		/* Art-area clip paths */
		--clip:              inset(9.85% 8% 52.85% 8%);
		--clip-stage:        polygon(91.5% 9.85%, 57% 9.85%, 54% 12%, 17% 12%, 16% 14%, 12% 16%, 8% 16%, 8% 47.15%, 92% 47.15%);
		--clip-trainer:      inset(14.5% 8.5% 48.2% 8.5%);
		--clip-invert:       polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0 47.15%, 91.5% 47.15%, 91.5% 9.85%, 8% 9.85%, 8% 47.15%, 0 50%);
		--clip-stage-invert: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0 47.15%, 91.5% 47.15%, 91.5% 9.85%, 57% 9.85%, 54% 12%, 17% 12%, 16% 14%, 12% 16%, 8% 16%, 8% 47.15%, 0 50%);
		--clip-borders:      inset(2.8% 4% round 2.55% / 1.5%);
		--card-glow:    hsl(0, 90%, 44%);
	}
	.card.water     { --card-glow: hsl(192, 97%, 60%); }
	.card.fire      { --card-glow: hsl(9,   81%, 59%); }
	.card.grass     { --card-glow: hsl(96,  81%, 65%); }
	.card.lightning { --card-glow: hsl(54,  87%, 63%); }
	.card.psychic   { --card-glow: hsl(281, 62%, 58%); }
	.card.fighting  { --card-glow: rgb(145, 90, 39);   }
	.card.darkness  { --card-glow: hsl(189, 77%, 27%); }
	.card.metal     { --card-glow: hsl(184, 20%, 70%); }
	.card.dragon    { --card-glow: hsl(51,  60%, 35%); }
	.card.fairy     { --card-glow: hsl(323, 100%, 89%); }

	/* Perspective wrapper preserves 3-D in the flipped container */
	.card__perspective {
		width: 100%; height: 100%;
		perspective: 600px;
		transform-style: preserve-3d;
	}

	/* Rotator applies the spring tilt on top of the card-large image */
	.card__rotator {
		width: 100%; height: 100%;
		border-radius: var(--card-radius);
		display: grid;
		transform-style: preserve-3d;
		transform: rotateY(var(--rotate-x, 0deg)) rotateX(var(--rotate-y, 0deg));
		will-change: transform;
		transition: box-shadow 0.4s ease;
		box-shadow: 0 8px 30px -4px rgba(0,0,0,.7);
	}
	.card:not(.interacting) .card__rotator {
		transition: transform 0.5s cubic-bezier(.03,.98,.52,.99), box-shadow 0.4s ease;
	}
	.card.interacting .card__rotator,
	.card__rotator:hover {
		box-shadow:
			0 0  4px -1px white,
			0 0  5px  2px var(--card-glow),
			0 0 20px  4px var(--card-glow),
			0 16px 40px -8px black,
			0 0 60px -20px var(--card-glow);
	}

	/* All children of rotator share the grid cell */
	.card__rotator,
	.card__rotator > * {
		width: 100%;
	}
	.card__rotator > * {
		display: grid; grid-area: 1/1;
		aspect-ratio: var(--card-aspect);
		border-radius: var(--card-radius);
		/* overflow: hidden removed — shine/glare have only CSS backgrounds that are clipped
		   by border-radius alone; overflow: hidden inside preserve-3d creates a 2D stacking
		   context the GPU clips as a flat rect, causing edge dropout at tilt angles */
	}
	.card__rotator img {
		height: 100%; width: 100%;
		display: block; object-fit: cover;
		transform: translateZ(0.01px);
		user-select: none;
	}

	/* ── Base Shine (color-dodge foil) — contrast 2.75 matches reference ────*/
	.card__shine {
		transform: translateZ(1px); z-index: 3;
		filter: brightness(.85) contrast(2.75) saturate(.65);
		mix-blend-mode: color-dodge;
		opacity: var(--card-opacity);
		will-change: opacity, background-position, background-image;
	}
	.card__shine::before, .card__shine::after {
		content: ""; display: block; grid-area: 1/1;
		transform: translateZ(1px); border-radius: var(--card-radius);
	}
	/* Pseudo-elements shift the sunpillar color aliases for richer layering */
	.card__shine::before {
		--sunpillar-clr-1: var(--sunpillar-5);
		--sunpillar-clr-2: var(--sunpillar-6);
		--sunpillar-clr-3: var(--sunpillar-1);
		--sunpillar-clr-4: var(--sunpillar-2);
		--sunpillar-clr-5: var(--sunpillar-3);
		--sunpillar-clr-6: var(--sunpillar-4);
	}
	.card__shine::after {
		--sunpillar-clr-1: var(--sunpillar-6);
		--sunpillar-clr-2: var(--sunpillar-1);
		--sunpillar-clr-3: var(--sunpillar-2);
		--sunpillar-clr-4: var(--sunpillar-3);
		--sunpillar-clr-5: var(--sunpillar-4);
		--sunpillar-clr-6: var(--sunpillar-5);
		transform: translateZ(1.2px);
	}

	/* ── Base Glare (overlay specular) ───────────────────────────────────────*/
	.card__glare {
		transform: translateZ(1.41px); z-index: 4;
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsla(0, 0%, 100%, 0.8) 10%, hsla(0, 0%, 100%, 0.65) 20%, hsla(0, 0%, 0%, 0.5) 90%
		);
		mix-blend-mode: overlay;
		opacity: var(--card-opacity);
		will-change: opacity, background-image;
	}
	.card__glare::after {
		content: ""; display: block; grid-area: 1/1; border-radius: var(--card-radius);
	}

	/* ═══════════════════════════════════════════════════════════════════
	   RARITY EFFECTS — ported from simeydotme/pokemon-cards-css reference
	═══════════════════════════════════════════════════════════════════ */

	/* ── Rare Holo ───────────────────────────────────────────────────────────*/
	.card[data-rarity="rare holo"] .card__shine {
		clip-path: var(--clip);
		background-image:
			repeating-linear-gradient(110deg,
				var(--violet), var(--blue), var(--green), var(--yellow), var(--red),
				var(--violet), var(--blue), var(--green), var(--yellow), var(--red),
				var(--violet), var(--blue), var(--green), var(--yellow), var(--red)
			),
			repeating-linear-gradient(90deg, #000 0px, #000 2px, #666 2px, #666 4px);
		background-position:
			calc(((50% - var(--background-x)) * 2.6) + 50%) calc(((50% - var(--background-y)) * 3.5) + 50%),
			center center;
		background-size: 400% 400%, cover;
		background-blend-mode: overlay;
		filter: brightness(1.1) contrast(1.1) saturate(1.2);
		mix-blend-mode: color-dodge;
		opacity: calc(var(--card-opacity) * 0.75);
	}
	.card[data-rarity="rare holo"][data-subtypes^="stage"] .card__shine { clip-path: var(--clip-stage); }
	.card[data-rarity="rare holo"][data-subtypes^="supporter"] .card__shine,
	.card[data-rarity="rare holo"][data-subtypes^="item"] .card__shine { clip-path: var(--clip-trainer); }

	.card[data-rarity="rare holo"] .card__shine::before {
		background-image:
			repeating-linear-gradient(90deg,
				rgba(0,0,0,1) calc(3%*2), rgba(100,100,100,1) calc(3%*3),
				rgba(0,0,0,1) calc(3%*3.5), rgba(100,100,100,1) calc(3%*4),
				rgba(0,0,0,1) calc(3%*5), rgba(0,0,0,1) calc(3%*14)
			),
			repeating-linear-gradient(90deg,
				rgba(0,0,0,1) calc(3%*2), rgba(100,100,100,1) calc(3%*3),
				rgba(0,0,0,1) calc(3%*3.5), rgba(100,100,100,1) calc(3%*4),
				rgba(0,0,0,1) calc(3%*5), rgba(0,0,0,1) calc(3%*10)
			);
		background-position:
			calc((((50% - var(--background-x)) * 1.65) + 50%) + (var(--background-y) * 0.5)) var(--background-x),
			calc((((50% - var(--background-x)) * -0.9) + 50%) - (var(--background-y) * 0.75)) var(--background-y);
		background-size: 200% 200%, 200% 200%;
		background-blend-mode: screen;
		filter: brightness(1.15) contrast(1.1);
		mix-blend-mode: hard-light;
	}
	.card[data-rarity="rare holo"] .card__shine::after {
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsla(0,0%,90%,.8) 0%, hsla(0,0%,78%,.1) 25%, hsl(0,0%,0%) 90%
		);
		mix-blend-mode: luminosity;
		filter: brightness(0.6) contrast(4);
	}
	.card[data-rarity="rare holo"] .card__glare {
		opacity: calc(var(--card-opacity) * .8);
		filter: brightness(0.8) contrast(1.5);
		mix-blend-mode: overlay;
	}
	.card[data-rarity="rare holo"] .card__glare::after {
		content: "";
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsl(180,100%,95%) 5%, hsla(0,0%,39%,.25) 55%, hsla(0,0%,0%,.36) 110%
		);
		mix-blend-mode: overlay;
		filter: brightness(.6) contrast(3);
		clip-path: var(--clip);
	}
	.card[data-rarity="rare holo"][data-subtypes^="stage"] .card__glare::after { clip-path: var(--clip-stage); }
	.card[data-rarity="rare holo"][data-subtypes^="supporter"] .card__glare::after,
	.card[data-rarity="rare holo"][data-subtypes^="item"] .card__glare::after { clip-path: var(--clip-trainer); }

	/* ── Cosmos Holo ─────────────────────────────────────────────────────────*/
	.card[data-rarity="rare holo cosmos"] .card__shine {
		clip-path: var(--clip);
		--sp: 4%;
		background-image:
			repeating-linear-gradient(82deg,
				hsl(53,65%,60%) calc(var(--sp)*1), hsl(93,56%,50%) calc(var(--sp)*2),
				hsl(176,54%,49%) calc(var(--sp)*3), hsl(228,59%,55%) calc(var(--sp)*4),
				hsl(283,60%,55%) calc(var(--sp)*5), hsl(326,59%,51%) calc(var(--sp)*6),
				hsl(326,59%,51%) calc(var(--sp)*7), hsl(283,60%,55%) calc(var(--sp)*8),
				hsl(228,59%,55%) calc(var(--sp)*9), hsl(176,54%,49%) calc(var(--sp)*10),
				hsl(93,56%,50%) calc(var(--sp)*11), hsl(53,65%,60%) calc(var(--sp)*12)
			),
			radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(180,100%,89%,.5) 5%, hsla(180,14%,57%,.3) 40%, hsl(0,0%,0%) 130%
			);
		background-blend-mode: color-burn, multiply;
		background-position:
			calc(10% + (var(--pointer-from-left) * 80%)) calc(10% + (var(--pointer-from-top) * 80%)),
			center center;
		background-size: 400% 900%, cover;
		filter: brightness(1) contrast(1) saturate(.8);
		mix-blend-mode: color-dodge;
		opacity: var(--card-opacity);
	}
	.card[data-rarity="rare holo cosmos"][data-subtypes^="stage"] .card__shine { clip-path: var(--clip-stage); }
	.card[data-rarity="rare holo cosmos"] .card__glare {
		background-image: radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsla(204,100%,95%,.8) 5%, hsla(250,15%,20%,1) 150%
		);
		filter: brightness(.75) contrast(2) saturate(2);
		mix-blend-mode: overlay;
		opacity: calc(var(--card-opacity) * (0.25 + var(--pointer-from-center)));
	}

	/* ── Rare Holo V ─────────────────────────────────────────────────────────*/
	.card[data-rarity="rare holo v"] .card__shine {
		filter: brightness(.7) contrast(2) saturate(.5);
	}
	.card[data-rarity="rare holo v"] .card__shine,
	.card[data-rarity="rare holo v"] .card__shine::after {
		background-image:
			var(--grain),
			repeating-linear-gradient(0deg,
				var(--sunpillar-clr-1) calc(var(--space)*1), var(--sunpillar-clr-2) calc(var(--space)*2),
				var(--sunpillar-clr-3) calc(var(--space)*3), var(--sunpillar-clr-4) calc(var(--space)*4),
				var(--sunpillar-clr-5) calc(var(--space)*5), var(--sunpillar-clr-6) calc(var(--space)*6),
				var(--sunpillar-clr-1) calc(var(--space)*7)
			),
			repeating-linear-gradient(var(--angle),
				#0e152e 0%, hsl(180,10%,60%) 3.8%, hsl(180,29%,66%) 4.5%,
				hsl(180,10%,60%) 5.2%, #0e152e 10%, #0e152e 12%
			),
			radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(0,0%,0%,.1) 12%, hsla(0,0%,0%,.15) 20%, hsla(0,0%,0%,.25) 120%
			);
		background-blend-mode: screen, hue, hard-light;
		background-size: 500px 100%, 200% 700%, 300% 100%, 200% 100%;
		background-position: center, 0% var(--background-y), var(--background-x) var(--background-y), var(--background-x) var(--background-y);
		filter: brightness(.8) contrast(2.95) saturate(.65);
	}
	.card[data-rarity="rare holo v"] .card__shine::after {
		background-position: center, 0% var(--background-y), calc(var(--background-x) * -1) calc(var(--background-y) * -1), var(--background-x) var(--background-y);
		background-size: 500px 100%, 200% 400%, 195% 100%, 200% 100%;
		filter: brightness(1) contrast(2.5) saturate(1.75);
		mix-blend-mode: soft-light;
	}
	.card[data-rarity="rare holo v"] .card__glare {
		background-image: radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsl(0,0%,100%) 0%, hsla(210,3%,54%,.33) 45%, hsla(0,0%,20%,.9) 130%
		);
		opacity: calc(var(--card-opacity) * .5);
		mix-blend-mode: hard-light;
		filter: brightness(.9) contrast(1.75);
	}

	/* ── Rare Holo VMax ──────────────────────────────────────────────────────*/
	.card[data-rarity="rare holo vmax"] .card__shine {
		--space: 6%;
		background-image:
			url("/img/vmaxbg.jpg"),
			repeating-linear-gradient(-33deg,
				hsl(2,70%,47%) calc(var(--space)*1), hsl(228,60%,64%) calc(var(--space)*2),
				hsl(176,55%,39%) calc(var(--space)*3), hsl(123,68%,35%) calc(var(--space)*4),
				hsl(283,75%,57%) calc(var(--space)*5), hsl(2,70%,47%) calc(var(--space)*6)
			),
			repeating-linear-gradient(var(--angle),
				hsla(227,53%,12%,.5) 0%, hsl(180,10%,50%) 2.5%, hsl(83,50%,35%) 5%,
				hsl(180,10%,50%) 7.5%, hsla(227,53%,12%,.5) 10%, hsla(227,53%,12%,.5) 15%
			),
			radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(189,76%,77%,.6) 0%, hsla(147,59%,77%,.6) 25%,
				hsla(271,55%,69%,.6) 50%, hsla(355,56%,72%,.6) 75%
			);
		background-blend-mode: difference, luminosity, soft-light;
		background-size: 60% 30%, 1100% 1100%, 600% 600%, 200% 200%;
		background-position:
			center, var(--background-x) var(--background-y),
			var(--background-x) var(--background-y), var(--background-x) var(--background-y);
		filter: brightness(calc((var(--pointer-from-center) * .4) + .4)) contrast(2) saturate(1);
	}
	.card[data-rarity="rare holo vmax"] .card__shine::after {
		background-image:
			repeating-linear-gradient(0deg,
				var(--sunpillar-clr-1) calc(var(--space)*1), var(--sunpillar-clr-2) calc(var(--space)*2),
				var(--sunpillar-clr-3) calc(var(--space)*3), var(--sunpillar-clr-4) calc(var(--space)*4),
				var(--sunpillar-clr-5) calc(var(--space)*5), var(--sunpillar-clr-6) calc(var(--space)*6),
				var(--sunpillar-clr-1) calc(var(--space)*7)
			),
			repeating-linear-gradient(var(--angle),
				#0e152e 0%, hsl(180,10%,60%) 3.8%, hsl(180,29%,66%) 4.5%,
				hsl(180,10%,60%) 5.2%, #0e152e 10%, #0e152e 12%
			);
		background-blend-mode: hue, hard-light;
		background-size: 200% 700%, 300% 100%;
		background-position: 0% var(--background-y), var(--background-x) var(--background-y);
		mix-blend-mode: lighten;
		opacity: calc((0.3 * var(--card-opacity)) + var(--card-opacity) * var(--pointer-from-center) * 0.5);
		filter: saturate(1.5);
	}
	.card[data-rarity="rare holo vmax"] .card__glare {
		mix-blend-mode: hard-light;
		filter: brightness(1) contrast(1);
		background-image: radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsla(0,0%,100%,.75) 0%, hsl(0,0%,0%) 120%
		);
		opacity: calc((0.2 * var(--card-opacity)) + var(--card-opacity) * var(--pointer-from-center) * 0.8);
	}

	/* ── Ultra Rare ──────────────────────────────────────────────────────────*/
	.card[data-rarity="rare ultra"] .card__shine {
		filter: brightness(.7) contrast(2) saturate(.5);
	}
	.card[data-rarity="rare ultra"] .card__shine,
	.card[data-rarity="rare ultra"] .card__shine::after {
		background-image:
			var(--grain),
			repeating-linear-gradient(0deg,
				var(--sunpillar-clr-1) calc(var(--space)*1), var(--sunpillar-clr-2) calc(var(--space)*2),
				var(--sunpillar-clr-3) calc(var(--space)*3), var(--sunpillar-clr-4) calc(var(--space)*4),
				var(--sunpillar-clr-5) calc(var(--space)*5), var(--sunpillar-clr-6) calc(var(--space)*6),
				var(--sunpillar-clr-1) calc(var(--space)*7)
			),
			repeating-linear-gradient(var(--angle),
				#0e152e 0%, hsl(180,10%,60%) 3.8%, hsl(180,29%,66%) 4.5%,
				hsl(180,10%,60%) 5.2%, #0e152e 10%, #0e152e 12%
			),
			radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(0,0%,0%,.1) 12%, hsla(0,0%,0%,.15) 20%, hsla(0,0%,0%,.25) 120%
			);
		background-blend-mode: screen, hue, hard-light;
		background-size: 500px 100%, 200% 500%, 250% 100%, 200% 100%;
		background-position: center, 0% var(--background-y), var(--background-x) var(--background-y), var(--background-x) var(--background-y);
		filter: brightness(.8) contrast(2.95) saturate(.65);
	}
	.card[data-rarity="rare ultra"] .card__shine::after {
		background-position: center, 0% var(--background-y), calc(var(--background-x) * -1) calc(var(--background-y) * -1), var(--background-x) var(--background-y);
		background-size: 500px 100%, 200% 400%, 195% 100%, 200% 100%;
		filter: brightness(1) contrast(2.5) saturate(1.75);
		mix-blend-mode: soft-light;
	}
	.card[data-rarity="rare ultra"] .card__glare {
		background-image: radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsl(0,0%,100%) 0%, hsla(210,3%,54%,.33) 45%, hsla(0,0%,20%,.9) 130%
		);
		opacity: calc(var(--card-opacity) * .5);
		mix-blend-mode: hard-light;
		filter: brightness(.9) contrast(1.75);
	}

	/* ── Illustration Rare ───────────────────────────────────────────────────*/
	.card[data-rarity="illustration rare"] .card__shine {
		background-image:
			radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(300,100%,95%,.5) 5%, hsla(200,80%,85%,.3) 35%, hsla(0,0%,0%,.5) 120%
			),
			repeating-linear-gradient(82deg,
				hsl(2,100%,73%) 0%, hsl(53,100%,69%) 16.66%,
				hsl(93,100%,69%) 33.33%, hsl(176,100%,76%) 50%,
				hsl(228,100%,74%) 66.66%, hsl(283,100%,73%) 83.33%, hsl(2,100%,73%) 100%
			);
		background-position:
			center center,
			calc(10% + (var(--pointer-from-left) * 80%)) calc(10% + (var(--pointer-from-top) * 80%));
		background-size: cover, 400% 900%;
		background-blend-mode: soft-light;
		filter: brightness(0.8) contrast(1.5) saturate(0.7);
		mix-blend-mode: color-dodge;
		opacity: calc(var(--card-opacity) * 0.65);
	}
	.card[data-rarity="illustration rare"] .card__glare {
		background-image: radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsla(300,100%,97%,.7) 5%, hsla(0,0%,50%,.25) 50%, hsla(0,0%,0%,.4) 110%
		);
		opacity: calc(var(--card-opacity) * 0.5);
		filter: brightness(0.8) contrast(1.3);
		mix-blend-mode: overlay;
	}

	/* ── Secret Rare / Hyper Rare ────────────────────────────────────────────*/
	.card[data-rarity="rare secret"] .card__shine {
		background-image:
			var(--glitter),
			var(--glitter),
			conic-gradient(
				var(--sunpillar-clr-4), var(--sunpillar-clr-5), var(--sunpillar-clr-6),
				var(--sunpillar-clr-1), var(--sunpillar-clr-4)
			),
			radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(150,0%,0%,.98) 10%, hsla(0,0%,95%,.15) 90%
			);
		background-size: var(--glittersize) var(--glittersize), var(--glittersize) var(--glittersize), cover, cover;
		background-position: 45% 45%, 55% 55%, center center, center center;
		background-blend-mode: soft-light, hard-light, overlay;
		mix-blend-mode: color-dodge;
		filter: brightness(calc(0.4 + (var(--pointer-from-center) * 0.2))) contrast(1) saturate(2.7);
	}
	.card[data-rarity="rare secret"] .card__shine::before {
		background-image:
			url("/img/geometric.png"),
			linear-gradient(45deg, hsl(46,95%,50%), hsl(52,100%,69%)),
			radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(10,20%,90%,.95) 10%, hsl(0,0%,0%) 70%
			);
		background-size: 33%, cover, cover;
		background-position: center center, center center, center center;
		background-blend-mode: hard-light, multiply;
		mix-blend-mode: lighten;
		filter: brightness(1.25) contrast(1.25) saturate(0.35);
		opacity: .8;
	}
	.card[data-rarity="rare secret"] .card__shine::after {
		background-image: var(--glitter);
		background-size: var(--glittersize) var(--glittersize);
		background-position:
			calc(50% - (2px * var(--pointer-from-left)) + 1px)
			calc(50% - (2px * var(--pointer-from-top)) + 1px);
		filter: brightness(calc((var(--pointer-from-center)*0.6) + 0.6)) contrast(1.5);
		mix-blend-mode: overlay;
	}
	.card[data-rarity="rare secret"] .card__glare {
		background-image: radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsla(45,8%,80%,.3) 0%, hsl(22,15%,12%) 180%
		);
		filter: brightness(1.3) contrast(1.5);
		mix-blend-mode: hard-light;
	}

	/* ── Rainbow Rare ────────────────────────────────────────────────────────*/
	.card[data-rarity="rare rainbow"] .card__shine {
		background-image:
			linear-gradient(-45deg, hsl(0,57%,37%), hsl(180,60%,35%)),
			var(--glitter),
			repeating-linear-gradient(-30deg,
				hsl(0,57%,37%), hsl(40,53%,39%), hsl(90,60%,35%),
				hsl(180,60%,35%), hsl(210,57%,39%), hsl(280,55%,31%),
				hsl(0,57%,37%), hsl(40,53%,39%), hsl(90,60%,35%),
				hsl(180,60%,35%), hsl(210,57%,39%), hsl(280,55%,31%), hsl(0,57%,37%)
			);
		background-blend-mode: luminosity, soft-light;
		background-size: 200% 200%, var(--glittersize) var(--glittersize), 400% 400%;
		background-position:
			calc(25% + (50% * var(--pointer-from-left))) calc(25% + (50% * var(--pointer-from-top))),
			center center,
			calc(25% + (var(--pointer-x) / 2)) calc(25% + (var(--pointer-y) / 2));
		filter: brightness(calc((var(--pointer-from-center)*0.25) + 0.6)) contrast(2.2) saturate(0.75);
	}
	.card[data-rarity="rare rainbow"] .card__shine::after {
		background-image:
			var(--glitter),
			repeating-linear-gradient(-60deg,
				hsl(0,57%,37%), hsl(40,53%,39%), hsl(90,60%,35%),
				hsl(180,60%,35%), hsl(210,57%,39%), hsl(280,55%,31%),
				hsl(0,57%,37%), hsl(40,53%,39%), hsl(90,60%,35%),
				hsl(180,60%,35%), hsl(210,57%,39%), hsl(280,55%,31%), hsl(0,57%,37%)
			);
		background-blend-mode: soft-light;
		background-size: var(--glittersize) var(--glittersize), 400% 400%;
		background-position: center center, var(--pointer-x) var(--pointer-y);
		filter: brightness(calc((var(--pointer-from-center)*0.3) + 0.55)) contrast(2) saturate(1);
		mix-blend-mode: color-dodge;
	}
	.card[data-rarity="rare rainbow"] .card__glare {
		background-image: radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsl(0,0%,80%), hsla(187,10%,85%,.25) 30%, hsl(197,6%,25%) 120%
		);
		filter: brightness(.9) contrast(1.75);
		opacity: calc(var(--pointer-from-center) * 0.9);
		mix-blend-mode: hard-light;
	}

	/* ── Reverse Holo — inverted clip (everything EXCEPT art box) ────────────*/
	.card[data-rarity$="reverse holo"] .card__shine {
		background-image:
			radial-gradient(circle at var(--pointer-x) var(--pointer-y), #fff 5%, #000 50%, #fff 80%),
			linear-gradient(-45deg, #000 15%, #fff, #000 85%);
		background-blend-mode: soft-light, difference;
		background-size: 120% 120%, 200% 200%;
		background-position:
			center center,
			calc(100% * var(--pointer-from-left)) calc(100% * var(--pointer-from-top));
		filter: brightness(.55) contrast(1.5) saturate(1);
		mix-blend-mode: color-dodge;
		clip-path: var(--clip-invert);
		opacity: calc((1.5 * var(--card-opacity)) - var(--pointer-from-center));
	}
	.card[data-rarity$="reverse holo"][data-subtypes^="stage"] .card__shine { clip-path: var(--clip-stage-invert); }
	.card[data-rarity$="reverse holo"] .card__glare {
		opacity: var(--card-opacity);
		background-image: radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsla(0,0%,100%,.8) 10%, hsla(0,0%,100%,.5) 20%, hsla(0,0%,0%,.75) 90%
		);
		filter: brightness(.7) contrast(1.5);
	}
	.card[data-rarity$="reverse holo"] .card__glare::after {
		background-image: radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsl(0,0%,100%) 10%, hsla(0,0%,100%,.5) 20%, hsla(0,0%,0%,.5) 120%
		);
		filter: brightness(1) contrast(1.5);
	}

	/* ── Amazing Rare ────────────────────────────────────────────────────────*/
	.card[data-rarity="amazing rare"] .card__shine {
		background-image:
			radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(53,100%,80%,.6) 0%, hsla(176,80%,65%,.4) 30%,
				hsla(283,80%,55%,.3) 60%, hsla(0,0%,0%,.4) 120%
			),
			repeating-linear-gradient(82deg,
				hsl(2,100%,73%) 0%, hsl(53,100%,69%) 14.28%,
				hsl(93,100%,69%) 28.57%, hsl(176,100%,76%) 42.85%,
				hsl(228,100%,74%) 57.14%, hsl(283,100%,73%) 71.42%, hsl(2,100%,73%) 100%
			);
		background-blend-mode: screen;
		background-size: cover, 300% 700%;
		background-position:
			center center,
			calc(10% + (var(--pointer-from-left) * 80%)) calc(10% + (var(--pointer-from-top) * 80%));
		filter: brightness(0.7) contrast(1.8) saturate(0.65);
		mix-blend-mode: color-dodge;
		opacity: calc(var(--card-opacity) * 0.7);
	}

	/* ── Close button — top-right overlay corner ─────────────────────────────*/
	.close-btn {
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 10;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		line-height: 1;
		color: #707070;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 0.4rem;
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s;
	}
	.close-btn:hover {
		color: #ffffff;
		border-color: rgba(255,255,255,0.15);
	}

	/* ── Info panel — floating aside ─────────────────────────────────────────*/
	.info-panel {
		position: absolute;
		left: 56%;
		top: 50%;
		transform: translateY(-50%);
		width: 280px;
		max-height: 90vh;
		background: rgba(17, 17, 17, 0.92);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-radius: 1rem;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0;
		overflow-y: auto;
	}
	@media (max-width: 680px) {
		.info-panel {
			position: static;
			transform: none;
			width: 100%;
			max-width: 320px;
			margin: 68vh auto 2rem;
			border-radius: 0.75rem;
		}
	}
	.info-scroll {
		flex: 1;
	}
	.card-title {
		font-family: 'Geist', sans-serif;
		font-weight: 800;
		font-size: clamp(1.2rem, 3vw, 1.6rem);
		color: #ffffff;
		line-height: 1.1;
		margin: 0 0 0.5rem;
	}
	.rarity-pill {
		display: inline-block;
		font-family: 'Geist', sans-serif;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		background: rgba(227, 0, 11, 0.15);
		border: 1px solid rgba(227, 0, 11, 0.4);
		color: #E3000B;
		padding: 0.2em 0.7em;
		border-radius: 999px;
		margin-bottom: 0.75rem;
	}
	.set-line {
		font-family: 'Geist', sans-serif;
		font-size: 0.8rem;
		color: #707070;
		margin: 0 0 1.25rem;
	}
	.stats {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 0 0 1.25rem;
	}
	.stat-row {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
	}
	.stat-row dt {
		font-family: 'Geist', sans-serif;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: #444444;
		min-width: 4.5rem;
	}
	.stat-row dd {
		font-family: 'Geist', sans-serif;
		font-size: 0.875rem;
		color: #c8c8c8;
		margin: 0;
	}
	.flavor {
		font-family: 'Geist', sans-serif;
		font-size: 0.8rem;
		font-style: italic;
		color: #555555;
		line-height: 1.6;
		border-left: 2px solid #222222;
		padding-left: 0.75rem;
		margin: 0;
	}

	/* ── Add-to-collection ───────────────────────────────────────────────────*/
	.action-row {
		margin-top: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.add-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-family: 'Geist', sans-serif;
		font-size: 0.8rem;
		font-weight: 600;
		color: #E3000B;
		background: rgba(227, 0, 11, 0.12);
		border: 1px solid rgba(227, 0, 11, 0.35);
		border-radius: 0.5rem;
		padding: 0.5rem 1rem;
		cursor: pointer;
		transition: background 0.2s, border-color 0.2s, color 0.2s;
		align-self: flex-start;
		width: 100%;
		justify-content: center;
	}
	.add-btn:hover:not(:disabled) {
		background: rgba(227, 0, 11, 0.22);
		border-color: rgba(227, 0, 11, 0.6);
		color: #ff2233;
	}
	.add-btn:disabled { cursor: default; opacity: 0.7; }
	.add-btn--success {
		color: #6ee7b7;
		background: rgba(16, 185, 129, 0.12);
		border-color: rgba(16, 185, 129, 0.35);
	}
	.add-btn--error {
		color: #fca5a5;
		background: rgba(239, 68, 68, 0.12);
		border-color: rgba(239, 68, 68, 0.35);
	}
	.add-error {
		font-family: 'Geist', sans-serif;
		font-size: 0.75rem;
		color: #fca5a5;
		margin: 0;
	}
	.collection-link {
		font-family: 'Geist', sans-serif;
		font-size: 0.75rem;
		color: #E3000B;
		text-decoration: none;
	}
	.collection-link:hover { color: #ff2233; }
	@keyframes spin { to { transform: rotate(360deg); } }
	.spin { animation: spin 0.75s linear infinite; }
</style>
