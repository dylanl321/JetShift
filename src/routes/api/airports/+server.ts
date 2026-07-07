import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

/**
 * Airport autocomplete/suggest using AirLabs API.
 * Query: ?q=Atlanta or ?q=ATL
 * Returns matching airports with IATA codes and timezones.
 */

export const GET: RequestHandler = async ({ url, platform, fetch }) => {
	const query = (url.searchParams.get('q') ?? '').trim();

	if (query.length < 2) {
		return json({ ok: false, results: [], reason: 'Query too short' });
	}

	const apiKey = platform?.env?.AIRLABS_API_KEY;
	if (!apiKey) {
		return json({ ok: false, results: [], reason: 'Airport search not configured' });
	}

	try {
		const suggestUrl = new URL('https://airlabs.co/api/v9/suggest');
		suggestUrl.searchParams.set('api_key', apiKey);
		suggestUrl.searchParams.set('q', query);

		const res = await fetch(suggestUrl.toString(), {
			signal: AbortSignal.timeout(5000),
			headers: { 'User-Agent': 'JetShift/1.0' }
		});

		if (!res.ok) {
			return json({ ok: false, results: [], reason: `AirLabs returned ${res.status}` });
		}

		const body = await res.json() as {
			response?: {
				airports?: Array<{
					name?: string;
					iata_code?: string;
					icao_code?: string;
					country_code?: string;
					city?: string;
					lat?: number;
					lng?: number;
				}>;
			};
		};

		const airports = (body.response?.airports ?? []).map((a) => ({
			name: a.name,
			iata: a.iata_code,
			city: a.city,
			country: a.country_code,
			lat: a.lat,
			lng: a.lng
		}));

		return json({ ok: true, results: airports });
	} catch {
		return json({ ok: false, results: [], reason: 'Airport search timed out' });
	}
};
