<script lang="ts">
	import '../../../app.css';
	import type { PageData } from './$types.js';
	import type { DayPlan, TimeWindow } from '$lib/circadian.js';

	export let data: PageData;

	const plan = data.plan;

	// Active day selector
	let activeDay = 0;
	$: currentDay = plan.days[activeDay];

	// Format minutes to HH:MM
	function fmt(m: number): string {
		const total = ((m % 1440) + 1440) % 1440;
		const h = Math.floor(total / 60);
		const min = total % 60;
		return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
	}

	// Convert window to percentage positions on a 24h bar
	function windowToStyle(win: TimeWindow, color: string, opacity = 0.85): string {
		const start = ((win.startMinutes % 1440 + 1440) % 1440) / 1440 * 100;
		const end = ((win.endMinutes % 1440 + 1440) % 1440) / 1440 * 100;
		if (end >= start) {
			return `position:absolute;top:0;bottom:0;left:${start}%;width:${end - start}%;background:${color};opacity:${opacity};border-radius:4px;`;
		} else {
			// Wraps midnight — return two segments (handled separately)
			return `position:absolute;top:0;bottom:0;left:${start}%;right:0;background:${color};opacity:${opacity};border-radius:4px 0 0 4px;`;
		}
	}

	function windowWraps(win: TimeWindow): boolean {
		const s = (win.startMinutes % 1440 + 1440) % 1440;
		const e = (win.endMinutes % 1440 + 1440) % 1440;
		return e < s;
	}

	function windowEndStyle(win: TimeWindow, color: string, opacity = 0.85): string {
		const e = ((win.endMinutes % 1440 + 1440) % 1440) / 1440 * 100;
		return `position:absolute;top:0;bottom:0;left:0;width:${e}%;background:${color};opacity:${opacity};border-radius:0 4px 4px 0;`;
	}

	interface Layer {
		win: TimeWindow;
		color: string;
		opacity: number;
		label: string;
		textColor: string;
		pattern?: string;
	}

	$: layers = buildLayers(currentDay);

	function buildLayers(day: DayPlan): Layer[] {
		const ls: Layer[] = [];
		for (const w of day.light_seek) {
			ls.push({ win: w, color: '#ca8a04', opacity: 0.75, label: '☀️ Seek Light', textColor: '#fef08a' });
		}
		for (const w of day.light_avoid) {
			ls.push({ win: w, color: '#334155', opacity: 0.9, label: '🕶️ Avoid Light', textColor: '#94a3b8' });
		}
		ls.push({ win: day.sleep, color: '#1d4ed8', opacity: 0.85, label: '😴 Sleep', textColor: '#93c5fd' });
		ls.push({ win: day.caffeine_ok, color: '#78350f', opacity: 0.7, label: '☕ Caffeine OK', textColor: '#fde68a' });
		ls.push({ win: day.caffeine_stop, color: '#7f1d1d', opacity: 0.75, label: '🚫 No Caffeine', textColor: '#fca5a5' });
		if (day.melatonin) {
			ls.push({ win: day.melatonin, color: '#5b21b6', opacity: 0.85, label: '💊 Melatonin', textColor: '#c4b5fd' });
		}
		return ls;
	}

	const LEGEND = [
		{ color: '#ca8a04', label: 'Seek bright light' },
		{ color: '#334155', label: 'Avoid bright light' },
		{ color: '#1d4ed8', label: 'Sleep' },
		{ color: '#78350f', label: 'Caffeine OK' },
		{ color: '#7f1d1d', label: 'No caffeine' },
		{ color: '#5b21b6', label: 'Melatonin' },
	];

	function tzShort(iana: string) {
		return iana.split('/').pop()?.replace(/_/g, ' ') ?? iana;
	}

	function sign(n: number) {
		return n >= 0 ? `+${n.toFixed(1)}` : n.toFixed(1);
	}
</script>

<svelte:head>
	<title>
		{tzShort(plan.departureTz)} → {tzShort(plan.arrivalTz)} — JetShift Plan
	</title>
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
		<a href="/plan" class="text-slate-400 text-sm hover:text-slate-200 transition-colors">New Plan</a>
	</nav>

	<main class="max-w-5xl mx-auto px-4 sm:px-6 py-10">
		<!-- Header -->
		<div class="rounded-2xl bg-slate-900 border border-slate-800 p-6 mb-8">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 class="text-2xl font-bold mb-1">
						{tzShort(plan.departureTz)}
						<span class="text-slate-500 mx-2">→</span>
						{tzShort(plan.arrivalTz)}
					</h1>
					<p class="text-slate-400 text-sm">
						Departing {new Date(data.departureDatetime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
					</p>
				</div>
				<div class="flex gap-4 flex-wrap">
					<div class="rounded-xl bg-slate-800 px-4 py-2 text-center">
						<div class="text-xs text-slate-400 mb-0.5">Time difference</div>
						<div class="font-bold text-lg text-indigo-300">{sign(plan.tzDiffHours)}h</div>
					</div>
					<div class="rounded-xl bg-slate-800 px-4 py-2 text-center">
						<div class="text-xs text-slate-400 mb-0.5">Direction</div>
						<div class="font-bold text-lg {plan.direction === 'east' ? 'text-yellow-400' : plan.direction === 'west' ? 'text-blue-400' : 'text-slate-400'}">
							{plan.direction === 'east' ? '→ Eastward' : plan.direction === 'west' ? '← Westward' : 'No change'}
						</div>
					</div>
					<div class="rounded-xl bg-slate-800 px-4 py-2 text-center">
						<div class="text-xs text-slate-400 mb-0.5">Plan days</div>
						<div class="font-bold text-lg text-slate-200">{plan.totalDays}</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Day tabs -->
		<div class="flex gap-2 flex-wrap mb-6">
			{#each plan.days as day, i}
				<button
					class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors border
						{activeDay === i
							? 'bg-indigo-600 border-indigo-500 text-white'
							: 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}"
					on:click={() => (activeDay = i)}
				>
					{day.dayIndex === 0
						? '✈️ Travel'
						: day.dayIndex < 0
						? `Day ${day.dayIndex}`
						: `+${day.dayIndex}`}
					<span class="ml-1 text-xs opacity-70">{day.date.slice(5)}</span>
				</button>
			{/each}
		</div>

		<!-- Day detail -->
		{#if currentDay}
			<div class="space-y-6">
				<!-- Day label + notes -->
				<div class="flex flex-wrap items-start justify-between gap-4">
					<div>
						<h2 class="text-xl font-bold">{currentDay.label}</h2>
						<p class="text-slate-400 text-sm">{currentDay.date}</p>
					</div>
					{#if currentDay.notes.length > 0}
						<div class="rounded-xl bg-indigo-950 border border-indigo-800 px-4 py-3 max-w-md">
							{#each currentDay.notes as note}
								<p class="text-sm text-indigo-200">{@html note}</p>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Timeline bar -->
				<div class="rounded-2xl bg-slate-900 border border-slate-800 p-5">
					<h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">24-Hour Timeline</h3>

					<!-- Hour labels -->
					<div class="flex mb-1 select-none">
						{#each Array(13) as _, i}
							<div class="flex-1 text-xs text-slate-600 text-center">{i * 2 === 0 ? '12a' : i * 2 === 12 ? '12p' : i * 2 < 12 ? `${i*2}a` : `${i*2-12}p`}</div>
						{/each}
					</div>

					<!-- Layer rows -->
					{#each layers as layer}
						<div class="mb-2.5">
							<div class="text-xs text-slate-500 mb-1">{layer.label}</div>
							<div class="relative h-7 rounded-lg bg-slate-800 overflow-hidden">
								<!-- Hour gridlines -->
								{#each Array(23) as _, i}
									<div
										class="absolute top-0 bottom-0 w-px bg-slate-700 opacity-40"
										style="left: {((i+1)/24)*100}%"
									></div>
								{/each}

								<!-- Main segment -->
								<div style={windowToStyle(layer.win, layer.color, layer.opacity)}></div>

								<!-- Wrap-around second segment -->
								{#if windowWraps(layer.win)}
									<div style={windowEndStyle(layer.win, layer.color, layer.opacity)}></div>
								{/if}

								<!-- Time label in bar -->
								{#if !windowWraps(layer.win)}
									{@const startPct = ((layer.win.startMinutes % 1440 + 1440) % 1440) / 1440 * 100}
									{@const endPct = ((layer.win.endMinutes % 1440 + 1440) % 1440) / 1440 * 100}
									{#if endPct - startPct > 8}
										<div
											class="absolute top-0 bottom-0 flex items-center px-1.5 text-xs font-mono pointer-events-none whitespace-nowrap overflow-hidden"
											style="left:{startPct}%;width:{endPct-startPct}%;color:{layer.textColor};"
										>
											{fmt(layer.win.startMinutes)}–{fmt(layer.win.endMinutes)}
										</div>
									{/if}
								{/if}
							</div>
						</div>
					{/each}

					<!-- CBT min marker -->
					<div class="relative h-4 mt-3">
						<div class="absolute top-0 bottom-0 w-0.5 bg-violet-400 opacity-70 rounded-full" style="left:{(currentDay.cbtMinHome/1440)*100}%"></div>
						<div class="absolute top-2 text-xs text-violet-400 whitespace-nowrap -translate-x-1/2" style="left:{(currentDay.cbtMinHome/1440)*100}%">
							CBTmin {fmt(currentDay.cbtMinHome)}
						</div>
					</div>
				</div>

				<!-- Schedule cards -->
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					<!-- Sleep -->
					<div class="rounded-xl bg-slate-900 border border-blue-900/60 p-4">
						<div class="flex items-center gap-2 mb-2">
							<span class="text-xl">😴</span>
							<span class="font-semibold text-blue-300">Sleep</span>
						</div>
						<p class="text-2xl font-mono font-bold text-white">{fmt(currentDay.sleep.startMinutes)}</p>
						<p class="text-sm text-slate-400">until {fmt(currentDay.sleep.endMinutes)}</p>
					</div>

					<!-- Light Seek -->
					<div class="rounded-xl bg-slate-900 border border-yellow-900/60 p-4">
						<div class="flex items-center gap-2 mb-2">
							<span class="text-xl">☀️</span>
							<span class="font-semibold text-yellow-300">Seek Light</span>
						</div>
						{#each currentDay.light_seek as w}
							<p class="text-2xl font-mono font-bold text-white">{fmt(w.startMinutes)}</p>
							<p class="text-sm text-slate-400">until {fmt(w.endMinutes)}</p>
						{/each}
					</div>

					<!-- Light Avoid -->
					<div class="rounded-xl bg-slate-900 border border-slate-600/60 p-4">
						<div class="flex items-center gap-2 mb-2">
							<span class="text-xl">🕶️</span>
							<span class="font-semibold text-slate-300">Avoid Light</span>
						</div>
						{#each currentDay.light_avoid as w}
							<p class="text-2xl font-mono font-bold text-white">{fmt(w.startMinutes)}</p>
							<p class="text-sm text-slate-400">until {fmt(w.endMinutes)}</p>
						{/each}
					</div>

					<!-- Caffeine OK -->
					<div class="rounded-xl bg-slate-900 border border-amber-900/60 p-4">
						<div class="flex items-center gap-2 mb-2">
							<span class="text-xl">☕</span>
							<span class="font-semibold text-amber-300">Caffeine OK</span>
						</div>
						<p class="text-2xl font-mono font-bold text-white">{fmt(currentDay.caffeine_ok.startMinutes)}</p>
						<p class="text-sm text-slate-400">until {fmt(currentDay.caffeine_ok.endMinutes)}</p>
					</div>

					<!-- No Caffeine -->
					<div class="rounded-xl bg-slate-900 border border-red-900/60 p-4">
						<div class="flex items-center gap-2 mb-2">
							<span class="text-xl">🚫</span>
							<span class="font-semibold text-red-300">No Caffeine</span>
						</div>
						<p class="text-2xl font-mono font-bold text-white">{fmt(currentDay.caffeine_stop.startMinutes)}</p>
						<p class="text-sm text-slate-400">until {fmt(currentDay.caffeine_stop.endMinutes)}</p>
					</div>

					<!-- Melatonin -->
					{#if currentDay.melatonin}
						<div class="rounded-xl bg-slate-900 border border-violet-900/60 p-4">
							<div class="flex items-center gap-2 mb-2">
								<span class="text-xl">💊</span>
								<span class="font-semibold text-violet-300">Melatonin (0.5 mg)</span>
							</div>
							<p class="text-2xl font-mono font-bold text-white">{fmt(currentDay.melatonin.startMinutes)}</p>
							<p class="text-sm text-slate-400">until {fmt(currentDay.melatonin.endMinutes)}</p>
						</div>
					{:else}
						<div class="rounded-xl bg-slate-900 border border-slate-800 p-4 opacity-40">
							<div class="flex items-center gap-2 mb-2">
								<span class="text-xl">💊</span>
								<span class="font-semibold text-slate-400">Melatonin</span>
							</div>
							<p class="text-sm text-slate-500">Not needed today</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Legend -->
		<div class="rounded-2xl bg-slate-900 border border-slate-800 p-5 mt-8">
			<h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Legend</h3>
			<div class="flex flex-wrap gap-4">
				{#each LEGEND as item}
					<div class="flex items-center gap-2">
						<div class="w-4 h-4 rounded" style="background:{item.color}"></div>
						<span class="text-sm text-slate-300">{item.label}</span>
					</div>
				{/each}
				<div class="flex items-center gap-2">
					<div class="w-1 h-4 rounded-full bg-violet-400"></div>
					<span class="text-sm text-slate-300">CBTmin (core body temp minimum)</span>
				</div>
			</div>
		</div>

		<!-- Science note -->
		<div class="mt-8 rounded-xl bg-slate-900 border border-slate-800 p-5">
			<h3 class="font-semibold text-slate-300 mb-2 flex items-center gap-2">
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
					<circle cx="8" cy="8" r="7" stroke="#64748b" stroke-width="1.2"/>
					<path d="M8 7v5M8 5v.5" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
				</svg>
				How this plan was calculated
			</h3>
			<p class="text-sm text-slate-400 leading-relaxed">
				Your <strong class="text-slate-300">Core Body Temperature minimum (CBTmin)</strong> was estimated at
				<strong class="text-slate-300">{fmt(plan.days[0].cbtMinHome)}</strong>
				(2 hours before your usual wake time).
				{#if plan.direction !== 'none'}
					Traveling <strong class="text-slate-300">{plan.direction === 'east' ? 'eastward' : 'westward'}</strong>
					requires a <strong class="text-slate-300">{plan.direction === 'east' ? 'phase advance' : 'phase delay'}</strong>
					of <strong class="text-slate-300">{Math.abs(plan.tzDiffHours).toFixed(1)} hours</strong>.
					The plan shifts your schedule by ~1 hour per day.
					Light exposure {plan.direction === 'east' ? 'after' : 'before'} CBTmin drives the clock
					{plan.direction === 'east' ? 'earlier' : 'later'}.
				{:else}
					No significant timezone adjustment needed.
				{/if}
			</p>
		</div>

		<!-- CTA -->
		<div class="mt-8 text-center">
			<a href="/plan" class="inline-flex items-center gap-2 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-colors px-6 py-3 text-sm font-medium">
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
					<path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
				</svg>
				Create another plan
			</a>
		</div>
	</main>
</div>
