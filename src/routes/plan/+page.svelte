<script lang="ts">
	import '../../app.css';
	import type { PageData, ActionData } from './$types.js';

	export let data: PageData;
	export let form: ActionData;

	// Default sleep schedule
	let sleepStart = '23:00';
	let sleepEnd = '07:00';

	// Pre-fill from form errors
	$: if (form?.values) {
		sleepStart = form.values.sleepStart || sleepStart;
		sleepEnd = form.values.sleepEnd || sleepEnd;
	}

	function err(field: string): string {
		return form?.errors?.[field] ?? '';
	}
</script>

<svelte:head>
	<title>Create Plan — JetShift</title>
</svelte:head>

<div class="min-h-screen bg-slate-950 text-slate-100">
	<!-- Nav -->
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
		<p class="text-slate-400 mb-10 text-sm">Enter your flight details and sleep schedule to get a personalized jet lag plan.</p>

		{#if form?.errors?.general}
			<div class="rounded-lg bg-red-950 border border-red-800 text-red-300 px-4 py-3 mb-6 text-sm">
				{form.errors.general}
			</div>
		{/if}

		<form method="POST" class="space-y-8">
			<!-- Trip Details -->
			<fieldset class="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5">
				<legend class="text-sm font-semibold uppercase tracking-wider text-indigo-400 -mt-3 -mx-6 px-6 pb-4 border-b border-slate-800 w-[calc(100%+3rem)] block">
					✈️ Trip Details
				</legend>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
					<div>
						<label for="departure_tz" class="block text-sm font-medium text-slate-300 mb-1.5">
							Departure City / Timezone
						</label>
						<select
							id="departure_tz"
							name="departure_tz"
							value={form?.values?.departureTz ?? ''}
							class="w-full rounded-lg bg-slate-800 border {err('departure_tz') ? 'border-red-600' : 'border-slate-700'} text-slate-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							required
						>
							<option value="" disabled>Select timezone…</option>
							{#each data.timezones as tz}
								<option value={tz.iana}>{tz.label}</option>
							{/each}
						</select>
						{#if err('departure_tz')}
							<p class="text-red-400 text-xs mt-1">{err('departure_tz')}</p>
						{/if}
					</div>

					<div>
						<label for="arrival_tz" class="block text-sm font-medium text-slate-300 mb-1.5">
							Arrival City / Timezone
						</label>
						<select
							id="arrival_tz"
							name="arrival_tz"
							value={form?.values?.arrivalTz ?? ''}
							class="w-full rounded-lg bg-slate-800 border {err('arrival_tz') ? 'border-red-600' : 'border-slate-700'} text-slate-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							required
						>
							<option value="" disabled>Select timezone…</option>
							{#each data.timezones as tz}
								<option value={tz.iana}>{tz.label}</option>
							{/each}
						</select>
						{#if err('arrival_tz')}
							<p class="text-red-400 text-xs mt-1">{err('arrival_tz')}</p>
						{/if}
					</div>
				</div>

				<div>
					<label for="departure_datetime" class="block text-sm font-medium text-slate-300 mb-1.5">
						Departure Date & Time <span class="text-slate-500 font-normal">(local time)</span>
					</label>
					<input
						type="datetime-local"
						id="departure_datetime"
						name="departure_datetime"
						value={form?.values?.departureDatetime ?? ''}
						class="w-full rounded-lg bg-slate-800 border {err('departure_datetime') ? 'border-red-600' : 'border-slate-700'} text-slate-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 [color-scheme:dark]"
						required
					/>
					{#if err('departure_datetime')}
						<p class="text-red-400 text-xs mt-1">{err('departure_datetime')}</p>
					{/if}
				</div>
			</fieldset>

			<!-- Sleep Schedule -->
			<fieldset class="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5">
				<legend class="text-sm font-semibold uppercase tracking-wider text-indigo-400 -mt-3 -mx-6 px-6 pb-4 border-b border-slate-800 w-[calc(100%+3rem)] block">
					🌙 Typical Sleep Schedule <span class="font-normal text-slate-400 normal-case tracking-normal">(at home)</span>
				</legend>

				<p class="text-xs text-slate-400">This is your <em>normal</em> sleep schedule before travel. It's used to calculate your circadian phase (CBTmin).</p>

				<div class="grid grid-cols-2 gap-5">
					<div>
						<label for="sleep_start" class="block text-sm font-medium text-slate-300 mb-1.5">
							Usual Bedtime
						</label>
						<input
							type="time"
							id="sleep_start"
							name="sleep_start"
							bind:value={sleepStart}
							class="w-full rounded-lg bg-slate-800 border {err('sleep_start') ? 'border-red-600' : 'border-slate-700'} text-slate-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 [color-scheme:dark]"
							required
						/>
						{#if err('sleep_start')}
							<p class="text-red-400 text-xs mt-1">{err('sleep_start')}</p>
						{/if}
					</div>

					<div>
						<label for="sleep_end" class="block text-sm font-medium text-slate-300 mb-1.5">
							Usual Wake Time
						</label>
						<input
							type="time"
							id="sleep_end"
							name="sleep_end"
							bind:value={sleepEnd}
							class="w-full rounded-lg bg-slate-800 border {err('sleep_end') ? 'border-red-600' : 'border-slate-700'} text-slate-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 [color-scheme:dark]"
							required
						/>
						{#if err('sleep_end')}
							<p class="text-red-400 text-xs mt-1">{err('sleep_end')}</p>
						{/if}
					</div>
				</div>

				<!-- Visual preview of sleep window -->
				<div class="mt-2 pt-4 border-t border-slate-800">
					<p class="text-xs text-slate-500 mb-2">Sleep window preview</p>
					<div class="relative h-6 rounded-full bg-slate-800 overflow-hidden">
						{#if sleepStart && sleepEnd}
							{@const startH = parseInt(sleepStart.split(':')[0])}
							{@const startM = parseInt(sleepStart.split(':')[1])}
							{@const endH = parseInt(sleepEnd.split(':')[0])}
							{@const endM = parseInt(sleepEnd.split(':')[1])}
							{@const startPct = ((startH * 60 + startM) / 1440) * 100}
							{@const endPct = ((endH * 60 + endM) / 1440) * 100}
							{#if endPct > startPct}
								<div
									class="absolute top-0 bottom-0 bg-indigo-600 opacity-70 rounded-full"
									style="left: {startPct}%; width: {endPct - startPct}%"
								></div>
							{:else}
								<!-- Wraps midnight -->
								<div class="absolute top-0 bottom-0 bg-indigo-600 opacity-70" style="left: {startPct}%; right: 0"></div>
								<div class="absolute top-0 bottom-0 bg-indigo-600 opacity-70" style="left: 0; width: {endPct}%"></div>
							{/if}
						{/if}
						<!-- Hour ticks -->
						{#each [6, 12, 18] as h}
							<div class="absolute top-0 bottom-0 w-px bg-slate-700" style="left: {(h / 24) * 100}%"></div>
						{/each}
					</div>
					<div class="flex justify-between text-xs text-slate-600 mt-1">
						<span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>12 AM</span>
					</div>
				</div>
			</fieldset>

			<button
				type="submit"
				class="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition-colors py-4 font-bold text-white text-lg shadow-lg shadow-indigo-900/40"
			>
				Generate My Plan →
			</button>
		</form>
	</main>
</div>
