// Seximal time. 1 instant = 0.07716 s.
// 6^6 instants = 1 hour, 6^4 instants = 1 "new minute" (100 s), 6^2 instants = 1 "new second" (2.7̅ s).
import { pad6 } from "./base";

export const INSTANTS_PER_HOUR = 46656; // 6^6
export const INSTANTS_PER_MINUTE = 1296; // 6^4
export const INSTANTS_PER_SECOND = 36; // 6^2
export const MINUTE_MS = 100_000; // 6^4 instants
export const SECOND_MS = MINUTE_MS / 36; // 6^2 instants ≈ 2777.8 ms
export const HOUR_MS = 3_600_000;
export const INSTANT_MS = MINUTE_MS / INSTANTS_PER_MINUTE; // ≈ 77.16 ms

export type SeximalTime = {
  hours: number; // 0-23
  minutes: number; // 0-35 (new minutes)
  seconds: number; // 0-35 (new seconds)
  instants: number; // 0-35
};

export function msToSeximal(ms: number): SeximalTime {
  const clamped = Math.max(0, ms);
  const hours = Math.floor(clamped / HOUR_MS);
  const remMs = clamped - hours * HOUR_MS;
  const instantsInHour = Math.floor((remMs / HOUR_MS) * INSTANTS_PER_HOUR);
  const minutes = Math.floor(instantsInHour / INSTANTS_PER_MINUTE);
  const seconds = Math.floor((instantsInHour % INSTANTS_PER_MINUTE) / INSTANTS_PER_SECOND);
  const instants = instantsInHour % INSTANTS_PER_SECOND;
  return { hours, minutes, seconds, instants };
}

export function seximalToMs(t: { hours?: number; minutes?: number; seconds?: number; instants?: number }): number {
  return (
    (t.hours ?? 0) * HOUR_MS +
    (t.minutes ?? 0) * MINUTE_MS +
    (t.seconds ?? 0) * SECOND_MS +
    (t.instants ?? 0) * INSTANT_MS
  );
}

export function nowSeximal(date = new Date()): SeximalTime {
  const ms =
    date.getHours() * HOUR_MS +
    date.getMinutes() * 60_000 +
    date.getSeconds() * 1000 +
    date.getMilliseconds();
  return msToSeximal(ms);
}

/** "HH:MM:SS" in base-6 digits (hours two digits, max "35" = 23). */
export function formatClock(t: SeximalTime): string {
  return `${pad6(t.hours)}:${pad6(t.minutes)}:${pad6(t.seconds)}`;
}

/** Duration formatting for timer/stopwatch: H:MM:SS.II (hours only when > 0). */
export function formatDuration(ms: number, withInstants = true): string {
  const t = msToSeximal(ms);
  const core = `${pad6(t.minutes)}:${pad6(t.seconds)}`;
  const h = t.hours > 0 ? `${t.hours.toString(6)}:` : "";
  return withInstants ? `${h}${core}.${pad6(t.instants)}` : `${h}${core}`;
}

export function formatStandardClock(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, "0");
  const s = date.getSeconds().toString().padStart(2, "0");
  return `${h.toString().padStart(2, "0")}:${m}:${s}`;
}
