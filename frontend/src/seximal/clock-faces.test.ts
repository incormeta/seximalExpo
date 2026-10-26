import assert from "node:assert/strict";
import test from "node:test";

import { DAY_TICKS, FACES, HUE_LIGHTNESS, HUE_SATURATION, SEXIMAL_TICKS, contrastingForeground, hslToRgb, hueClockColor, progressToHue, relativeLuminance, restoredFace } from "./clock-faces";

test("Daylight leads the carousel while all legacy face selections migrate", () => {
  const legacy = [0, "solar", 1, 2, 3, "progress", "hue"];
  assert.deepEqual(FACES.map(({ id }) => id), ["daylight", ...legacy]);
  for (const [index, id] of legacy.entries()) assert.equal(FACES[restoredFace(null, index)].id, id);
  assert.equal(new Set(FACES.map(({ id }) => id)).size, FACES.length);
});

test("day scale has hourly ticks and stronger, base-six-labelled quarter-day divisions", () => {
  assert.equal(DAY_TICKS.length, 25);
  const majors = DAY_TICKS.filter(({ major }) => major);
  assert.deepEqual(majors.map(({ label }) => label), ["0₆", "10₆", "20₆", "30₆", "40₆"]);
  assert.deepEqual(majors.map(({ progress }) => progress), [0, 0.25, 0.5, 0.75, 1]);
  assert.ok(DAY_TICKS.filter(({ major }) => !major).every(({ label }) => label === undefined));
});

test("hour and minute scales have six major seximal divisions and unlabelled minor ticks", () => {
  assert.equal(SEXIMAL_TICKS.length, 37);
  const majors = SEXIMAL_TICKS.filter(({ major }) => major);
  assert.deepEqual(majors.map(({ label }) => label), ["0₆", "10₆", "20₆", "30₆", "40₆", "50₆", "100₆"]);
  assert.deepEqual(majors.map(({ value }) => value), [0, 6, 12, 18, 24, 30, 36]);
  assert.equal(majors[majors.length - 1].progress, 1);
  assert.ok(SEXIMAL_TICKS.filter(({ major }) => !major).every(({ label }) => label === undefined));
});

test("hue spans one full wheel and wraps continuously at the next midnight", () => {
  for (const [progress, hue] of [[0, 0], [0.25, 90], [0.5, 180], [0.75, 270], [1, 0], [1.25, 90], [-0.25, 270]]) {
    assert.equal(progressToHue(progress), hue);
  }
  const midnight = new Date(2026, 0, 15);
  const before = new Date(midnight.getTime() - 1);
  const beforeColor = hueClockColor(before).rgb;
  const afterColor = hueClockColor(midnight).rgb;
  for (let channel = 0; channel < 3; channel++) {
    assert.ok(Math.abs(beforeColor[channel] - afterColor[channel]) < 1e-6);
  }
  assert.equal(hueClockColor(new Date(2026, 0, 15, 12)).background, "hsl(180, 72%, 46%)");
  const frame = new Date(midnight.getTime() + 16);
  assert.notEqual(hueClockColor(midnight).background, hueClockColor(frame).background);
});

test("relative luminance linearizes sRGB and foreground maximizes actual contrast throughout the wheel", () => {
  assert.equal(relativeLuminance([0, 0, 0]), 0);
  assert.equal(relativeLuminance([1, 1, 1]), 1);
  assert.ok(Math.abs(relativeLuminance([0.5, 0.5, 0.5]) - 0.21404114048223255) < 1e-12);
  const light = "#FAFAFA";
  const dark = "#09090B";
  const luminance: Record<string, number> = { [light]: relativeLuminance([250 / 255, 250 / 255, 250 / 255]), [dark]: relativeLuminance([9 / 255, 9 / 255, 11 / 255]) };
  for (let hue = 0; hue < 360; hue += 0.5) {
    const rgb = hslToRgb(hue, HUE_SATURATION, HUE_LIGHTNESS);
    const background = relativeLuminance(rgb);
    const contrast = (candidate: string) => (Math.max(background, luminance[candidate]) + 0.05) / (Math.min(background, luminance[candidate]) + 0.05);
    const chosen = contrastingForeground(rgb, [light, dark]);
    assert.ok(contrast(chosen) >= contrast(chosen === light ? dark : light));
    assert.ok(contrast(chosen) > 4.3, `contrast at hue ${hue}`);
  }
});
