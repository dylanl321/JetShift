/**
 * Minimal, dependency-free iCalendar (RFC 5545) generator.
 *
 * We emit UTC timestamps (DTSTART/DTEND in Z form) so no VTIMEZONE block is needed and the events
 * land at the correct wall-clock time in any calendar app. Each event carries a VALARM so the
 * user's phone/desktop fires a native notification — the most reliable cross-platform "reminder".
 */
import type { CalendarEvent } from './circadian.js';

function pad(n: number): string {
	return String(n).padStart(2, '0');
}

/** Format a Date as an RFC 5545 UTC timestamp: YYYYMMDDTHHMMSSZ */
function toIcsUtc(d: Date): string {
	return (
		`${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
		`T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
	);
}

/** Escape text per RFC 5545 (commas, semicolons, backslashes, newlines). */
function esc(text: string): string {
	return text
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\r?\n/g, '\\n');
}

/** Fold long lines to 75 octets per RFC 5545 (approximated by characters, adequate for ASCII). */
function fold(line: string): string {
	if (line.length <= 73) return line;
	const parts: string[] = [];
	let rest = line;
	parts.push(rest.slice(0, 73));
	rest = rest.slice(73);
	while (rest.length > 72) {
		parts.push(' ' + rest.slice(0, 72));
		rest = rest.slice(72);
	}
	if (rest.length) parts.push(' ' + rest);
	return parts.join('\r\n');
}

export function buildIcs(events: CalendarEvent[], calendarName: string): string {
	const now = toIcsUtc(new Date());
	const lines: string[] = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//JetShift//Jet Lag Plan//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		`X-WR-CALNAME:${esc(calendarName)}`
	];

	for (const ev of events) {
		lines.push('BEGIN:VEVENT');
		lines.push(`UID:${esc(ev.uid)}@jetshift`);
		lines.push(`DTSTAMP:${now}`);
		lines.push(`DTSTART:${toIcsUtc(ev.start)}`);
		lines.push(`DTEND:${toIcsUtc(ev.end)}`);
		lines.push(fold(`SUMMARY:${esc(ev.title)}`));
		lines.push(fold(`DESCRIPTION:${esc(ev.description)}`));
		lines.push(`CATEGORIES:${esc(ev.category.toUpperCase())}`);
		if (ev.reminderMinutesBefore > 0) {
			lines.push('BEGIN:VALARM');
			lines.push('ACTION:DISPLAY');
			lines.push(fold(`DESCRIPTION:${esc(ev.title)}`));
			lines.push(`TRIGGER:-PT${ev.reminderMinutesBefore}M`);
			lines.push('END:VALARM');
		}
		lines.push('END:VEVENT');
	}

	lines.push('END:VCALENDAR');
	return lines.join('\r\n') + '\r\n';
}
