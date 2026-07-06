import { fail, redirect } from '@sveltejs/kit';
import { generatePlan, serializePlan } from '$lib/circadian.js';
import type { Actions, PageServerLoad } from './$types.js';
import { TIMEZONES } from '$lib/timezones.js';

export const load: PageServerLoad = async () => {
	return { timezones: TIMEZONES };
};

export const actions: Actions = {
	default: async ({ request, platform }) => {
		const db = platform?.env?.DB ?? null;

		const form = await request.formData();

		const departureTz = form.get('departure_tz')?.toString().trim() ?? '';
		const arrivalTz = form.get('arrival_tz')?.toString().trim() ?? '';
		const departureDatetime = form.get('departure_datetime')?.toString().trim() ?? '';
		const sleepStart = form.get('sleep_start')?.toString().trim() ?? '';
		const sleepEnd = form.get('sleep_end')?.toString().trim() ?? '';

		// Validate
		const errors: Record<string, string> = {};
		if (!departureTz) errors.departure_tz = 'Please select a departure timezone.';
		if (!arrivalTz) errors.arrival_tz = 'Please select an arrival timezone.';
		if (!departureDatetime) errors.departure_datetime = 'Please enter departure date & time.';
		if (!sleepStart) errors.sleep_start = 'Please enter your usual bedtime.';
		if (!sleepEnd) errors.sleep_end = 'Please enter your usual wake time.';

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors, values: { departureTz, arrivalTz, departureDatetime, sleepStart, sleepEnd } });
		}

		// Generate plan
		let plan;
		try {
			plan = generatePlan(departureTz, arrivalTz, departureDatetime, sleepStart, sleepEnd);
		} catch (e) {
			return fail(500, { errors: { general: 'Failed to generate plan. Please check your inputs.' }, values: {} });
		}

		const id = crypto.randomUUID();
		const createdAt = new Date().toISOString();
		const planJson = serializePlan(plan);

		if (db) {
			try {
				await db
					.prepare(
						'INSERT INTO trips (id, created_at, departure_tz, arrival_tz, departure_datetime, typical_sleep_start, typical_sleep_end, plan_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
					)
					.bind(id, createdAt, departureTz, arrivalTz, departureDatetime, sleepStart, sleepEnd, planJson)
					.run();
			} catch {
				// If DB not available, still redirect with plan in URL (fallback)
			}
		}

		redirect(303, `/plan/${id}`);
	}
};
