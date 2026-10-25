import assert from "node:assert/strict";
import test from "node:test";

import { SOLAR_CITIES } from "./cities";
import { daylightProgress, getSunTimes, isSolarLocation, zonedParts } from "./sun";

const city = (prefix: string) => SOLAR_CITIES.find((c) => c.name.startsWith(prefix))!;
const withinMinutes = (actual: Date, expected: string, tolerance = 5) => {
  assert.ok(Math.abs(actual.getTime() - Date.parse(expected)) < tolerance * 60_000, `${actual.toISOString()} should be within ${tolerance} minutes of ${expected}`);
};

test("New York summer-solstice sunrise and sunset match reference times", () => {
  const times = getSunTimes("2026-06-21", city("New York"));
  assert.equal(times.kind, "normal");
  if (times.kind !== "normal") return;
  withinMinutes(times.sunrise, "2026-06-21T09:25:00Z");
  withinMinutes(times.sunset, "2026-06-22T00:31:00Z");
  assert.ok(times.sunriseFraction > 5 / 24 && times.sunriseFraction < 6 / 24);
  assert.ok(times.sunsetFraction > 20 / 24 && times.sunsetFraction < 21 / 24);
});

test("sunrise and sunset stay on the selected local day across the date line", () => {
  for (const name of ["Auckland", "Sydney", "Tokyo", "Honolulu", "Anchorage"]) {
    const location = city(name);
    for (const day of ["2026-06-21", "2026-12-21"]) {
      const times = getSunTimes(day, location);
      assert.equal(times.kind, "normal");
      if (times.kind !== "normal") continue;
      assert.equal(zonedParts(times.sunrise, location.timeZone).day, day, `${name} sunrise`);
      assert.equal(zonedParts(times.sunset, location.timeZone).day, day, `${name} sunset`);
      assert.ok(times.sunset.getTime() > times.sunrise.getTime());
    }
  }
});

test("southern summer has a longer daylight arc than southern winter", () => {
  const summer = getSunTimes("2026-12-21", city("Sydney"));
  const winter = getSunTimes("2026-06-21", city("Sydney"));
  assert.equal(summer.kind, "normal");
  assert.equal(winter.kind, "normal");
  if (summer.kind !== "normal" || winter.kind !== "normal") return;
  withinMinutes(summer.sunrise, "2026-12-20T18:41:00Z");
  withinMinutes(summer.sunset, "2026-12-21T09:06:00Z");
  assert.ok(summer.sunsetFraction - summer.sunriseFraction > winter.sunsetFraction - winter.sunriseFraction);
});

test("DST changes shift clock positions while event instants remain consistent", () => {
  const location = city("New York");
  const before = getSunTimes("2026-03-07", location);
  const after = getSunTimes("2026-03-08", location);
  assert.equal(before.kind, "normal");
  assert.equal(after.kind, "normal");
  if (before.kind !== "normal" || after.kind !== "normal") return;
  assert.equal(zonedParts(before.sunrise, location.timeZone).hours, 6);
  assert.equal(zonedParts(after.sunrise, location.timeZone).hours, 7);
  assert.ok(after.sunriseFraction - before.sunriseFraction > 50 / 1440);
  assert.ok(after.sunrise.getTime() - before.sunrise.getTime() < 24 * 3_600_000);
});

test("polar days and nights have no invented sunrise or sunset", () => {
  assert.deepEqual(getSunTimes("2026-06-21", city("Tromsø")), { kind: "polar-day" });
  assert.deepEqual(getSunTimes("2026-12-21", city("Tromsø")), { kind: "polar-night" });
  assert.deepEqual(getSunTimes("2026-06-21", { ...city("Tromsø"), latitude: -90 }), { kind: "polar-night" });
  assert.deepEqual(getSunTimes("2026-12-21", { ...city("Tromsø"), latitude: -90 }), { kind: "polar-day" });
});

test("the rim switches hue families at the exact sunrise/sunset positions", () => {
  const times = getSunTimes("2026-06-21", city("London"));
  if (times.kind !== "normal") return assert.fail("Expected ordinary daylight");
  assert.equal(daylightProgress(times.sunriseFraction - 0.00001, times).daylight, false);
  assert.equal(daylightProgress(times.sunriseFraction + 0.00001, times).daylight, true);
  assert.equal(daylightProgress(times.sunsetFraction - 0.00001, times).daylight, true);
  assert.equal(daylightProgress(times.sunsetFraction + 0.00001, times).daylight, false);
  assert.equal(daylightProgress(0.5, times).daylight, true);
  assert.equal(daylightProgress(0, times).daylight, false);
  const wrapped = { ...times, sunriseFraction: 0.9, sunsetFraction: 0.2 };
  assert.equal(daylightProgress(0, wrapped).daylight, true);
  assert.equal(daylightProgress(0.5, wrapped).daylight, false);
  assert.equal(daylightProgress(0.2, { kind: "polar-day" }).daylight, true);
  assert.equal(daylightProgress(0.2, { kind: "polar-night" }).daylight, false);
});

test("stored coordinates and time zones are validated before use", () => {
  assert.ok(SOLAR_CITIES.every(isSolarLocation));
  for (const value of [null, {}, "city", { ...city("London"), latitude: 91 }, { ...city("London"), longitude: -181 }, { ...city("London"), latitude: NaN }, { ...city("London"), timeZone: "not/a-zone" }]) {
    assert.equal(isSolarLocation(value), false);
  }
  assert.throws(() => getSunTimes("2026-06-21", { ...city("London"), latitude: 100 }));
});
