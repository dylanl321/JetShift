import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { findAirport, type Airport } from '$lib/airports.js';

/**
 * Resolve a flight number to its origin/destination airports.
 *
 * Live lookup requires an AviationStack API key in `FLIGHT_API_KEY` (Cloudflare env var / secret).
 * Without it — or if the upstream call fails or the flight isn't found — we respond with
 * `ok: false` and a reason, and the client falls back to manual map / airport-code selection.
 *
 * Response shape:
 *   { ok: true, flight, departure: {...}, arrival: {...} }
 *   { ok: false, reason: string, needsManual: true }
 */

interface Endpoint {
	iata: string;
	tz: string;
	city?: string;
	name?: string;
	known: boolean; // present in our bundled airport dataset
}

function toEndpoint(iata: string | undefined | null, tzFromApi?: string | null): Endpoint | null {
	if (!iata) return null;
	const code = iata.toUpperCase();
	const known: Airport | undefined = findAirport(code);
	if (known) {
		return { iata: code, tz: known.tz, city: known.city, name: known.name, known: true };
	}
	if (tzFromApi) {
		return { iata: code, tz: tzFromApi, city: code, name: code, known: false };
	}
	return null;
}

export const GET: RequestHandler = async ({ url, platform, fetch }) => {
	const flightRaw = (url.searchParams.get('flight') ?? '').trim().toUpperCase().replace(/\s+/g, '');
	const date = (url.searchParams.get('date') ?? '').trim(); // YYYY-MM-DD (optional)

	if (!/^[A-Z0-9]{2,3}\d{1,4}$/.test(flightRaw)) {
		return json({
			ok: false,
			reason: 'Enter a flight number like BA178 or DL401.',
			needsManual: true
		});
	}

	const apiKey = platform?.env?.FLIGHT_API_KEY;
	if (!apiKey) {
		return json({
			ok: false,
			reason:
				'Live flight lookup is not configured on this deployment. Pick your airports on the map instead.',
			needsManual: true
		});
	}

	try {
		const api = new URL('https://api.aviationstack.com/v1/flights');
		api.searchParams.set('access_key', apiKey);
		api.searchParams.set('flight_iata', flightRaw);
		if (date) api.searchParams.set('flight_date', date);
		api.searchParams.set('limit', '1');

		const res = await fetch(api.toString(), { signal: AbortSignal.timeout(8000) });
		if (!res.ok) {
			return json({ ok: false, reason: `Flight service returned ${res.status}.`, needsManual: true });
		}
		const body = (await res.json()) as {
			data?: Array<{
				departure?: { iata?: string; timezone?: string };
				arrival?: { iata?: string; timezone?: string };
			}>;
		};
		const rec = body.data?.[0];
		const departure = toEndpoint(rec?.departure?.iata, rec?.departure?.timezone);
		const arrival = toEndpoint(rec?.arrival?.iata, rec?.arrival?.timezone);

		if (!departure || !arrival) {
			return json({
				ok: false,
				reason: 'Could not find that flight. Pick your airports on the map instead.',
				needsManual: true
			});
		}

		return json({ ok: true, flight: flightRaw, departure, arrival });
	} catch (e) {
		return json({
			ok: false,
			reason: 'Flight lookup timed out. Pick your airports on the map instead.',
			needsManual: true
		});
	}
};
