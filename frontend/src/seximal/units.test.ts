import assert from "node:assert/strict";
import test from "node:test";

import { CATEGORIES, NO_PREFIX, PREFIXES, Unit, convertValue, unitLabel, unitSymbol } from "./units";

const relativeCloseTo = (actual: number, expected: number, tolerance = 1e-10) => {
  const scale = Math.max(1, Math.abs(actual), Math.abs(expected));
  assert.ok(Math.abs(actual - expected) <= tolerance * scale, `${actual} should be close to ${expected}`);
};

const unit = (categoryId: string, unitId: string): Unit => {
  const category = CATEGORIES.find(({ id }) => id === categoryId);
  assert.ok(category, `missing category ${categoryId}`);
  const match = category.units.find(({ id }) => id === unitId);
  assert.ok(match, `missing unit ${categoryId}.${unitId}`);
  return match;
};

test("every category has unique, valid units", () => {
  const categoryIds = new Set<string>();
  for (const category of CATEGORIES) {
    assert.ok(!categoryIds.has(category.id), `duplicate category id ${category.id}`);
    categoryIds.add(category.id);
    assert.ok(category.units.length >= 2, `${category.name} needs at least two units`);

    const unitIds = new Set<string>();
    for (const candidate of category.units) {
      assert.ok(!unitIds.has(candidate.id), `duplicate unit id ${category.id}.${candidate.id}`);
      unitIds.add(candidate.id);
      assert.ok(candidate.name.length > 0);
      assert.ok(candidate.symbol.length > 0);
      assert.ok(Number.isFinite(candidate.factor) && candidate.factor > 0, `invalid factor for ${candidate.id}`);
    }
  }
});

test("all units round-trip through every other unit in their category", () => {
  for (const category of CATEGORIES) {
    for (const from of category.units) {
      for (const to of category.units) {
        for (const value of [-12.5, 0, 123.456]) {
          const converted = convertValue(value, from, NO_PREFIX, to, NO_PREFIX);
          const roundTrip = convertValue(converted, to, NO_PREFIX, from, NO_PREFIX);
          relativeCloseTo(roundTrip, value, 1e-9);
        }
      }
    }
  }
});

test("seximal magnitude prefixes scale and round-trip correctly", () => {
  for (const category of CATEGORIES) {
    const seximalUnit = category.units.find(({ seximal }) => seximal);
    assert.ok(seximalUnit, `${category.name} is missing its seximal unit`);
    const standardUnit = category.units.find(({ seximal }) => !seximal);
    assert.ok(standardUnit, `${category.name} is missing a standard unit`);

    for (const prefix of PREFIXES) {
      const converted = convertValue(2.5, seximalUnit, prefix, standardUnit, NO_PREFIX);
      const roundTrip = convertValue(converted, standardUnit, NO_PREFIX, seximalUnit, prefix);
      relativeCloseTo(roundTrip, 2.5, 1e-9);
    }
  }
});

test("common SI and US customary reference conversions are accurate", () => {
  relativeCloseTo(convertValue(1, unit("length", "mi"), NO_PREFIX, unit("length", "km"), NO_PREFIX), 1.609344);
  relativeCloseTo(convertValue(1, unit("area", "acre"), NO_PREFIX, unit("area", "ft2"), NO_PREFIX), 43560);
  relativeCloseTo(convertValue(1, unit("volume", "ft3"), NO_PREFIX, unit("volume", "l"), NO_PREFIX), 28.316846592);
  relativeCloseTo(convertValue(1, unit("volume", "gal"), NO_PREFIX, unit("volume", "floz"), NO_PREFIX), 128);
  relativeCloseTo(convertValue(1, unit("mass", "lb"), NO_PREFIX, unit("mass", "oz"), NO_PREFIX), 16);
  relativeCloseTo(convertValue(1, unit("force", "kip"), NO_PREFIX, unit("force", "lbf"), NO_PREFIX), 1000);
  relativeCloseTo(convertValue(1, unit("pressure", "atm"), NO_PREFIX, unit("pressure", "torr"), NO_PREFIX), 760);
  relativeCloseTo(convertValue(1, unit("energy", "ftlb"), NO_PREFIX, unit("energy", "j"), NO_PREFIX), 1.3558179483314004);
  relativeCloseTo(convertValue(32, unit("temp", "f"), NO_PREFIX, unit("temp", "c"), NO_PREFIX), 0);
  relativeCloseTo(convertValue(491.67, unit("temp", "r"), NO_PREFIX, unit("temp", "c"), NO_PREFIX), 0);
});

test("seximal magnitude names and symbols are reflected in labels", () => {
  const instant = unit("time", "instant");
  const nifa = PREFIXES.find(({ name }) => name === "nifa")!;
  assert.equal(unitLabel(instant, nifa), "nifainstant");
  assert.equal(unitSymbol(instant, nifa), "nifa·inst");
  assert.equal(unitLabel(unit("time", "s"), nifa), "second");
});
