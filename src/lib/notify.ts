/**
 * Client-side Web Notifications for upcoming plan events.
 *
 * The browser Notification API can only fire while a page (or its service worker) is alive, so this
 * schedules in-page timers for events happening within the next ~24 h. For reliable background
 * reminders across devices we also offer the ICS calendar export (see /plan/[id]/calendar.ics),
 * which hands scheduling off to the OS calendar. Both are surfaced in the UI.
 */
import type { CalendarEvent } from './circadian.js';

export type NotifyPermission = 'granted' | 'denied' | 'default' | 'unsupported';

/** setTimeout has a ~24.8 day (2^31 ms) ceiling; stay well under it. */
const MAX_HORIZON_MS = 24 * 60 * 60 * 1000; // only schedule the next 24h in-page

let timers: ReturnType<typeof setTimeout>[] = [];

export function notificationsSupported(): boolean {
	return typeof window !== 'undefined' && 'Notification' in window;
}

export function currentPermission(): NotifyPermission {
	if (!notificationsSupported()) return 'unsupported';
	return Notification.permission as NotifyPermission;
}

export async function requestPermission(): Promise<NotifyPermission> {
	if (!notificationsSupported()) return 'unsupported';
	try {
		return (await Notification.requestPermission()) as NotifyPermission;
	} catch {
		return currentPermission();
	}
}

/** Cancel any timers scheduled by scheduleUpcoming. */
export function clearScheduled(): void {
	for (const t of timers) clearTimeout(t);
	timers = [];
}

export interface ScheduleResult {
	scheduled: number;
	nextAt: Date | null;
}

/**
 * Schedule browser notifications for events whose reminder time falls within the next 24 h.
 * Returns how many were scheduled. Idempotent: clears previous timers first.
 */
export function scheduleUpcoming(events: CalendarEvent[], now: Date = new Date()): ScheduleResult {
	clearScheduled();
	if (currentPermission() !== 'granted') return { scheduled: 0, nextAt: null };

	const nowMs = now.getTime();
	let scheduled = 0;
	let nextAt: number | null = null;

	for (const ev of events) {
		const remindMs = ev.start.getTime() - ev.reminderMinutesBefore * 60000;
		const delay = remindMs - nowMs;
		if (delay <= 0 || delay > MAX_HORIZON_MS) continue;
		const body = ev.description;
		const timer = setTimeout(() => {
			try {
				new Notification(ev.title, { body, tag: ev.uid });
			} catch {
				/* ignore */
			}
		}, delay);
		timers.push(timer);
		scheduled++;
		if (nextAt === null || remindMs < nextAt) nextAt = remindMs;
	}

	return { scheduled, nextAt: nextAt === null ? null : new Date(nextAt) };
}

/** Fire an immediate test notification so the user can confirm it works. */
export function testNotification(): boolean {
	if (currentPermission() !== 'granted') return false;
	try {
		new Notification('JetShift reminders are on ✈️', {
			body: "You'll get nudges for light, sleep, caffeine and melatonin timing."
		});
		return true;
	} catch {
		return false;
	}
}
