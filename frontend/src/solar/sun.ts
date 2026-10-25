// Sunrise/sunset at a standard apparent solar altitude of -0.833° (sea level).
// Julian-cycle equations from https://en.wikipedia.org/wiki/Sunrise_equation.
// These are local estimates; terrain and atmospheric conditions can shift them.
export type SolarLocation = {
  name: string;
  latitude: number;
  longitude: number;
  timeZone: string;
};

export type SunTimes =
  | { kind: "normal"; sunrise: Date; sunset: Date; sunriseFraction: number; sunsetFraction: number }
  | { kind: "polar-day" | "polar-night" };

const DAY_MS = 86_400_000;
const J2000 = 2_451_545;
const DEG = Math.PI / 180;
const formatters = new Map<string, Intl.DateTimeFormat>();

export function zonedParts(date: Date, timeZone: string) {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    });
    formatters.set(timeZone, formatter);
  }
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    hours: Number(parts.hour), minutes: Number(parts.minute), seconds: Number(parts.second),
  };
}

export function isSolarLocation(value: unknown): value is SolarLocation {
  if (!value || typeof value !== "object") return false;
  const v = value as SolarLocation;
  if (typeof v.name !== "string" || !v.name.trim() || typeof v.timeZone !== "string"
    || !Number.isFinite(v.latitude) || Math.abs(v.latitude) > 90
    || !Number.isFinite(v.longitude) || Math.abs(v.longitude) > 180) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: v.timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export function getSunTimes(day: string, location: SolarLocation): SunTimes {
  if (!isSolarLocation(location) || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new Error("A valid date, coordinates and time zone are required.");
  }
  // Anchor the solar cycle at local noon, including date-line and DST offsets.
  const noon = Date.parse(`${day}T12:00:00Z`);
  let localNoon = noon;
  for (let i = 0; i < 2; i++) {
    const p = zonedParts(new Date(localNoon), location.timeZone);
    const wall = Date.parse(`${p.day}T${String(p.hours).padStart(2, "0")}:${String(p.minutes).padStart(2, "0")}:${String(p.seconds).padStart(2, "0")}Z`);
    localNoon += noon - wall;
  }
  const lw = -location.longitude * DEG;
  const phi = location.latitude * DEG;
  const d = localNoon / DAY_MS + 2_440_587.5 - J2000;
  const cycle = Math.round(d - 0.0009 - lw / (2 * Math.PI));
  const ds = 0.0009 + lw / (2 * Math.PI) + cycle;
  const anomaly = DEG * (357.5291 + 0.98560028 * ds);
  const center = DEG * (1.9148 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly) + 0.0003 * Math.sin(3 * anomaly));
  const longitude = anomaly + center + DEG * 102.9372 + Math.PI;
  const declination = Math.asin(Math.sin(longitude) * Math.sin(DEG * 23.4397));
  const transit = J2000 + ds + 0.0053 * Math.sin(anomaly) - 0.0069 * Math.sin(2 * longitude);
  const cosHourAngle = (Math.sin(-0.833 * DEG) - Math.sin(phi) * Math.sin(declination))
    / (Math.cos(phi) * Math.cos(declination));
  if (cosHourAngle < -1) return { kind: "polar-day" };
  if (cosHourAngle > 1) return { kind: "polar-night" };
  const hourAngle = Math.acos(cosHourAngle) / (2 * Math.PI);
  const sunrise = new Date((transit - hourAngle - 2_440_587.5) * DAY_MS);
  const sunset = new Date((transit + hourAngle - 2_440_587.5) * DAY_MS);
  const fraction = (date: Date) => {
    const p = zonedParts(date, location.timeZone);
    return (p.hours * 3600 + p.minutes * 60 + p.seconds) / 86_400;
  };
  return { kind: "normal", sunrise, sunset, sunriseFraction: fraction(sunrise), sunsetFraction: fraction(sunset) };
}

// Fractions follow the dial: midnight at the bottom, counterclockwise.
export function daylightProgress(fraction: number, times: SunTimes): { daylight: boolean; progress: number } {
  const wrap = (n: number) => ((n % 1) + 1) % 1;
  if (times.kind !== "normal") return { daylight: times.kind === "polar-day", progress: wrap(fraction) };
  const dayLength = wrap(times.sunsetFraction - times.sunriseFraction);
  const sinceRise = wrap(fraction - times.sunriseFraction);
  if (sinceRise < dayLength) return { daylight: true, progress: sinceRise / dayLength };
  return { daylight: false, progress: wrap(fraction - times.sunsetFraction) / (1 - dayLength) };
}
