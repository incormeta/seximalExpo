import assert from "node:assert/strict";
import test from "node:test";

import { CATEGORIES, NO_PREFIX, PREFIXES, Unit, convertValue, supportsPrefixes, unitLabel, unitSymbol } from "./units";

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

test("turnforce is the torque of one fort at a perpendicular distance of one thumb", () => {
  const force = convertValue(1, unit("force", "fort"), NO_PREFIX, unit("force", "n"), NO_PREFIX);
  const leverArm = convertValue(1, unit("length", "thumb"), NO_PREFIX, unit("length", "m"), NO_PREFIX);
  const torque = convertValue(1, unit("torque", "turn"), NO_PREFIX, unit("torque", "nm"), NO_PREFIX);
  relativeCloseTo(torque, force * leverArm);
  relativeCloseTo(torque, 0.11396172346548);

  const nifa = PREFIXES.find(({ name }) => name === "nifa")!;
  const kila = PREFIXES.find(({ name }) => name === "kila")!;
  const larga = PREFIXES.find(({ name }) => name === "larga")!;
  const prefixedForce = convertValue(1, unit("force", "fort"), nifa, unit("force", "n"), NO_PREFIX);
  const prefixedArm = convertValue(1, unit("length", "thumb"), kila, unit("length", "m"), NO_PREFIX);
  relativeCloseTo(convertValue(prefixedForce * prefixedArm, unit("torque", "nm"), NO_PREFIX, unit("torque", "turn"), larga), 1);
});

test("one stream delivers one fill of liquid in one instant", () => {
  const fillLitres = convertValue(1, unit("volume", "fill"), NO_PREFIX, unit("volume", "l"), NO_PREFIX);
  const instantSeconds = convertValue(1, unit("time", "instant"), NO_PREFIX, unit("time", "s"), NO_PREFIX);
  const litresPerSecond = convertValue(1, unit("flow", "stream"), NO_PREFIX, unit("flow", "lps"), NO_PREFIX);
  relativeCloseTo(litresPerSecond * instantSeconds, fillLitres);
  relativeCloseTo(litresPerSecond, 2.57948712);

  // One stream running for a nifa-instant delivers a nifa-fill.
  const nifa = PREFIXES.find(({ name }) => name === "nifa")!;
  const elapsedSeconds = convertValue(1, unit("time", "instant"), nifa, unit("time", "s"), NO_PREFIX);
  const litresPerMinute = convertValue(1, unit("flow", "stream"), NO_PREFIX, unit("flow", "lpm"), NO_PREFIX);
  relativeCloseTo(convertValue(litresPerMinute * elapsedSeconds / 60, unit("volume", "l"), NO_PREFIX, unit("volume", "fill"), nifa), 1);
});

test("one cruise travels one thumb using one fill of fuel", () => {
  const fillGallons = convertValue(1, unit("volume", "fill"), NO_PREFIX, unit("volume", "gal"), NO_PREFIX);
  const thumbMiles = convertValue(1, unit("length", "thumb"), NO_PREFIX, unit("length", "mi"), NO_PREFIX);
  const milesPerGallon = convertValue(1, unit("fuel", "cruise"), NO_PREFIX, unit("fuel", "mpgus"), NO_PREFIX);
  // The existing miles-per-gallon conversion factor is rounded.
  relativeCloseTo(milesPerGallon * fillGallons, thumbMiles, 1e-8);
  relativeCloseTo(convertValue(1, unit("fuel", "cruise"), NO_PREFIX, unit("fuel", "kml"), NO_PREFIX), 0.00029334722372252044);

  const larga = PREFIXES.find(({ name }) => name === "larga")!;
  const distanceKm = convertValue(1, unit("length", "thumb"), larga, unit("length", "km"), NO_PREFIX);
  const fillLitres = convertValue(1, unit("volume", "fill"), NO_PREFIX, unit("volume", "l"), NO_PREFIX);
  relativeCloseTo(convertValue(1, unit("fuel", "cruise"), larga, unit("fuel", "kml"), NO_PREFIX) * fillLitres, distanceKm);
});

test("one electric cruise travels one thumb using one nerg of energy", () => {
  const energyKwh = convertValue(1, unit("energy", "nerg"), NO_PREFIX, unit("energy", "kwh"), NO_PREFIX);
  const efficiency = convertValue(1, unit("electric", "electric-cruise"), NO_PREFIX, unit("electric", "kmkwh"), NO_PREFIX);
  const distanceThumbs = convertValue(efficiency * energyKwh, unit("length", "km"), NO_PREFIX, unit("length", "thumb"), NO_PREFIX);
  relativeCloseTo(distanceThumbs, 1);
  relativeCloseTo(efficiency, 1844.4224710424708);
});

test("electric efficiency converts accurately between miles, kilometres, and SI units", () => {
  relativeCloseTo(convertValue(4, unit("electric", "mikwh"), NO_PREFIX, unit("electric", "kmkwh"), NO_PREFIX), 6.437376);
  relativeCloseTo(convertValue(1, unit("electric", "mpj"), NO_PREFIX, unit("electric", "kmkwh"), NO_PREFIX), 3600);
  relativeCloseTo(convertValue(1, unit("electric", "kmkwh"), NO_PREFIX, unit("electric", "mpj"), NO_PREFIX), 1 / 3600);
});

test("milli-electric cruise travels one thumb using one kilanerg", () => {
  const milli = PREFIXES.find(({ name }) => name === "milli")!;
  const kila = PREFIXES.find(({ name }) => name === "kila")!;
  const efficiency = convertValue(1, unit("electric", "electric-cruise"), milli, unit("electric", "kmkwh"), NO_PREFIX);
  relativeCloseTo(efficiency, 1.4231654869154866);
  const energyKwh = convertValue(1, unit("energy", "nerg"), kila, unit("energy", "kwh"), NO_PREFIX);
  relativeCloseTo(convertValue(efficiency * energyKwh, unit("length", "km"), NO_PREFIX, unit("length", "thumb"), NO_PREFIX), 1);

  // A typical 4 mi/kWh reading also converts back to the same standard value.
  const electricCruises = convertValue(4, unit("electric", "mikwh"), NO_PREFIX, unit("electric", "electric-cruise"), milli);
  relativeCloseTo(convertValue(electricCruises, unit("electric", "electric-cruise"), milli, unit("electric", "mikwh"), NO_PREFIX), 4);
});

test("one celce is the temperature rise from one nerg heating one fill of water", () => {
  const rise = convertValue(1, unit("temp", "celce"), NO_PREFIX, unit("temp", "c"), NO_PREFIX);
  const waterVolumeMl = convertValue(1, unit("volume", "fill"), NO_PREFIX, unit("volume", "ml"), NO_PREFIX);
  const energyJoules = convertValue(1, unit("energy", "nerg"), NO_PREFIX, unit("energy", "j"), NO_PREFIX);
  assert.ok(rise > 0.0001368 && rise < 0.0001369);
  // Reference liquid water has a density of 1 g/mL and heat capacity of 4.184 J/(g·°C).
  relativeCloseTo(waterVolumeMl * 4.184 * rise, energyJoules);
});

test("celce scales retain freezing-point zero and standard temperature offsets", () => {
  for (const unitId of ["celce", "aux-celce"]) {
    const temperatureUnit = unit("temp", unitId);
    relativeCloseTo(convertValue(0, temperatureUnit, NO_PREFIX, unit("temp", "c"), NO_PREFIX), 0);
    relativeCloseTo(convertValue(0, temperatureUnit, NO_PREFIX, unit("temp", "f"), NO_PREFIX), 32);
    relativeCloseTo(convertValue(0, temperatureUnit, NO_PREFIX, unit("temp", "k"), NO_PREFIX), 273.15);
    relativeCloseTo(convertValue(32, unit("temp", "f"), NO_PREFIX, temperatureUnit, NO_PREFIX), 0);
    relativeCloseTo(convertValue(273.15, unit("temp", "k"), NO_PREFIX, temperatureUnit, NO_PREFIX), 0);

    for (const celsius of [-40, 20, 100]) {
      const value = convertValue(celsius, unit("temp", "c"), NO_PREFIX, temperatureUnit, NO_PREFIX);
      relativeCloseTo(convertValue(value, temperatureUnit, NO_PREFIX, unit("temp", "f"), NO_PREFIX), celsius * 1.8 + 32);
      relativeCloseTo(convertValue(value, temperatureUnit, NO_PREFIX, unit("temp", "k"), NO_PREFIX), celsius + 273.15);
    }
  }
});

test("auxiliary celce stays at 7776 celce and ignores prefixes on either side", () => {
  const celce = unit("temp", "celce");
  const auxiliary = unit("temp", "aux-celce");
  assert.ok(supportsPrefixes(celce));
  assert.equal(supportsPrefixes(auxiliary), false);
  relativeCloseTo(convertValue(1, auxiliary, NO_PREFIX, celce, NO_PREFIX), 7776);
  const celsius = convertValue(1, auxiliary, NO_PREFIX, unit("temp", "c"), NO_PREFIX);
  assert.ok(celsius > 1.064 && celsius < 1.065);

  for (const prefix of PREFIXES) {
    relativeCloseTo(convertValue(1, auxiliary, prefix, celce, NO_PREFIX), 7776);
    relativeCloseTo(convertValue(7776, celce, NO_PREFIX, auxiliary, prefix), 1);
    relativeCloseTo(convertValue(1, auxiliary, prefix, unit("temp", "c"), NO_PREFIX), celsius);
    relativeCloseTo(convertValue(1, auxiliary, prefix, auxiliary, prefix), 1);
    // Ordinary celce still accepts prefixes when paired with the fixed auxiliary unit.
    relativeCloseTo(convertValue(1, celce, prefix, auxiliary, prefix), 6 ** prefix.power / 7776);
    relativeCloseTo(convertValue(1, auxiliary, prefix, celce, prefix), 7776 / 6 ** prefix.power);
    assert.equal(unitLabel(auxiliary, prefix), "auxiliary celce");
    assert.equal(unitSymbol(auxiliary, prefix), "°ceₐ");
  }
});

test("seximal magnitude names and symbols are reflected in labels", () => {
  const instant = unit("time", "instant");
  const nifa = PREFIXES.find(({ name }) => name === "nifa")!;
  assert.equal(unitLabel(instant, nifa), "nifainstant");
  assert.equal(unitSymbol(instant, nifa), "nifa·inst");
  assert.equal(unitLabel(unit("time", "s"), nifa), "second");
});
