# Seximal — Base-6 Utility Suite (Expo)

## Original problem statement
Build a mobile app suite for measuring, calculating and displaying values in Seximal (base 6): base-6-only calculator; base converter (seximal ↔ decimal, dozenal, binary, hex); unit converter with the given seximal units (instant, thumb, bock, fill, rapid, grav, heft, fort, presh, nerg, celce, freckle, pow) and seximal prefixes (nifa, kila, larga, mega, giga, tera, peta, exa, nivi, milli, tini, micro, nano, pico); base-6 clock; base-6 timer & stopwatch; info section. Converter inspired by iPhone "Convertible", time features inspired by iOS Clock.

## User choices
- Clock: hours = 6⁶ instants (exactly 1 h), minutes = 6⁴ instants (100 s, 36/h), seconds = 6² instants (36/min).
- Dark theme with amber accent.
- Unit converter: seximal input & output with prefix picker (decimal input toggle also provided).
- Fully offline, local history only (no backend).

## Architecture
- Expo Router, 4 tabs `(tabs)/index|convert|time|learn` (NativeTabs on iOS 26+, JS Tabs elsewhere).
- Logic: `src/seximal/base.ts` (parse/format any base), `calc.ts` (token engine, precedence), `units.ts` (categories, factors, prefixes), `time.ts` (seximal time math).
- Theme tokens in `src/theme.ts` (dark palette, Barlow Condensed / Barlow fonts via expo-font, Ionicons).
- Calculator history persisted with `@/src/utils/storage`.
- Backend untouched (unused).

## Implemented (2026-06)
- Calc: 0–5 keypad, + − × ÷, ±, ., backspace, AC, decimal hint, persisted history, error on ÷0.
- Convert › Units: 13 categories, From/To blocks with inline unit list, prefix chips for seximal units, swap, seximal/decimal keypad toggle.
- Convert › Number bases: text input with per-base validation, live results for the other 4 bases, tap result to switch base.
- Time › Clock: digital HH:MM:SS.II (base 6) + analog 36-tick dial + standard time.
- Time › Timer: seximal wheel pickers, progress ring, ends-at (seximal + standard), pause/resume/cancel, done banner.
- Time › Stopwatch: base-6 elapsed, laps with fastest/slowest tint.
- Learn: hero, intro, counting table, prefixes, time units, unit table, base cheatsheet.
- Tested by testing agent (iteration_1): all flows pass.

- Timer alarm (2026-06): looping alarm sound (expo-audio, generated `assets/sounds/alarm.wav`) + repeating vibration when done; scheduled local notification (expo-notifications) so it fires with the screen off; contextual permission card (Allow / Not now / Open Settings). Not testable on web.
- Fixed-width digit rendering (`MonoDigits`) for clock, timer and stopwatch so separators no longer jitter.
- Tested by testing agent (iteration_2): pass.

## Backlog
- P1: Multiple timers; save favourite conversions.
- P2: Seximal date/calendar, share/copy results, widget-style clock, light theme option.
