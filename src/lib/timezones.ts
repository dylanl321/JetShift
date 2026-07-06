/**
 * Common IANA timezones with display names and UTC offsets (standard time).
 * Offsets are in minutes from UTC.
 */
export interface TimezoneOption {
	iana: string;
	label: string;
	city: string;
	offsetMinutes: number; // standard offset; actual offset may differ with DST
}

export const TIMEZONES: TimezoneOption[] = [
	// Americas
	{ iana: 'America/Anchorage',        label: 'Anchorage (AKST, UTC-9)',          city: 'Anchorage',       offsetMinutes: -540 },
	{ iana: 'America/Los_Angeles',      label: 'Los Angeles / San Francisco (PST, UTC-8)', city: 'Los Angeles', offsetMinutes: -480 },
	{ iana: 'America/Denver',           label: 'Denver (MST, UTC-7)',               city: 'Denver',          offsetMinutes: -420 },
	{ iana: 'America/Phoenix',          label: 'Phoenix (MST, UTC-7, no DST)',      city: 'Phoenix',         offsetMinutes: -420 },
	{ iana: 'America/Chicago',          label: 'Chicago (CST, UTC-6)',              city: 'Chicago',         offsetMinutes: -360 },
	{ iana: 'America/New_York',         label: 'New York (EST, UTC-5)',             city: 'New York',        offsetMinutes: -300 },
	{ iana: 'America/Toronto',          label: 'Toronto (EST, UTC-5)',              city: 'Toronto',         offsetMinutes: -300 },
	{ iana: 'America/Sao_Paulo',        label: 'São Paulo (BRT, UTC-3)',            city: 'São Paulo',       offsetMinutes: -180 },
	{ iana: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (ART, UTC-3)',   city: 'Buenos Aires',    offsetMinutes: -180 },
	{ iana: 'America/Halifax',          label: 'Halifax (AST, UTC-4)',              city: 'Halifax',         offsetMinutes: -240 },
	{ iana: 'America/Vancouver',        label: 'Vancouver (PST, UTC-8)',            city: 'Vancouver',       offsetMinutes: -480 },
	{ iana: 'America/Mexico_City',      label: 'Mexico City (CST, UTC-6)',          city: 'Mexico City',     offsetMinutes: -360 },
	{ iana: 'America/Bogota',           label: 'Bogotá (COT, UTC-5)',               city: 'Bogotá',          offsetMinutes: -300 },
	{ iana: 'America/Lima',             label: 'Lima (PET, UTC-5)',                 city: 'Lima',            offsetMinutes: -300 },
	{ iana: 'America/Santiago',         label: 'Santiago (CLT, UTC-4)',             city: 'Santiago',        offsetMinutes: -240 },
	{ iana: 'Pacific/Honolulu',         label: 'Honolulu (HST, UTC-10)',            city: 'Honolulu',        offsetMinutes: -600 },

	// Europe / Africa
	{ iana: 'Atlantic/Reykjavik',       label: 'Reykjavik (GMT, UTC+0)',            city: 'Reykjavik',       offsetMinutes: 0 },
	{ iana: 'Europe/London',            label: 'London (GMT/BST, UTC+0/+1)',        city: 'London',          offsetMinutes: 0 },
	{ iana: 'Europe/Lisbon',            label: 'Lisbon (WET, UTC+0)',               city: 'Lisbon',          offsetMinutes: 0 },
	{ iana: 'Europe/Paris',             label: 'Paris / Berlin / Rome (CET, UTC+1)',city: 'Paris',           offsetMinutes: 60 },
	{ iana: 'Europe/Berlin',            label: 'Berlin (CET, UTC+1)',               city: 'Berlin',          offsetMinutes: 60 },
	{ iana: 'Europe/Madrid',            label: 'Madrid (CET, UTC+1)',               city: 'Madrid',          offsetMinutes: 60 },
	{ iana: 'Europe/Amsterdam',         label: 'Amsterdam (CET, UTC+1)',            city: 'Amsterdam',       offsetMinutes: 60 },
	{ iana: 'Europe/Rome',              label: 'Rome (CET, UTC+1)',                 city: 'Rome',            offsetMinutes: 60 },
	{ iana: 'Europe/Athens',            label: 'Athens (EET, UTC+2)',               city: 'Athens',          offsetMinutes: 120 },
	{ iana: 'Europe/Helsinki',          label: 'Helsinki (EET, UTC+2)',             city: 'Helsinki',        offsetMinutes: 120 },
	{ iana: 'Europe/Istanbul',          label: 'Istanbul (TRT, UTC+3)',             city: 'Istanbul',        offsetMinutes: 180 },
	{ iana: 'Europe/Moscow',            label: 'Moscow (MSK, UTC+3)',               city: 'Moscow',          offsetMinutes: 180 },
	{ iana: 'Africa/Cairo',             label: 'Cairo (EET, UTC+2)',                city: 'Cairo',           offsetMinutes: 120 },
	{ iana: 'Africa/Johannesburg',      label: 'Johannesburg (SAST, UTC+2)',        city: 'Johannesburg',    offsetMinutes: 120 },
	{ iana: 'Africa/Lagos',             label: 'Lagos (WAT, UTC+1)',                city: 'Lagos',           offsetMinutes: 60 },
	{ iana: 'Africa/Nairobi',           label: 'Nairobi (EAT, UTC+3)',              city: 'Nairobi',         offsetMinutes: 180 },

	// Asia / Middle East
	{ iana: 'Asia/Dubai',               label: 'Dubai (GST, UTC+4)',                city: 'Dubai',           offsetMinutes: 240 },
	{ iana: 'Asia/Karachi',             label: 'Karachi (PKT, UTC+5)',              city: 'Karachi',         offsetMinutes: 300 },
	{ iana: 'Asia/Kolkata',             label: 'Mumbai / Delhi (IST, UTC+5:30)',    city: 'Mumbai',          offsetMinutes: 330 },
	{ iana: 'Asia/Dhaka',               label: 'Dhaka (BST, UTC+6)',                city: 'Dhaka',           offsetMinutes: 360 },
	{ iana: 'Asia/Bangkok',             label: 'Bangkok / Jakarta (ICT, UTC+7)',    city: 'Bangkok',         offsetMinutes: 420 },
	{ iana: 'Asia/Shanghai',            label: 'Shanghai / Beijing (CST, UTC+8)',   city: 'Shanghai',        offsetMinutes: 480 },
	{ iana: 'Asia/Hong_Kong',           label: 'Hong Kong (HKT, UTC+8)',            city: 'Hong Kong',       offsetMinutes: 480 },
	{ iana: 'Asia/Singapore',           label: 'Singapore (SGT, UTC+8)',            city: 'Singapore',       offsetMinutes: 480 },
	{ iana: 'Asia/Taipei',              label: 'Taipei (CST, UTC+8)',               city: 'Taipei',          offsetMinutes: 480 },
	{ iana: 'Asia/Tokyo',               label: 'Tokyo (JST, UTC+9)',                city: 'Tokyo',           offsetMinutes: 540 },
	{ iana: 'Asia/Seoul',               label: 'Seoul (KST, UTC+9)',                city: 'Seoul',           offsetMinutes: 540 },
	{ iana: 'Asia/Riyadh',              label: 'Riyadh (AST, UTC+3)',               city: 'Riyadh',          offsetMinutes: 180 },
	{ iana: 'Asia/Tehran',              label: 'Tehran (IRST, UTC+3:30)',            city: 'Tehran',          offsetMinutes: 210 },
	{ iana: 'Asia/Calcutta',            label: 'Calcutta (IST, UTC+5:30)',           city: 'Calcutta',        offsetMinutes: 330 },

	// Oceania
	{ iana: 'Australia/Perth',          label: 'Perth (AWST, UTC+8)',               city: 'Perth',           offsetMinutes: 480 },
	{ iana: 'Australia/Adelaide',       label: 'Adelaide (ACST, UTC+9:30)',         city: 'Adelaide',        offsetMinutes: 570 },
	{ iana: 'Australia/Sydney',         label: 'Sydney / Melbourne (AEST, UTC+10)', city: 'Sydney',          offsetMinutes: 600 },
	{ iana: 'Pacific/Auckland',         label: 'Auckland (NZST, UTC+12)',           city: 'Auckland',        offsetMinutes: 720 },
	{ iana: 'Pacific/Fiji',             label: 'Fiji (FJT, UTC+12)',                city: 'Suva',            offsetMinutes: 720 },
];

/**
 * Get the current UTC offset in minutes for a given IANA timezone string.
 * Uses the Intl API so DST is accounted for.
 */
export function getCurrentOffsetMinutes(iana: string, date: Date = new Date()): number {
	try {
		const fmt = new Intl.DateTimeFormat('en-US', {
			timeZone: iana,
			timeZoneName: 'shortOffset'
		});
		const parts = fmt.formatToParts(date);
		const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
		// Parse "GMT+5:30" or "GMT-8" etc.
		const match = tzPart.match(/GMT([+-])(\d+)(?::(\d+))?/);
		if (!match) return 0;
		const sign = match[1] === '+' ? 1 : -1;
		const hours = parseInt(match[2], 10);
		const mins = parseInt(match[3] ?? '0', 10);
		return sign * (hours * 60 + mins);
	} catch {
		return 0;
	}
}

export function findTimezone(iana: string): TimezoneOption | undefined {
	return TIMEZONES.find((t) => t.iana === iana);
}
