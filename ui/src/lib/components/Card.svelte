<script lang="ts">
	import { spring } from 'svelte/motion';
	import type { TcgCard } from '$shared/tcg';

	export let card: TcgCard;

	// ── Math helpers (mirrors reference implementation) ───────────────────────
	const round  = (v: number, p = 3) => parseFloat(v.toFixed(p));
	const clamp  = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
	const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) =>
		round(tMin + (tMax - tMin) * ((v - fMin) / (fMax - fMin)));

	// ── Per-card random seed — varies background parallax across cards ────────
	const seed = { x: Math.random(), y: Math.random() };

	// ── Rarity normalisation ──────────────────────────────────────────────────
	// Maps pokemontcg.io rarity strings to the CSS data-rarity values our
	// selectors use. We keep the "reverse holo" suffix intact for the $= selector.
	function resolveRarity(raw: string): string {
		const r = raw.toLowerCase().trim();
		if (r.endsWith('reverse holo'))                      return r;          // keep for $= selector
		if (r === 'rare holo cosmos')                        return 'rare holo cosmos';
		if (r === 'rare holo v')                             return 'rare holo v';
		if (r === 'rare holo vmax' || r === 'rare holo vstar') return 'rare holo vmax';
		if (r.startsWith('rare holo'))                       return 'rare holo'; // ex, gx, lvx, star …
		if (r === 'rare rainbow')                            return 'rare rainbow';
		if (r === 'rare secret' || r === 'hyper rare' || r === 'ace spec rare') return 'rare secret';
		if (r === 'rare ultra' || r === 'double rare' || r === 'ultra rare')    return 'rare ultra';
		if (r === 'special illustration rare' || r === 'illustration rare')     return 'illustration rare';
		if (r === 'amazing rare')                            return 'amazing rare';
		return r;
	}

	$: dataRarity   = resolveRarity(card.rarity ?? '');
	$: subtypesStr  = (card.subtypes  ?? []).join(' ').toLowerCase();
	$: supertypeStr = (card.supertype ?? '').toLowerCase();
	$: typesStr     = (card.types     ?? []).join(' ').toLowerCase();

	// ── Spring stores ─────────────────────────────────────────────────────────
	// Matching the reference: stiff/fast for interaction, loose/slow for snap-back
	const SI = { stiffness: 0.066, damping: 0.25 }; // interact
	const SS = { stiffness: 0.01,  damping: 0.06  }; // snap-back

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

		// Set spring stiffness to interact mode
		springRotate.stiffness = SI.stiffness; springRotate.damping = SI.damping;
		springGlare.stiffness  = SI.stiffness; springGlare.damping  = SI.damping;
		springBg.stiffness     = SI.stiffness; springBg.damping     = SI.damping;

		// Rotate: max ±14.3° (center.x/y range is -50..50, divided by 3.5)
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

	// ── CSS custom properties ─────────────────────────────────────────────────
	// These are re-computed every frame while springs are animating.
	// Storing the rotation as "Xdeg" (with unit) is the critical fix —
	// the old implementation tried to compute it inside CSS calc() which
	// cannot multiply a unitless % by a deg angle.
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
		<!--
			card__rotator: applies the 3-D tilt. rotateY uses the X-axis spring
			(left-right pan) and rotateX uses the Y-axis spring (up-down tilt).
			This is intentional — it matches how the reference works.
		-->
		<div
			class="card__rotator"
			on:pointermove={interact}
			on:pointerleave={interactEnd}
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
				<!-- Foil shine layer (color-dodge) -->
				<div class="card__shine" aria-hidden="true"></div>
				<!-- Specular glare layer (overlay) -->
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
	/* ── Sunpillar palette (rainbow spectrum used by holo effects) ─────────── */
	.card {
		--sunpillar-1: hsl(2,   100%, 73%);
		--sunpillar-2: hsl(53,  100%, 69%);
		--sunpillar-3: hsl(93,  100%, 69%);
		--sunpillar-4: hsl(176, 100%, 76%);
		--sunpillar-5: hsl(228, 100%, 74%);
		--sunpillar-6: hsl(283, 100%, 73%);

		/* Default ordering — overridden in ::before / ::after for visual depth */
		--sp1: var(--sunpillar-1);
		--sp2: var(--sunpillar-2);
		--sp3: var(--sunpillar-3);
		--sp4: var(--sunpillar-4);
		--sp5: var(--sunpillar-5);
		--sp6: var(--sunpillar-6);
	}

	/* ── Per-type card-glow accent colour ────────────────────────────────────*/
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

	/* ── Card geometry constants ─────────────────────────────────────────────*/
	.card {
		--card-aspect:  0.718;
		--card-radius:  4.55% / 3.5%;
		/* art-area clip (basic holo + cosmos) */
		--clip-art:     inset(9.85% 8% 52.85% 8%);

		transform: translate3d(0, 0, 0.01px);
		will-change: transform;
		cursor: pointer;
	}

	/* ── Translater wrapper (adds perspective context) ───────────────────────*/
	.card__translater {
		perspective: 600px;
		transform-style: preserve-3d;
	}

	/* ── Rotator (carries the 3-D tilt transform) ────────────────────────────*/
	.card__rotator {
		aspect-ratio: var(--card-aspect);
		border-radius: var(--card-radius);
		display: grid;
		transform-style: preserve-3d;
		/* JS-computed values with deg units — this is what was broken before */
		transform: rotateY(var(--rotate-x, 0deg)) rotateX(var(--rotate-y, 0deg));
		transition: box-shadow 0.4s ease;
		will-change: transform;
		box-shadow:
			0  6px 20px -4px rgba(0,0,0,.55),
			0  2px  8px -2px rgba(0,0,0,.45);
	}

	/* Snap transform transition only when not actively interacting */
	.card:not(.interacting) .card__rotator {
		transition: transform 0.6s cubic-bezier(.03,.98,.52,.99), box-shadow 0.4s ease;
	}

	/* Type-coloured glow ring on hover */
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

	/* ── Front layer (stacks image + shine + glare via CSS Grid) ─────────────*/
	.card__rotator,
	.card__front,
	.card__front > * {
		width: 100%;
	}

	.card__front,
	.card__front > * {
		display: grid;
		grid-area: 1/1;
		aspect-ratio: var(--card-aspect);
		border-radius: var(--card-radius);
		overflow: hidden;
	}

	.card__front img {
		height: auto;
		width: 100%;
		display: block;
		transform: translateZ(0.01px);
	}

	.card__fallback {
		background: linear-gradient(135deg, #1a1a2e, #0f0f1f);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #a0a0b0;
		font-size: 0.8rem;
		font-family: 'DM Sans', sans-serif;
	}

	/* ── Shine layer ─────────────────────────────────────────────────────────
	   Sits above the card image. Mix-blend-mode: color-dodge makes it invisible
	   at opacity 0 and dramatically brightens colours as opacity → 1.          */
	.card__shine {
		transform: translateZ(1px);
		z-index: 3;
		background-size: cover;
		background-position: center;
		filter: brightness(.85) contrast(2.75) saturate(.65);
		mix-blend-mode: color-dodge;
		opacity: var(--card-opacity);
		will-change: opacity, background-position, background-size;
	}

	.card__shine::before,
	.card__shine::after {
		content: "";
		display: block;
		grid-area: 1/1;
		transform: translateZ(1px);
		border-radius: var(--card-radius);
	}

	/* ── Glare layer ─────────────────────────────────────────────────────────
	   Specular highlight — white hot-spot that tracks the pointer.             */
	.card__glare {
		transform: translateZ(1.41px);
		z-index: 4;
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsla(0, 0%, 100%, 0.8) 10%,
			hsla(0, 0%, 100%, 0.65) 20%,
			hsla(0, 0%, 0%, 0.5) 90%
		);
		mix-blend-mode: overlay;
		opacity: var(--card-opacity);
		will-change: opacity, background-image;
	}

	.card__glare::after {
		content: "";
		display: block;
		grid-area: 1/1;
		border-radius: var(--card-radius);
		background: transparent;
	}

	/* ═══════════════════════════════════════════════════════════════════════
	   RARITY EFFECTS
	   Each tier adds richer multi-layer CSS gradient effects on top of the
	   base shine/glare structure above.
	═══════════════════════════════════════════════════════════════════════ */

	/* ── Rare Holo — rainbow scanlines clipped to the art area ───────────── */
	.card[data-rarity="rare holo"] .card__shine {
		clip-path: var(--clip-art);
		background-image:
			repeating-linear-gradient(110deg,
				var(--sunpillar-5), var(--sunpillar-6), var(--sunpillar-1),
				var(--sunpillar-2), var(--sunpillar-3), var(--sunpillar-4),
				var(--sunpillar-5), var(--sunpillar-6), var(--sunpillar-1),
				var(--sunpillar-2), var(--sunpillar-3), var(--sunpillar-4)
			),
			repeating-linear-gradient(90deg,
				#000 0px, #000 2px,
				#666 2px, #666 4px
			);
		background-position:
			calc(((50% - var(--background-x)) * 2.6) + 50%)
			calc(((50% - var(--background-y)) * 3.5) + 50%),
			center center;
		background-size: 400% 400%, cover;
		background-blend-mode: overlay;
		filter: brightness(1.1) contrast(1.1) saturate(1.2);
		mix-blend-mode: color-dodge;
	}

	.card[data-rarity="rare holo"] .card__shine::before {
		background-image:
			repeating-linear-gradient(90deg,
				rgba(0,0,0,1)   6%,  rgba(100,100,100,1) 9%,
				rgba(0,0,0,1)  10.5%,rgba(100,100,100,1) 12%,
				rgba(0,0,0,1)  15%,  rgba(0,0,0,1)       42%
			),
			repeating-linear-gradient(90deg,
				rgba(0,0,0,1)   6%,  rgba(100,100,100,1) 9%,
				rgba(0,0,0,1)  10.5%,rgba(100,100,100,1) 12%,
				rgba(0,0,0,1)  15%,  rgba(0,0,0,1)       30%
			);
		background-position:
			calc((((50% - var(--background-x)) *  1.65) + 50%) + (var(--background-y) * 0.5))  var(--background-x),
			calc((((50% - var(--background-x)) * -0.9)  + 50%) - (var(--background-y) * 0.75)) var(--background-y);
		background-size: 200% 200%, 200% 200%;
		background-blend-mode: screen;
		filter: brightness(1.15) contrast(1.1);
		mix-blend-mode: hard-light;
	}

	.card[data-rarity="rare holo"] .card__shine::after {
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsla(0, 0%, 90%, 0.8) 0%,
			hsla(0, 0%, 78%, 0.1) 25%,
			hsl(0, 0%, 0%) 90%
		);
		mix-blend-mode: luminosity;
		filter: brightness(0.6) contrast(4);
	}

	.card[data-rarity="rare holo"] .card__glare {
		opacity: calc(var(--card-opacity) * 0.8);
		filter: brightness(0.8) contrast(1.5);
		mix-blend-mode: overlay;
	}

	.card[data-rarity="rare holo"] .card__glare::after {
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsl(180, 100%, 95%) 5%,
			hsla(0, 0%, 39%, 0.25) 55%,
			hsla(0, 0%, 0%, 0.36) 110%
		);
		mix-blend-mode: overlay;
		filter: brightness(0.6) contrast(3);
	}

	/* ── Cosmos Holo — starfield spectrum ────────────────────────────────── */
	.card[data-rarity="rare holo cosmos"] .card__shine {
		clip-path: var(--clip-art);
		--sp: 4%;
		background-image:
			repeating-linear-gradient(82deg,
				hsl(53,  65%, 60%) calc(var(--sp)*1),  hsl(93,  56%, 50%) calc(var(--sp)*2),
				hsl(176, 54%, 49%) calc(var(--sp)*3),  hsl(228, 59%, 55%) calc(var(--sp)*4),
				hsl(283, 60%, 55%) calc(var(--sp)*5),  hsl(326, 59%, 51%) calc(var(--sp)*6),
				hsl(326, 59%, 51%) calc(var(--sp)*7),  hsl(283, 60%, 55%) calc(var(--sp)*8),
				hsl(228, 59%, 55%) calc(var(--sp)*9),  hsl(176, 54%, 49%) calc(var(--sp)*10),
				hsl(93,  56%, 50%) calc(var(--sp)*11), hsl(53,  65%, 60%) calc(var(--sp)*12)
			),
			radial-gradient(
				farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(180, 100%, 89%, 0.5) 5%,
				hsla(180,  14%, 57%, 0.3) 40%,
				hsl(0, 0%, 0%) 130%
			);
		background-blend-mode: multiply;
		background-position:
			calc(10% + (var(--pointer-from-left) * 80%)) calc(10% + (var(--pointer-from-top) * 80%)),
			center center;
		background-size: 400% 900%, cover;
		filter: brightness(1) contrast(1) saturate(0.8);
		mix-blend-mode: color-dodge;
	}

	.card[data-rarity="rare holo cosmos"] .card__glare {
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsla(204, 100%, 95%, 0.8) 5%,
			hsla(250, 15%, 20%, 1) 150%
		);
		filter: brightness(0.75) contrast(2) saturate(2);
		mix-blend-mode: overlay;
		opacity: calc(var(--card-opacity) * (0.25 + var(--pointer-from-center)));
	}

	/* ── Rare Holo V — full-card vertical spectrum band ─────────────────── */
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
				#0e152e 0%,
				hsl(180, 10%, 60%) 3.8%,
				hsl(180, 29%, 66%) 4.5%,
				hsl(180, 10%, 60%) 5.2%,
				#0e152e 10%, #0e152e 12%
			),
			radial-gradient(
				farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(0,0%,0%,.1) 12%, hsla(0,0%,0%,.15) 20%, hsla(0,0%,0%,.25) 120%
			);
		background-blend-mode: screen, hue, hard-light;
		background-size: 200% 700%, 300% 100%, 200% 100%;
		background-position:
			0% var(--background-y),
			var(--background-x) var(--background-y),
			var(--background-x) var(--background-y);
		filter: brightness(0.8) contrast(2.95) saturate(0.65);
		mix-blend-mode: color-dodge;
	}

	.card[data-rarity="rare holo vmax"] .card__shine {
		filter: brightness(0.75) contrast(3.2) saturate(0.55);
	}

	.card[data-rarity="rare holo v"] .card__glare,
	.card[data-rarity="rare holo vmax"] .card__glare {
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsl(0,0%,100%) 0%, hsla(210,3%,54%,.33) 45%, hsla(0,0%,20%,.9) 130%
		);
		opacity: calc(var(--card-opacity) * 0.5);
		mix-blend-mode: hard-light;
		filter: brightness(0.9) contrast(1.75);
	}

	/* ── Ultra Rare / Double Rare — bold full-card sweep ────────────────── */
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
				#0e152e 0%,
				hsl(180, 10%, 60%) 3.8%, hsl(180, 29%, 66%) 4.5%, hsl(180, 10%, 60%) 5.2%,
				#0e152e 10%, #0e152e 12%
			),
			radial-gradient(
				farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(0,0%,0%,.1) 12%, hsla(0,0%,0%,.15) 20%, hsla(0,0%,0%,.25) 120%
			);
		background-blend-mode: screen, hue, hard-light;
		background-size: 200% 500%, 250% 100%, 200% 100%;
		background-position:
			0% var(--background-y),
			var(--background-x) var(--background-y),
			var(--background-x) var(--background-y);
		filter: brightness(0.8) contrast(2.95) saturate(0.65);
		mix-blend-mode: color-dodge;
	}

	.card[data-rarity="rare ultra"] .card__glare {
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsl(0,0%,100%) 0%, hsla(210,3%,54%,.33) 45%, hsla(0,0%,20%,.9) 130%
		);
		opacity: calc(var(--card-opacity) * 0.4);
		mix-blend-mode: hard-light;
		filter: brightness(0.9) contrast(1.75);
	}

	/* ── Illustration Rare — painterly pastel shimmer ────────────────────── */
	.card[data-rarity="illustration rare"] .card__shine {
		background-image:
			radial-gradient(
				farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(300, 100%, 95%, 0.7) 5%,
				hsla(200,  80%, 85%, 0.4) 35%,
				hsla(0, 0%, 0%, 0.6) 120%
			),
			repeating-linear-gradient(82deg,
				hsl(2,   100%, 73%) 0%,     hsl(53,  100%, 69%) 16.66%,
				hsl(93,  100%, 69%) 33.33%, hsl(176, 100%, 76%) 50%,
				hsl(228, 100%, 74%) 66.66%, hsl(283, 100%, 73%) 83.33%,
				hsl(2,   100%, 73%) 100%
			);
		background-position:
			center center,
			calc(10% + (var(--pointer-from-left) * 80%)) calc(10% + (var(--pointer-from-top) * 80%));
		background-size: cover, 400% 900%;
		background-blend-mode: soft-light;
		filter: brightness(0.9) contrast(2) saturate(0.75);
		mix-blend-mode: color-dodge;
		opacity: calc(var(--card-opacity) * 0.85);
	}

	.card[data-rarity="illustration rare"] .card__glare {
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsla(300, 100%, 97%, 0.9) 5%,
			hsla(0, 0%, 50%, 0.3) 50%,
			hsla(0, 0%, 0%, 0.5) 110%
		);
		opacity: calc(var(--card-opacity) * 0.7);
		filter: brightness(0.85) contrast(1.5);
		mix-blend-mode: overlay;
	}

	/* ── Rare Secret / Hyper Rare / Ace Spec — gold foil ────────────────── */
	.card[data-rarity="rare secret"] .card__shine {
		background-image:
			linear-gradient(-45deg,
				hsl(40, 80%, 50%), hsl(50, 90%, 65%),
				hsl(40, 85%, 55%), hsl(35, 75%, 45%)
			),
			repeating-linear-gradient(-30deg,
				hsl(40, 100%, 50%), hsl(50, 100%, 65%), hsl(55, 100%, 70%),
				hsl(45, 100%, 60%), hsl(40, 100%, 50%), hsl(35, 100%, 45%),
				hsl(40, 100%, 50%), hsl(50, 100%, 65%), hsl(55, 100%, 70%),
				hsl(45, 100%, 60%), hsl(40, 100%, 50%)
			);
		background-blend-mode: multiply;
		background-size: 200% 200%, 400% 400%;
		background-position:
			calc(25% + (50% * var(--pointer-from-left))) calc(25% + (50% * var(--pointer-from-top))),
			calc(25% + (var(--pointer-x) / 2)) calc(25% + (var(--pointer-y) / 2));
		filter: brightness(calc((var(--pointer-from-center) * 0.3) + 0.55)) contrast(2.2) saturate(0.75);
		mix-blend-mode: color-dodge;
	}

	.card[data-rarity="rare secret"] .card__glare {
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsl(50, 100%, 90%), hsla(40, 80%, 70%, 0.3) 30%, hsl(35, 50%, 25%) 120%
		);
		filter: brightness(0.9) contrast(1.75);
		opacity: calc(var(--pointer-from-center) * 0.85);
		mix-blend-mode: hard-light;
	}

	/* ── Rainbow Rare — full-card cycling spectrum ───────────────────────── */
	.card[data-rarity="rare rainbow"] .card__shine {
		background-image:
			repeating-linear-gradient(-30deg,
				hsl(0,   57%, 37%), hsl(40,  53%, 39%), hsl(90,  60%, 35%),
				hsl(180, 60%, 35%), hsl(210, 57%, 39%), hsl(280, 55%, 31%),
				hsl(0,   57%, 37%), hsl(40,  53%, 39%), hsl(90,  60%, 35%),
				hsl(180, 60%, 35%), hsl(210, 57%, 39%), hsl(280, 55%, 31%),
				hsl(0,   57%, 37%)
			);
		background-size: 400% 400%;
		background-position:
			calc(25% + (var(--pointer-x) / 2)) calc(25% + (var(--pointer-y) / 2));
		filter: brightness(calc((var(--pointer-from-center) * 0.25) + 0.6)) contrast(2.2) saturate(0.75);
		mix-blend-mode: color-dodge;
	}

	.card[data-rarity="rare rainbow"] .card__glare {
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsl(0, 0%, 80%), hsla(187, 10%, 85%, 0.25) 30%, hsl(197, 6%, 25%) 120%
		);
		filter: brightness(0.9) contrast(1.75);
		opacity: calc(var(--pointer-from-center) * 0.9);
		mix-blend-mode: hard-light;
	}

	/* ── Reverse Holo — full-card soft shimmer ────────────────────────────── */
	.card[data-rarity$="reverse holo"] .card__shine {
		background-image:
			radial-gradient(
				circle at var(--pointer-x) var(--pointer-y),
				#fff 5%, #000 50%, #fff 80%
			),
			linear-gradient(-45deg, #000 15%, #fff, #000 85%);
		background-blend-mode: soft-light, difference;
		background-size: 120% 120%, 200% 200%;
		background-position:
			center center,
			calc(100% * var(--pointer-from-left)) calc(100% * var(--pointer-from-top));
		filter: brightness(0.55) contrast(1.5) saturate(1);
		mix-blend-mode: color-dodge;
		opacity: calc((1.5 * var(--card-opacity)) - var(--pointer-from-center));
	}

	.card[data-rarity$="reverse holo"] .card__glare {
		opacity: var(--card-opacity);
		background-image: radial-gradient(
			farthest-corner circle at var(--pointer-x) var(--pointer-y),
			hsla(0, 0%, 100%, 0.8) 10%,
			hsla(0, 0%, 100%, 0.5) 20%,
			hsla(0, 0%, 0%, 0.75) 90%
		);
		filter: brightness(0.7) contrast(1.5);
	}

	/* ── Amazing Rare — vivid radial burst ───────────────────────────────── */
	.card[data-rarity="amazing rare"] .card__shine {
		background-image:
			radial-gradient(
				farthest-corner circle at var(--pointer-x) var(--pointer-y),
				hsla(53, 100%, 80%, 0.9) 0%,
				hsla(176, 80%, 65%, 0.6) 30%,
				hsla(283, 80%, 55%, 0.4) 60%,
				hsla(0, 0%, 0%, 0.5) 120%
			),
			repeating-linear-gradient(82deg,
				hsl(2, 100%, 73%) 0%, hsl(53, 100%, 69%) 14.28%,
				hsl(93, 100%, 69%) 28.57%, hsl(176, 100%, 76%) 42.85%,
				hsl(228, 100%, 74%) 57.14%, hsl(283, 100%, 73%) 71.42%,
				hsl(2, 100%, 73%) 100%
			);
		background-blend-mode: screen;
		background-size: cover, 300% 700%;
		background-position:
			center center,
			calc(10% + (var(--pointer-from-left) * 80%)) calc(10% + (var(--pointer-from-top) * 80%));
		filter: brightness(0.85) contrast(2.5) saturate(0.7);
		mix-blend-mode: color-dodge;
	}

	/* ── Card info ────────────────────────────────────────────────────────── */
	.card-info {
		margin-top: 0.6rem;
		text-align: center;
	}

	.card-name {
		font-family: 'Syne', sans-serif;
		font-weight: 700;
		font-size: 0.85rem;
		color: #e2e2ea;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-meta {
		font-family: 'DM Sans', sans-serif;
		font-size: 0.72rem;
		color: #7c7c8e;
		margin-top: 0.2rem;
	}
</style>
