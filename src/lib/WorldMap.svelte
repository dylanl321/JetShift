<script lang="ts">
	import type { Airport } from './airports.js';
	import { createEventDispatcher } from 'svelte';

	export let airports: Airport[] = [];
	export let departure: string | null = null; // IATA
	export let arrival: string | null = null; // IATA
	/** Which endpoint the next map click assigns. */
	export let selecting: 'departure' | 'arrival' = 'departure';

	const dispatch = createEventDispatcher<{ select: { iata: string; role: 'departure' | 'arrival' } }>();

	// Equirectangular projection into a 360×180 viewBox.
	const W = 360;
	const H = 180;
	function px(lon: number): number {
		return lon + 180;
	}
	function py(lat: number): number {
		return 90 - lat;
	}

	// Rough continent silhouettes (lon,lat) for orientation — intentionally low-detail & faint.
	const CONTINENTS: [number, number][][] = [
		[[-168, 65], [-140, 70], [-95, 71], [-60, 60], [-55, 47], [-70, 43], [-81, 25], [-97, 16], [-107, 23], [-124, 40], [-140, 58], [-168, 65]],
		[[-80, 9], [-60, 8], [-50, 0], [-35, -7], [-40, -23], [-58, -35], [-71, -52], [-74, -42], [-70, -18], [-81, -4], [-80, 9]],
		[[-10, 58], [3, 61], [28, 60], [40, 47], [28, 40], [10, 37], [-8, 43], [-10, 58]],
		[[-17, 21], [10, 33], [33, 31], [44, 11], [51, 11], [40, -4], [38, -20], [20, -35], [10, -18], [-17, 21]],
		[[40, 47], [55, 62], [90, 72], [140, 71], [160, 60], [143, 45], [130, 34], [122, 22], [100, 8], [78, 8], [60, 24], [45, 40], [40, 47]],
		[[114, -22], [131, -12], [143, -12], [151, -25], [146, -38], [129, -32], [115, -34], [114, -22]]
	];
	function polyPoints(pts: [number, number][]): string {
		return pts.map(([lon, lat]) => `${px(lon)},${py(lat)}`).join(' ');
	}

	$: depAirport = airports.find((a) => a.iata === departure) ?? null;
	$: arrAirport = airports.find((a) => a.iata === arrival) ?? null;

	function handleSelect(a: Airport) {
		dispatch('select', { iata: a.iata, role: selecting });
	}

	function roleOf(iata: string): 'departure' | 'arrival' | null {
		if (iata === departure) return 'departure';
		if (iata === arrival) return 'arrival';
		return null;
	}
</script>

<div class="w-full">
	<svg
		viewBox="0 0 {W} {H}"
		class="w-full rounded-xl border border-slate-800 bg-slate-900"
		role="group"
		aria-label="World map — click a city to select it"
	>
		<!-- Ocean -->
		<rect x="0" y="0" width={W} height={H} fill="#0b1220" />

		<!-- Graticule -->
		{#each [-120, -60, 0, 60, 120] as lon}
			<line x1={px(lon)} y1="0" x2={px(lon)} y2={H} stroke="#1e293b" stroke-width="0.4" />
		{/each}
		{#each [-60, -30, 0, 30, 60] as lat}
			<line x1="0" y1={py(lat)} x2={W} y2={py(lat)} stroke="#1e293b" stroke-width="0.4" />
		{/each}
		<line x1="0" y1={py(0)} x2={W} y2={py(0)} stroke="#334155" stroke-width="0.6" stroke-dasharray="2 2" />

		<!-- Continents (faint) -->
		{#each CONTINENTS as poly}
			<polygon points={polyPoints(poly)} fill="#1e293b" opacity="0.55" stroke="#334155" stroke-width="0.3" />
		{/each}

		<!-- Route line -->
		{#if depAirport && arrAirport}
			<line
				x1={px(depAirport.lon)} y1={py(depAirport.lat)}
				x2={px(arrAirport.lon)} y2={py(arrAirport.lat)}
				stroke="#6366f1" stroke-width="0.8" stroke-dasharray="3 2" opacity="0.9"
			/>
		{/if}

		<!-- Airport markers -->
		{#each airports as a}
			{@const role = roleOf(a.iata)}
			<g
				class="cursor-pointer"
				role="button"
				tabindex="0"
				aria-label="{a.city} ({a.iata})"
				on:click={() => handleSelect(a)}
				on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleSelect(a))}
			>
				<circle
					cx={px(a.lon)} cy={py(a.lat)}
					r={role ? 2.6 : 1.3}
					fill={role === 'departure' ? '#22d3ee' : role === 'arrival' ? '#f472b6' : '#64748b'}
					stroke={role ? '#0b1220' : 'none'}
					stroke-width="0.5"
					opacity={role ? 1 : 0.7}
				/>
				<!-- Invisible larger hit target -->
				<circle cx={px(a.lon)} cy={py(a.lat)} r="3.5" fill="transparent" />
			</g>
		{/each}
	</svg>

	<div class="flex items-center justify-between mt-2 text-xs">
		<div class="flex items-center gap-3">
			<span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span> From{#if depAirport}: <strong class="text-slate-200">{depAirport.city}</strong>{/if}</span>
			<span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-pink-400 inline-block"></span> To{#if arrAirport}: <strong class="text-slate-200">{arrAirport.city}</strong>{/if}</span>
		</div>
		<span class="text-slate-500">Tap a city to set <strong class="text-slate-300">{selecting}</strong></span>
	</div>
</div>
