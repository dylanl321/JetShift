import { error } from '@sveltejs/kit';
import {
	generateItinerary,
	normalizeStoredItinerary,
	type Itinerary
} from '$lib/circadian.js';
import type { PageServerLoad } from './$types.js';

interface TripRow {
	id: string;
	departure_tz: string;
	arrival_tz: string;
	departure_datetime: string;
	return_datetime: string | null;
	flight_number: string | null;
	typical_sleep_start: string;
	typical_sleep_end: string;
	age: number | null;
	chronotype: string | null;
	caffeine: string | null;
	uses_melatonin: number | null;
	plan_json: string;
	created_at: string;
}

export const load: PageServerLoad = async ({ params, platform }) => {
	const db = platform?.env?.DB ?? null;
	if (!db) {
		error(503, 'Database not available in this environment. Deploy to Cloudflare to use this feature.');
	}

	let row: TripRow | null = null;
	try {
		row = await db.prepare('SELECT * FROM trips WHERE id = ?').bind(params.id).first<TripRow>();
	} catch {
		error(500, 'Failed to load plan from database.');
	}
	if (!row) {
		error(404, 'Plan not found. It may have expired or the link is incorrect.');
	}

	let itinerary: Itinerary;
	try {
		itinerary = normalizeStoredItinerary(row.plan_json);
	} catch {
		// Regenerate from stored inputs as a fallback.
		itinerary = generateItinerary(
			{
				departureTz: row.departure_tz,
				arrivalTz: row.arrival_tz,
				departureDatetime: row.departure_datetime,
				sleepStart: row.typical_sleep_start,
				sleepEnd: row.typical_sleep_end,
				age: row.age ?? undefined,
				chronotype: (row.chronotype as never) ?? undefined,
				caffeine: (row.caffeine as never) ?? undefined,
				usesMelatonin: row.uses_melatonin == null ? true : row.uses_melatonin === 1
			},
			row.return_datetime
		);
	}

	return {
		id: row.id,
		createdAt: row.created_at,
		departureDatetime: row.departure_datetime,
		returnDatetime: row.return_datetime,
		flightNumber: row.flight_number,
		itinerary
	};
};
