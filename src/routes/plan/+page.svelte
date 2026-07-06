<script lang="ts">
	import '../../app.css';
	import type { PageData, ActionData } from './$types.js';
	import TripPlanner from '$lib/TripPlanner.svelte';

	export let data: PageData;
	export let form: ActionData;

	let sleepStart = form?.values?.sleepStart || '23:00';
	let sleepEnd = form?.values?.sleepEnd || '07:00';
	let usesMelatonin = form?.values?.usesMelatonin ?? true;

	function err(field: string): string {
		return (form?.errors as Record<string, string> | undefined)?.[field] ?? '';
	}

	const chronotypes = [
		{ value: 'early', label: '🐦 Early bird', hint: 'Wake & sleep early' },
		{ value: 'intermediate', label: '🌤️ In between', hint: 'Average' },
		{ value: 'late', label: '🦉 Night owl', hint: 'Wake & sleep late' }
	];
	const caffeineOptions = [
		{ value: 'none', label: 'None', hint: "I don't use caffeine" },
		{ value: 'sensitive', label: 'Sensitive', hint: 'Cut off early' },
		{ value: 'average', label: 'Average', hint: 'Typical' },
		{ value: 'tolerant', label: 'Tolerant', hint: 'Late is fine' }
	];
	let chronotype = form?.values?.chronotype || 'intermediate';
	let caffeine = form?.values?.caffeine || 'average';
</script>

<svelte:head>
	<title>Create Plan — JetShift</title>
</svelte:head>

<div class="min-h-screen bg-slate-950 text-slate-100">
	<nav class="border-b border-slate-800 px-6 py-4 flex items-center gap-4 max-w-6xl mx-auto">
		<a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
			<svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
				<circle cx="14" cy="14" r="13" fill="#1e293b" stroke="#6366f1" stroke-width="1.5"/>
				<path d="M14 7v7l4 2" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M6 17l3-1.5 1.5 2.5 4-6 3 1-1 4H6z" fill="#6366f1" opacity="0.8"/>
			</svg>
			<span class="text-lg font-bold">Jet<span class="text-indigo-400">Shift</span></span>
		</a>
		<span class="text-slate-600">/</span>
		<span class="text-slate-400 text-sm">Create Plan</span>
	</nav>

	<main class="max-w-2xl mx-auto px-6 py-12">
		<h1 class="text-3xl font-bold mb-2">Plan Your Trip</h1>
		<p class="text-slate-400 mb-8 text-sm">
			Enter your flight and a few details about you. JetShift builds a hyper-personalized circadian
			plan from your route, chronotype, age, sleep pattern and caffeine habits.
		</p>

		{#if form?.errors?.general}
			<div class="rounded-lg bg-red-950 border border-red-800 text-red-300 px-4 py-3 mb-6 text-sm">{form.errors.general}</div>
		{/if}
		{#if form?.errors && Object.keys(form.errors).some((k) => k !== 'general')}
			<div class="rounded-lg bg-amber-950 border border-amber-800 text-amber-300 px-4 py-3 mb-6 text-sm">
				Please fix the highlighted fields below.
			</div>
		{/if}

		<form method="POST" class="space-y-8">
			<!-- Trip / route -->
			<fieldset class="rounded-2xl bg-slate-900 border border-slate-800 p-6">
				<legend class="text-sm font-semibold uppercase tracking-wider text-indigo-400 px-2">✈️ Route</legend>
				<TripPlanner
					airports={data.airports}
					initialDepartureTz={form?.values?.departureTz ?? ''}
					initialArrivalTz={form?.values?.arrivalTz ?? ''}
					initialDepartureDatetime={form?.values?.departureDatetime ?? ''}
					initialReturnDatetime={form?.values?.returnDatetime ?? ''}
					initialFlight={form?.values?.flightNumber ?? ''}
				/>
				{#if err('departure_tz')}<p class="text-red-400 text-xs mt-2">{err('departure_tz')}</p>{/if}
				{#if err('arrival_tz')}<p class="text-red-400 text-xs mt-1">{err('arrival_tz')}</p>{/if}
				{#if err('departure_datetime')}<p class="text-red-400 text-xs mt-1">{err('departure_datetime')}</p>{/if}
				{#if err('return_datetime')}<p class="text-red-400 text-xs mt-1">{err('return_datetime')}</p>{/if}
			</fieldset>

			<!-- About you -->
			<fieldset class="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5">
				<legend class="text-sm font-semibold uppercase tracking-wider text-indigo-400 px-2">🧬 About you</legend>

				<div class="grid grid-cols-2 gap-5">
					<div>
						<label for="sleep_start" class="block text-sm font-medium text-slate-300 mb-1.5">Usual bedtime</label>
						<input type="time" id="sleep_start" name="sleep_start" bind:value={sleepStart} required
							class="w-full rounded-lg bg-slate-800 border {err('sleep_start') ? 'border-red-600' : 'border-slate-700'} text-slate-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]" />
						{#if err('sleep_start')}<p class="text-red-400 text-xs mt-1">{err('sleep_start')}</p>{/if}
					</div>
					<div>
						<label for="sleep_end" class="block text-sm font-medium text-slate-300 mb-1.5">Usual wake time</label>
						<input type="time" id="sleep_end" name="sleep_end" bind:value={sleepEnd} required
							class="w-full rounded-lg bg-slate-800 border {err('sleep_end') ? 'border-red-600' : 'border-slate-700'} text-slate-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]" />
						{#if err('sleep_end')}<p class="text-red-400 text-xs mt-1">{err('sleep_end')}</p>{/if}
					</div>
				</div>

				<div>
					<label for="age" class="block text-sm font-medium text-slate-300 mb-1.5">
						Age <span class="text-slate-500 font-normal">(optional — tunes circadian phase)</span>
					</label>
					<input type="number" id="age" name="age" min="1" max="120" value={form?.values?.age ?? ''} placeholder="e.g. 35"
						class="w-full sm:w-40 rounded-lg bg-slate-800 border {err('age') ? 'border-red-600' : 'border-slate-700'} text-slate-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
					{#if err('age')}<p class="text-red-400 text-xs mt-1">{err('age')}</p>{/if}
				</div>

				<div>
					<span class="block text-sm font-medium text-slate-300 mb-1.5">Chronotype</span>
					<div class="grid grid-cols-3 gap-2">
						{#each chronotypes as c}
							<label class="cursor-pointer rounded-lg border px-3 py-2.5 text-center transition-colors
								{chronotype === c.value ? 'border-indigo-500 bg-indigo-950/60 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'}">
								<input type="radio" name="chronotype" value={c.value} bind:group={chronotype} class="sr-only" />
								<span class="block text-sm font-medium">{c.label}</span>
								<span class="block text-xs opacity-70">{c.hint}</span>
							</label>
						{/each}
					</div>
				</div>

				<div>
					<span class="block text-sm font-medium text-slate-300 mb-1.5">Caffeine</span>
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
						{#each caffeineOptions as c}
							<label class="cursor-pointer rounded-lg border px-3 py-2.5 text-center transition-colors
								{caffeine === c.value ? 'border-amber-500 bg-amber-950/40 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'}">
								<input type="radio" name="caffeine" value={c.value} bind:group={caffeine} class="sr-only" />
								<span class="block text-sm font-medium">{c.label}</span>
								<span class="block text-xs opacity-70">{c.hint}</span>
							</label>
						{/each}
					</div>
				</div>

				<label class="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 cursor-pointer">
					<input type="checkbox" name="uses_melatonin" bind:checked={usesMelatonin} class="accent-violet-500 w-4 h-4" />
					<span class="text-sm">
						<span class="font-medium text-slate-200">Include melatonin guidance</span>
						<span class="block text-xs text-slate-400">Low-dose (0.5 mg) timing. Consult a physician before use.</span>
					</span>
				</label>
			</fieldset>

			<button type="submit"
				class="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition-colors py-4 font-bold text-white text-lg shadow-lg shadow-indigo-900/40">
				Generate My Plan →
			</button>
		</form>
	</main>
</div>
