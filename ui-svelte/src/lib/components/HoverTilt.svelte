<script lang="ts">
	import { spring } from 'svelte/motion';

	// ── Inlined types ─────────────────────────────────────────────────────────
	type ElementBox = {
		width: number; height: number; left: number; top: number;
		center: [number, number]; half: [number, number];
	};
	type PointerDerivatives = {
		delta: [number, number]; distance: number; angle: number; edge: number;
	};

	// ── Props (from Svelte 5 original: $props() → export let) ─────────────────
	export let tiltFactor      = 1;
	export let tiltFactorY: number | undefined = undefined;
	export let scaleFactor     = 1;
	export let springOptions: { stiffness?: number; damping?: number; precision?: number } = {};
	export let tiltSpringOptions: { stiffness?: number; damping?: number; precision?: number } | undefined = undefined;
	export let enterDelay      = 0;
	export let exitDelay       = 200;
	export let shadow          = false;
	export let shadowBlur      = 12;
	export let blendMode: string | undefined = undefined;
	export let glareIntensity  = 1;
	export let glareHue        = 270;
	export let glareMask: string | undefined = undefined;
	export let glareMaskMode: string | undefined = undefined;
	export let glareMaskComposite: string | undefined = undefined;

	// ── Inlined utils ─────────────────────────────────────────────────────────
	const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

	const readElementBox = (el: HTMLElement): ElementBox => {
		const rect = el.getBoundingClientRect();
		const w = rect.width || 1;
		const h = rect.height || 1;
		return { width: w, height: h, left: rect.left, top: rect.top,
		         center: [w / 2, h / 2], half: [w / 2, h / 2] };
	};

	const derivePointerState = (box: ElementBox, pos: { x: number; y: number }): PointerDerivatives => {
		const px = pos.x * box.width;
		const py = pos.y * box.height;
		const dx = px - box.center[0];
		const dy = py - box.center[1];
		const distance = Math.hypot(dx, dy);
		const absX = Math.abs(dx), absY = Math.abs(dy);
		const kx = absX ? box.half[0] / absX : Infinity;
		const ky = absY ? box.half[1] / absY : Infinity;
		const edge = clamp01(1 / Math.min(kx, ky));
		let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
		if (angle < 0) angle += 360;
		return { delta: [dx, dy], distance, angle, edge };
	};

	// ── Spring setup (new Spring() → spring() from svelte/motion) ─────────────
	const defaultOpts = { stiffness: 0.2, damping: 0.8, precision: 0.001 };
	const initOpts     = { ...defaultOpts, ...springOptions };
	const initTiltOpts = { ...defaultOpts, ...(tiltSpringOptions ?? springOptions) };

	// Svelte 4: spring() returns a store; read with $ prefix
	const activation = spring(0,              initOpts);
	const position   = spring({ x: 0.5, y: 0.5 }, initTiltOpts);

	// ── State ($state<T> → typed let) ─────────────────────────────────────────
	let pointerBox: ElementBox | null = null;
	let pendingPointerMove: { box: ElementBox; normalized: [number, number] } | null = null;
	let moveFrame: number | null = null;
	let isActive = false;
	let enterTimeout: ReturnType<typeof setTimeout>;
	let exitTimeout:  ReturnType<typeof setTimeout>;

	// ── Reactive derivations ($derived → $:) ─────────────────────────────────
	const ROTATION = 10;
	$: rotX     = ROTATION * tiltFactor;
	$: rotY     = ROTATION * (tiltFactorY ?? tiltFactor);
	$: scaleVal = 1 + (scaleFactor - 1) * $activation;
	$: ptrState = pointerBox
		? derivePointerState(pointerBox, { x: $position.x, y: $position.y })
		: ({ delta: [0, 0] as [number, number], distance: 0, angle: 0, edge: 0 });

	$: dynVars = [
		`--hover-tilt-x: ${$position.x}`,
		`--hover-tilt-y: ${$position.y}`,
		`--hover-tilt-opacity: ${$activation}`,
		`--hover-tilt-scale: ${scaleVal}`,
		`--hover-tilt-rotation-x: ${rotX}deg`,
		`--hover-tilt-rotation-y: ${rotY}deg`,
		`--hover-tilt-angle: ${ptrState.angle}deg`,
		`--hover-tilt-from-center: ${ptrState.distance}px`,
		`--hover-tilt-at-edge: ${ptrState.edge}`,
	].join('; ');

	$: inputVars = [
		`--hover-tilt-shadow-blur: ${shadowBlur}`,
		`--hover-tilt-blend-mode: ${blendMode ?? 'overlay'}`,
		`--hover-tilt-glare-intensity: ${glareIntensity}`,
		`--hover-tilt-glare-hue: ${glareHue}`,
		...(glareMask          ? [`--hover-tilt-glare-mask: ${glareMask}`]                       : []),
		...(glareMaskMode      ? [`--hover-tilt-glare-mask-mode: ${glareMaskMode}`]               : []),
		...(glareMaskComposite ? [`--hover-tilt-glare-mask-composite: ${glareMaskComposite}`]     : []),
	].join('; ');

	// Static calc-only vars — never change per-frame, can be a const string
	const staticVars = [
		'--shadow-x: calc(var(--hover-tilt-x, 0) * 2 - 1)',
		'--shadow-y: calc(var(--hover-tilt-y, 0) * 2 - 1)',
		'--gradient-x: calc(var(--hover-tilt-x, 0.5) * 100%)',
		'--gradient-y: calc(var(--hover-tilt-y, 0.5) * 100%)',
		'--scale: var(--hover-tilt-scale, 1)',
		'--rotation-x: calc( var(--hover-tilt-y, 0) * var(--hover-tilt-rotation-y, 20deg) * 2 - var(--hover-tilt-rotation-y, 20deg) )',
		'--rotation-y: calc( (1 - var(--hover-tilt-x, 0)) * var(--hover-tilt-rotation-x, 20deg) * 2 - var(--hover-tilt-rotation-x, 20deg) )',
	].join('; ');

	$: containerStyle = `${dynVars}; ${staticVars}; ${inputVars}`;

	// ── Spring option helpers ─────────────────────────────────────────────────
	const resetSprings = () => {
		activation.stiffness = initOpts.stiffness!;
		activation.damping   = initOpts.damping!;
		position.stiffness   = initTiltOpts.stiffness!;
		position.damping     = initTiltOpts.damping!;
	};

	const exitSprings = () => {
		activation.stiffness = initOpts.stiffness! * 0.2;
		activation.damping   = initOpts.damping!   * 0.5;
		position.stiffness   = initTiltOpts.stiffness! * 0.2;
		position.damping     = initTiltOpts.damping!   * 0.5;
	};

	// ── Pointer frame scheduling ──────────────────────────────────────────────
	const scheduleUpdate = () => {
		if (!isActive || moveFrame !== null || !pendingPointerMove) return;
		moveFrame = requestAnimationFrame(() => {
			const p = pendingPointerMove;
			moveFrame = null;
			if (!p || !isActive) return;
			pendingPointerMove = null;
			pointerBox = p.box;
			position.set({ x: p.normalized[0], y: p.normalized[1] });
		});
	};

	const capturePayload = (e: PointerEvent): boolean => {
		const node = e.currentTarget as HTMLElement;
		if (!node) return false;
		const box = readElementBox(node);
		const nx  = clamp01((e.clientX - box.left) / box.width);
		const ny  = clamp01((e.clientY - box.top)  / box.height);
		pointerBox        = box;
		pendingPointerMove = { box, normalized: [nx, ny] };
		return true;
	};

	// ── Pointer event handlers (onpointerX → on:pointerX) ────────────────────
	const handlePointerEnter = (e: PointerEvent) => {
		clearTimeout(enterTimeout);
		clearTimeout(exitTimeout);
		capturePayload(e);
		if (isActive) {
			resetSprings();
			activation.set(1);
			scheduleUpdate();
		} else {
			enterTimeout = setTimeout(() => {
				if (!isActive) {
					resetSprings();
					activation.set(1);
					isActive = true;
					scheduleUpdate();
				}
			}, enterDelay);
		}
	};

	const handlePointerMove = (e: PointerEvent) => {
		if (capturePayload(e)) scheduleUpdate();
	};

	const handlePointerLeave = (_e: PointerEvent) => {
		clearTimeout(enterTimeout);
		clearTimeout(exitTimeout);
		if (moveFrame !== null) {
			cancelAnimationFrame(moveFrame);
			moveFrame        = null;
			pendingPointerMove = null;
		}
		exitTimeout = setTimeout(async () => {
			exitSprings();
			position.set({ x: 0.5, y: 0.5 });
			try {
				await activation.set(0);
				isActive = false;
			} catch (err) {
				if (err instanceof Error && err.message === 'Aborted') return;
				throw err;
			}
		}, exitDelay);
	};
</script>

<div
	class="hover-tilt-container"
	data-is-active={$activation >= 0.01}
	style={containerStyle}
>
	<div
		class="hover-tilt"
		class:hover-tilt-shadow={shadow}
		class:hover-tilt-glare-mask={!!glareMask}
		role="presentation"
		on:pointermove={handlePointerMove}
		on:pointerleave={handlePointerLeave}
		on:pointerenter={handlePointerEnter}
	>
		<slot />
	</div>
</div>

<style>
	/* the container element */
	.hover-tilt-container {
		perspective: 600px;
		touch-action: none;
	}

	/* the main tilt element */
	.hover-tilt {
		--hover-tilt-default-gradient: radial-gradient(
			farthest-corner circle at var(--gradient-x) var(--gradient-y),
			lch(95% 2.7 var(--hover-tilt-glare-hue, 270) / calc(var(--hover-tilt-glare-intensity, 1) * 0.66)) 8%,
			lch(88% 5.5 var(--hover-tilt-glare-hue, 270) / calc(var(--hover-tilt-glare-intensity, 1) * 0.5)) 28%,
			lch(05% 3.5 var(--hover-tilt-glare-hue, 270) / calc(var(--hover-tilt-glare-intensity, 1) * 0.25)) 90%
		);
		position: relative;
		border-radius: inherit;
		transform: scale(var(--scale)) rotateX(var(--rotation-x)) rotateY(var(--rotation-y)) translate3d(0, 0, 0.01px);
		transform-style: preserve-3d;
		will-change: transform, box-shadow, opacity;
	}

	/* the gradient glare layer */
	.hover-tilt::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
		background-image: var(--hover-tilt-custom-gradient, var(--hover-tilt-default-gradient));
		mix-blend-mode: var(--hover-tilt-blend-mode, overlay);
		opacity: var(--hover-tilt-opacity, 0);
		will-change: background-image, opacity;
	}

	/* shadow variant */
	.hover-tilt-shadow {
		--shadow-blur-1: calc(var(--hover-tilt-shadow-blur, 12) * 1px);
		--shadow-blur-2: calc(var(--shadow-blur-1) / 2);
		--hover-tilt-default-shadow:
			calc(var(--shadow-x) * var(--shadow-blur-1)) calc(var(--shadow-y) * var(--shadow-blur-1) / 2 + var(--shadow-blur-1) / 4) calc(var(--shadow-blur-1) / 2) calc(var(--shadow-blur-1) * -0.25) lch(0% 0 0 / calc(var(--hover-tilt-opacity, 0) * 0.125)),
			calc(var(--shadow-x) * var(--shadow-blur-2)) calc(var(--shadow-y) * var(--shadow-blur-2) / 2 + var(--shadow-blur-2) / 4) calc(var(--shadow-blur-2) / 2) calc(var(--shadow-blur-2) * -0.25) lch(0% 0 0 / calc(var(--hover-tilt-opacity, 0) * 0.125));
		box-shadow: var(--hover-tilt-custom-shadow, var(--hover-tilt-default-shadow));
	}

	/* glare mask variant */
	.hover-tilt-glare-mask::before {
		mask-image: var(--hover-tilt-glare-mask, none);
		mask-size: cover;
		mask-position: center;
		mask-repeat: no-repeat;
		mask-mode: var(--hover-tilt-glare-mask-mode, match-source);
		mask-composite: var(--hover-tilt-glare-mask-composite, add);
	}
</style>
