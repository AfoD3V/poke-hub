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
			role="button"
			tabindex="0"
			on:pointermove={interact}
			on:pointerleave={interactEnd}
			on:click={() => dispatch('expand', card)}
			on:keypress={(e) => e.key === 'Enter' && dispatch('expand', card)}
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
	/* ── Variables ───────────────────────────────────────────────────────────*/
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
		/* Texture images (copied from reference into ui/static/img/) */
		--grain:    url("/img/grain.webp");
		--glitter:  url("/img/glitter.png");
		--glittersize: 25%;
		/* Geometry */
		--card-aspect: 0.718;
		--card-radius: 4.55% / 3.5%;
		--space: 5%;
		--angle: 133deg;
		/* Art-area clip paths — three variants per reference */
		--clip:              inset(9.85% 8% 52.85% 8%);
		--clip-stage:        polygon(91.5% 9.85%, 57% 9.85%, 54% 12%, 17% 12%, 16% 14%, 12% 16%, 8% 16%, 8% 47.15%, 92% 47.15%);
		--clip-trainer:      inset(14.5% 8.5% 48.2% 8.5%);
		--clip-invert:       polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0 47.15%, 91.5% 47.15%, 91.5% 9.85%, 8% 9.85%, 8% 47.15%, 0 50%);
		--clip-stage-invert: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0 47.15%, 91.5% 47.15%, 91.5% 9.85%, 57% 9.85%, 54% 12%, 17% 12%, 16% 14%, 12% 16%, 8% 16%, 8% 47.15%, 0 50%);
		--clip-borders:      inset(2.8% 4% round 2.55% / 1.5%);
		/* Glow color */
		--card-glow: hsl(215, 90%, 70%);
		transform: translate3d(0, 0, 0.01px);
		will-change: transform;
		cursor: pointer;
	}

	/* ── Per-type glow ───────────────────────────────────────────────────────*/
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

	/* ── Translater / Rotator ────────────────────────────────────────────────*/
	.card__translater { perspective: 600px; transform-style: preserve-3d; }
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
	.card__rotator, .card__front, .card__front > * { width: 100%; }
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

	/* ── Card info ───────────────────────────────────────────────────────────*/
	.card-info { margin-top: 0.6rem; text-align: center; }
	.card-name {
		font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.85rem;
		color: #e2e2ea; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	}
	.card-meta { font-family: 'DM Sans', sans-serif; font-size: 0.72rem; color: #7c7c8e; margin-top: 0.2rem; }
</style>
