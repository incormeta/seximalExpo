import { toSeximal } from "./base";
import { localDayProgress } from "./time";

export type FaceId = "daylight" | 0 | "solar" | 1 | 2 | 3 | "progress" | "hue";

// Persist stable face IDs; restoredFace migrates indices saved before Daylight.
export const FACES: { id: FaceId; name: string; description: string }[] = [
  { id: "daylight", name: "Daylight", description: "Diurnal · sunlight around your day" },
  { id: 0, name: "Face 0", description: "Diurnal · counterclockwise hours outside, minutes inside" },
  { id: "solar", name: "Solar face", description: "Diurnal · the sun marks the hour, minutes inside" },
  { id: 1, name: "Face 1", description: "Semi-diurnal · 12 hours around, thirds of an hour" },
  { id: 2, name: "Face 2", description: "Semi-diurnal · minutes outside, hours inside" },
  { id: 3, name: "Face 3", description: "Diurnal · 24-hour inner ring, minutes & seconds outside" },
  { id: "progress", name: "Progress Bars", description: "Day · hour · minute" },
  { id: "hue", name: "Hue Clock", description: "One day · one color wheel" },
];

function progressTicks(total: number) {
  return Array.from({ length: total + 1 }, (_, value) => ({
    value,
    progress: value / total,
    major: value % 6 === 0,
    label: value % 6 === 0 ? `${toSeximal(value)}₆` : undefined,
  }));
}

export const DAY_TICKS = progressTicks(24);
export const SEXIMAL_TICKS = progressTicks(36);

// Ambient color defaults; the app has no per-face settings system.
export const HUE_SATURATION = 0.72;
export const HUE_LIGHTNESS = 0.46;

export function progressToHue(progress: number): number {
  return ((progress % 1) + 1) % 1 * 360;
}

type RGB = readonly [number, number, number];

export function hslToRgb(hue: number, saturation: number, lightness: number): RGB {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const sector = ((hue % 360) + 360) % 360 / 60;
  const x = chroma * (1 - Math.abs(sector % 2 - 1));
  const offset = lightness - chroma / 2;
  const rgb: RGB = sector < 1 ? [chroma, x, 0] : sector < 2 ? [x, chroma, 0]
    : sector < 3 ? [0, chroma, x] : sector < 4 ? [0, x, chroma]
      : sector < 5 ? [x, 0, chroma] : [chroma, 0, x];
  return [rgb[0] + offset, rgb[1] + offset, rgb[2] + offset];
}

export function relativeLuminance(rgb: RGB): number {
  const linear = rgb.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

/** Choose between the theme's light/dark foregrounds using WCAG contrast. */
export function contrastingForeground(background: RGB, candidates: readonly string[]): string {
  const backgroundLuminance = relativeLuminance(background);
  const contrast = (hex: string) => {
    const channel = (start: number) => parseInt(hex.slice(start, start + 2), 16) / 255;
    const luminance = relativeLuminance([channel(1), channel(3), channel(5)]);
    return (Math.max(luminance, backgroundLuminance) + 0.05) / (Math.min(luminance, backgroundLuminance) + 0.05);
  };
  return candidates.reduce((best, candidate) => contrast(candidate) > contrast(best) ? candidate : best);
}

export function hueClockColor(date: Date) {
  const hue = progressToHue(localDayProgress(date));
  return {
    background: `hsl(${hue}, ${HUE_SATURATION * 100}%, ${HUE_LIGHTNESS * 100}%)`,
    rgb: hslToRgb(hue, HUE_SATURATION, HUE_LIGHTNESS),
  };
}

export function restoredFace(savedId: unknown, legacyIndex: unknown): number {
  const index = FACES.findIndex(({ id }) => String(id) === savedId);
  if (index >= 0) return index;
  // The old key stored an array index; inserting Daylight must not change an
  // existing user's selected face. New selections use stable IDs instead.
  return typeof legacyIndex === "number" && Number.isInteger(legacyIndex) && legacyIndex >= 0 && legacyIndex < FACES.length - 1 ? legacyIndex + 1 : 0;
}
