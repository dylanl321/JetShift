<script lang="ts">
	import WorldMap from './WorldMap.svelte';
	import { AIRPORTS, searchAirports, findAirport, type Airport } from './airports.js';

	export let airports: Airport[] = AIRPORTS;

	// Optional initial values (e.g. from a failed form submit).
	export let initialDepartureTz = '';
	export let initialArrivalTz = '';
	export let initialDepartureDatetime = '';
	export let initialReturnDatetime = '';
	export let initialFlight = '';

	interface Endpoint {
		iata: string | null;
		city: string;
		tz: string;
	}

	function endpointFromTz(tz: string): Endpoint | null {
		if (!tz) return null;
		const a = airports.find((x) => x.tz === tz);
		return a ? { iata: a.iata, city: a.city, tz: a.tz } : { iata: null, city: tz.split('/').pop() ?? tz, tz };
	}

	let from: Endpoint | null = endpointFromTz(initialDepartureTz);
	let to: Endpoint | null = endpointFromTz(initialArrivalTz);
	let selecting: 'departure' | 'arrival' = 'departure';

	let departureDatetime = initialDepartureDatetime;
	let roundTrip = !!initialReturnDatetime;
	let returnDatetime = initialReturnDatetime;

	// Airport search boxes.
	let fromQuery = from?.city ?? '';
	let toQuery = to?.city ?? '';
	let fromResults: Airport[] = [];
	let toResults: Airport[] = [];
	let fromOpen = false;
	let toOpen = false;

	function onFromInput() {
		fromResults = searchAirports(fromQuery);
		fromOpen = fromResults.length > 0;
	}
	function onToInput() {
		toResults = searchAirports(toQuery);
		toOpen = toResults.length > 0;
	}
	function pick(role: 'departure' | 'arrival', a: Airport) {
		const ep: Endpoint = { iata: a.iata, city: a.city, tz: a.tz };
		if (role === 'departure') {
			from = ep;
			fromQuery = `${a.city} (${a.iata})`;
			fromOpen = false;
			selecting = 'arrival';
		} else {
			to = ep;
			toQuery = `${a.city} (${a.iata})`;
			toOpen = false;
			selecting = 'departure';
		}
	}
	function onMapSelect(e: CustomEvent<{ iata: string; role: 'departure' | 'arrival' }>) {
		const a = findAirport(e.detail.iata);
		if (a) pick(e.detail.role, a);
	}
	function swap() {
		const t = from;
		from = to;
		to = t;
		const q = fromQuery;
		fromQuery = toQuery;
		toQuery = q;
	}

	// Flight-number lookup.
	let flight = initialFlight;
	let flightState: 'idle' | 'loading' | 'ok' | 'error' = 'idle';
	let flightMsg = '';
	async function lookupFlight() {
		const f = flight.trim().toUpperCase().replace(/\s+/g, '');
		if (!f) return;
		flightState = 'loading';
		flightMsg = '';
		try {
			const date = departureDatetime ? departureDatetime.slice(0, 10) : '';
			const res = await fetch(`/api/flight?flight=${encodeURIComponent(f)}&date=${date}`);
			const data = await res.json();
			if (data.ok) {
				const dep: Endpoint = { iata: data.departure.iata, city: data.departure.city, tz: data.departure.tz };
				const arr: Endpoint = { iata: data.arrival.iata, city: data.arrival.city, tz: data.arrival.tz };
				from = dep;
				to = arr;
				fromQuery = `${dep.city} (${dep.iata})`;
				toQuery = `${arr.city} (${arr.iata})`;
				flightState = 'ok';
				flightMsg = `Found ${dep.city} → ${arr.city}.`;
			} else {
				flightState = 'error';
				flightMsg = data.reason ?? 'Could not resolve that flight.';
			}
		} catch {
			flightState = 'error';
			flightMsg = 'Lookup failed. Pick your airports on the map instead.';
		}
	}

	$: mapDeparture = from?.iata ?? null;
	$: mapArrival = to?.iata ?? null;
</script>

<!-- Hidden inputs consumed by the form POST -->
<input type="hidden" name="departure_tz" value={from?.tz ?? ''} />
<input type="hidden" name="arrival_tz" value={to?.tz ?? ''} />
<input type="hidden" name="round_trip" value={roundTrip ? 'on' : ''} />

<div class="space-y-5">
	<!-- Flight number -->
	<div>
		<label for="flight_number" class="block text-sm font-medium text-slate-300 mb-1.5">
			Flight number <span class="text-slate-500 font-normal">(optional — auto-fills your route)</span>
		</label>
		<div class="flex gap-2">
			<input
				id="flight_number"
				name="flight_number"
				bind:value={flight}
				placeholder="e.g. BA178"
				autocomplete="off"
				on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), lookupFlight())}
				class="flex-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase placeholder:normal-case"
			/>
			<button
				type="button"
				on:click={lookupFlight}
				disabled={flightState === 'loading'}
				class="rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white whitespace-nowrap"
			>
				{flightState === 'loading' ? 'Looking up…' : 'Look up'}
			</button>
		</div>
		{#if flightMsg}
			<p class="text-xs mt-1 {flightState === 'ok' ? 'text-emerald-400' : 'text-amber-400'}">{flightMsg}</p>
		{/if}
	</div>

	<!-- From / To autocomplete -->
	<div class="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
		<div class="relative">
			<label for="from_q" class="block text-sm font-medium text-slate-300 mb-1.5">From</label>
			<input
				id="from_q"
				bind:value={fromQuery}
				on:input={onFromInput}
				on:focus={() => { selecting = 'departure'; onFromInput(); }}
				on:blur={() => setTimeout(() => (fromOpen = false), 150)}
				placeholder="City or airport code"
				autocomplete="off"
				class="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
			/>
			{#if fromOpen}
				<ul class="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg bg-slate-800 border border-slate-700 shadow-xl">
					{#each fromResults as a}
						<li>
							<button type="button" class="w-full text-left px-3 py-2 text-sm hover:bg-slate-700" on:click={() => pick('departure', a)}>
								<span class="font-mono text-cyan-300">{a.iata}</span> · {a.city}, {a.country}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<button type="button" on:click={swap} title="Swap" aria-label="Swap from and to"
			class="justify-self-center rounded-lg border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white h-10 w-10 flex items-center justify-center mb-0.5">
			⇄
		</button>

		<div class="relative">
			<label for="to_q" class="block text-sm font-medium text-slate-300 mb-1.5">To</label>
			<input
				id="to_q"
				bind:value={toQuery}
				on:input={onToInput}
				on:focus={() => { selecting = 'arrival'; onToInput(); }}
				on:blur={() => setTimeout(() => (toOpen = false), 150)}
				placeholder="City or airport code"
				autocomplete="off"
				class="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
			/>
			{#if toOpen}
				<ul class="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg bg-slate-800 border border-slate-700 shadow-xl">
					{#each toResults as a}
						<li>
							<button type="button" class="w-full text-left px-3 py-2 text-sm hover:bg-slate-700" on:click={() => pick('arrival', a)}>
								<span class="font-mono text-pink-300">{a.iata}</span> · {a.city}, {a.country}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>

	<!-- Map -->
	<WorldMap {airports} departure={mapDeparture} arrival={mapArrival} {selecting} on:select={onMapSelect} />

	<!-- Dates -->
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
		<div>
			<label for="departure_datetime" class="block text-sm font-medium text-slate-300 mb-1.5">
				Departure <span class="text-slate-500 font-normal">(local time)</span>
			</label>
			<input
				type="datetime-local"
				id="departure_datetime"
				name="departure_datetime"
				bind:value={departureDatetime}
				required
				class="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
			/>
		</div>
		<div>
			<div class="flex items-center justify-between mb-1.5">
				<label for="return_datetime" class="block text-sm font-medium text-slate-300">Return</label>
				<label class="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
					<input type="checkbox" bind:checked={roundTrip} class="accent-indigo-500" />
					Round trip
				</label>
			</div>
			<input
				type="datetime-local"
				id="return_datetime"
				name="return_datetime"
				bind:value={returnDatetime}
				disabled={!roundTrip}
				class="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark] disabled:opacity-40"
			/>
		</div>
	</div>
</div>
