import { fail, redirect } from '@sveltejs/kit';
import {
	generateItinerary,
	serializeItinerary,
	type Chronotype,
	type CaffeineSensitivity,
	type PlanInput
} from '$lib/circadian.js';
import type { Actions, PageServerLoad } from './$types.js';
import { TIMEZONES } from '$lib/timezones.js';
import { AIRPORTS } from '$lib/airports.js';

export const load: PageServerLoad = async () => {
	return { timezones: TIMEZONES, airports: AIRPORTS };
};

const CHRONOTYPES: Chronotype[] = ['early', 'intermediate', 'late'];
const CAFFEINE: CaffeineSensitivity[] = ['none', 'sensitive', 'average', 'tolerant'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidTz(tz: string): boolean {
	try {
		new Intl.DateTimeFormat('en-US', { timeZone: tz });
		return true;
	} catch {
		return false;
	}
}

export const actions: Actions = {
	default: async ({ request, platform }) => {
		const db = platform?.env?.DB ?? null;
		const form = await request.formData();

		const s = (k: string) => form.get(k)?.toString().trim() ?? '';
		const departureTz = s('departure_tz');
		const arrivalTz = s('arrival_tz');
		const departureDatetime = s('departure_datetime');
		const returnDatetime = s('return_datetime');
		const roundTrip = form.get('round_trip') === 'on' || !!returnDatetime;
		const flightNumber = s('flight_number');
		const sleepStart = s('sleep_start');
		const sleepEnd = s('sleep_end');
		const ageRaw = s('age');
		const chronotypeRaw = s('chronotype');
		const caffeineRaw = s('caffeine');
		const usesMelatonin = form.get('uses_melatonin') === 'on';

		const values = {
			departureTz,
			arrivalTz,
			departureDatetime,
			returnDatetime,
			roundTrip,
			flightNumber,
			sleepStart,
			sleepEnd,
			age: ageRaw,
			chronotype: chronotypeRaw,
			caffeine: caffeineRaw,
			usesMelatonin
		};

		// Validation.
		const errors: Record<string, string> = {};
		if (!departureTz || !isValidTz(departureTz)) errors.departure_tz = 'Select a valid departure location.';
		if (!arrivalTz || !isValidTz(arrivalTz)) errors.arrival_tz = 'Select a valid arrival location.';
		if (!departureDatetime || Number.isNaN(Date.parse(departureDatetime)))
			errors.departure_datetime = 'Enter a valid departure date & time.';
		if (roundTrip && returnDatetime) {
			if (Number.isNaN(Date.parse(returnDatetime)))
				errors.return_datetime = 'Enter a valid return date & time.';
			else if (departureDatetime && Date.parse(returnDatetime) <= Date.parse(departureDatetime))
				errors.return_datetime = 'Return must be after departure.';
		}
		if (!TIME_RE.test(sleepStart)) errors.sleep_start = 'Enter your bedtime as HH:MM.';
		if (!TIME_RE.test(sleepEnd)) errors.sleep_end = 'Enter your wake time as HH:MM.';

		let age: number | undefined;
		if (ageRaw) {
			const n = Number(ageRaw);
			if (!Number.isFinite(n) || n < 1 || n > 120) errors.age = 'Enter an age between 1 and 120.';
			else age = Math.round(n);
		}
		const chronotype: Chronotype = CHRONOTYPES.includes(chronotypeRaw as Chronotype)
			? (chronotypeRaw as Chronotype)
			: 'intermediate';
		const caffeine: CaffeineSensitivity = CAFFEINE.includes(caffeineRaw as CaffeineSensitivity)
			? (caffeineRaw as CaffeineSensitivity)
			: 'average';

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors, values });
		}

		const input: PlanInput = {
			departureTz,
			arrivalTz,
			departureDatetime,
			sleepStart,
			sleepEnd,
			age,
			chronotype,
			caffeine,
			usesMelatonin
		};

		let itinerary;
		try {
			itinerary = generateItinerary(input, roundTrip ? returnDatetime : null);
		} catch {
			return fail(500, { errors: { general: 'Failed to generate plan. Please check your inputs.' }, values });
		}

		const id = crypto.randomUUID();
		const createdAt = new Date().toISOString();
		const planJson = serializeItinerary(itinerary);

		if (db) {
			try {
				await db
					.prepare(
						`INSERT INTO trips
							(id, created_at, departure_tz, arrival_tz, departure_datetime, return_datetime,
							 flight_number, typical_sleep_start, typical_sleep_end, age, chronotype, caffeine,
							 uses_melatonin, plan_json)
						 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
					)
					.bind(
						id,
						createdAt,
						departureTz,
						arrivalTz,
						departureDatetime,
						roundTrip ? returnDatetime : null,
						flightNumber || null,
						sleepStart,
						sleepEnd,
						age ?? null,
						chronotype,
						caffeine,
						usesMelatonin ? 1 : 0,
						planJson
					)
					.run();
			} catch {
				// If DB insert fails, still proceed to the plan page (it will re-generate if needed).
			}
		}

		redirect(303, `/plan/${id}`);
	}
};
