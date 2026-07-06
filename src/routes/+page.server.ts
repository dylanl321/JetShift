import type { PageServerLoad } from './$types.js';

interface TripRow {
	id: string;
	created_at: string;
	departure_tz: string;
	arrival_tz: string;
	departure_datetime: string;
}

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform?.env?.DB;
	if (!db) {
		return { recentPlans: [] };
	}

	try {
		const result = await db
			.prepare(
				'SELECT id, created_at, departure_tz, arrival_tz, departure_datetime FROM trips ORDER BY created_at DESC LIMIT 6'
			)
			.all<TripRow>();

		return {
			recentPlans: result.results ?? []
		};
	} catch {
		return { recentPlans: [] };
	}
};
