# JetShift

Jet lag management app — hyper-personalized circadian-rhythm adjustment plans with light, sleep,
caffeine and melatonin timing.

## What it does

Given your flight and a short profile, JetShift builds a day-by-day plan that shifts your body clock
to the destination timezone with the least disruption.

- **Personalized circadian model** — factors in your exact flight, sleep schedule, **chronotype**
  (morning/night person), **chronological age**, and **caffeine** sensitivity.
- **Smart shift routing** — the clock advances ~1 h/day but delays ~1.5 h/day, so for large eastward
  gaps JetShift takes the easier route (a phase *delay* the long way round) instead of a brutal
  advance.
- **Direction-aware guidance** — light-seek/avoid windows and melatonin timing follow the chosen
  shift direction (evening melatonin to advance, morning melatonin to delay).
- **Round trips** — generates an outbound and a return leg, each re-adapting to the right timezone.
- **Location picker** — choose airports on an interactive world map (real Natural Earth geometry,
  forgiving nearest-city taps on mobile), by city/airport-code autocomplete, or by **flight
  number** (live lookup when an API key is configured, graceful manual fallback otherwise). Your
  home airport is preselected from your device timezone.
- **Reminders & exports** — **calendar (.ics)** with per-event alarms, **browser notifications**
  for windows in the next 24 h, plus **CSV**, **JSON**, and a **printable / PDF** day-by-day view.
- **Mobile-first UI** — no horizontal scroll, 44 px touch targets, scrollable day tabs.

## Tech

SvelteKit + Tailwind on Cloudflare Pages, with a D1 database for saved plans.

## Develop

```bash
npm install
npm run dev
```

## Validate

```bash
npm test     # circadian-logic assertion suite
npm run check # svelte-check / TypeScript
npm run build
```

## Cloudflare setup

- D1 binding `DB` (see `wrangler.jsonc`). Apply migrations with
  `wrangler d1 migrations apply jetshift-db`.
- Optional `FLIGHT_API_KEY` (AviationStack) secret to enable live flight-number lookup.

---

Not a substitute for medical advice. Consult a physician before using melatonin.
