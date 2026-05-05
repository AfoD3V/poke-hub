<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { spring } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import type { TcgCard } from '$shared/tcg';

	export let card: TcgCard;

	const dispatch = createEventDispatcher<{ close: void }>();

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

<!-- Backdrop -->
<div
	class="overlay"
	on:click={close}
	transition:fade={{ duration: 220 }}
	role="dialog"
	aria-modal="true"
	aria-label="Card detail — {card.name}"
>
	<!-- Stop click propagation so clicking the card doesn't close the modal -->
	<div class="modal-layout" on:click|stopPropagation>

		<!-- ── 3-D flip container ──────────────────────────────────────────── -->
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
				Clipping lives on .face-inner instead.
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

		<!-- ── Info panel ──────────────────────────────────────────────────── -->
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

			<button class="close-btn" on:click={close} aria-label="Close">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
				</svg>
				Close
			</button>
		</aside>
	</div>
</div>

<style>
	/* ── Overlay ─────────────────────────────────────────────────────────────*/
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(4, 4, 14, 0.88);
		backdrop-filter: blur(12px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		overflow-y: auto;
	}

	/* ── Modal layout: card + info side by side ───────────────────────────────*/
	.modal-layout {
		display: flex;
		align-items: center;
		gap: 3rem;
		max-width: 860px;
		width: 100%;
	}
	@media (max-width: 680px) {
		.modal-layout { flex-direction: column; gap: 1.5rem; }
	}

	/* ── Flip shadow wrapper (filter lives here, NOT on flip-wrap) ───────────*/
	.flip-shadow-wrap {
		flex-shrink: 0;
		width: min(320px, 80vw);
		aspect-ratio: 0.718;
		/* drop-shadow is safe here — this element has no transform-style:preserve-3d */
		filter: drop-shadow(0 30px 60px rgba(0,0,0,0.85));
		position: relative;
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

	/* Clipping wrapper — safe to use overflow:hidden here since it's not the
	   element that carries the backface-visibility declaration */
	.face-inner {
		position: absolute;
		inset: 0;
		overflow: hidden;
		border-radius: 4.55% / 3.5%;
	}

	.face-inner img {
		width: 100%; height: 100%;
		object-fit: cover;
		display: block;
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
		--sunpillar-1: hsl(2,   100%, 73%);
		--sunpillar-2: hsl(53,  100%, 69%);
		--sunpillar-3: hsl(93,  100%, 69%);
		--sunpillar-4: hsl(176, 100%, 76%);
		--sunpillar-5: hsl(228, 100%, 74%);
		--sunpillar-6: hsl(283, 100%, 73%);
		--sp1: var(--sunpillar-1); --sp2: var(--sunpillar-2);
		--sp3: var(--sunpillar-3); --sp4: var(--sunpillar-4);
		--sp5: var(--sunpillar-5); --sp6: var(--sunpillar-6);

		--card-aspect:  0.718;
		--card-radius:  4.55% / 3.5%;
		--clip-art:     inset(9.85% 8% 52.85% 8%);
		--card-glow:    hsl(215, 90%, 70%);
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
	.card.fairy     { --card-glow: hsl(323,100%, 89%); }

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
		overflow: hidden;
	}
	.card__rotator img {
		height: 100%; width: 100%;
		display: block; object-fit: cover;
		transform: translateZ(0.01px);
		user-select: none;
	}

	/* ── Shine & Glare ───────────────────────────────────────────────────────*/
	.card__shine {
		transform: translateZ(1px); z-index: 3;
		filter: brightness(.85) contrast(1.6) saturate(.65);
		mix-blend-mode: color-dodge;
		opacity: calc(var(--card-opacity) * 0.85);
		will-change: opacity, background-position;
	}
	.card__shine::before, .card__shine::after {
		content: ""; display: block; grid-area: 1/1;
		transform: translateZ(1px); border-radius: var(--card-radius);
	}
	.card__glare {
		transform: translateZ(1.41px); z-index: 4;
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsla(0,0%,100%,.8) 10%, hsla(0,0%,100%,.65) 20%, hsla(0,0%,0%,.5) 90%
		);
		mix-blend-mode: overlay;
		opacity: calc(var(--card-opacity) * 0.7);
	}
	.card__glare::after {
		content: ""; display: block; grid-area: 1/1; border-radius: var(--card-radius);
	}

	/* ── Rarity effects (same tuning as Card.svelte) ─────────────────────────*/
	.card[data-rarity="rare holo"] .card__shine {
		clip-path: var(--clip-art);
		background-image:
			repeating-linear-gradient(110deg,
				var(--sunpillar-5),var(--sunpillar-6),var(--sunpillar-1),
				var(--sunpillar-2),var(--sunpillar-3),var(--sunpillar-4),
				var(--sunpillar-5),var(--sunpillar-6),var(--sunpillar-1),
				var(--sunpillar-2),var(--sunpillar-3),var(--sunpillar-4)
			),
			repeating-linear-gradient(90deg,#000 0px,#000 2px,#666 2px,#666 4px);
		background-position:
			calc(((50% - var(--background-x))*2.6)+50%) calc(((50% - var(--background-y))*3.5)+50%),
			center center;
		background-size: 400% 400%, cover;
		background-blend-mode: overlay;
		filter: brightness(1) contrast(1) saturate(1.1);
		mix-blend-mode: color-dodge;
		opacity: calc(var(--card-opacity) * 0.75);
	}
	.card[data-rarity="rare holo"] .card__shine::before {
		background-image:
			repeating-linear-gradient(90deg,
				rgba(0,0,0,1) 6%, rgba(100,100,100,1) 9%, rgba(0,0,0,1) 10.5%,
				rgba(100,100,100,1) 12%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 42%
			),
			repeating-linear-gradient(90deg,
				rgba(0,0,0,1) 6%, rgba(100,100,100,1) 9%, rgba(0,0,0,1) 10.5%,
				rgba(100,100,100,1) 12%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 30%
			);
		background-position:
			calc((((50%-var(--background-x))*1.65)+50%)+(var(--background-y)*0.5)) var(--background-x),
			calc((((50%-var(--background-x))*-0.9)+50%)-(var(--background-y)*0.75)) var(--background-y);
		background-size: 200% 200%, 200% 200%;
		background-blend-mode: screen;
		filter: brightness(1.1) contrast(1);
		mix-blend-mode: hard-light;
	}
	.card[data-rarity="rare holo"] .card__shine::after {
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsla(0,0%,90%,.6) 0%, hsla(0,0%,78%,.08) 25%, hsl(0,0%,0%) 90%
		);
		mix-blend-mode: luminosity; filter: brightness(0.5) contrast(3);
	}
	.card[data-rarity="rare holo"] .card__glare {
		opacity: calc(var(--card-opacity) * 0.5);
		filter: brightness(0.7) contrast(1.2);
		mix-blend-mode: overlay;
	}
	.card[data-rarity="rare holo"] .card__glare::after {
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsl(180,100%,95%) 5%, hsla(0,0%,39%,.2) 55%, hsla(0,0%,0%,.3) 110%
		);
		mix-blend-mode: overlay; filter: brightness(0.5) contrast(2.5);
	}

	.card[data-rarity="rare holo cosmos"] .card__shine {
		clip-path: var(--clip-art); --sp: 4%;
		background-image:
			repeating-linear-gradient(82deg,
				hsl(53,65%,60%) calc(var(--sp)*1),  hsl(93,56%,50%)  calc(var(--sp)*2),
				hsl(176,54%,49%) calc(var(--sp)*3), hsl(228,59%,55%) calc(var(--sp)*4),
				hsl(283,60%,55%) calc(var(--sp)*5), hsl(326,59%,51%) calc(var(--sp)*6),
				hsl(326,59%,51%) calc(var(--sp)*7), hsl(283,60%,55%) calc(var(--sp)*8),
				hsl(228,59%,55%) calc(var(--sp)*9), hsl(176,54%,49%) calc(var(--sp)*10),
				hsl(93,56%,50%)  calc(var(--sp)*11),hsl(53,65%,60%)  calc(var(--sp)*12)
			),
			radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(180,100%,89%,.4) 5%, hsla(180,14%,57%,.2) 40%, hsl(0,0%,0%) 130%);
		background-blend-mode: multiply;
		background-position:
			calc(10%+(var(--pointer-from-left)*80%)) calc(10%+(var(--pointer-from-top)*80%)),
			center center;
		background-size: 400% 900%, cover;
		filter: brightness(0.9) contrast(0.9) saturate(0.75);
		mix-blend-mode: color-dodge;
		opacity: calc(var(--card-opacity) * 0.7);
	}

	.card[data-rarity="rare holo v"] .card__shine,
	.card[data-rarity="rare holo vmax"] .card__shine {
		--sp: 5%;
		background-image:
			repeating-linear-gradient(0deg,
				var(--sp1) calc(var(--sp)*1),var(--sp2) calc(var(--sp)*2),
				var(--sp3) calc(var(--sp)*3),var(--sp4) calc(var(--sp)*4),
				var(--sp5) calc(var(--sp)*5),var(--sp6) calc(var(--sp)*6),
				var(--sp1) calc(var(--sp)*7)
			),
			repeating-linear-gradient(133deg,
				#0e152e 0%,hsl(180,10%,60%) 3.8%,hsl(180,29%,66%) 4.5%,
				hsl(180,10%,60%) 5.2%,#0e152e 10%,#0e152e 12%
			),
			radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(0,0%,0%,.08) 12%,hsla(0,0%,0%,.12) 20%,hsla(0,0%,0%,.2) 120%);
		background-blend-mode: screen, hue, hard-light;
		background-size: 200% 700%, 300% 100%, 200% 100%;
		background-position: 0% var(--background-y), var(--background-x) var(--background-y), var(--background-x) var(--background-y);
		filter: brightness(0.55) contrast(1.5) saturate(0.6);
		mix-blend-mode: color-dodge;
		opacity: calc(var(--card-opacity) * 0.85);
	}
	.card[data-rarity="rare holo vmax"] .card__shine { filter: brightness(0.5) contrast(1.5) saturate(0.55); }
	.card[data-rarity="rare holo v"] .card__glare,
	.card[data-rarity="rare holo vmax"] .card__glare {
		background-image: radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsl(0,0%,100%) 0%, hsla(210,3%,54%,.25) 45%, hsla(0,0%,20%,.8) 130%);
		opacity: calc(var(--card-opacity) * 0.35);
		mix-blend-mode: hard-light; filter: brightness(0.8) contrast(1.4);
	}

	.card[data-rarity="rare ultra"] .card__shine {
		--sp: 5%;
		background-image:
			repeating-linear-gradient(0deg,
				var(--sp1) calc(var(--sp)*1),var(--sp2) calc(var(--sp)*2),
				var(--sp3) calc(var(--sp)*3),var(--sp4) calc(var(--sp)*4),
				var(--sp5) calc(var(--sp)*5),var(--sp6) calc(var(--sp)*6),
				var(--sp1) calc(var(--sp)*7)
			),
			repeating-linear-gradient(133deg,
				#0e152e 0%,hsl(180,10%,60%) 3.8%,hsl(180,29%,66%) 4.5%,
				hsl(180,10%,60%) 5.2%,#0e152e 10%,#0e152e 12%
			),
			radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(0,0%,0%,.08) 12%,hsla(0,0%,0%,.12) 20%,hsla(0,0%,0%,.2) 120%);
		background-blend-mode: screen, hue, hard-light;
		background-size: 200% 500%, 250% 100%, 200% 100%;
		background-position: 0% var(--background-y), var(--background-x) var(--background-y), var(--background-x) var(--background-y);
		filter: brightness(0.5) contrast(1.4) saturate(0.6);
		mix-blend-mode: color-dodge;
		opacity: calc(var(--card-opacity) * 0.8);
	}
	.card[data-rarity="rare ultra"] .card__glare {
		background-image: radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsl(0,0%,100%) 0%, hsla(210,3%,54%,.25) 45%, hsla(0,0%,20%,.8) 130%);
		opacity: calc(var(--card-opacity) * 0.3);
		mix-blend-mode: hard-light; filter: brightness(0.8) contrast(1.4);
	}

	.card[data-rarity="illustration rare"] .card__shine {
		background-image:
			radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(300,100%,95%,.5) 5%,hsla(200,80%,85%,.3) 35%,hsla(0,0%,0%,.5) 120%),
			repeating-linear-gradient(82deg,
				hsl(2,100%,73%) 0%,hsl(53,100%,69%) 16.66%,hsl(93,100%,69%) 33.33%,
				hsl(176,100%,76%) 50%,hsl(228,100%,74%) 66.66%,hsl(283,100%,73%) 83.33%,
				hsl(2,100%,73%) 100%);
		background-position: center center, calc(10%+(var(--pointer-from-left)*80%)) calc(10%+(var(--pointer-from-top)*80%));
		background-size: cover, 400% 900%;
		background-blend-mode: soft-light;
		filter: brightness(0.8) contrast(1.5) saturate(0.7);
		mix-blend-mode: color-dodge; opacity: calc(var(--card-opacity) * 0.65);
	}

	.card[data-rarity="rare secret"] .card__shine {
		background-image:
			linear-gradient(-45deg,hsl(40,80%,50%),hsl(50,90%,65%),hsl(40,85%,55%),hsl(35,75%,45%)),
			repeating-linear-gradient(-30deg,
				hsl(40,100%,50%),hsl(50,100%,65%),hsl(55,100%,70%),
				hsl(45,100%,60%),hsl(40,100%,50%),hsl(35,100%,45%),
				hsl(40,100%,50%),hsl(50,100%,65%),hsl(55,100%,70%),
				hsl(45,100%,60%),hsl(40,100%,50%));
		background-blend-mode: multiply;
		background-size: 200% 200%, 400% 400%;
		background-position:
			calc(25%+(50%*var(--pointer-from-left))) calc(25%+(50%*var(--pointer-from-top))),
			calc(25%+(var(--pointer-x)/2)) calc(25%+(var(--pointer-y)/2));
		filter: brightness(calc((var(--pointer-from-center)*0.2)+0.4)) contrast(1.8) saturate(0.7);
		mix-blend-mode: color-dodge; opacity: calc(var(--card-opacity) * 0.8);
	}
	.card[data-rarity="rare secret"] .card__glare {
		background-image: radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsl(50,100%,90%),hsla(40,80%,70%,.25) 30%,hsl(35,50%,25%) 120%);
		filter: brightness(0.8) contrast(1.5);
		opacity: calc(var(--pointer-from-center) * 0.65); mix-blend-mode: hard-light;
	}

	.card[data-rarity="rare rainbow"] .card__shine {
		background-image: repeating-linear-gradient(-30deg,
			hsl(0,57%,37%),hsl(40,53%,39%),hsl(90,60%,35%),hsl(180,60%,35%),
			hsl(210,57%,39%),hsl(280,55%,31%),hsl(0,57%,37%),hsl(40,53%,39%),
			hsl(90,60%,35%),hsl(180,60%,35%),hsl(210,57%,39%),hsl(280,55%,31%),hsl(0,57%,37%));
		background-size: 400% 400%;
		background-position: calc(25%+(var(--pointer-x)/2)) calc(25%+(var(--pointer-y)/2));
		filter: brightness(calc((var(--pointer-from-center)*0.2)+0.45)) contrast(1.8) saturate(0.7);
		mix-blend-mode: color-dodge; opacity: calc(var(--card-opacity) * 0.85);
	}

	.card[data-rarity$="reverse holo"] .card__shine {
		background-image:
			radial-gradient(circle at var(--pointer-x) var(--pointer-y),#fff 5%,#000 50%,#fff 80%),
			linear-gradient(-45deg,#000 15%,#fff,#000 85%);
		background-blend-mode: soft-light, difference;
		background-size: 120% 120%, 200% 200%;
		background-position: center center, calc(100%*var(--pointer-from-left)) calc(100%*var(--pointer-from-top));
		filter: brightness(0.45) contrast(1.3) saturate(0.9);
		mix-blend-mode: color-dodge;
		opacity: calc((1.2*var(--card-opacity))-var(--pointer-from-center)*0.4);
	}

	/* ── Info panel ──────────────────────────────────────────────────────────*/
	.info-panel {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
		max-height: min(90vh, 600px);
	}
	.info-scroll {
		flex: 1;
		overflow-y: auto;
		padding-right: 0.25rem;
	}
	.card-title {
		font-family: 'Syne', sans-serif;
		font-weight: 800;
		font-size: clamp(1.3rem, 4vw, 2rem);
		color: #f0f0f8;
		line-height: 1.1;
		margin: 0 0 0.5rem;
	}
	.rarity-pill {
		display: inline-block;
		font-family: 'DM Sans', sans-serif;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		background: rgba(139, 92, 246, 0.2);
		border: 1px solid rgba(139, 92, 246, 0.4);
		color: #c4b5fd;
		padding: 0.2em 0.7em;
		border-radius: 999px;
		margin-bottom: 0.75rem;
	}
	.set-line {
		font-family: 'DM Sans', sans-serif;
		font-size: 0.8rem;
		color: #6c6c82;
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
		font-family: 'DM Sans', sans-serif;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: #4c4c64;
		min-width: 4.5rem;
	}
	.stat-row dd {
		font-family: 'DM Sans', sans-serif;
		font-size: 0.875rem;
		color: #c8c8dc;
		margin: 0;
	}
	.flavor {
		font-family: 'DM Sans', sans-serif;
		font-size: 0.8rem;
		font-style: italic;
		color: #5c5c74;
		line-height: 1.6;
		border-left: 2px solid #2a2a3e;
		padding-left: 0.75rem;
		margin: 0;
	}
	.close-btn {
		margin-top: 1.5rem;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-family: 'DM Sans', sans-serif;
		font-size: 0.8rem;
		color: #6c6c82;
		background: transparent;
		border: 1px solid #2a2a3e;
		border-radius: 0.5rem;
		padding: 0.5rem 1rem;
		cursor: pointer;
		transition: color 0.2s, border-color 0.2s;
		align-self: flex-start;
	}
	.close-btn:hover {
		color: #e2e2ea;
		border-color: #4c4c64;
	}
</style>
