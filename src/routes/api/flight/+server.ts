import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { findAirport, type Airport } from '$lib/airports.js';

/**
 * Resolve a flight number to its origin/destination airports using AirLabs API.
 *
 * Uses the `routes` endpoint to find departure/arrival for a given flight IATA code.
 * Falls back to the bundled airport dataset for timezone info.
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
	lat?: number;
	lng?: number;
	known: boolean;
}

function toEndpoint(iata: string | undefined | null, airportData?: any): Endpoint | null {
	if (!iata) return null;
	const code = iata.toUpperCase();
	const known: Airport | undefined = findAirport(code);
	if (known) {
		return { iata: code, tz: known.tz, city: known.city, name: known.name, known: true };
	}
	// Use AirLabs airport data if we don't have it bundled
	if (airportData) {
		return {
			iata: code,
			tz: airportData.timezone || 'UTC',
			city: airportData.city || code,
			name: airportData.name || code,
			lat: airportData.lat,
			lng: airportData.lng,
			known: false
		};
	}
	return null;
}

export const GET: RequestHandler = async ({ url, platform, fetch }) => {
	const flightRaw = (url.searchParams.get('flight') ?? '').trim().toUpperCase().replace(/\s+/g, '');
	const date = (url.searchParams.get('date') ?? '').trim();

	if (!/^[A-Z0-9]{2,3}\d{1,4}$/.test(flightRaw)) {
		return json({
			ok: false,
			reason: 'Enter a flight number like BA178 or DL401.',
			needsManual: true
		});
	}

	const apiKey = platform?.env?.AIRLABS_API_KEY;
	if (!apiKey) {
		return json({
			ok: false,
			reason:
				'Live flight lookup is not configured. Pick your airports on the map instead.',
			needsManual: true
		});
	}

	try {
		// Use AirLabs routes endpoint to find the flight
		const routeUrl = new URL('https://airlabs.co/api/v9/routes');
		routeUrl.searchParams.set('api_key', apiKey);
		routeUrl.searchParams.set('flight_iata', flightRaw);

		const res = await fetch(routeUrl.toString(), {
			signal: AbortSignal.timeout(8000),
			headers: { 'User-Agent': 'JetShift/1.0' }
		});

		if (!res.ok) {
			return json({ ok: false, reason: `Flight service returned ${res.status}.`, needsManual: true });
		}

		const body = await res.json() as {
			response?: Array<{
				dep_iata?: string;
				arr_iata?: string;
				dep_time?: string;
				arr_time?: string;
				duration?: number;
				days?: string[];
			}>;
		};

		const route = body.response?.[0];
		if (!route?.dep_iata || !route?.arr_iata) {
			return json({
				ok: false,
				reason: 'Could not find that flight. Pick your airports on the map instead.',
				needsManual: true
			});
		}

		// Now look up airport details for timezone info
		let depAirportData = null;
		let arrAirportData = null;

		// Only fetch airport details if not in our bundled dataset
		if (!findAirport(route.dep_iata) || !findAirport(route.arr_iata)) {
			const airportUrl = new URL('https://airlabs.co/api/v9/airports');
			airportUrl.searchParams.set('api_key', apiKey);
			airportUrl.searchParams.set('iata_code', !findAirport(route.dep_iata) ? route.dep_iata : route.arr_iata);

			const airportRes = await fetch(airportUrl.toString(), {
				signal: AbortSignal.timeout(5000),
				headers: { 'User-Agent': 'JetShift/1.0' }
			});
			if (airportRes.ok) {
				const airportBody = await airportRes.json() as { response?: any[] };
				if (airportBody.response?.[0]) {
					if (!findAirport(route.dep_iata)) depAirportData = airportBody.response[0];
					else arrAirportData = airportBody.response[0];
				}
			}
		}

		const departure = toEndpoint(route.dep_iata, depAirportData);
		const arrival = toEndpoint(route.arr_iata, arrAirportData);

		if (!departure || !arrival) {
			return json({
				ok: false,
				reason: 'Could not resolve airport timezones. Pick your airports on the map instead.',
				needsManual: true
			});
		}

		return json({
			ok: true,
			flight: flightRaw,
			departure,
			arrival,
			duration: route.duration ?? null,
			dep_time: route.dep_time ?? null,
			arr_time: route.arr_time ?? null,
			days: route.days ?? null
		});
	} catch (e) {
		return json({
			ok: false,
			reason: 'Flight lookup timed out. Pick your airports on the map instead.',
			needsManual: true
		});
	}
};
