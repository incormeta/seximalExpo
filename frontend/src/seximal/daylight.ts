// Offline NOAA solar-position equations. Sunrise/set use the conventional
// -0.833° apparent horizon (refraction + solar radius), at sea level.
export type DaylightLocation = { name: string; latitude: number; longitude: number; timeZone: string };
export type SunEvent = { kind: "sunrise" | "sunset"; at: Date; fraction: number };
export type Daylight = {
  date: string;
  start: number;
  end: number;
  events: SunEvent[];
  state: "normal" | "polar-day" | "polar-night";
  daylightMs: number;
  altitudes: number[];
};

const DAY = 86_400_000;
const RAD = Math.PI / 180;
const HORIZON = -0.833;
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string) {
  let value = formatters.get(timeZone);
  if (!value) {
    value = new Intl.DateTimeFormat("en-GB", {
      timeZone, calendar: "gregory", numberingSystem: "latn", hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    formatters.set(timeZone, value);
  }
  return value;
}

export function zonedParts(date: Date, timeZone: string) {
  const parts = Object.fromEntries(formatter(timeZone).formatToParts(date).map(({ type, value }) => [type, value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    timeMs: (+parts.hour * 3600 + +parts.minute * 60 + +parts.second) * 1000 + date.getUTCMilliseconds(),
  };
}

export function isTimeZone(value: string): boolean {
  try { new Intl.DateTimeFormat("en", { timeZone: value }); return value.length > 0; } catch { return false; }
}

export function isDaylightLocation(value: unknown): value is DaylightLocation {
  if (!value || typeof value !== "object") return false;
  const v = value as DaylightLocation;
  return typeof v.name === "string" && v.name.trim().length > 0 && v.name.length <= 80 &&
    typeof v.latitude === "number" && Number.isFinite(v.latitude) && Math.abs(v.latitude) <= 90 &&
    typeof v.longitude === "number" && Number.isFinite(v.longitude) && Math.abs(v.longitude) <= 180 &&
    typeof v.timeZone === "string" && isTimeZone(v.timeZone);
}

export function parseLocation(raw: unknown): DaylightLocation | null {
  try {
    const value: unknown = typeof raw === "string" ? JSON.parse(raw) : null;
    return isDaylightLocation(value) ? value : null;
  } catch { return null; }
}

// Find the actual start of a civil date, including offset changes at midnight.
// A civil day may be 23, 24, 25 (or even 23.5) hours long.
function dateBoundary(date: string, timeZone: string): number {
  const center = Date.parse(`${date}T00:00:00Z`);
  let lo = center - 36 * 3_600_000;
  let hi = center + 36 * 3_600_000;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (zonedParts(new Date(mid), timeZone).date < date) lo = mid;
    else hi = mid;
  }
  return hi;
}

export function solarAltitude(at: number, latitude: number, longitude: number): number {
  const t = (at / DAY + 2440587.5 - 2451545) / 36525;
  const meanLongitude = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
  const anomaly = (357.52911 + t * (35999.05029 - 0.0001537 * t)) * RAD;
  const eccentricity = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const center = Math.sin(anomaly) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * anomaly) * (0.019993 - 0.000101 * t) + Math.sin(3 * anomaly) * 0.000289;
  const omega = (125.04 - 1934.136 * t) * RAD;
  const apparentLongitude = (meanLongitude + center - 0.00569 - 0.00478 * Math.sin(omega)) * RAD;
  const obliquity = (23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(omega)) * RAD;
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(apparentLongitude));
  const y = Math.tan(obliquity / 2) ** 2;
  const l = meanLongitude * RAD;
  const equation = 4 / RAD * (y * Math.sin(2 * l) - 2 * eccentricity * Math.sin(anomaly) +
    4 * eccentricity * y * Math.sin(anomaly) * Math.cos(2 * l) -
    0.5 * y * y * Math.sin(4 * l) - 1.25 * eccentricity ** 2 * Math.sin(2 * anomaly));
  const utcMinutes = ((at % DAY) + DAY) % DAY / 60_000;
  const solarMinutes = ((utcMinutes + equation + 4 * longitude) % 1440 + 1440) % 1440;
  const hourAngle = (solarMinutes / 4 - 180) * RAD;
  const lat = latitude * RAD;
  const sine = Math.sin(lat) * Math.sin(declination) + Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle);
  return Math.asin(Math.max(-1, Math.min(1, sine))) / RAD;
}

export function calculateDaylight(date: string, location: DaylightLocation): Daylight {
  const { latitude, longitude, timeZone } = location;
  const start = dateBoundary(date, timeZone);
  const tomorrow = new Date(Date.parse(`${date}T00:00:00Z`) + DAY).toISOString().slice(0, 10);
  const end = dateBoundary(tomorrow, timeZone);
  const altitude = (at: number) => solarAltitude(at, latitude, longitude);
  const events: SunEvent[] = [];
  let previous = start;
  let above = altitude(start) >= HORIZON;
  let dayStart = above ? start : null;
  let daylightMs = 0;

  // Bracket crossings on the actual UTC timeline, then refine to <1 second.
  // This also handles dates with only one rise/set near the polar seasons.
  for (let at = start + 60_000; previous < end; at += 60_000) {
    const next = Math.min(at, end);
    const nextAbove = altitude(next) >= HORIZON;
    if (nextAbove !== above) {
      let lo = previous;
      let hi = next;
      while (hi - lo > 250) {
        const mid = (lo + hi) / 2;
        if ((altitude(mid) >= HORIZON) === above) lo = mid;
        else hi = mid;
      }
      const crossing = Math.round((lo + hi) / 2);
      if (crossing < end) {
        events.push({ kind: nextAbove ? "sunrise" : "sunset", at: new Date(crossing), fraction: zonedParts(new Date(crossing), timeZone).timeMs / DAY });
      }
      if (nextAbove) dayStart = crossing;
      else if (dayStart !== null) { daylightMs += crossing - dayStart; dayStart = null; }
      above = nextAbove;
    }
    previous = next;
  }
  if (dayStart !== null) daylightMs += end - dayStart;

  // Sample by wall-clock position, so the sun and event markers share the same
  // counterclockwise 24-hour dial even on DST days. In a skipped/repeated hour
  // the rim interpolates smoothly; event times always use their actual offset.
  const midnight = Date.parse(`${date}T00:00:00Z`);
  const altitudes = Array.from({ length: 97 }, (_, i) => {
    const wall = midnight + (i % 96) / 96 * DAY;
    let instant = start + (i % 96) / 96 * DAY;
    for (let pass = 0; pass < 3; pass++) {
      const parts = zonedParts(new Date(instant), timeZone);
      const shown = Date.parse(`${parts.date}T00:00:00Z`) + parts.timeMs;
      instant += wall - shown;
    }
    return altitude(instant);
  });
  return { date, start, end, events, daylightMs, altitudes,
    state: events.length ? "normal" : daylightMs > 0 ? "polar-day" : "polar-night" };
}

export function formatSunTime(at: Date, timeZone: string): string {
  return new Intl.DateTimeFormat(undefined, { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(at);
}

export function daylightDuration(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
