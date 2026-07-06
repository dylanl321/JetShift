<script lang="ts">
	import '../app.css';
	import type { PageData } from './$types.js';

	export let data: PageData;

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function tzShort(iana: string) {
		return iana.split('/').pop()?.replace('_', ' ') ?? iana;
	}
</script>

<svelte:head>
	<title>JetShift — Beat Jet Lag</title>
</svelte:head>

<div class="min-h-screen bg-slate-950 text-slate-100">
	<!-- Nav -->
	<nav class="border-b border-slate-800 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
		<div class="flex items-center gap-2">
			<!-- Plane + clock icon -->
			<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
				<circle cx="14" cy="14" r="13" fill="#1e293b" stroke="#6366f1" stroke-width="1.5"/>
				<path d="M14 7v7l4 2" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M6 17l3-1.5 1.5 2.5 4-6 3 1-1 4H6z" fill="#6366f1" opacity="0.8"/>
			</svg>
			<span class="text-xl font-bold tracking-tight text-white">Jet<span class="text-indigo-400">Shift</span></span>
		</div>
		<a href="/plan" class="rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-2 text-sm font-semibold text-white">
			Create Plan
		</a>
	</nav>

	<!-- Hero -->
	<section class="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
		<div class="inline-flex items-center gap-2 rounded-full bg-indigo-950 border border-indigo-800 px-4 py-1.5 text-sm text-indigo-300 mb-8">
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
				<circle cx="7" cy="7" r="6.5" stroke="#818cf8" stroke-width="1"/>
				<path d="M7 3.5v3.5l2 1" stroke="#818cf8" stroke-width="1.2" stroke-linecap="round"/>
			</svg>
			Science-based jet lag management
		</div>

		<h1 class="text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
			Conquer <span class="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">jet lag</span><br/>
			with precision timing
		</h1>
		<p class="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
			JetShift builds a hyper-personalized circadian adjustment plan from your exact flight,
			chronotype, age, sleep pattern and caffeine habits. Pick your route on the map or by flight
			number, plan round trips, and get reminders for light, sleep, caffeine and melatonin timing.
		</p>

		<a href="/plan" class="inline-flex items-center gap-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition-colors px-8 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-900/40">
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
				<path d="M3 10h14M10 3l7 7-7 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
			Create Your Plan
		</a>
	</section>

	<!-- Features -->
	<section class="max-w-5xl mx-auto px-6 py-16">
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
			{#each [
				{
					icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#fbbf24" opacity="0.9"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/></svg>`,
					title: 'Light Timing',
					desc: 'Precise windows for seeking bright light or avoiding it to shift your body clock.'
				},
				{
					icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#6366f1" opacity="0.7" stroke="#818cf8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
					title: 'Sleep Schedule',
					desc: 'Day-by-day sleep window shifts that gradually move your rhythm to the destination.'
				},
				{
					icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 8h1a4 4 0 0 1 0 8h-1" stroke="#a16207" stroke-width="2" stroke-linecap="round"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" stroke="#a16207" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 1v3M10 1v3M14 1v3" stroke="#a16207" stroke-width="2" stroke-linecap="round"/></svg>`,
					title: 'Caffeine Timing',
					desc: 'Optimal windows to drink coffee and a hard cutoff to protect sleep quality.'
				},
				{
					icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#a78bfa" stroke-width="1.5"/><circle cx="12" cy="12" r="4" fill="#7c3aed" opacity="0.6"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="#a78bfa" stroke-width="1.5" stroke-linecap="round"/></svg>`,
					title: 'Melatonin Guide',
					desc: 'Low-dose melatonin timing recommendations to reinforce your new schedule.'
				}
			] as f}
				<div class="rounded-2xl bg-slate-900 border border-slate-800 p-6">
					<div class="mb-3">{@html f.icon}</div>
					<h3 class="font-semibold text-white mb-1">{f.title}</h3>
					<p class="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- How it works -->
	<section class="max-w-3xl mx-auto px-6 py-12">
		<h2 class="text-3xl font-bold text-center mb-10">How it works</h2>
		<ol class="space-y-6">
			{#each [
				['Enter your trip', 'Pick cities on the map or type a flight number. Add a return date for round trips, plus your sleep, chronotype, age and caffeine habits.'],
				['Algorithm runs', 'We estimate your CBTmin and choose the easier route (advance vs delay) to shift your clock, personalized to you.'],
				['Follow your timeline', 'A colour-coded day-by-day timeline shows exactly when to seek light, sleep, cut caffeine and take melatonin — in the right timezone.'],
				['Get reminders', 'Enable browser alerts or add the plan to your calendar so every window pings you at the right moment.']
			] as [title, desc], i}
				<li class="flex gap-5 items-start">
					<span class="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-900 border border-indigo-700 flex items-center justify-center font-bold text-indigo-300 text-lg">{i + 1}</span>
					<div>
						<h3 class="font-semibold text-white mb-1">{@html title}</h3>
						<p class="text-slate-400 text-sm">{desc}</p>
					</div>
				</li>
			{/each}
		</ol>
	</section>

	<!-- Recent Plans -->
	{#if data.recentPlans.length > 0}
		<section class="max-w-4xl mx-auto px-6 py-12">
			<h2 class="text-2xl font-bold mb-6">Recent Plans</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each data.recentPlans as plan}
					<a href="/plan/{plan.id}" class="rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-700 transition-colors p-5 group">
						<div class="flex items-center gap-2 text-sm text-slate-400 mb-2">
							<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
								<path d="M2 7h10M7 2l5 5-5 5" stroke="#94a3b8" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
							{formatDate(plan.departure_datetime)}
						</div>
						<div class="font-semibold text-white group-hover:text-indigo-300 transition-colors">
							{tzShort(plan.departure_tz)} → {tzShort(plan.arrival_tz)}
						</div>
						<div class="text-xs text-slate-500 mt-1">Created {formatDate(plan.created_at)}</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Footer -->
	<footer class="border-t border-slate-800 mt-16 py-8 text-center text-slate-500 text-sm">
		<p>JetShift — circadian science made practical.</p>
		<p class="mt-1 text-xs">Not a substitute for medical advice. Consult a physician before using melatonin.</p>
	</footer>
</div>
