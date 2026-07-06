import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { itineraryCalendarEvents, type Itinerary, type CircadianPlan } from '$lib/circadian.js';
import { buildIcs } from '$lib/ics.js';

/** Normalize a stored plan_json (legacy single plan OR new itinerary) into an Itinerary. */
function asItinerary(json: string): Itinerary {
	const parsed = JSON.parse(json);
	if (parsed && typeof parsed === 'object' && 'outbound' in parsed) {
		return parsed as Itinerary;
	}
	// Legacy: a bare CircadianPlan.
	return { version: 1, roundTrip: false, outbound: parsed as CircadianPlan, return: null };
}

export const GET: RequestHandler = async ({ params, platform }) => {
	const db = platform?.env?.DB ?? null;
	if (!db) error(503, 'Database not available in this environment.');

	let row: { plan_json: string; departure_tz: string; arrival_tz: string } | null = null;
	try {
		row = await db
			.prepare('SELECT plan_json, departure_tz, arrival_tz FROM trips WHERE id = ?')
			.bind(params.id)
			.first();
	} catch {
		error(500, 'Failed to load plan.');
	}
	if (!row) error(404, 'Plan not found.');

	let itin: Itinerary;
	try {
		itin = asItinerary(row.plan_json);
	} catch {
		error(500, 'Stored plan is corrupted.');
	}

	const events = itineraryCalendarEvents(itin);
	const name = `JetShift · ${itin.outbound.departureLabel} → ${itin.outbound.arrivalLabel}`;
	const ics = buildIcs(events, name);

	return new Response(ics, {
		headers: {
			'Content-Type': 'text/calendar; charset=utf-8',
			'Content-Disposition': `attachment; filename="jetshift-${params.id.slice(0, 8)}.ics"`,
			'Cache-Control': 'no-store'
		}
	});
};
