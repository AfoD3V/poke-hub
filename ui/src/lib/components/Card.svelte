<script lang="ts">
	import { spring } from 'svelte/motion';
	import { createEventDispatcher } from 'svelte';
	import type { TcgCard } from '$shared/tcg';

	export let card: TcgCard;

	const dispatch = createEventDispatcher<{ expand: TcgCard }>();

	// ── Math helpers ──────────────────────────────────────────────────────────
	const round  = (v: number, p = 3) => parseFloat(v.toFixed(p));
	const clamp  = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
	const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) =>
		round(tMin + (tMax - tMin) * ((v - fMin) / (fMax - fMin)));

	// ── Per-card random seed ──────────────────────────────────────────────────
	const seed = { x: Math.random(), y: Math.random() };

	// ── Rarity normalisation ──────────────────────────────────────────────────
	function resolveRarity(raw: string): string {
		const r = raw.toLowerCase().trim();
		if (r.endsWith('reverse holo'))                                          return r;
		if (r === 'rare holo cosmos')                                            return 'rare holo cosmos';
		if (r === 'rare holo v')                                                 return 'rare holo v';
		if (r === 'rare holo vmax' || r === 'rare holo vstar')                   return 'rare holo vmax';
		if (r.startsWith('rare holo'))                                           return 'rare holo';
		if (r === 'rare rainbow')                                                return 'rare rainbow';
		if (r === 'rare secret' || r === 'hyper rare' || r === 'ace spec rare')  return 'rare secret';
		if (r === 'rare ultra'  || r === 'double rare'  || r === 'ultra rare')   return 'rare ultra';
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

	// ── Spring stores ─────────────────────────────────────────────────────────
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
		springBg.set({
			x: adjust(pct.x, 0, 100, 37, 63),
			y: adjust(pct.y, 0, 100, 33, 67),
		});
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
		--pointer-from-center: ${clamp(
			Math.sqrt(($springGlare.y - 50) ** 2 + ($springGlare.x - 50) ** 2) / 50,
			0, 1
		)};
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
</script>

<div
	class="card {typesStr}"
	class:interacting
	data-rarity={dataRarity}
	data-subtypes={subtypesStr}
	data-supertype={supertypeStr}
	style={dynStyles}
	role="listitem"
>
	<div class="card__translater">
		<div
			class="card__rotator"
			on:pointermove={interact}
			on:pointerleave={interactEnd}
			on:click={() => dispatch('expand', card)}
		>
			<div class="card__front">
				{#if card.images?.small}
					<img
						src={card.images.small}
						alt={card.name}
						loading="lazy"
						width="245"
						height="342"
					/>
				{:else}
					<div class="card__fallback" aria-label={card.name}>
						<span>{card.name}</span>
					</div>
				{/if}
				<div class="card__shine" aria-hidden="true"></div>
				<div class="card__glare"  aria-hidden="true"></div>
			</div>
		</div>
	</div>

	<div class="card-info">
		<h3 class="card-name">{card.name}</h3>
		<p class="card-meta">{card.set} · {card.number}</p>
	</div>
</div>

<style>
	/* ── Palette ─────────────────────────────────────────────────────────────*/
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
	}

	/* ── Per-type glow ───────────────────────────────────────────────────────*/
	.card              { --card-glow: hsl(215, 90%, 70%); }
	.card.water        { --card-glow: hsl(192, 97%, 60%); }
	.card.fire         { --card-glow: hsl(9,   81%, 59%); }
	.card.grass        { --card-glow: hsl(96,  81%, 65%); }
	.card.lightning    { --card-glow: hsl(54,  87%, 63%); }
	.card.psychic      { --card-glow: hsl(281, 62%, 58%); }
	.card.fighting     { --card-glow: rgb(145, 90, 39);   }
	.card.darkness     { --card-glow: hsl(189, 77%, 27%); }
	.card.metal        { --card-glow: hsl(184, 20%, 70%); }
	.card.dragon       { --card-glow: hsl(51,  60%, 35%); }
	.card.fairy        { --card-glow: hsl(323, 100%, 89%); }

	/* ── Card geometry ───────────────────────────────────────────────────────*/
	.card {
		--card-aspect: 0.718;
		--card-radius: 4.55% / 3.5%;
		--clip-art:    inset(9.85% 8% 52.85% 8%);
		transform: translate3d(0, 0, 0.01px);
		will-change: transform;
		cursor: pointer;
	}

	/* ── Translater ──────────────────────────────────────────────────────────*/
	.card__translater { perspective: 600px; transform-style: preserve-3d; }

	/* ── Rotator ─────────────────────────────────────────────────────────────*/
	.card__rotator {
		aspect-ratio: var(--card-aspect);
		border-radius: var(--card-radius);
		display: grid;
		transform-style: preserve-3d;
		transform: rotateY(var(--rotate-x, 0deg)) rotateX(var(--rotate-y, 0deg));
		transition: box-shadow 0.4s ease;
		will-change: transform;
		box-shadow: 0 6px 20px -4px rgba(0,0,0,.55), 0 2px 8px -2px rgba(0,0,0,.45);
	}

	.card:not(.interacting) .card__rotator {
		transition: transform 0.6s cubic-bezier(.03,.98,.52,.99), box-shadow 0.4s ease;
	}

	.card__rotator:hover,
	.card.interacting .card__rotator {
		box-shadow:
			0 0  3px -1px white,
			0 0  3px  1px var(--card-glow),
			0 0 12px  2px var(--card-glow),
			0 8px 24px -4px black,
			0 0 40px -30px var(--card-glow),
			0 0 50px -20px var(--card-glow);
	}

	/* ── Front layer ─────────────────────────────────────────────────────────*/
	.card__rotator, .card__front, .card__front > * {
		width: 100%;
	}
	.card__front, .card__front > * {
		display: grid; grid-area: 1/1;
		aspect-ratio: var(--card-aspect);
		border-radius: var(--card-radius);
		overflow: hidden;
	}
	.card__front img { height: auto; width: 100%; display: block; transform: translateZ(0.01px); }
	.card__fallback {
		background: linear-gradient(135deg, #1a1a2e, #0f0f1f);
		display: flex; align-items: center; justify-content: center;
		color: #a0a0b0; font-size: 0.8rem; font-family: 'DM Sans', sans-serif;
	}

	/* ── Shine layer (color-dodge foil) ──────────────────────────────────────
	   opacity: 0 at rest, transitions to 1 on hover.
	   Each rarity overrides filter + background-image for its specific look.  */
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

	/* ── Glare layer (overlay specular hot-spot) ─────────────────────────────*/
	.card__glare {
		transform: translateZ(1.41px); z-index: 4;
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsla(0, 0%, 100%, 0.8) 10%, hsla(0, 0%, 100%, 0.65) 20%, hsla(0, 0%, 0%, 0.5) 90%
		);
		mix-blend-mode: overlay;
		opacity: calc(var(--card-opacity) * 0.7);
		will-change: opacity, background-image;
	}
	.card__glare::after {
		content: ""; display: block; grid-area: 1/1; border-radius: var(--card-radius);
	}

	/* ═══════════════════════════════════════════════════════════════════
	   RARITY EFFECTS
	═══════════════════════════════════════════════════════════════════ */

	/* ── Rare Holo — rainbow scanlines clipped to art area ───────────────── */
	.card[data-rarity="rare holo"] .card__shine {
		clip-path: var(--clip-art);
		background-image:
			repeating-linear-gradient(110deg,
				var(--sunpillar-5), var(--sunpillar-6), var(--sunpillar-1),
				var(--sunpillar-2), var(--sunpillar-3), var(--sunpillar-4),
				var(--sunpillar-5), var(--sunpillar-6), var(--sunpillar-1),
				var(--sunpillar-2), var(--sunpillar-3), var(--sunpillar-4)
			),
			repeating-linear-gradient(90deg, #000 0px, #000 2px, #666 2px, #666 4px);
		background-position:
			calc(((50% - var(--background-x)) * 2.6) + 50%) calc(((50% - var(--background-y)) * 3.5) + 50%),
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
				rgba(0,0,0,1)   6%,  rgba(100,100,100,1) 9%,
				rgba(0,0,0,1)  10.5%,rgba(100,100,100,1) 12%,
				rgba(0,0,0,1)  15%,  rgba(0,0,0,1)       42%
			),
			repeating-linear-gradient(90deg,
				rgba(0,0,0,1)  6%,   rgba(100,100,100,1) 9%,
				rgba(0,0,0,1)  10.5%,rgba(100,100,100,1) 12%,
				rgba(0,0,0,1)  15%,  rgba(0,0,0,1)       30%
			);
		background-position:
			calc((((50% - var(--background-x)) *  1.65) + 50%) + (var(--background-y) * 0.5))  var(--background-x),
			calc((((50% - var(--background-x)) * -0.9)  + 50%) - (var(--background-y) * 0.75)) var(--background-y);
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
		mix-blend-mode: luminosity;
		filter: brightness(0.5) contrast(3);
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
		mix-blend-mode: overlay;
		filter: brightness(0.5) contrast(2.5);
	}

	/* ── Cosmos Holo ─────────────────────────────────────────────────────────*/
	.card[data-rarity="rare holo cosmos"] .card__shine {
		clip-path: var(--clip-art);
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
			radial-gradient(
				farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(180,100%,89%,.4) 5%, hsla(180,14%,57%,.2) 40%, hsl(0,0%,0%) 130%
			);
		background-blend-mode: multiply;
		background-position:
			calc(10% + (var(--pointer-from-left) * 80%)) calc(10% + (var(--pointer-from-top) * 80%)),
			center center;
		background-size: 400% 900%, cover;
		filter: brightness(0.9) contrast(0.9) saturate(0.75);
		mix-blend-mode: color-dodge;
		opacity: calc(var(--card-opacity) * 0.7);
	}
	.card[data-rarity="rare holo cosmos"] .card__glare {
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsla(204,100%,95%,.6) 5%, hsla(250,15%,20%,1) 150%
		);
		filter: brightness(0.6) contrast(1.5) saturate(1.5);
		mix-blend-mode: overlay;
		opacity: calc(var(--card-opacity) * (0.2 + var(--pointer-from-center) * 0.4));
	}

	/* ── Rare Holo V — full-card vertical spectrum ───────────────────────────*/
	.card[data-rarity="rare holo v"] .card__shine,
	.card[data-rarity="rare holo vmax"] .card__shine {
		--sp: 5%;
		background-image:
			repeating-linear-gradient(0deg,
				var(--sp1) calc(var(--sp)*1), var(--sp2) calc(var(--sp)*2),
				var(--sp3) calc(var(--sp)*3), var(--sp4) calc(var(--sp)*4),
				var(--sp5) calc(var(--sp)*5), var(--sp6) calc(var(--sp)*6),
				var(--sp1) calc(var(--sp)*7)
			),
			repeating-linear-gradient(133deg,
				#0e152e 0%, hsl(180,10%,60%) 3.8%, hsl(180,29%,66%) 4.5%,
				hsl(180,10%,60%) 5.2%, #0e152e 10%, #0e152e 12%
			),
			radial-gradient(
				farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(0,0%,0%,.08) 12%, hsla(0,0%,0%,.12) 20%, hsla(0,0%,0%,.2) 120%
			);
		background-blend-mode: screen, hue, hard-light;
		background-size: 200% 700%, 300% 100%, 200% 100%;
		background-position:
			0% var(--background-y),
			var(--background-x) var(--background-y),
			var(--background-x) var(--background-y);
		/* Key fix: reduce contrast significantly so the card image shows through */
		filter: brightness(0.55) contrast(1.5) saturate(0.6);
		mix-blend-mode: color-dodge;
		opacity: calc(var(--card-opacity) * 0.85);
	}
	.card[data-rarity="rare holo vmax"] .card__shine {
		filter: brightness(0.5) contrast(1.5) saturate(0.55);
	}
	.card[data-rarity="rare holo v"] .card__glare,
	.card[data-rarity="rare holo vmax"] .card__glare {
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsl(0,0%,100%) 0%, hsla(210,3%,54%,.25) 45%, hsla(0,0%,20%,.8) 130%
		);
		opacity: calc(var(--card-opacity) * 0.35);
		mix-blend-mode: hard-light;
		filter: brightness(0.8) contrast(1.4);
	}

	/* ── Ultra Rare / Double Rare ─────────────────────────────────────────────*/
	.card[data-rarity="rare ultra"] .card__shine {
		--sp: 5%;
		background-image:
			repeating-linear-gradient(0deg,
				var(--sp1) calc(var(--sp)*1), var(--sp2) calc(var(--sp)*2),
				var(--sp3) calc(var(--sp)*3), var(--sp4) calc(var(--sp)*4),
				var(--sp5) calc(var(--sp)*5), var(--sp6) calc(var(--sp)*6),
				var(--sp1) calc(var(--sp)*7)
			),
			repeating-linear-gradient(133deg,
				#0e152e 0%, hsl(180,10%,60%) 3.8%, hsl(180,29%,66%) 4.5%,
				hsl(180,10%,60%) 5.2%, #0e152e 10%, #0e152e 12%
			),
			radial-gradient(
				farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(0,0%,0%,.08) 12%, hsla(0,0%,0%,.12) 20%, hsla(0,0%,0%,.2) 120%
			);
		background-blend-mode: screen, hue, hard-light;
		background-size: 200% 500%, 250% 100%, 200% 100%;
		background-position:
			0% var(--background-y),
			var(--background-x) var(--background-y),
			var(--background-x) var(--background-y);
		filter: brightness(0.5) contrast(1.4) saturate(0.6);
		mix-blend-mode: color-dodge;
		opacity: calc(var(--card-opacity) * 0.8);
	}
	.card[data-rarity="rare ultra"] .card__glare {
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsl(0,0%,100%) 0%, hsla(210,3%,54%,.25) 45%, hsla(0,0%,20%,.8) 130%
		);
		opacity: calc(var(--card-opacity) * 0.3);
		mix-blend-mode: hard-light;
		filter: brightness(0.8) contrast(1.4);
	}

	/* ── Illustration Rare ───────────────────────────────────────────────────*/
	.card[data-rarity="illustration rare"] .card__shine {
		background-image:
			radial-gradient(
				farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(300,100%,95%,.5) 5%, hsla(200,80%,85%,.3) 35%, hsla(0,0%,0%,.5) 120%
			),
			repeating-linear-gradient(82deg,
				hsl(2,100%,73%) 0%, hsl(53,100%,69%) 16.66%,
				hsl(93,100%,69%) 33.33%, hsl(176,100%,76%) 50%,
				hsl(228,100%,74%) 66.66%, hsl(283,100%,73%) 83.33%,
				hsl(2,100%,73%) 100%
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
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsla(300,100%,97%,.7) 5%, hsla(0,0%,50%,.25) 50%, hsla(0,0%,0%,.4) 110%
		);
		opacity: calc(var(--card-opacity) * 0.5);
		filter: brightness(0.8) contrast(1.3);
		mix-blend-mode: overlay;
	}

	/* ── Rare Secret / Hyper Rare — gold foil ────────────────────────────────*/
	.card[data-rarity="rare secret"] .card__shine {
		background-image:
			linear-gradient(-45deg,
				hsl(40,80%,50%), hsl(50,90%,65%), hsl(40,85%,55%), hsl(35,75%,45%)
			),
			repeating-linear-gradient(-30deg,
				hsl(40,100%,50%), hsl(50,100%,65%), hsl(55,100%,70%),
				hsl(45,100%,60%), hsl(40,100%,50%), hsl(35,100%,45%),
				hsl(40,100%,50%), hsl(50,100%,65%), hsl(55,100%,70%),
				hsl(45,100%,60%), hsl(40,100%,50%)
			);
		background-blend-mode: multiply;
		background-size: 200% 200%, 400% 400%;
		background-position:
			calc(25% + (50% * var(--pointer-from-left))) calc(25% + (50% * var(--pointer-from-top))),
			calc(25% + (var(--pointer-x) / 2)) calc(25% + (var(--pointer-y) / 2));
		filter: brightness(calc((var(--pointer-from-center) * 0.2) + 0.4)) contrast(1.8) saturate(0.7);
		mix-blend-mode: color-dodge;
		opacity: calc(var(--card-opacity) * 0.8);
	}
	.card[data-rarity="rare secret"] .card__glare {
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsl(50,100%,90%), hsla(40,80%,70%,.25) 30%, hsl(35,50%,25%) 120%
		);
		filter: brightness(0.8) contrast(1.5);
		opacity: calc(var(--pointer-from-center) * 0.65);
		mix-blend-mode: hard-light;
	}

	/* ── Rainbow Rare ────────────────────────────────────────────────────────*/
	.card[data-rarity="rare rainbow"] .card__shine {
		background-image:
			repeating-linear-gradient(-30deg,
				hsl(  0,57%,37%), hsl( 40,53%,39%), hsl( 90,60%,35%),
				hsl(180,60%,35%), hsl(210,57%,39%), hsl(280,55%,31%),
				hsl(  0,57%,37%), hsl( 40,53%,39%), hsl( 90,60%,35%),
				hsl(180,60%,35%), hsl(210,57%,39%), hsl(280,55%,31%),
				hsl(  0,57%,37%)
			);
		background-size: 400% 400%;
		background-position: calc(25% + (var(--pointer-x) / 2)) calc(25% + (var(--pointer-y) / 2));
		filter: brightness(calc((var(--pointer-from-center) * 0.2) + 0.45)) contrast(1.8) saturate(0.7);
		mix-blend-mode: color-dodge;
		opacity: calc(var(--card-opacity) * 0.85);
	}
	.card[data-rarity="rare rainbow"] .card__glare {
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsl(0,0%,80%), hsla(187,10%,85%,.2) 30%, hsl(197,6%,25%) 120%
		);
		filter: brightness(0.8) contrast(1.5);
		opacity: calc(var(--pointer-from-center) * 0.7);
		mix-blend-mode: hard-light;
	}

	/* ── Reverse Holo ────────────────────────────────────────────────────────*/
	.card[data-rarity$="reverse holo"] .card__shine {
		background-image:
			radial-gradient(circle at var(--pointer-x) var(--pointer-y), #fff 5%, #000 50%, #fff 80%),
			linear-gradient(-45deg, #000 15%, #fff, #000 85%);
		background-blend-mode: soft-light, difference;
		background-size: 120% 120%, 200% 200%;
		background-position:
			center center,
			calc(100% * var(--pointer-from-left)) calc(100% * var(--pointer-from-top));
		filter: brightness(0.45) contrast(1.3) saturate(0.9);
		mix-blend-mode: color-dodge;
		opacity: calc((1.2 * var(--card-opacity)) - var(--pointer-from-center) * 0.4);
	}
	.card[data-rarity$="reverse holo"] .card__glare {
		opacity: calc(var(--card-opacity) * 0.6);
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsla(0,0%,100%,.6) 10%, hsla(0,0%,100%,.4) 20%, hsla(0,0%,0%,.6) 90%
		);
		filter: brightness(0.6) contrast(1.3);
	}

	/* ── Amazing Rare ────────────────────────────────────────────────────────*/
	.card[data-rarity="amazing rare"] .card__shine {
		background-image:
			radial-gradient(
				farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(53,100%,80%,.6) 0%, hsla(176,80%,65%,.4) 30%,
				hsla(283,80%,55%,.3) 60%, hsla(0,0%,0%,.4) 120%
			),
			repeating-linear-gradient(82deg,
				hsl(2,100%,73%) 0%, hsl(53,100%,69%) 14.28%,
				hsl(93,100%,69%) 28.57%, hsl(176,100%,76%) 42.85%,
				hsl(228,100%,74%) 57.14%, hsl(283,100%,73%) 71.42%,
				hsl(2,100%,73%) 100%
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

	/* ── Card info ───────────────────────────────────────────────────────────*/
	.card-info { margin-top: 0.6rem; text-align: center; }
	.card-name {
		font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.85rem;
		color: #e2e2ea; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	}
	.card-meta { font-family: 'DM Sans', sans-serif; font-size: 0.72rem; color: #7c7c8e; margin-top: 0.2rem; }
</style>
