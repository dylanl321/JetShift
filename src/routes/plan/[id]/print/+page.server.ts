import { error } from '@sveltejs/kit';
import { normalizeStoredItinerary, type Itinerary } from '$lib/circadian.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, platform }) => {
	const db = platform?.env?.DB ?? null;
	if (!db) error(503, 'Database not available in this environment.');

	let row: { plan_json: string; flight_number: string | null; departure_datetime: string } | null =
		null;
	try {
		row = await db
			.prepare('SELECT plan_json, flight_number, departure_datetime FROM trips WHERE id = ?')
			.bind(params.id)
			.first();
	} catch {
		error(500, 'Failed to load plan.');
	}
	if (!row) error(404, 'Plan not found.');

	let itinerary: Itinerary;
	try {
		itinerary = normalizeStoredItinerary(row.plan_json);
	} catch {
		error(500, 'Stored plan is corrupted.');
	}

	return {
		id: params.id,
		flightNumber: row.flight_number,
		departureDatetime: row.departure_datetime,
		itinerary
	};
};
