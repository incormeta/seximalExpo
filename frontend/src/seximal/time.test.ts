import assert from "node:assert/strict";
import test from "node:test";

import { HOUR_MS, MINUTE_MS, clockProgress, formatClock, localDayProgress, nowSeximal } from "./time";

function inTimeZone(zone: string, check: () => void) {
  const previous = process.env.TZ;
  process.env.TZ = zone;
  try { check(); } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
}

test("midnight and noon retain civil hours and existing base-six formatting", () => {
  inTimeZone("UTC", () => {
    const midnight = new Date(2026, 0, 15);
    const noon = new Date(2026, 0, 15, 12);
    assert.deepEqual(clockProgress(midnight), { day: 0, hour: 0, minute: 0 });
    assert.deepEqual(clockProgress(noon), { day: 0.5, hour: 0, minute: 0 });
    assert.equal(localDayProgress(midnight), 0);
    assert.equal(localDayProgress(noon), 0.5);
    assert.equal(formatClock(nowSeximal(midnight)), "00:00:00");
    assert.equal(formatClock(nowSeximal(noon)), "20:00:00");
  });
});

test("all progress bars approach their endpoints just before midnight, then wrap", () => {
  inTimeZone("UTC", () => {
    const before = new Date(2026, 0, 15, 23, 59, 59, 999);
    const progress = clockProgress(before);
    assert.equal(progress.day, 1 - 1 / (24 * HOUR_MS));
    assert.equal(progress.hour, 1 - 1 / HOUR_MS);
    assert.equal(progress.minute, 1 - 1 / MINUTE_MS);
    assert.equal(formatClock(nowSeximal(before)), "35:55:55");
    assert.deepEqual(clockProgress(new Date(before.getTime() + 1)), { day: 0, hour: 0, minute: 0 });
  });
});

test("bars include fractional seconds and use the existing seximal minute duration", () => {
  inTimeZone("UTC", () => {
    const date = new Date(2026, 0, 15, 6, 15, 12, 500);
    const progress = clockProgress(date);
    assert.equal(progress.day, (6 * HOUR_MS + 912_500) / (24 * HOUR_MS));
    assert.equal(progress.hour, 912_500 / HOUR_MS);
    assert.equal(progress.minute, 0.125);

    const next = new Date(date.getTime() + 1);
    // Continuous progress must change even while every displayed digit is unchanged.
    assert.deepEqual(nowSeximal(next), nowSeximal(date));
    for (const id of ["day", "hour", "minute"] as const) {
      assert.ok(clockProgress(next)[id] > progress[id]);
    }
    assert.equal(clockProgress(new Date(2026, 0, 15, 0, 0, 50)).minute, 0.5);
    assert.equal(clockProgress(new Date(2026, 0, 15, 0, 1, 40)).minute, 0);
    assert.equal(clockProgress(new Date(2026, 0, 15, 0, 30)).hour, 0.5);
  });
});

test("local device time is respected outside UTC, including fractional-hour zones", () => {
  inTimeZone("Asia/Kathmandu", () => {
    const noon = new Date("2026-01-15T06:15:00.000Z");
    assert.equal(noon.getHours(), 12);
    assert.equal(clockProgress(noon).day, 0.5);
    assert.equal(localDayProgress(noon), 0.5);
    assert.equal(formatClock(nowSeximal(noon)), "20:00:00");
  });
});

test("DST-short local days use the actual 23 hours and stay continuous across the skipped hour", () => {
  inTimeZone("America/New_York", () => {
    assert.equal(localDayProgress(new Date("2026-03-08T05:00:00Z")), 0);
    const noon = new Date("2026-03-08T12:00:00-04:00");
    assert.equal(localDayProgress(noon), 11 / 23);
    assert.equal(clockProgress(noon).day, 0.5);
    const before = new Date("2026-03-08T01:59:59.999-05:00");
    const after = new Date(before.getTime() + 1);
    assert.equal(after.getHours(), 3);
    assert.ok(Math.abs(localDayProgress(after) - localDayProgress(before) - 1 / (23 * HOUR_MS)) < 1e-15);
    assert.equal(localDayProgress(new Date("2026-03-08T23:59:59.999-04:00")), 1 - 1 / (23 * HOUR_MS));
    assert.equal(localDayProgress(new Date("2026-03-09T00:00:00-04:00")), 0);
  });
});

test("DST-long local days distinguish repeated hours and use the actual 25 hours", () => {
  inTimeZone("America/New_York", () => {
    assert.equal(localDayProgress(new Date("2026-11-01T00:00:00-04:00")), 0);
    assert.equal(localDayProgress(new Date("2026-11-01T12:00:00-05:00")), 13 / 25);
    const first = new Date("2026-11-01T01:30:00-04:00");
    const second = new Date("2026-11-01T01:30:00-05:00");
    assert.equal(localDayProgress(first), 1.5 / 25);
    assert.equal(localDayProgress(second), 2.5 / 25);
    const before = new Date("2026-11-01T01:59:59.999-04:00");
    const after = new Date(before.getTime() + 1);
    assert.equal(after.getHours(), 1);
    assert.ok(Math.abs(localDayProgress(after) - localDayProgress(before) - 1 / (25 * HOUR_MS)) < 1e-15);
    assert.equal(localDayProgress(new Date("2026-11-01T23:59:59.999-05:00")), 1 - 1 / (25 * HOUR_MS));
    assert.equal(localDayProgress(new Date("2026-11-02T00:00:00-05:00")), 0);
  });
});

test("midnight boundaries also handle a half-hour DST transition", () => {
  inTimeZone("Australia/Lord_Howe", () => {
    assert.equal(localDayProgress(new Date("2026-10-04T12:00:00+11:00")), 11.5 / 23.5);
  });
});

test("a DST change that skips midnight still ends at the next calendar midnight", () => {
  inTimeZone("America/Santiago", () => {
    const start = new Date(2026, 8, 6);
    assert.equal(start.getHours(), 1);
    assert.equal(localDayProgress(start), 0);
    assert.equal(localDayProgress(new Date(2026, 8, 6, 12)), 11 / 23);
    assert.equal(localDayProgress(new Date(2026, 8, 6, 23, 59, 59, 999)), 1 - 1 / (23 * HOUR_MS));
    assert.equal(localDayProgress(new Date(2026, 8, 7)), 0);
  });
});
