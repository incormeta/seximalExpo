import { DaylightLocation } from "./daylight";

// Bundled, searchable presets: no geocoding service or network permission.
export const DAYLIGHT_CITIES: DaylightLocation[] = [
  { name: "London", latitude: 51.5074, longitude: -0.1278, timeZone: "Europe/London" },
  { name: "New York", latitude: 40.7128, longitude: -74.006, timeZone: "America/New_York" },
  { name: "Los Angeles", latitude: 34.0522, longitude: -118.2437, timeZone: "America/Los_Angeles" },
  { name: "Chicago", latitude: 41.8781, longitude: -87.6298, timeZone: "America/Chicago" },
  { name: "Denver", latitude: 39.7392, longitude: -104.9903, timeZone: "America/Denver" },
  { name: "Honolulu", latitude: 21.3099, longitude: -157.8581, timeZone: "Pacific/Honolulu" },
  { name: "Anchorage", latitude: 61.2181, longitude: -149.9003, timeZone: "America/Anchorage" },
  { name: "Toronto", latitude: 43.6532, longitude: -79.3832, timeZone: "America/Toronto" },
  { name: "Mexico City", latitude: 19.4326, longitude: -99.1332, timeZone: "America/Mexico_City" },
  { name: "São Paulo", latitude: -23.5505, longitude: -46.6333, timeZone: "America/Sao_Paulo" },
  { name: "Buenos Aires", latitude: -34.6037, longitude: -58.3816, timeZone: "America/Argentina/Buenos_Aires" },
  { name: "Paris", latitude: 48.8566, longitude: 2.3522, timeZone: "Europe/Paris" },
  { name: "Berlin", latitude: 52.52, longitude: 13.405, timeZone: "Europe/Berlin" },
  { name: "Rome", latitude: 41.9028, longitude: 12.4964, timeZone: "Europe/Rome" },
  { name: "Reykjavík", latitude: 64.1466, longitude: -21.9426, timeZone: "Atlantic/Reykjavik" },
  { name: "Tromsø", latitude: 69.6492, longitude: 18.9553, timeZone: "Europe/Oslo" },
  { name: "Longyearbyen", latitude: 78.2232, longitude: 15.6469, timeZone: "Arctic/Longyearbyen" },
  { name: "Cairo", latitude: 30.0444, longitude: 31.2357, timeZone: "Africa/Cairo" },
  { name: "Nairobi", latitude: -1.2921, longitude: 36.8219, timeZone: "Africa/Nairobi" },
  { name: "Cape Town", latitude: -33.9249, longitude: 18.4241, timeZone: "Africa/Johannesburg" },
  { name: "Dubai", latitude: 25.2048, longitude: 55.2708, timeZone: "Asia/Dubai" },
  { name: "Mumbai", latitude: 19.076, longitude: 72.8777, timeZone: "Asia/Kolkata" },
  { name: "Delhi", latitude: 28.6139, longitude: 77.209, timeZone: "Asia/Kolkata" },
  { name: "Kathmandu", latitude: 27.7172, longitude: 85.324, timeZone: "Asia/Kathmandu" },
  { name: "Singapore", latitude: 1.3521, longitude: 103.8198, timeZone: "Asia/Singapore" },
  { name: "Hong Kong", latitude: 22.3193, longitude: 114.1694, timeZone: "Asia/Hong_Kong" },
  { name: "Beijing", latitude: 39.9042, longitude: 116.4074, timeZone: "Asia/Shanghai" },
  { name: "Tokyo", latitude: 35.6762, longitude: 139.6503, timeZone: "Asia/Tokyo" },
  { name: "Sydney", latitude: -33.8688, longitude: 151.2093, timeZone: "Australia/Sydney" },
  { name: "Adelaide", latitude: -34.9285, longitude: 138.6007, timeZone: "Australia/Adelaide" },
  { name: "Auckland", latitude: -36.8509, longitude: 174.7645, timeZone: "Pacific/Auckland" },
  { name: "Kiritimati", latitude: 1.8721, longitude: -157.4278, timeZone: "Pacific/Kiritimati" },
];

export const DEFAULT_DAYLIGHT_LOCATION = DAYLIGHT_CITIES[0];

export function searchCities(query: string) {
  const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ø/g, "o").toLowerCase();
  const needle = normalize(query.trim());
  return DAYLIGHT_CITIES.filter(({ name, timeZone }) => normalize(`${name} ${timeZone}`).includes(needle));
}
