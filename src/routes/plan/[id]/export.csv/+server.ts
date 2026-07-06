import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	normalizeStoredItinerary,
	type CircadianPlan,
	type TimeWindow
} from '$lib/circadian.js';

/** Flatten the itinerary into a spreadsheet-friendly CSV schedule. */

function hhmm(m: number): string {
	const t = ((m % 1440) + 1440) % 1440;
	return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.round(t % 60)).padStart(2, '0')}`;
}

function csvCell(v: string): string {
	return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function planRows(plan: CircadianPlan, leg: string): string[][] {
	const rows: string[][] = [];
	for (const day of plan.days) {
		const add = (activity: string, win: TimeWindow | null) => {
			if (!win) return;
			rows.push([
				leg,
				day.label,
				day.date,
				day.tzLabel,
				activity,
				hhmm(win.startMinutes),
				hhmm(win.endMinutes),
				day.notes.join(' ')
			]);
		};
		add('Sleep', day.sleep);
		for (const w of day.light_seek) add('Seek bright light', w);
		for (const w of day.light_avoid) add('Avoid bright light', w);
		add('Caffeine OK', day.caffeine_ok);
		add('No caffeine', day.caffeine_stop);
		add('Melatonin 0.5 mg', day.melatonin);
	}
	return rows;
}

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

	let rows: string[][];
	try {
		const itin = normalizeStoredItinerary(row.plan_json);
		rows = planRows(itin.outbound, 'Outbound');
		if (itin.return) rows.push(...planRows(itin.return, 'Return'));
	} catch {
		error(500, 'Stored plan is corrupted.');
	}

	const header = ['Leg', 'Day', 'Date', 'Timezone', 'Activity', 'Start', 'End', 'Notes'];
	const csv =
		[header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="jetshift-${params.id.slice(0, 8)}.csv"`,
			'Cache-Control': 'no-store'
		}
	});
};
