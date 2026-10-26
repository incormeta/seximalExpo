import assert from "node:assert/strict";
import test from "node:test";

import { calculateDaylight, isDaylightLocation, parseLocation, solarAltitude, zonedParts } from "./daylight";
import { DAYLIGHT_CITIES, searchCities } from "./daylight-locations";
import { FACES, restoredFace } from "./clock-faces";

const city = (name: string) => DAYLIGHT_CITIES.find((value) => value.name === name)!;
const HOUR = 3_600_000;

test("London solstice events match published minute-level times within two minutes", () => {
  const day = calculateDaylight("2026-06-21", city("London"));
  assert.equal(day.state, "normal");
  assert.equal(day.events.length, 2);
  for (const [index, expected] of ["2026-06-21T03:43:00Z", "2026-06-21T20:21:00Z"].entries()) {
    assert.ok(Math.abs(day.events[index].at.getTime() - Date.parse(expected)) < 120_000);
  }
  assert.ok(day.daylightMs > 16.5 * HOUR && day.daylightMs < 16.8 * HOUR);
});

test("DST dates use real civil-day boundaries and each event's local offset", () => {
  const location = city("New York");
  for (const [date, hours, offset] of [["2026-03-08", 23, -4], ["2026-11-01", 25, -5]] as const) {
    const day = calculateDaylight(date, location);
    assert.equal((day.end - day.start) / HOUR, hours);
    assert.equal(day.events.length, 2);
    for (const event of day.events) {
      const local = zonedParts(event.at, location.timeZone);
      assert.equal(local.date, date);
      const utcHours = event.at.getUTCHours() + event.at.getUTCMinutes() / 60;
      assert.ok(Math.abs(local.timeMs / HOUR - (utcHours + offset)) < 1 / 60);
      assert.equal(event.fraction, local.timeMs / (24 * HOUR));
    }
  }
  // Lord Howe's DST shift is only thirty minutes.
  const lordHowe = { name: "Lord Howe", latitude: -31.55, longitude: 159.08, timeZone: "Australia/Lord_Howe" };
  assert.equal((calculateDaylight("2026-10-04", lordHowe).end - calculateDaylight("2026-10-04", lordHowe).start) / HOUR, 23.5);
});

test("polar day/night have finite rims, no invented events, and correct durations", () => {
  for (const latitude of [69.6492, 90, -90]) {
    const location = { ...city("Tromsø"), latitude };
    const summer = calculateDaylight("2026-06-21", location);
    const winter = calculateDaylight("2026-12-21", location);
    assert.equal(summer.state, latitude > 0 ? "polar-day" : "polar-night");
    assert.equal(winter.state, latitude > 0 ? "polar-night" : "polar-day");
    for (const day of [summer, winter]) {
      assert.equal(day.events.length, 0);
      assert.equal(day.daylightMs, day.state === "polar-day" ? day.end - day.start : 0);
      assert.ok(day.altitudes.every(Number.isFinite));
      assert.equal(day.altitudes[0], day.altitudes.at(-1));
    }
  }
});

test("southern seasons, fractional offsets and the date line use the selected local date", () => {
  assert.ok(calculateDaylight("2026-12-21", city("Sydney")).daylightMs > calculateDaylight("2026-06-21", city("Sydney")).daylightMs);
  for (const name of ["Sydney", "Kathmandu", "Kiritimati", "Honolulu"]) {
    const location = city(name);
    const day = calculateDaylight("2026-06-21", location);
    assert.equal(day.events.length, 2);
    for (const event of day.events) {
      assert.equal(zonedParts(event.at, location.timeZone).date, day.date);
      assert.ok(event.at.getTime() >= day.start && event.at.getTime() < day.end);
      assert.ok(event.fraction >= 0 && event.fraction < 1);
      assert.ok(Math.abs(solarAltitude(event.at.getTime(), location.latitude, location.longitude) + 0.833) < 0.01);
    }
  }
  assert.equal(zonedParts(new Date("2026-06-21T12:00:00Z"), "Pacific/Kiritimati").date, "2026-06-22");
  assert.equal(zonedParts(new Date("2026-06-21T00:00:00Z"), "Asia/Kathmandu").timeMs / HOUR, 5.75);
});

test("a polar transition can have only one event without becoming polar day/night", () => {
  const day = calculateDaylight("2026-05-16", city("Tromsø"));
  assert.equal(day.state, "normal");
  assert.equal(day.events.length, 1);
  assert.equal(day.events[0].kind, "sunrise");
  assert.ok(day.daylightMs > 22 * HOUR && day.daylightMs < 24 * HOUR);
});

test("location storage rejects corrupt coordinates and zones, and presets work offline", () => {
  for (const location of DAYLIGHT_CITIES) assert.ok(isDaylightLocation(location));
  assert.deepEqual(parseLocation(JSON.stringify(city("London"))), city("London"));
  for (const raw of [null, "{", "null", "{}", JSON.stringify({ ...city("London"), latitude: 91 }), JSON.stringify({ ...city("London"), longitude: -181 }), JSON.stringify({ ...city("London"), timeZone: "Mars/Olympus" })]) assert.equal(parseLocation(raw), null);
  assert.equal(searchCities("tromso")[0].name, "Tromsø");
  assert.equal(searchCities("sao paulo")[0].name, "São Paulo");
});

test("Daylight leads the carousel and stored selections survive insertion", () => {
  assert.equal(FACES[0].id, "daylight");
  assert.equal(restoredFace(null, null), 0);
  assert.equal(restoredFace("daylight", 4), 0);
  for (let legacy = 0; legacy < FACES.length - 1; legacy++) assert.equal(restoredFace(null, legacy), legacy + 1);
  for (const invalid of [-1, 1.5, FACES.length - 1, "1", NaN]) assert.equal(restoredFace(null, invalid), 0);
  for (const [index, face] of FACES.entries()) assert.equal(restoredFace(String(face.id), null), index);
});
