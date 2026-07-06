/* Validation suite for the jet-lag engine. Run: node scripts/run-ts.mjs scripts/circadian.test.ts */
import {
	generatePlan,
	generateItinerary,
	itineraryCalendarEvents,
	planCalendarEvents,
	type PlanInput
} from '../src/lib/circadian.js';

let passed = 0;
let failed = 0;
function ok(cond: boolean, msg: string) {
	if (cond) {
		passed++;
	} else {
		failed++;
		console.error('  ✗ ' + msg);
	}
}

const base: PlanInput = {
	departureTz: 'America/New_York',
	arrivalTz: 'Europe/London',
	departureDatetime: '2026-08-01T18:00',
	sleepStart: '23:00',
	sleepEnd: '07:00'
};

// 1. Eastward moderate shift (NY -> London, +5h) should ADVANCE.
{
	const p = generatePlan(base);
	ok(p.direction === 'east', 'NY->London is eastward');
	ok(p.mode === 'advance', 'NY->London moderate east => advance');
	ok(p.shiftHours < 0, 'advance => negative shiftHours');
	ok(p.days.length === p.totalDays, 'days length matches totalDays');
}

// 2. Large eastward shift (NY -> Tokyo, +13/14h) should DELAY (cheaper route).
{
	const p = generatePlan({ ...base, arrivalTz: 'Asia/Tokyo' });
	ok(p.direction === 'east', 'NY->Tokyo compass east');
	ok(p.mode === 'delay', 'NY->Tokyo large east => delay (long way round)');
	ok(p.shiftHours > 0, 'delay => positive shiftHours');
	ok(p.adjustmentDays <= 12, 'adjustment days capped');
}

// 3. Westward shift (NY -> LA, -3h) should DELAY.
{
	const p = generatePlan({ ...base, arrivalTz: 'America/Los_Angeles' });
	ok(p.direction === 'west', 'NY->LA westward');
	ok(p.mode === 'delay', 'NY->LA => delay');
}

// 4. No significant shift (NY -> Chicago is 1h; use same tz for none).
{
	const p = generatePlan({ ...base, arrivalTz: 'America/New_York' });
	ok(p.direction === 'none' && p.mode === 'none', 'same tz => no shift');
	ok(p.days.every((d) => d.melatonin === null), 'no melatonin when no shift');
}

// 5. Light direction: advance seeks light AFTER cbtmin; delay seeks BEFORE.
{
	const adv = generatePlan(base); // advance
	const del = generatePlan({ ...base, arrivalTz: 'America/Los_Angeles' }); // delay
	const dA = adv.days.find((d) => d.dayIndex === -1)!;
	const seekA = dA.light_seek[0];
	// after cbtmin => start == cbtMinLocal
	ok(seekA.startMinutes === dA.cbtMinLocal, 'advance seek-light starts at CBTmin');
	const dD = del.days.find((d) => d.dayIndex === -1)!;
	const seekD = dD.light_seek[0];
	ok(seekD.endMinutes === dD.cbtMinLocal, 'delay seek-light ends at CBTmin');
}

// 6. Melatonin timing: advance => evening (before sleep); delay => morning (after wake).
{
	const adv = generatePlan(base);
	const del = generatePlan({ ...base, arrivalTz: 'America/Los_Angeles' });
	const mA = adv.days.find((d) => d.melatonin)!;
	ok(mA.melatonin!.endMinutes === mA.sleep.startMinutes, 'advance melatonin ends at bedtime');
	const mD = del.days.find((d) => d.melatonin)!;
	ok(mD.melatonin!.startMinutes === mD.sleep.endMinutes, 'delay melatonin starts at wake');
}

// 7. Personalization: chronotype changes CBTmin offset.
{
	const early = generatePlan({ ...base, chronotype: 'early' });
	const late = generatePlan({ ...base, chronotype: 'late' });
	ok(early.profile.cbtOffsetMin > late.profile.cbtOffsetMin, 'early chronotype has larger CBT offset');
}

// 8. Caffeine sensitivity changes cutoff; "none" suppresses caffeine windows.
{
	const none = generatePlan({ ...base, caffeine: 'none' });
	ok(none.days.every((d) => d.caffeine_ok === null && d.caffeine_stop === null), 'no caffeine windows when none');
	const sensitive = generatePlan({ ...base, caffeine: 'sensitive' });
	const tolerant = generatePlan({ ...base, caffeine: 'tolerant' });
	const s = sensitive.days[0];
	const t = tolerant.days[0];
	// sensitive stops caffeine earlier relative to sleep -> longer no-caffeine window
	const sStop = s.caffeine_stop!;
	const tStop = t.caffeine_stop!;
	const sLen = ((sStop.endMinutes - sStop.startMinutes + 1440) % 1440);
	const tLen = ((tStop.endMinutes - tStop.startMinutes + 1440) % 1440);
	ok(sLen > tLen, 'sensitive => longer no-caffeine window than tolerant');
}

// 9. usesMelatonin=false suppresses melatonin.
{
	const p = generatePlan({ ...base, usesMelatonin: false });
	ok(p.days.every((d) => d.melatonin === null), 'no melatonin when usesMelatonin=false');
}

// 10. Round trip: return leg swaps tzs and shifts back.
{
	const itin = generateItinerary(base, '2026-08-10T10:00');
	ok(itin.roundTrip === true, 'round trip flagged');
	ok(itin.return !== null, 'return leg present');
	ok(itin.return!.departureTz === base.arrivalTz, 'return departs from destination');
	ok(itin.return!.arrivalTz === base.departureTz, 'return arrives home');
	// Outbound advances (east); return should delay (west back).
	ok(itin.outbound.mode === 'advance' && itin.return!.mode === 'delay', 'return leg mirrors outbound');
}

// 11. Calendar events have valid ordered absolute times and reminders.
{
	const itin = generateItinerary(base, '2026-08-10T10:00');
	const events = itineraryCalendarEvents(itin);
	ok(events.length > 0, 'calendar events generated');
	ok(events.every((e) => e.end.getTime() > e.start.getTime()), 'every event end after start');
	ok(events.every((e) => !Number.isNaN(e.start.getTime())), 'no NaN event times');
	ok(new Set(events.map((e) => e.uid)).size === events.length, 'event UIDs unique');
	// Sleep event should be ~8h.
	const sleepEv = planCalendarEvents(itin.outbound, 'out').find((e) => e.category === 'sleep')!;
	const hrs = (sleepEv.end.getTime() - sleepEv.start.getTime()) / 3600000;
	ok(Math.abs(hrs - 8) < 0.1, 'sleep event ~8h, got ' + hrs);
}

// 12. All window times are within a day and finite; no NaN leaking from bad math.
{
	const p = generatePlan({ ...base, arrivalTz: 'Australia/Sydney', age: 70, chronotype: 'early' });
	for (const d of p.days) {
		for (const w of [d.sleep, ...d.light_seek, ...d.light_avoid]) {
			ok(Number.isFinite(w.startMinutes) && Number.isFinite(w.endMinutes), 'finite window minutes');
		}
	}
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
