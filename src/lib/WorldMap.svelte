<script lang="ts">
	import type { Airport } from './airports.js';
	import { WORLD_LAND_PATH } from './worldland.js';
	import { createEventDispatcher } from 'svelte';

	export let airports: Airport[] = [];
	export let departure: string | null = null; // IATA
	export let arrival: string | null = null; // IATA
	/** Which endpoint the next map tap assigns. Two-way bindable. */
	export let selecting: 'departure' | 'arrival' = 'departure';

	const dispatch = createEventDispatcher<{
		select: { iata: string; role: 'departure' | 'arrival' };
	}>();

	// Equirectangular projection into a 360×180 viewBox.
	const W = 360;
	const H = 180;
	const px = (lon: number) => lon + 180;
	const py = (lat: number) => 90 - lat;

	$: depAirport = airports.find((a) => a.iata === departure) ?? null;
	$: arrAirport = airports.find((a) => a.iata === arrival) ?? null;

	/**
	 * Curved route between the endpoints. Bows toward the nearer pole (a rough nod to great-circle
	 * routes) and takes the short way across the antimeridian, drawing a wrapped twin when needed.
	 */
	function routePaths(a: Airport, b: Airport): string[] {
		let x1 = px(a.lon);
		let x2 = px(b.lon);
		const y1 = py(a.lat);
		const y2 = py(b.lat);
		// Choose the short crossing: shift the second endpoint by ±360 if closer.
		if (x2 - x1 > 180) x2 -= 360;
		else if (x1 - x2 > 180) x2 += 360;
		const mx = (x1 + x2) / 2;
		const my = (y1 + y2) / 2;
		// Bow ~18% of the horizontal span toward the top (north) — most long-haul routes arc north.
		const bow = Math.min(Math.abs(x2 - x1) * 0.18, 30);
		const cy = Math.max(my - bow, 4);
		const d = `M${x1} ${y1}Q${mx} ${cy} ${x2} ${y2}`;
		// If the curve leaves the viewBox horizontally, draw a ±360-shifted twin so both fragments show.
		if (x2 < 0 || x2 > W || x1 < 0 || x1 > W) {
			const shift = x2 < 0 || x1 < 0 ? 360 : -360;
			return [d, `M${x1 + shift} ${y1}Q${mx + shift} ${cy} ${x2 + shift} ${y2}`];
		}
		return [d];
	}
	$: routes = depAirport && arrAirport ? routePaths(depAirport, arrAirport) : [];

	function roleOf(iata: string): 'departure' | 'arrival' | null {
		if (iata === departure) return 'departure';
		if (iata === arrival) return 'arrival';
		return null;
	}

	/** Forgiving tap handling: select the airport nearest to the tap point (mobile-friendly). */
	let svgEl: SVGSVGElement;
	function nearestAirport(clientX: number, clientY: number): Airport | null {
		const rect = svgEl.getBoundingClientRect();
		const x = ((clientX - rect.left) / rect.width) * W;
		const y = ((clientY - rect.top) / rect.height) * H;
		let best: Airport | null = null;
		let bestD = Infinity;
		for (const a of airports) {
			const dx = px(a.lon) - x;
			const dy = py(a.lat) - y;
			const d = dx * dx + dy * dy;
			if (d < bestD) {
				bestD = d;
				best = a;
			}
		}
		// Accept taps within ~14 viewBox units (~4% of map width) of a marker.
		return bestD <= 14 * 14 ? best : null;
	}
	function handleTap(e: MouseEvent) {
		const a = nearestAirport(e.clientX, e.clientY);
		if (!a) return;
		dispatch('select', { iata: a.iata, role: selecting });
	}

	/** Keep selected-city labels inside the viewBox. */
	function labelAnchor(a: Airport): 'start' | 'end' {
		return px(a.lon) > W - 46 ? 'end' : 'start';
	}
	function labelX(a: Airport): number {
		return labelAnchor(a) === 'start' ? px(a.lon) + 4 : px(a.lon) - 4;
	}
	function labelY(a: Airport): number {
		return Math.min(Math.max(py(a.lat) - 4, 8), H - 4);
	}
</script>

<div class="w-full">
	<!-- From / To mode pills -->
	<div class="flex items-center gap-2 mb-2" role="radiogroup" aria-label="Choose which endpoint the next map tap sets">
		<button
			type="button"
			role="radio"
			aria-checked={selecting === 'departure'}
			on:click={() => (selecting = 'departure')}
			class="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors min-h-[36px]
				{selecting === 'departure' ? 'border-cyan-400 bg-cyan-950/60 text-cyan-200' : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-500'}"
		>
			<span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
			From{depAirport ? `: ${depAirport.city}` : ''}
		</button>
		<button
			type="button"
			role="radio"
			aria-checked={selecting === 'arrival'}
			on:click={() => (selecting = 'arrival')}
			class="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors min-h-[36px]
				{selecting === 'arrival' ? 'border-pink-400 bg-pink-950/60 text-pink-200' : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-500'}"
		>
			<span class="w-2.5 h-2.5 rounded-full bg-pink-400"></span>
			To{arrAirport ? `: ${arrAirport.city}` : ''}
		</button>
		<span class="ml-auto text-xs text-slate-500 hidden sm:block">Tap the map to set {selecting === 'departure' ? 'departure' : 'arrival'}</span>
	</div>

	<!-- Pointer-only shortcut: keyboard users select airports via the search fields above, which
	     cover the same airports with full a11y. -->
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
	<svg
		bind:this={svgEl}
		viewBox="0 0 {W} {H}"
		class="w-full rounded-xl border border-slate-800 select-none cursor-crosshair touch-manipulation"
		role="application"
		aria-label="World map — tap near a city to select it as {selecting}"
		on:click={handleTap}
	>
		<defs>
			<radialGradient id="oceanGrad" cx="50%" cy="38%" r="75%">
				<stop offset="0%" stop-color="#101c33" />
				<stop offset="100%" stop-color="#080e1c" />
			</radialGradient>
			<filter id="markerGlow" x="-80%" y="-80%" width="260%" height="260%">
				<feGaussianBlur stdDeviation="1.6" result="b" />
				<feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
			</filter>
		</defs>

		<!-- Ocean -->
		<rect x="0" y="0" width={W} height={H} fill="url(#oceanGrad)" />

		<!-- Graticule (subtle) -->
		{#each [-120, -60, 0, 60, 120] as lon}
			<line x1={px(lon)} y1="0" x2={px(lon)} y2={H} stroke="#1e293b" stroke-width="0.35" opacity="0.5" />
		{/each}
		{#each [-60, -30, 0, 30, 60] as lat}
			<line x1="0" y1={py(lat)} x2={W} y2={py(lat)} stroke="#1e293b" stroke-width="0.35" opacity="0.5" />
		{/each}

		<!-- Land (Natural Earth 110m) -->
		<path d={WORLD_LAND_PATH} fill="#26334d" stroke="#3b4a68" stroke-width="0.3" fill-rule="evenodd" />

		<!-- Route arc -->
		{#each routes as d}
			<path {d} fill="none" stroke="#0b1220" stroke-width="2.2" opacity="0.6" />
			<path {d} fill="none" stroke="#818cf8" stroke-width="1" stroke-linecap="round" stroke-dasharray="4 3" class="route-dash" />
		{/each}

		<!-- Airport markers -->
		{#each airports as a}
			{@const role = roleOf(a.iata)}
			{#if !role}
				<circle cx={px(a.lon)} cy={py(a.lat)} r="1.4" fill="#7d8db0" opacity="0.85" pointer-events="none">
					<title>{a.city} ({a.iata})</title>
				</circle>
			{/if}
		{/each}

		<!-- Selected markers on top, with labels -->
		{#each [depAirport, arrAirport] as sel, i}
			{#if sel}
				{@const color = i === 0 ? '#22d3ee' : '#f472b6'}
				<circle cx={px(sel.lon)} cy={py(sel.lat)} r="4.5" fill={color} opacity="0.25" pointer-events="none" />
				<circle cx={px(sel.lon)} cy={py(sel.lat)} r="2.4" fill={color} stroke="#0b1220" stroke-width="0.7" filter="url(#markerGlow)" pointer-events="none" />
				<text
					x={labelX(sel)}
					y={labelY(sel)}
					text-anchor={labelAnchor(sel)}
					font-size="6.5"
					font-weight="700"
					fill={color}
					stroke="#080e1c"
					stroke-width="2"
					paint-order="stroke"
					pointer-events="none"
				>{sel.city}</text>
			{/if}
		{/each}
	</svg>

	<p class="mt-1.5 text-xs text-slate-500 sm:hidden text-center">
		Tap the map to set <strong class="text-slate-300">{selecting === 'departure' ? 'departure' : 'arrival'}</strong>
	</p>
</div>

<style>
	.route-dash {
		animation: dashflow 1.6s linear infinite;
	}
	@keyframes dashflow {
		to {
			stroke-dashoffset: -14;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.route-dash {
			animation: none;
		}
	}
</style>
