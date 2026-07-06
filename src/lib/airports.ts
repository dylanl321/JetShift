/**
 * Major international airports with IANA timezone and coordinates.
 *
 * Powers the map picker, the airport-code autocomplete, and flight-number resolution. Coordinates
 * are used to plot markers on an equirectangular map. Timezones are IANA strings so DST is handled
 * by the Intl API at plan time.
 */
export interface Airport {
	iata: string;
	name: string;
	city: string;
	country: string;
	tz: string; // IANA
	lat: number;
	lon: number;
}

export const AIRPORTS: Airport[] = [
	// North America
	{ iata: 'JFK', name: 'John F. Kennedy Intl', city: 'New York', country: 'USA', tz: 'America/New_York', lat: 40.64, lon: -73.78 },
	{ iata: 'EWR', name: 'Newark Liberty Intl', city: 'Newark', country: 'USA', tz: 'America/New_York', lat: 40.69, lon: -74.17 },
	{ iata: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'USA', tz: 'America/Los_Angeles', lat: 33.94, lon: -118.41 },
	{ iata: 'SFO', name: 'San Francisco Intl', city: 'San Francisco', country: 'USA', tz: 'America/Los_Angeles', lat: 37.62, lon: -122.38 },
	{ iata: 'SEA', name: 'Seattle-Tacoma Intl', city: 'Seattle', country: 'USA', tz: 'America/Los_Angeles', lat: 47.45, lon: -122.31 },
	{ iata: 'ORD', name: "O'Hare Intl", city: 'Chicago', country: 'USA', tz: 'America/Chicago', lat: 41.98, lon: -87.90 },
	{ iata: 'DFW', name: 'Dallas/Fort Worth Intl', city: 'Dallas', country: 'USA', tz: 'America/Chicago', lat: 32.90, lon: -97.04 },
	{ iata: 'ATL', name: 'Hartsfield-Jackson Intl', city: 'Atlanta', country: 'USA', tz: 'America/New_York', lat: 33.64, lon: -84.43 },
	{ iata: 'MIA', name: 'Miami Intl', city: 'Miami', country: 'USA', tz: 'America/New_York', lat: 25.80, lon: -80.29 },
	{ iata: 'BOS', name: 'Logan Intl', city: 'Boston', country: 'USA', tz: 'America/New_York', lat: 42.36, lon: -71.01 },
	{ iata: 'DEN', name: 'Denver Intl', city: 'Denver', country: 'USA', tz: 'America/Denver', lat: 39.86, lon: -104.67 },
	{ iata: 'PHX', name: 'Sky Harbor Intl', city: 'Phoenix', country: 'USA', tz: 'America/Phoenix', lat: 33.43, lon: -112.01 },
	{ iata: 'IAD', name: 'Washington Dulles Intl', city: 'Washington', country: 'USA', tz: 'America/New_York', lat: 38.95, lon: -77.46 },
	{ iata: 'HNL', name: 'Daniel K. Inouye Intl', city: 'Honolulu', country: 'USA', tz: 'Pacific/Honolulu', lat: 21.32, lon: -157.92 },
	{ iata: 'ANC', name: 'Anchorage Intl', city: 'Anchorage', country: 'USA', tz: 'America/Anchorage', lat: 61.17, lon: -149.99 },
	{ iata: 'YYZ', name: 'Toronto Pearson Intl', city: 'Toronto', country: 'Canada', tz: 'America/Toronto', lat: 43.68, lon: -79.63 },
	{ iata: 'YVR', name: 'Vancouver Intl', city: 'Vancouver', country: 'Canada', tz: 'America/Vancouver', lat: 49.19, lon: -123.18 },
	{ iata: 'YUL', name: 'Montréal-Trudeau Intl', city: 'Montréal', country: 'Canada', tz: 'America/Toronto', lat: 45.47, lon: -73.74 },
	{ iata: 'MEX', name: 'Mexico City Intl', city: 'Mexico City', country: 'Mexico', tz: 'America/Mexico_City', lat: 19.44, lon: -99.07 },

	// South America
	{ iata: 'GRU', name: 'São Paulo/Guarulhos Intl', city: 'São Paulo', country: 'Brazil', tz: 'America/Sao_Paulo', lat: -23.43, lon: -46.47 },
	{ iata: 'GIG', name: 'Rio de Janeiro/Galeão Intl', city: 'Rio de Janeiro', country: 'Brazil', tz: 'America/Sao_Paulo', lat: -22.81, lon: -43.25 },
	{ iata: 'EZE', name: 'Ministro Pistarini Intl', city: 'Buenos Aires', country: 'Argentina', tz: 'America/Argentina/Buenos_Aires', lat: -34.82, lon: -58.54 },
	{ iata: 'SCL', name: 'Arturo Merino Benítez Intl', city: 'Santiago', country: 'Chile', tz: 'America/Santiago', lat: -33.39, lon: -70.79 },
	{ iata: 'BOG', name: 'El Dorado Intl', city: 'Bogotá', country: 'Colombia', tz: 'America/Bogota', lat: 4.70, lon: -74.15 },
	{ iata: 'LIM', name: 'Jorge Chávez Intl', city: 'Lima', country: 'Peru', tz: 'America/Lima', lat: -12.02, lon: -77.11 },

	// Europe
	{ iata: 'LHR', name: 'Heathrow', city: 'London', country: 'UK', tz: 'Europe/London', lat: 51.47, lon: -0.45 },
	{ iata: 'LGW', name: 'Gatwick', city: 'London', country: 'UK', tz: 'Europe/London', lat: 51.15, lon: -0.19 },
	{ iata: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France', tz: 'Europe/Paris', lat: 49.01, lon: 2.55 },
	{ iata: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'Netherlands', tz: 'Europe/Amsterdam', lat: 52.31, lon: 4.76 },
	{ iata: 'FRA', name: 'Frankfurt', city: 'Frankfurt', country: 'Germany', tz: 'Europe/Berlin', lat: 50.04, lon: 8.56 },
	{ iata: 'MUC', name: 'Munich', city: 'Munich', country: 'Germany', tz: 'Europe/Berlin', lat: 48.35, lon: 11.79 },
	{ iata: 'MAD', name: 'Adolfo Suárez Madrid–Barajas', city: 'Madrid', country: 'Spain', tz: 'Europe/Madrid', lat: 40.47, lon: -3.56 },
	{ iata: 'BCN', name: 'Barcelona–El Prat', city: 'Barcelona', country: 'Spain', tz: 'Europe/Madrid', lat: 41.30, lon: 2.08 },
	{ iata: 'FCO', name: 'Fiumicino', city: 'Rome', country: 'Italy', tz: 'Europe/Rome', lat: 41.80, lon: 12.25 },
	{ iata: 'ZRH', name: 'Zurich', city: 'Zurich', country: 'Switzerland', tz: 'Europe/Zurich', lat: 47.46, lon: 8.55 },
	{ iata: 'LIS', name: 'Humberto Delgado', city: 'Lisbon', country: 'Portugal', tz: 'Europe/Lisbon', lat: 38.77, lon: -9.13 },
	{ iata: 'DUB', name: 'Dublin', city: 'Dublin', country: 'Ireland', tz: 'Europe/Dublin', lat: 53.43, lon: -6.27 },
	{ iata: 'CPH', name: 'Copenhagen', city: 'Copenhagen', country: 'Denmark', tz: 'Europe/Copenhagen', lat: 55.62, lon: 12.65 },
	{ iata: 'ARN', name: 'Stockholm Arlanda', city: 'Stockholm', country: 'Sweden', tz: 'Europe/Stockholm', lat: 59.65, lon: 17.92 },
	{ iata: 'OSL', name: 'Oslo Gardermoen', city: 'Oslo', country: 'Norway', tz: 'Europe/Oslo', lat: 60.19, lon: 11.10 },
	{ iata: 'HEL', name: 'Helsinki-Vantaa', city: 'Helsinki', country: 'Finland', tz: 'Europe/Helsinki', lat: 60.32, lon: 24.96 },
	{ iata: 'VIE', name: 'Vienna Intl', city: 'Vienna', country: 'Austria', tz: 'Europe/Vienna', lat: 48.11, lon: 16.57 },
	{ iata: 'ATH', name: 'Athens Intl', city: 'Athens', country: 'Greece', tz: 'Europe/Athens', lat: 37.94, lon: 23.94 },
	{ iata: 'IST', name: 'Istanbul', city: 'Istanbul', country: 'Turkey', tz: 'Europe/Istanbul', lat: 41.26, lon: 28.74 },
	{ iata: 'SVO', name: 'Sheremetyevo', city: 'Moscow', country: 'Russia', tz: 'Europe/Moscow', lat: 55.97, lon: 37.41 },
	{ iata: 'KEF', name: 'Keflavík Intl', city: 'Reykjavik', country: 'Iceland', tz: 'Atlantic/Reykjavik', lat: 63.99, lon: -22.62 },

	// Africa & Middle East
	{ iata: 'CAI', name: 'Cairo Intl', city: 'Cairo', country: 'Egypt', tz: 'Africa/Cairo', lat: 30.11, lon: 31.41 },
	{ iata: 'JNB', name: 'O. R. Tambo Intl', city: 'Johannesburg', country: 'South Africa', tz: 'Africa/Johannesburg', lat: -26.14, lon: 28.25 },
	{ iata: 'CPT', name: 'Cape Town Intl', city: 'Cape Town', country: 'South Africa', tz: 'Africa/Johannesburg', lat: -33.97, lon: 18.60 },
	{ iata: 'LOS', name: 'Murtala Muhammed Intl', city: 'Lagos', country: 'Nigeria', tz: 'Africa/Lagos', lat: 6.58, lon: 3.32 },
	{ iata: 'NBO', name: 'Jomo Kenyatta Intl', city: 'Nairobi', country: 'Kenya', tz: 'Africa/Nairobi', lat: -1.32, lon: 36.93 },
	{ iata: 'DXB', name: 'Dubai Intl', city: 'Dubai', country: 'UAE', tz: 'Asia/Dubai', lat: 25.25, lon: 55.36 },
	{ iata: 'DOH', name: 'Hamad Intl', city: 'Doha', country: 'Qatar', tz: 'Asia/Qatar', lat: 25.27, lon: 51.61 },
	{ iata: 'RUH', name: 'King Khalid Intl', city: 'Riyadh', country: 'Saudi Arabia', tz: 'Asia/Riyadh', lat: 24.96, lon: 46.70 },
	{ iata: 'TLV', name: 'Ben Gurion', city: 'Tel Aviv', country: 'Israel', tz: 'Asia/Jerusalem', lat: 32.01, lon: 34.89 },
	{ iata: 'IKA', name: 'Imam Khomeini Intl', city: 'Tehran', country: 'Iran', tz: 'Asia/Tehran', lat: 35.42, lon: 51.15 },

	// Asia
	{ iata: 'DEL', name: 'Indira Gandhi Intl', city: 'Delhi', country: 'India', tz: 'Asia/Kolkata', lat: 28.56, lon: 77.10 },
	{ iata: 'BOM', name: 'Chhatrapati Shivaji Intl', city: 'Mumbai', country: 'India', tz: 'Asia/Kolkata', lat: 19.09, lon: 72.87 },
	{ iata: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'Thailand', tz: 'Asia/Bangkok', lat: 13.69, lon: 100.75 },
	{ iata: 'SIN', name: 'Changi', city: 'Singapore', country: 'Singapore', tz: 'Asia/Singapore', lat: 1.36, lon: 103.99 },
	{ iata: 'KUL', name: 'Kuala Lumpur Intl', city: 'Kuala Lumpur', country: 'Malaysia', tz: 'Asia/Kuala_Lumpur', lat: 2.75, lon: 101.71 },
	{ iata: 'CGK', name: 'Soekarno-Hatta Intl', city: 'Jakarta', country: 'Indonesia', tz: 'Asia/Jakarta', lat: -6.13, lon: 106.66 },
	{ iata: 'HKG', name: 'Hong Kong Intl', city: 'Hong Kong', country: 'Hong Kong', tz: 'Asia/Hong_Kong', lat: 22.31, lon: 113.91 },
	{ iata: 'PVG', name: 'Shanghai Pudong Intl', city: 'Shanghai', country: 'China', tz: 'Asia/Shanghai', lat: 31.14, lon: 121.81 },
	{ iata: 'PEK', name: 'Beijing Capital Intl', city: 'Beijing', country: 'China', tz: 'Asia/Shanghai', lat: 40.08, lon: 116.58 },
	{ iata: 'CAN', name: 'Guangzhou Baiyun Intl', city: 'Guangzhou', country: 'China', tz: 'Asia/Shanghai', lat: 23.39, lon: 113.30 },
	{ iata: 'TPE', name: 'Taoyuan Intl', city: 'Taipei', country: 'Taiwan', tz: 'Asia/Taipei', lat: 25.08, lon: 121.23 },
	{ iata: 'NRT', name: 'Narita Intl', city: 'Tokyo', country: 'Japan', tz: 'Asia/Tokyo', lat: 35.77, lon: 140.39 },
	{ iata: 'HND', name: 'Haneda', city: 'Tokyo', country: 'Japan', tz: 'Asia/Tokyo', lat: 35.55, lon: 139.78 },
	{ iata: 'ICN', name: 'Incheon Intl', city: 'Seoul', country: 'South Korea', tz: 'Asia/Seoul', lat: 37.46, lon: 126.44 },
	{ iata: 'MNL', name: 'Ninoy Aquino Intl', city: 'Manila', country: 'Philippines', tz: 'Asia/Manila', lat: 14.51, lon: 121.02 },

	// Oceania
	{ iata: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia', tz: 'Australia/Sydney', lat: -33.94, lon: 151.18 },
	{ iata: 'MEL', name: 'Melbourne', city: 'Melbourne', country: 'Australia', tz: 'Australia/Melbourne', lat: -37.67, lon: 144.84 },
	{ iata: 'BNE', name: 'Brisbane', city: 'Brisbane', country: 'Australia', tz: 'Australia/Brisbane', lat: -27.38, lon: 153.12 },
	{ iata: 'PER', name: 'Perth', city: 'Perth', country: 'Australia', tz: 'Australia/Perth', lat: -31.94, lon: 115.97 },
	{ iata: 'AKL', name: 'Auckland', city: 'Auckland', country: 'New Zealand', tz: 'Pacific/Auckland', lat: -37.01, lon: 174.79 },
	{ iata: 'NAN', name: 'Nadi Intl', city: 'Nadi', country: 'Fiji', tz: 'Pacific/Fiji', lat: -17.76, lon: 177.44 }
];

const BY_IATA = new Map(AIRPORTS.map((a) => [a.iata, a]));

export function findAirport(iata: string): Airport | undefined {
	return BY_IATA.get(iata.toUpperCase());
}

/** Fuzzy search over IATA / city / name / country. Returns up to `limit` matches. */
export function searchAirports(query: string, limit = 8): Airport[] {
	const q = query.trim().toLowerCase();
	if (!q) return [];
	const scored: { a: Airport; score: number }[] = [];
	for (const a of AIRPORTS) {
		const iata = a.iata.toLowerCase();
		const city = a.city.toLowerCase();
		const name = a.name.toLowerCase();
		const country = a.country.toLowerCase();
		let score = -1;
		if (iata === q) score = 100;
		else if (city === q) score = 90;
		else if (iata.startsWith(q)) score = 80;
		else if (city.startsWith(q)) score = 70;
		else if (city.includes(q)) score = 50;
		else if (name.includes(q)) score = 40;
		else if (country.includes(q)) score = 20;
		if (score >= 0) scored.push({ a, score });
	}
	scored.sort((x, y) => y.score - x.score || x.a.city.localeCompare(y.a.city));
	return scored.slice(0, limit).map((s) => s.a);
}
