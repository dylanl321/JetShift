<script lang="ts">
	import '../../../app.css';
	import { onMount, onDestroy } from 'svelte';
	import type { PageData } from './$types.js';
	import type { CircadianPlan, DayPlan, TimeWindow, CalendarEvent } from '$lib/circadian.js';
	import { itineraryCalendarEvents } from '$lib/circadian.js';
	import {
		notificationsSupported,
		currentPermission,
		requestPermission,
		scheduleUpcoming,
		testNotification,
		clearScheduled,
		type NotifyPermission
	} from '$lib/notify.js';

	export let data: PageData;

	const itin = data.itinerary;
	const legs: { key: 'outbound' | 'return'; plan: CircadianPlan; title: string }[] = [
		{ key: 'outbound', plan: itin.outbound, title: `${itin.outbound.departureLabel} → ${itin.outbound.arrivalLabel}` }
	];
	if (itin.return) {
		legs.push({ key: 'return', plan: itin.return, title: `${itin.return.departureLabel} → ${itin.return.arrivalLabel}` });
	}

	let activeLeg = 0;
	$: plan = legs[activeLeg].plan;

	// Pick a sensible default day: today if within the plan, else the first day.
	function defaultDayIndex(p: CircadianPlan): number {
		const today = new Date().toISOString().slice(0, 10);
		const idx = p.days.findIndex((d) => d.date === today);
		return idx >= 0 ? idx : 0;
	}
	let activeDay = defaultDayIndex(itin.outbound);
	$: {
		// Clamp when switching legs.
		if (activeDay >= plan.days.length) activeDay = 0;
	}
	$: currentDay = plan.days[activeDay];

	function fmt(m: number): string {
		const total = ((m % 1440) + 1440) % 1440;
		const h = Math.floor(total / 60);
		const min = Math.round(total % 60);
		const ampm = h >= 12 ? 'PM' : 'AM';
		const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
		return `${h12}:${String(min).padStart(2, '0')} ${ampm}`;
	}

	function windowWraps(win: TimeWindow): boolean {
		const s = (win.startMinutes % 1440 + 1440) % 1440;
		const e = (win.endMinutes % 1440 + 1440) % 1440;
		return e < s;
	}
	function mainStyle(win: TimeWindow, color: string, opacity: number): string {
		const start = ((win.startMinutes % 1440 + 1440) % 1440) / 1440 * 100;
		const end = ((win.endMinutes % 1440 + 1440) % 1440) / 1440 * 100;
		if (end >= start) return `position:absolute;top:0;bottom:0;left:${start}%;width:${end - start}%;background:${color};opacity:${opacity};border-radius:4px;`;
		return `position:absolute;top:0;bottom:0;left:${start}%;right:0;background:${color};opacity:${opacity};border-radius:4px 0 0 4px;`;
	}
	function endStyle(win: TimeWindow, color: string, opacity: number): string {
		const e = ((win.endMinutes % 1440 + 1440) % 1440) / 1440 * 100;
		return `position:absolute;top:0;bottom:0;left:0;width:${e}%;background:${color};opacity:${opacity};border-radius:0 4px 4px 0;`;
	}

	interface Layer { win: TimeWindow; color: string; opacity: number; label: string; textColor: string; }
	$: layers = buildLayers(currentDay);
	function buildLayers(day: DayPlan): Layer[] {
		const ls: Layer[] = [];
		for (const w of day.light_seek) ls.push({ win: w, color: '#ca8a04', opacity: 0.75, label: '☀️ Seek Light', textColor: '#fef08a' });
		for (const w of day.light_avoid) ls.push({ win: w, color: '#334155', opacity: 0.9, label: '🕶️ Avoid Light', textColor: '#94a3b8' });
		ls.push({ win: day.sleep, color: '#1d4ed8', opacity: 0.85, label: '😴 Sleep', textColor: '#93c5fd' });
		if (day.caffeine_ok) ls.push({ win: day.caffeine_ok, color: '#78350f', opacity: 0.7, label: '☕ Caffeine OK', textColor: '#fde68a' });
		if (day.caffeine_stop) ls.push({ win: day.caffeine_stop, color: '#7f1d1d', opacity: 0.75, label: '🚫 No Caffeine', textColor: '#fca5a5' });
		if (day.melatonin) ls.push({ win: day.melatonin, color: '#5b21b6', opacity: 0.85, label: '💊 Melatonin', textColor: '#c4b5fd' });
		return ls;
	}

	const LEGEND = [
		{ color: '#ca8a04', label: 'Seek bright light' },
		{ color: '#334155', label: 'Avoid bright light' },
		{ color: '#1d4ed8', label: 'Sleep' },
		{ color: '#78350f', label: 'Caffeine OK' },
		{ color: '#7f1d1d', label: 'No caffeine' },
		{ color: '#5b21b6', label: 'Melatonin' }
	];

	function sign(n: number) { return n >= 0 ? `+${n.toFixed(1)}` : n.toFixed(1); }

	// ---- Notifications ----
	let allEvents: CalendarEvent[] = [];
	let perm: NotifyPermission = 'unsupported';
	let notifSupported = false;
	let scheduledCount = 0;
	let statusMsg = '';

	onMount(() => {
		notifSupported = notificationsSupported();
		perm = currentPermission();
		allEvents = itineraryCalendarEvents(itin);
		if (perm === 'granted') refreshSchedule();
	});
	onDestroy(() => clearScheduled());

	function refreshSchedule() {
		const res = scheduleUpcoming(allEvents);
		scheduledCount = res.scheduled;
		statusMsg = res.scheduled > 0
			? `${res.scheduled} reminder${res.scheduled === 1 ? '' : 's'} queued for the next 24 h.`
			: 'No events in the next 24 h — reminders will arrive closer to your trip.';
	}

	async function enableNotifications() {
		perm = await requestPermission();
		if (perm === 'granted') {
			testNotification();
			refreshSchedule();
		} else if (perm === 'denied') {
			statusMsg = 'Notifications are blocked. Enable them in your browser settings, or use the calendar export.';
		}
	}
</script>

<svelte:head>
	<title>{plan.departureLabel} → {plan.arrivalLabel} — JetShift Plan</title>
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
		<a href="/plan" class="text-slate-400 text-sm hover:text-slate-200 transition-colors">New Plan</a>
	</nav>

	<main class="max-w-5xl mx-auto px-4 sm:px-6 py-10">
		<!-- Header -->
		<div class="rounded-2xl bg-slate-900 border border-slate-800 p-6 mb-6">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 class="text-2xl font-bold mb-1">
						{plan.departureLabel}<span class="text-slate-500 mx-2">→</span>{plan.arrivalLabel}
					</h1>
					<p class="text-slate-400 text-sm">
						{legs[activeLeg].key === 'outbound' ? 'Departing' : 'Returning'}
						{new Date(plan.departureDatetime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
						{#if data.flightNumber} · Flight {data.flightNumber}{/if}
					</p>
				</div>
				<div class="grid grid-cols-3 gap-2 sm:gap-3 w-full sm:w-auto">
					<div class="rounded-xl bg-slate-800 px-2 sm:px-4 py-2 text-center">
						<div class="text-xs text-slate-400 mb-0.5">Time diff</div>
						<div class="font-bold text-base sm:text-lg text-indigo-300">{sign(plan.tzDiffHours)}h</div>
					</div>
					<div class="rounded-xl bg-slate-800 px-2 sm:px-4 py-2 text-center">
						<div class="text-xs text-slate-400 mb-0.5">Strategy</div>
						<div class="font-bold text-base sm:text-lg {plan.mode === 'advance' ? 'text-yellow-400' : plan.mode === 'delay' ? 'text-blue-400' : 'text-slate-400'}">
							{plan.mode === 'advance' ? 'Advance ⏪' : plan.mode === 'delay' ? 'Delay ⏩' : 'No shift'}
						</div>
					</div>
					<div class="rounded-xl bg-slate-800 px-2 sm:px-4 py-2 text-center">
						<div class="text-xs text-slate-400 mb-0.5">Adapt in</div>
						<div class="font-bold text-base sm:text-lg text-slate-200">{plan.adjustmentDays || 0}d</div>
					</div>
				</div>
			</div>

			<!-- Leg switcher -->
			{#if legs.length > 1}
				<div class="flex flex-col sm:flex-row gap-2 mt-4">
					{#each legs as leg, i}
						<button
							class="rounded-lg px-4 py-2.5 min-h-[44px] text-sm font-medium border transition-colors text-left sm:text-center truncate
								{activeLeg === i ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}"
							on:click={() => { activeLeg = i; activeDay = defaultDayIndex(leg.plan); }}
						>
							{i === 0 ? '→ Outbound' : '← Return'}: {leg.title}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Reminders & export card -->
		<div class="rounded-2xl bg-slate-900 border border-slate-800 p-5 mb-6">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h3 class="font-semibold text-slate-200 flex items-center gap-2">🔔 Reminders & export</h3>
					<p class="text-sm text-slate-400 mt-0.5">
						Get nudged at each light, sleep, caffeine and melatonin window — or take the plan with you.
					</p>
					{#if statusMsg}<p class="text-xs mt-1 {perm === 'denied' ? 'text-amber-400' : 'text-emerald-400'}">{statusMsg}</p>{/if}
				</div>
				<div class="grid grid-cols-2 sm:flex gap-2 shrink-0">
					{#if notifSupported && perm !== 'granted'}
						<button type="button" on:click={enableNotifications}
							class="col-span-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 min-h-[44px] text-sm font-semibold text-white">
							🔔 Enable alerts
						</button>
					{:else if perm === 'granted'}
						<button type="button" on:click={() => { testNotification(); refreshSchedule(); }}
							class="col-span-2 rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 min-h-[44px] text-sm font-semibold text-white">
							✓ Alerts on · test
						</button>
					{/if}
					<a href="/plan/{data.id}/calendar.ics"
						class="rounded-lg border border-slate-700 hover:border-slate-500 text-slate-200 px-4 py-2 min-h-[44px] text-sm font-semibold flex items-center justify-center gap-1.5">
						📅 Calendar
					</a>
					<a href="/plan/{data.id}/print"
						class="rounded-lg border border-slate-700 hover:border-slate-500 text-slate-200 px-4 py-2 min-h-[44px] text-sm font-semibold flex items-center justify-center gap-1.5">
						🖨️ Print / PDF
					</a>
					<a href="/plan/{data.id}/export.csv" download
						class="rounded-lg border border-slate-700 hover:border-slate-500 text-slate-200 px-4 py-2 min-h-[44px] text-sm font-semibold flex items-center justify-center gap-1.5">
						⬇ CSV
					</a>
					<a href="/plan/{data.id}/export.json" download
						class="rounded-lg border border-slate-700 hover:border-slate-500 text-slate-200 px-4 py-2 min-h-[44px] text-sm font-semibold flex items-center justify-center gap-1.5">
						⬇ JSON
					</a>
				</div>
			</div>
			{#if !notifSupported}
				<p class="text-xs text-slate-500 mt-2">Browser alerts aren't supported here — the calendar export gives reliable reminders on any device.</p>
			{:else}
				<p class="text-xs text-slate-500 mt-2">Browser alerts fire while this tab is open. For background reminders across devices, use the calendar export.</p>
			{/if}
		</div>

		<!-- Day tabs: one scrollable row on mobile, wrapped on desktop -->
		<div class="flex gap-2 mb-6 overflow-x-auto sm:flex-wrap pb-1.5 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
			{#each plan.days as day, i}
				<button
					class="shrink-0 snap-start rounded-lg px-3 py-2 min-h-[44px] text-sm font-medium transition-colors border
						{activeDay === i ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}"
					on:click={() => (activeDay = i)}
				>
					{day.dayIndex === 0 ? '✈️ Travel' : day.dayIndex < 0 ? `Day ${day.dayIndex}` : `+${day.dayIndex}`}
					<span class="ml-1 text-xs opacity-70">{day.date.slice(5)}</span>
				</button>
			{/each}
		</div>

		{#if currentDay}
			<div class="space-y-6">
				<div class="flex flex-wrap items-start justify-between gap-4">
					<div>
						<h2 class="text-xl font-bold">{currentDay.label}</h2>
						<p class="text-slate-400 text-sm">
							{currentDay.date} · times in <strong class="text-slate-300">{currentDay.tzLabel}</strong> local time
						</p>
					</div>
					{#if currentDay.notes.length > 0}
						<div class="rounded-xl bg-indigo-950 border border-indigo-800 px-4 py-3 max-w-md space-y-1">
							{#each currentDay.notes as note}<p class="text-sm text-indigo-200">{note}</p>{/each}
						</div>
					{/if}
				</div>

				<!-- Timeline -->
				<div class="rounded-2xl bg-slate-900 border border-slate-800 p-5">
					<div class="flex items-center justify-between mb-4">
						<h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider">24-Hour Timeline</h3>
						<span class="text-xs text-slate-500">{currentDay.tzLabel} time</span>
					</div>
					<div class="flex mb-1 select-none">
						{#each Array(13) as _, i}
							<div class="flex-1 text-[10px] sm:text-xs text-slate-600 text-center {i % 2 === 1 ? 'invisible sm:visible' : ''}">
								{i * 2 === 0 ? '12a' : i * 2 === 12 ? '12p' : i * 2 < 12 ? `${i*2}a` : `${i*2-12}p`}
							</div>
						{/each}
					</div>
					{#each layers as layer}
						<div class="mb-2.5">
							<div class="text-xs text-slate-500 mb-1">{layer.label}</div>
							<div class="relative h-7 rounded-lg bg-slate-800 overflow-hidden">
								{#each Array(23) as _, i}
									<div class="absolute top-0 bottom-0 w-px bg-slate-700 opacity-40" style="left: {((i+1)/24)*100}%"></div>
								{/each}
								<div style={mainStyle(layer.win, layer.color, layer.opacity)}></div>
								{#if windowWraps(layer.win)}
									<div style={endStyle(layer.win, layer.color, layer.opacity)}></div>
								{/if}
								{#if !windowWraps(layer.win)}
									{@const startPct = ((layer.win.startMinutes % 1440 + 1440) % 1440) / 1440 * 100}
									{@const endPct = ((layer.win.endMinutes % 1440 + 1440) % 1440) / 1440 * 100}
									{#if endPct - startPct > 8}
										<div class="absolute top-0 bottom-0 hidden sm:flex items-center px-1.5 text-xs font-mono pointer-events-none whitespace-nowrap overflow-hidden"
											style="left:{startPct}%;width:{endPct-startPct}%;color:{layer.textColor};">
											{fmt(layer.win.startMinutes)}–{fmt(layer.win.endMinutes)}
										</div>
									{/if}
								{/if}
							</div>
						</div>
					{/each}
					<div class="relative h-4 mt-3">
						<div class="absolute top-0 bottom-0 w-0.5 bg-violet-400 opacity-70 rounded-full" style="left:{(currentDay.cbtMinLocal/1440)*100}%"></div>
						<div class="absolute top-2 text-xs text-violet-400 whitespace-nowrap -translate-x-1/2" style="left:{(currentDay.cbtMinLocal/1440)*100}%">
							CBTmin {fmt(currentDay.cbtMinLocal)}
						</div>
					</div>
				</div>

				<!-- Cards -->
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					<div class="rounded-xl bg-slate-900 border border-blue-900/60 p-4">
						<div class="flex items-center gap-2 mb-2"><span class="text-xl">😴</span><span class="font-semibold text-blue-300">Sleep</span></div>
						<p class="text-2xl font-mono font-bold text-white">{fmt(currentDay.sleep.startMinutes)}</p>
						<p class="text-sm text-slate-400">until {fmt(currentDay.sleep.endMinutes)}</p>
					</div>
					<div class="rounded-xl bg-slate-900 border border-yellow-900/60 p-4">
						<div class="flex items-center gap-2 mb-2"><span class="text-xl">☀️</span><span class="font-semibold text-yellow-300">Seek Light</span></div>
						{#each currentDay.light_seek as w}
							<p class="text-2xl font-mono font-bold text-white">{fmt(w.startMinutes)}</p>
							<p class="text-sm text-slate-400">until {fmt(w.endMinutes)}</p>
						{/each}
					</div>
					<div class="rounded-xl bg-slate-900 border border-slate-600/60 p-4">
						<div class="flex items-center gap-2 mb-2"><span class="text-xl">🕶️</span><span class="font-semibold text-slate-300">Avoid Light</span></div>
						{#each currentDay.light_avoid as w}
							<p class="text-2xl font-mono font-bold text-white">{fmt(w.startMinutes)}</p>
							<p class="text-sm text-slate-400">until {fmt(w.endMinutes)}</p>
						{/each}
					</div>
					{#if currentDay.caffeine_ok}
						<div class="rounded-xl bg-slate-900 border border-amber-900/60 p-4">
							<div class="flex items-center gap-2 mb-2"><span class="text-xl">☕</span><span class="font-semibold text-amber-300">Caffeine OK</span></div>
							<p class="text-2xl font-mono font-bold text-white">{fmt(currentDay.caffeine_ok.startMinutes)}</p>
							<p class="text-sm text-slate-400">until {fmt(currentDay.caffeine_ok.endMinutes)}</p>
						</div>
						<div class="rounded-xl bg-slate-900 border border-red-900/60 p-4">
							<div class="flex items-center gap-2 mb-2"><span class="text-xl">🚫</span><span class="font-semibold text-red-300">No Caffeine</span></div>
							<p class="text-2xl font-mono font-bold text-white">{fmt(currentDay.caffeine_stop?.startMinutes ?? 0)}</p>
							<p class="text-sm text-slate-400">until {fmt(currentDay.caffeine_stop?.endMinutes ?? 0)}</p>
						</div>
					{:else}
						<div class="rounded-xl bg-slate-900 border border-slate-800 p-4 opacity-40">
							<div class="flex items-center gap-2 mb-2"><span class="text-xl">☕</span><span class="font-semibold text-slate-400">Caffeine</span></div>
							<p class="text-sm text-slate-500">No caffeine guidance</p>
						</div>
					{/if}
					{#if currentDay.melatonin}
						<div class="rounded-xl bg-slate-900 border border-violet-900/60 p-4">
							<div class="flex items-center gap-2 mb-2"><span class="text-xl">💊</span><span class="font-semibold text-violet-300">Melatonin (0.5 mg)</span></div>
							<p class="text-2xl font-mono font-bold text-white">{fmt(currentDay.melatonin.startMinutes)}</p>
							<p class="text-sm text-slate-400">until {fmt(currentDay.melatonin.endMinutes)}</p>
						</div>
					{:else}
						<div class="rounded-xl bg-slate-900 border border-slate-800 p-4 opacity-40">
							<div class="flex items-center gap-2 mb-2"><span class="text-xl">💊</span><span class="font-semibold text-slate-400">Melatonin</span></div>
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
					<div class="flex items-center gap-2"><div class="w-4 h-4 rounded" style="background:{item.color}"></div><span class="text-sm text-slate-300">{item.label}</span></div>
				{/each}
				<div class="flex items-center gap-2"><div class="w-1 h-4 rounded-full bg-violet-400"></div><span class="text-sm text-slate-300">CBTmin (core body temp minimum)</span></div>
			</div>
		</div>

		<!-- Science note -->
		<div class="mt-8 rounded-xl bg-slate-900 border border-slate-800 p-5">
			<h3 class="font-semibold text-slate-300 mb-2">How this plan was calculated</h3>
			<p class="text-sm text-slate-400 leading-relaxed">
				Your <strong class="text-slate-300">CBTmin</strong> was estimated
				<strong class="text-slate-300">{Math.round(plan.profile.cbtOffsetMin)} min</strong> before your usual wake time
				(adjusted for your {plan.profile.chronotype} chronotype{plan.profile.age ? ` and age ${plan.profile.age}` : ''}).
				{#if plan.mode !== 'none'}
					A <strong class="text-slate-300">{Math.abs(plan.tzDiffHours).toFixed(1)}h</strong> {plan.direction === 'east' ? 'eastward' : 'westward'} trip
					is handled as a <strong class="text-slate-300">phase {plan.mode}</strong>
					of <strong class="text-slate-300">{Math.abs(plan.shiftHours).toFixed(1)}h</strong>
					{#if (plan.direction === 'east' && plan.mode === 'delay') || (plan.direction === 'west' && plan.mode === 'advance')}
						— we take the easier route around the clock —
					{/if}
					shifting ~1–1.5h per day. Light {plan.mode === 'advance' ? 'after' : 'before'} CBTmin drives the clock
					{plan.mode === 'advance' ? 'earlier' : 'later'}.
				{:else}
					No significant timezone adjustment is needed.
				{/if}
			</p>
			<p class="text-xs text-slate-500 mt-3">Not medical advice. Consult a physician before using melatonin or if you have a health condition.</p>
		</div>

		<div class="mt-8 text-center">
			<a href="/plan" class="inline-flex items-center gap-2 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-colors px-6 py-3 text-sm font-medium">
				Create another plan
			</a>
		</div>
	</main>
</div>
