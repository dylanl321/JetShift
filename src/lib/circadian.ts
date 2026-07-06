/**
 * Circadian rhythm adjustment algorithm for jet lag management.
 *
 * Science basis:
 * - CBTmin (Core Body Temperature minimum) occurs ~2 hours before habitual wake time.
 * - Light exposure 0–4 h AFTER CBTmin advances the circadian clock (good for eastward travel).
 * - Light exposure 0–4 h BEFORE CBTmin delays the circadian clock (good for westward travel).
 * - We shift CBTmin by ~1 hour per day toward the destination phase.
 * - Caffeine should be avoided within 6 hours of the adjusted target sleep time.
 * - Melatonin (0.5 mg) taken 1–2 h before the adjusted target sleep time helps phase advance.
 */

import { getCurrentOffsetMinutes } from './timezones.js';

export interface TimeWindow {
	startMinutes: number; // minutes from midnight (0–1439), may exceed 1440 if wrapping
	endMinutes: number;
	label: string;
}

export interface DayPlan {
	dayIndex: number; // 0 = departure day
	date: string; // ISO date string YYYY-MM-DD
	label: string; // e.g. "Day 1 · Pre-departure"
	/** CBTmin for this day, in minutes from midnight in HOME timezone */
	cbtMinHome: number;
	/** Target CBTmin in destination timezone */
	cbtMinDest: number;
	light_seek: TimeWindow[];
	light_avoid: TimeWindow[];
	sleep: TimeWindow;
	caffeine_ok: TimeWindow;
	caffeine_stop: TimeWindow;
	melatonin: TimeWindow | null;
	notes: string[];
}

export interface CircadianPlan {
	departureTz: string;
	arrivalTz: string;
	departureOffsetMin: number;
	arrivalOffsetMin: number;
	tzDiffHours: number; // positive = eastward, negative = westward
	direction: 'east' | 'west' | 'none';
	totalDays: number;
	days: DayPlan[];
}

/** Clamp minutes to [0, 1440) */
function mod1440(m: number): number {
	return ((m % 1440) + 1440) % 1440;
}

function minutesToHHMM(m: number): string {
	const total = mod1440(m);
	const h = Math.floor(total / 60);
	const min = total % 60;
	return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function addDays(isoDate: string, days: number): string {
	const d = new Date(isoDate + 'T00:00:00Z');
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}

export function generatePlan(
	departureTz: string,
	arrivalTz: string,
	departureDatetime: string, // ISO string
	sleepStart: string, // "HH:MM" in home tz
	sleepEnd: string // "HH:MM" in home tz (wake time)
): CircadianPlan {
	const depDate = new Date(departureDatetime);

	const departureOffsetMin = getCurrentOffsetMinutes(departureTz, depDate);
	const arrivalOffsetMin = getCurrentOffsetMinutes(arrivalTz, depDate);

	// Timezone difference: positive = destination is ahead = eastward travel
	const tzDiffMinutes = arrivalOffsetMin - departureOffsetMin;
	const tzDiffHours = tzDiffMinutes / 60;

	const direction: 'east' | 'west' | 'none' =
		Math.abs(tzDiffHours) < 1 ? 'none' : tzDiffHours > 0 ? 'east' : 'west';

	// Parse home sleep schedule
	const [sleepStartH, sleepStartM] = sleepStart.split(':').map(Number);
	const [sleepEndH, sleepEndM] = sleepEnd.split(':').map(Number);
	const homeSleepStartMin = sleepStartH * 60 + sleepStartM;
	const homeSleepEndMin = sleepEndH * 60 + sleepEndM; // wake time

	// Sleep duration
	let sleepDurationMin = mod1440(homeSleepEndMin - homeSleepStartMin);
	if (sleepDurationMin < 4 * 60) sleepDurationMin += 24 * 60; // handle wrap
	if (sleepDurationMin > 10 * 60) sleepDurationMin = 8 * 60; // sanity cap

	// CBTmin is 2 hours before wake time in home tz
	const homeCbtMin = mod1440(homeSleepEndMin - 2 * 60);

	// Destination CBTmin (what CBTmin should be once adapted, in home tz clock)
	// We subtract tzDiff because the destination is tzDiff hours ahead/behind
	const destCbtMinInHomeClock = mod1440(homeCbtMin - tzDiffMinutes);

	// Number of days needed: 1 hour shift per day, plus 2 pre-departure + 2 post-arrival buffer days
	const shiftsNeeded = Math.abs(tzDiffHours);
	const adjustmentDays = Math.ceil(shiftsNeeded);
	// We start pre-departure adjustment 1 day before for large shifts
	const preDepartureDays = Math.min(adjustmentDays, 3);
	const postArrivalDays = adjustmentDays - preDepartureDays + 2;
	const totalDays = preDepartureDays + 1 + postArrivalDays; // +1 for travel day

	const departureDateStr = departureDatetime.slice(0, 10);

	const days: DayPlan[] = [];

	for (let i = 0; i < totalDays; i++) {
		// dayIndex relative to departure: negative = pre-departure, 0 = departure, positive = post-arrival
		const relDay = i - preDepartureDays;

		// Fractional progress toward full adaptation (0 = home, 1 = fully adapted)
		// We shift starting from day -preDepartureDays
		const shiftedDays = i; // days shifted so far
		const maxShifts = adjustmentDays;
		const progress = Math.min(shiftedDays / maxShifts, 1);

		// Current CBTmin (interpolate from home to destination), in home tz clock
		const currentCbtMin = lerpCircular(homeCbtMin, destCbtMinInHomeClock, progress);

		// Target sleep end (wake time) = CBTmin + 2 hours
		const targetWakeMin = mod1440(currentCbtMin + 2 * 60);
		const targetSleepStartMin = mod1440(targetWakeMin - sleepDurationMin);

		// Light exposure windows
		// Eastward: advance clock → seek light AFTER CBTmin (CBTmin to CBTmin+4h)
		// Westward: delay clock → seek light BEFORE CBTmin (CBTmin-4h to CBTmin)
		let lightSeekStart: number, lightSeekEnd: number;
		let lightAvoidStart: number, lightAvoidEnd: number;

		if (direction === 'east') {
			// Seek light 0-4h after CBTmin
			lightSeekStart = currentCbtMin;
			lightSeekEnd = mod1440(currentCbtMin + 4 * 60);
			// Avoid light 4h before CBTmin
			lightAvoidStart = mod1440(currentCbtMin - 4 * 60);
			lightAvoidEnd = currentCbtMin;
		} else if (direction === 'west') {
			// Seek light 0-4h before CBTmin
			lightSeekStart = mod1440(currentCbtMin - 4 * 60);
			lightSeekEnd = currentCbtMin;
			// Avoid light right after CBTmin
			lightAvoidStart = currentCbtMin;
			lightAvoidEnd = mod1440(currentCbtMin + 4 * 60);
		} else {
			// No adjustment needed
			lightSeekStart = mod1440(targetWakeMin);
			lightSeekEnd = mod1440(targetWakeMin + 4 * 60);
			lightAvoidStart = mod1440(homeSleepStartMin - 2 * 60);
			lightAvoidEnd = homeSleepStartMin;
		}

		// Caffeine: OK from wake until 6 hours before target sleep start
		const caffeineOkStart = targetWakeMin;
		const caffeineStopMin = mod1440(targetSleepStartMin - 6 * 60);
		const caffeineOkEnd = caffeineStopMin;
		const caffeineStopEnd = targetSleepStartMin;

		// Melatonin: 1 hour before target sleep start, only if adjustment > 1h
		let melatonin: TimeWindow | null = null;
		if (Math.abs(tzDiffHours) >= 1 && progress < 1) {
			const melatoninStart = mod1440(targetSleepStartMin - 60);
			const melatoninEnd = targetSleepStartMin;
			melatonin = {
				startMinutes: melatoninStart,
				endMinutes: melatoninEnd,
				label: `Melatonin 0.5 mg (${minutesToHHMM(melatoninStart)}–${minutesToHHMM(melatoninEnd)})`
			};
		}

		// Notes
		const notes: string[] = [];
		const shiftAmountH = Math.round(Math.abs(progress * tzDiffHours) * 10) / 10;
		if (relDay < 0) {
			notes.push(`Pre-departure: shift your schedule ${shiftAmountH}h toward destination time.`);
		} else if (relDay === 0) {
			notes.push('Travel day. Try to sleep on the plane to align with destination night.');
			if (Math.abs(tzDiffHours) >= 5) {
				notes.push('Use a sleep mask and earplugs on the flight if traveling overnight.');
			}
		} else {
			notes.push(`Day ${relDay} at destination — ${Math.round(progress * 100)}% adapted.`);
			if (progress >= 1) {
				notes.push('Fully adapted to local time. Maintain regular schedule.');
			}
		}

		const dateStr = addDays(departureDateStr, relDay);

		let label = '';
		if (relDay < 0) label = `Day ${relDay} · Pre-departure`;
		else if (relDay === 0) label = 'Day 0 · Travel day';
		else label = `Day +${relDay} · At destination`;

		days.push({
			dayIndex: relDay,
			date: dateStr,
			label,
			cbtMinHome: currentCbtMin,
			cbtMinDest: mod1440(currentCbtMin + tzDiffMinutes),
			light_seek: [
				{
					startMinutes: lightSeekStart,
					endMinutes: lightSeekEnd,
					label: `Seek bright light (${minutesToHHMM(lightSeekStart)}–${minutesToHHMM(lightSeekEnd)})`
				}
			],
			light_avoid: [
				{
					startMinutes: lightAvoidStart,
					endMinutes: lightAvoidEnd,
					label: `Avoid bright light (${minutesToHHMM(lightAvoidStart)}–${minutesToHHMM(lightAvoidEnd)})`
				}
			],
			sleep: {
				startMinutes: targetSleepStartMin,
				endMinutes: targetWakeMin,
				label: `Sleep (${minutesToHHMM(targetSleepStartMin)}–${minutesToHHMM(targetWakeMin)})`
			},
			caffeine_ok: {
				startMinutes: caffeineOkStart,
				endMinutes: caffeineOkEnd,
				label: `Caffeine OK (${minutesToHHMM(caffeineOkStart)}–${minutesToHHMM(caffeineOkEnd)})`
			},
			caffeine_stop: {
				startMinutes: caffeineStopMin,
				endMinutes: caffeineStopEnd,
				label: `No caffeine (${minutesToHHMM(caffeineStopMin)}–${minutesToHHMM(caffeineStopEnd)})`
			},
			melatonin,
			notes
		});
	}

	return {
		departureTz,
		arrivalTz,
		departureOffsetMin,
		arrivalOffsetMin,
		tzDiffHours,
		direction,
		totalDays,
		days
	};
}

/**
 * Linear interpolation on a circular scale (0–1440 minutes).
 * Takes the shortest arc between a and b.
 */
function lerpCircular(a: number, b: number, t: number): number {
	let diff = b - a;
	// Take shortest path around the circle
	if (diff > 720) diff -= 1440;
	if (diff < -720) diff += 1440;
	return mod1440(a + diff * t);
}

/**
 * Serialize a plan to a compact JSON string for storage.
 */
export function serializePlan(plan: CircadianPlan): string {
	return JSON.stringify(plan);
}

export function deserializePlan(json: string): CircadianPlan {
	return JSON.parse(json) as CircadianPlan;
}
