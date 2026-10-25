import { memo } from "react";
import { Circle, G, Line, Path } from "react-native-svg";

import { SunTimes, daylightProgress } from "@/src/solar/sun";
import { useTheme } from "@/src/theme";

const point = (fraction: number, radius: number) => ({
  x: 180 + Math.sin(fraction * 2 * Math.PI) * radius,
  y: 180 + Math.cos(fraction * 2 * Math.PI) * radius,
});

function mix(a: string, b: string, amount: number) {
  const channel = (offset: number) => Math.round(
    parseInt(a.slice(offset, offset + 2), 16) * (1 - amount) + parseInt(b.slice(offset, offset + 2), 16) * amount,
  ).toString(16).padStart(2, "0");
  return `#${channel(1)}${channel(3)}${channel(5)}`;
}

// Static between location/date changes; the clock's fast hands need not rebuild
// the segmented conic gradient. Split exactly at both horizon crossings.
export const DaylightRim = memo(function DaylightRim({ times }: { times: SunTimes | null }) {
  const { colors } = useTheme();
  if (!times) return <Circle cx={180} cy={180} r={143} stroke={colors.borderStrong} strokeWidth={10} strokeDasharray="2 4" fill="none" />;
  const stops = Array.from({ length: 241 }, (_, i) => i / 240);
  if (times.kind === "normal") stops.push(times.sunriseFraction, times.sunsetFraction);
  const boundaries = [...new Set(stops)].sort((a, b) => a - b);
  return (
    <G testID="daylight-rim">
      {boundaries.slice(0, -1).map((start, i) => {
        const end = boundaries[i + 1];
        const { daylight, progress } = daylightProgress((start + end) / 2, times);
        const palette = daylight
          ? [colors.solarDawn, colors.solarDay, colors.solarDusk]
          : [colors.solarTwilight, colors.solarNight, colors.solarPredawn];
        const color = progress < 0.5 ? mix(palette[0], palette[1], progress * 2) : mix(palette[1], palette[2], (progress - 0.5) * 2);
        const a = point(start, 143);
        // Overlap adjacent strokes slightly to avoid antialiased hairline seams,
        // but never soften the exact sunrise/sunset boundary.
        const limit = times.kind === "normal"
          ? Math.min(...[times.sunriseFraction, times.sunsetFraction, 1].filter((f) => f >= end))
          : 1;
        const b = point(Math.min(end + 0.001, limit), 143);
        return <Path key={i} d={`M ${a.x} ${a.y} A 143 143 0 0 0 ${b.x} ${b.y}`} stroke={color} strokeWidth={10} fill="none" />;
      })}
      {times.kind === "normal" && [times.sunriseFraction, times.sunsetFraction].map((fraction, i) => {
        const a = point(fraction, 136);
        const b = point(fraction, 151);
        return (
          <G key={i} testID={i === 0 ? "sunrise-marker" : "sunset-marker"}>
            <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={colors.surface} strokeWidth={5} />
            <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={colors.onSurface} strokeWidth={2} />
          </G>
        );
      })}
    </G>
  );
});
