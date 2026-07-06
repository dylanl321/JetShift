import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { normalizeStoredItinerary } from '$lib/circadian.js';

/** Download the full itinerary (both legs, all windows, profile) as pretty-printed JSON. */
export const GET: RequestHandler = async ({ params, platform }) => {
	const db = platform?.env?.DB ?? null;
	if (!db) error(503, 'Database not available in this environment.');

	let row: { plan_json: string } | null = null;
	try {
		row = await db.prepare('SELECT plan_json FROM trips WHERE id = ?').bind(params.id).first();
	} catch {
		error(500, 'Failed to load plan.');
	}
	if (!row) error(404, 'Plan not found.');

	let body: string;
	try {
		body = JSON.stringify(normalizeStoredItinerary(row.plan_json), null, 2);
	} catch {
		error(500, 'Stored plan is corrupted.');
	}

	return new Response(body, {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Content-Disposition': `attachment; filename="jetshift-${params.id.slice(0, 8)}.json"`,
			'Cache-Control': 'no-store'
		}
	});
};
