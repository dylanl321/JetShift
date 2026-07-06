import { error } from '@sveltejs/kit';
import { deserializePlan, generatePlan, serializePlan } from '$lib/circadian.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, platform }) => {
	const db = platform?.env?.DB ?? null;
	const { id } = params;

	if (!db) {
		error(503, 'Database not available in this environment. Deploy to Cloudflare Pages to use this feature.');
	}

	let row: {
		id: string;
		departure_tz: string;
		arrival_tz: string;
		departure_datetime: string;
		typical_sleep_start: string;
		typical_sleep_end: string;
		plan_json: string;
		created_at: string;
	} | null = null;

	try {
		row = await db
			.prepare('SELECT * FROM trips WHERE id = ?')
			.bind(id)
			.first();
	} catch {
		error(500, 'Failed to load plan from database.');
	}

	if (!row) {
		error(404, 'Plan not found. It may have expired or the link is incorrect.');
	}

	// If plan_json is present, use it directly; otherwise regenerate
	let plan;
	if (row.plan_json) {
		try {
			plan = deserializePlan(row.plan_json);
		} catch {
			plan = generatePlan(
				row.departure_tz,
				row.arrival_tz,
				row.departure_datetime,
				row.typical_sleep_start,
				row.typical_sleep_end
			);
		}
	} else {
		plan = generatePlan(
			row.departure_tz,
			row.arrival_tz,
			row.departure_datetime,
			row.typical_sleep_start,
			row.typical_sleep_end
		);
	}

	return {
		id: row.id,
		createdAt: row.created_at,
		departureTz: row.departure_tz,
		arrivalTz: row.arrival_tz,
		departureDatetime: row.departure_datetime,
		sleepStart: row.typical_sleep_start,
		sleepEnd: row.typical_sleep_end,
		plan
	};
};
