/**
 * Circadian rhythm adjustment algorithm for jet lag management.
 *
 * Science basis (Eastman & Burgess protocols, Sleep Med Clin.; Roenneberg chronotype work;
 * Duffy et al. on age and circadian phase):
 *
 * - CBTmin (Core Body Temperature minimum) occurs roughly 2 h before habitual wake time. Its exact
 *   offset varies with chronotype and age, so we personalize it.
 * - Light in the ~4 h AFTER CBTmin ADVANCES the clock (shifts it earlier). Light in the ~4 h BEFORE
 *   CBTmin DELAYS the clock (shifts it later). Effect is strongest nearest CBTmin.
 * - The clock advances ~1 h/day and delays ~1.5 h/day, so delaying is easier. For large eastward
 *   gaps it is often cheaper to DELAY around the clock ("the long way") than to advance. We pick
 *   whichever route costs fewer days.
 * - Chronotype and age shift both CBTmin and how fast the clock can move: morning types advance
 *   more readily, evening types delay more readily, and older adults adapt somewhat more slowly.
 * - Melatonin (0.5 mg) in the evening promotes a PHASE ADVANCE; in the morning a PHASE DELAY. We
 *   time it by the shift direction we chose, not by compass direction.
 * - Caffeine should be avoided within a personalized window before target sleep (based on
 *   sensitivity), because caffeine's half-life keeps it circulating for hours.
 */

import { getCurrentOffsetMinutes, findTimezone } from './timezones.js';

/** Baseline hours the clock can ADVANCE (shift earlier) per day. */
export const ADVANCE_RATE_H = 1.0;
/** Baseline hours the clock can DELAY (shift later) per day — delaying is easier than advancing. */
export const DELAY_RATE_H = 1.5;
/** Cap so we never emit an absurdly long plan. */
const MAX_ADJUSTMENT_DAYS = 12;

export type Chronotype = 'early' | 'intermediate' | 'late';
export type CaffeineSensitivity = 'none' | 'sensitive' | 'average' | 'tolerant';

export interface PlanInput {
	departureTz: string;
	arrivalTz: string;
	/** ISO datetime, local to the departure timezone. */
	departureDatetime: string;
	sleepStart: string; // "HH:MM" bedtime in departure/home tz
	sleepEnd: string; // "HH:MM" wake time in departure/home tz
	/** Chronological age in years. Affects circadian phase and adaptation speed. */
	age?: number;
	/** Morning person (early) … night person (late). */
	chronotype?: Chronotype;
	/** Caffeine sensitivity / use. "none" suppresses caffeine guidance entirely. */
	caffeine?: CaffeineSensitivity;
	/** Whether the traveller is willing to use low-dose melatonin. */
	usesMelatonin?: boolean;
}

export interface TimeWindow {
	/** Minutes from local midnight in the day's display timezone. May exceed 1440 / wrap (end <
	 *  start) when the window runs into the following calendar day. */
	startMinutes: number;
	endMinutes: number;
	label: string;
}

export interface DayPlan {
	dayIndex: number; // 0 = travel day; negative = pre-departure; positive = at destination
	date: string; // YYYY-MM-DD in this day's display timezone
	label: string;
	tz: 'home' | 'destination';
	tzLabel: string;
	tzOffsetMin: number;
	/** CBTmin in minutes from midnight in the day's DISPLAY timezone. */
	cbtMinLocal: number;
	light_seek: TimeWindow[];
	light_avoid: TimeWindow[];
	sleep: TimeWindow;
	caffeine_ok: TimeWindow | null;
	caffeine_stop: TimeWindow | null;
	melatonin: TimeWindow | null;
	notes: string[];
}

export interface CircadianPlan {
	version: number;
	departureTz: string;
	arrivalTz: string;
	departureLabel: string;
	arrivalLabel: string;
	departureOffsetMin: number;
	arrivalOffsetMin: number;
	departureDatetime: string;
	tzDiffHours: number; // positive = destination clock ahead (eastward)
	direction: 'east' | 'west' | 'none';
	mode: 'advance' | 'delay' | 'none';
	shiftHours: number; // signed: negative = advance/earlier, positive = delay/later
	adjustmentDays: number;
	totalDays: number;
	/** Personalization echoed back for display / regeneration. */
	profile: {
		age: number | null;
		chronotype: Chronotype;
		caffeine: CaffeineSensitivity;
		usesMelatonin: boolean;
		cbtOffsetMin: number;
	};
	days: DayPlan[];
}

export interface Itinerary {
	version: number;
	roundTrip: boolean;
	outbound: CircadianPlan;
	return: CircadianPlan | null;
}

/* ------------------------------------------------------------------ helpers */

function mod1440(m: number): number {
	return ((m % 1440) + 1440) % 1440;
}

function clamp(v: number, lo: number, hi: number): number {
	return Math.max(lo, Math.min(hi, v));
}

function minutesToHHMM(m: number): string {
	const total = mod1440(m);
	const h = Math.floor(total / 60);
	const min = Math.round(total % 60);
	return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function addDays(isoDate: string, days: number): string {
	const d = new Date(isoDate + 'T00:00:00Z');
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}

function tzCityLabel(iana: string): string {
	return findTimezone(iana)?.city ?? iana.split('/').pop()?.replace(/_/g, ' ') ?? iana;
}

function makeWindow(startMinutes: number, endMinutes: number, label: string): TimeWindow {
	return {
		startMinutes,
		endMinutes,
		label: `${label} (${minutesToHHMM(startMinutes)}–${minutesToHHMM(endMinutes)})`
	};
}

/** Minutes before wake that CBTmin occurs, personalized by chronotype and age. */
function cbtOffsetMinutes(chronotype: Chronotype, age: number | null): number {
	let off = 120; // ~2 h baseline
	if (chronotype === 'early') off += 30; // morning types: CBTmin further before wake
	else if (chronotype === 'late') off -= 30; // evening types: CBTmin closer to wake
	if (age != null) {
		if (age >= 65) off += 20; // older adults phase-advanced
		else if (age <= 25) off -= 10; // young adults phase-delayed
	}
	return clamp(off, 60, 180);
}

/** Per-day advance / delay rates (h/day), personalized. */
function personalizedRates(chronotype: Chronotype, age: number | null) {
	let advance = ADVANCE_RATE_H;
	let delay = DELAY_RATE_H;
	if (chronotype === 'early') {
		advance += 0.25;
		delay -= 0.25;
	} else if (chronotype === 'late') {
		advance -= 0.25;
		delay += 0.25;
	}
	if (age != null && age >= 65) {
		advance *= 0.85;
		delay *= 0.85;
	}
	return { advance: clamp(advance, 0.5, 2), delay: clamp(delay, 0.75, 2.5) };
}

/** Hours before target sleep to stop caffeine, by sensitivity. null => no caffeine guidance. */
function caffeineCutoffHours(sensitivity: CaffeineSensitivity): number | null {
	switch (sensitivity) {
		case 'none':
			return null;
		case 'sensitive':
			return 8;
		case 'tolerant':
			return 4;
		case 'average':
		default:
			return 6;
	}
}

/* ------------------------------------------------------------------ core */

export function generatePlan(input: PlanInput): CircadianPlan {
	const {
		departureTz,
		arrivalTz,
		departureDatetime,
		sleepStart,
		sleepEnd,
		age = null,
		chronotype = 'intermediate',
		caffeine = 'average',
		usesMelatonin = true
	} = input;

	const depDate = new Date(departureDatetime);
	if (Number.isNaN(depDate.getTime())) throw new Error('Invalid departure date/time.');

	const departureOffsetMin = getCurrentOffsetMinutes(departureTz, depDate);
	const arrivalOffsetMin = getCurrentOffsetMinutes(arrivalTz, depDate);

	const tzDiffMinutes = arrivalOffsetMin - departureOffsetMin;
	const tzDiffHours = tzDiffMinutes / 60;
	const direction: 'east' | 'west' | 'none' =
		Math.abs(tzDiffHours) < 1 ? 'none' : tzDiffHours > 0 ? 'east' : 'west';

	// Parse home sleep schedule.
	const [sh, sm] = sleepStart.split(':').map(Number);
	const [eh, em] = sleepEnd.split(':').map(Number);
	const homeSleepStartMin = sh * 60 + sm;
	const homeSleepEndMin = eh * 60 + em; // wake

	let sleepDurationMin = mod1440(homeSleepEndMin - homeSleepStartMin);
	if (sleepDurationMin < 4 * 60) sleepDurationMin += 24 * 60;
	if (sleepDurationMin > 11 * 60 || sleepDurationMin < 4 * 60) sleepDurationMin = 8 * 60;

	const cbtOffsetMin = cbtOffsetMinutes(chronotype, age);
	const homeCbtMin = mod1440(homeSleepEndMin - cbtOffsetMin);

	// Choose the cheaper route (advance vs delay) to reach the destination phase.
	const advanceHours = ((tzDiffHours % 24) + 24) % 24; // 0..24
	const delayHours = advanceHours === 0 ? 0 : 24 - advanceHours;
	const rates = personalizedRates(chronotype, age);

	let mode: 'advance' | 'delay' | 'none';
	let shiftHours: number;
	if (direction === 'none' || advanceHours === 0) {
		mode = 'none';
		shiftHours = 0;
	} else if (advanceHours / rates.advance <= delayHours / rates.delay) {
		mode = 'advance';
		shiftHours = -advanceHours;
	} else {
		mode = 'delay';
		shiftHours = delayHours;
	}

	const totalShiftMin = shiftHours * 60;
	const rateH = mode === 'delay' ? rates.delay : rates.advance;
	const adjustmentDays =
		mode === 'none' ? 0 : Math.min(Math.ceil(Math.abs(shiftHours) / rateH), MAX_ADJUSTMENT_DAYS);

	const preDepartureDays = mode === 'none' ? 1 : Math.min(adjustmentDays, 3);
	const postArrivalDays = mode === 'none' ? 2 : Math.max(adjustmentDays - preDepartureDays + 2, 2);
	const totalDays = preDepartureDays + 1 + postArrivalDays;

	const departureDateStr = departureDatetime.slice(0, 10);
	const departureLabel = tzCityLabel(departureTz);
	const arrivalLabel = tzCityLabel(arrivalTz);
	const cutoffH = caffeineCutoffHours(caffeine);

	const days: DayPlan[] = [];

	for (let i = 0; i < totalDays; i++) {
		const relDay = i - preDepartureDays;
		const progress = adjustmentDays === 0 ? 1 : Math.min(i / adjustmentDays, 1);

		const cbtMinHomeClock = mod1440(homeCbtMin + totalShiftMin * progress);
		const atDestination = relDay >= 1;
		const displayShift = atDestination ? tzDiffMinutes : 0;
		const cbtMinLocal = mod1440(cbtMinHomeClock + displayShift);

		const targetWakeMin = mod1440(cbtMinLocal + cbtOffsetMin);
		const targetSleepStartMin = mod1440(targetWakeMin - sleepDurationMin);

		const lightSeek: TimeWindow[] = [];
		const lightAvoid: TimeWindow[] = [];
		if (mode === 'advance') {
			lightSeek.push(makeWindow(cbtMinLocal, mod1440(cbtMinLocal + 4 * 60), '☀️ Seek bright light'));
			lightAvoid.push(makeWindow(mod1440(cbtMinLocal - 4 * 60), cbtMinLocal, '🕶️ Avoid bright light'));
		} else if (mode === 'delay') {
			lightSeek.push(makeWindow(mod1440(cbtMinLocal - 4 * 60), cbtMinLocal, '☀️ Seek bright light'));
			lightAvoid.push(makeWindow(cbtMinLocal, mod1440(cbtMinLocal + 4 * 60), '🕶️ Avoid bright light'));
		} else {
			lightSeek.push(makeWindow(targetWakeMin, mod1440(targetWakeMin + 4 * 60), '☀️ Morning light'));
			lightAvoid.push(
				makeWindow(mod1440(targetSleepStartMin - 2 * 60), targetSleepStartMin, '🕶️ Dim light before bed')
			);
		}

		let caffeineOk: TimeWindow | null = null;
		let caffeineStop: TimeWindow | null = null;
		if (cutoffH != null) {
			const caffeineStopMin = mod1440(targetSleepStartMin - cutoffH * 60);
			caffeineOk = makeWindow(targetWakeMin, caffeineStopMin, '☕ Caffeine OK');
			caffeineStop = makeWindow(caffeineStopMin, targetSleepStartMin, '🚫 No caffeine');
		}

		let melatonin: TimeWindow | null = null;
		if (usesMelatonin && progress < 1 && mode !== 'none') {
			if (mode === 'advance') {
				melatonin = makeWindow(mod1440(targetSleepStartMin - 60), targetSleepStartMin, '💊 Melatonin 0.5 mg');
			} else {
				melatonin = makeWindow(targetWakeMin, mod1440(targetWakeMin + 60), '💊 Melatonin 0.5 mg');
			}
		}

		const notes: string[] = [];
		const shiftedH = Math.round(Math.abs(progress * shiftHours) * 10) / 10;
		if (relDay < 0) {
			if (mode === 'advance')
				notes.push(
					shiftedH < 0.25
						? 'Pre-departure: start easing earlier — bed & wake a touch earlier, bright morning light.'
						: `Pre-departure: shift ${shiftedH}h earlier — bed & wake earlier, bright morning light.`
				);
			else if (mode === 'delay')
				notes.push(
					shiftedH < 0.25
						? 'Pre-departure: start easing later — stay up a bit later, bright evening light.'
						: `Pre-departure: shift ${shiftedH}h later — stay up & wake later, bright evening light.`
				);
			else notes.push('No significant shift needed — keep your normal schedule.');
		} else if (relDay === 0) {
			notes.push('Travel day. Set your watch to destination time and follow this schedule in flight.');
			if (Math.abs(tzDiffHours) >= 5)
				notes.push('Use an eye mask & earplugs; nap only inside your planned sleep window.');
			notes.push('Stay hydrated and skip alcohol — it worsens jet lag and sleep quality.');
		} else {
			notes.push(`Day +${relDay} at ${arrivalLabel} — about ${Math.round(progress * 100)}% adapted.`);
			if (progress >= 1) notes.push('Fully adapted to local time. Keep a consistent schedule to lock it in.');
		}

		let label: string;
		if (relDay < 0) label = `Day ${relDay} · Pre-departure`;
		else if (relDay === 0) label = 'Day 0 · Travel day';
		else label = `Day +${relDay} · At destination`;

		days.push({
			dayIndex: relDay,
			date: addDays(departureDateStr, relDay),
			label,
			tz: atDestination ? 'destination' : 'home',
			tzLabel: atDestination ? arrivalLabel : departureLabel,
			tzOffsetMin: atDestination ? arrivalOffsetMin : departureOffsetMin,
			cbtMinLocal,
			light_seek: lightSeek,
			light_avoid: lightAvoid,
			sleep: makeWindow(targetSleepStartMin, targetWakeMin, '😴 Sleep'),
			caffeine_ok: caffeineOk,
			caffeine_stop: caffeineStop,
			melatonin,
			notes
		});
	}

	return {
		version: 2,
		departureTz,
		arrivalTz,
		departureLabel,
		arrivalLabel,
		departureOffsetMin,
		arrivalOffsetMin,
		departureDatetime,
		tzDiffHours,
		direction,
		mode,
		shiftHours,
		adjustmentDays,
		totalDays,
		profile: { age, chronotype, caffeine, usesMelatonin, cbtOffsetMin },
		days
	};
}

/**
 * Build a full itinerary. For a round trip the return leg swaps timezones and shifts the clock
 * back toward the home phase (the traveller re-adapts to home). The home sleep schedule is reused
 * because the traveller keeps the same clock-time sleep habit wherever they are.
 */
export function generateItinerary(
	outboundInput: PlanInput,
	returnDatetime?: string | null
): Itinerary {
	const outbound = generatePlan(outboundInput);
	let ret: CircadianPlan | null = null;
	if (returnDatetime) {
		ret = generatePlan({
			...outboundInput,
			departureTz: outboundInput.arrivalTz,
			arrivalTz: outboundInput.departureTz,
			departureDatetime: returnDatetime
		});
	}
	return { version: 1, roundTrip: !!ret, outbound, return: ret };
}

/* ------------------------------------------------------- calendar / export */

export interface CalendarEvent {
	uid: string;
	title: string;
	description: string;
	/** Absolute instants (UTC). */
	start: Date;
	end: Date;
	reminderMinutesBefore: number;
	category: 'sleep' | 'light-seek' | 'light-avoid' | 'caffeine-stop' | 'melatonin';
}

function windowToDates(date: string, offsetMin: number, win: TimeWindow): { start: Date; end: Date } {
	const midnightUtcMs = Date.parse(date + 'T00:00:00Z');
	const start = midnightUtcMs + (win.startMinutes - offsetMin) * 60000;
	let endMinutes = win.endMinutes;
	// If the window wraps past midnight, its end is on the next calendar day.
	if (endMinutes <= win.startMinutes) endMinutes += 1440;
	const end = midnightUtcMs + (endMinutes - offsetMin) * 60000;
	return { start: new Date(start), end: new Date(end) };
}

/**
 * Flatten a plan into actionable calendar events with absolute times. `keyPrefix` keeps UIDs
 * unique across legs.
 */
export function planCalendarEvents(plan: CircadianPlan, keyPrefix: string): CalendarEvent[] {
	const events: CalendarEvent[] = [];
	for (const day of plan.days) {
		const push = (
			win: TimeWindow,
			title: string,
			category: CalendarEvent['category'],
			reminderMinutesBefore: number,
			description: string
		) => {
			const { start, end } = windowToDates(day.date, day.tzOffsetMin, win);
			events.push({
				uid: `${keyPrefix}-${category}-${day.date}`,
				title,
				description,
				start,
				end,
				reminderMinutesBefore,
				category
			});
		};

		push(day.sleep, 'JetShift · Sleep', 'sleep', 30, `Target sleep window (${day.tzLabel} time).`);
		for (const w of day.light_seek)
			push(w, 'JetShift · Seek bright light', 'light-seek', 10, `Get bright light now to shift your clock (${day.tzLabel} time).`);
		for (const w of day.light_avoid)
			push(w, 'JetShift · Avoid bright light', 'light-avoid', 10, `Keep light dim / wear sunglasses (${day.tzLabel} time).`);
		if (day.caffeine_stop)
			push(day.caffeine_stop, 'JetShift · Caffeine cutoff', 'caffeine-stop', 0, `Stop caffeine to protect sleep (${day.tzLabel} time).`);
		if (day.melatonin)
			push(day.melatonin, 'JetShift · Melatonin', 'melatonin', 15, `Take 0.5 mg melatonin (${day.tzLabel} time). Consult a physician first.`);
	}
	return events;
}

export function itineraryCalendarEvents(itin: Itinerary): CalendarEvent[] {
	const out = planCalendarEvents(itin.outbound, 'out');
	if (itin.return) out.push(...planCalendarEvents(itin.return, 'ret'));
	return out;
}

/* ------------------------------------------------------- (de)serialization */

export function serializeItinerary(itin: Itinerary): string {
	return JSON.stringify(itin);
}

export function deserializeItinerary(json: string): Itinerary {
	return JSON.parse(json) as Itinerary;
}
