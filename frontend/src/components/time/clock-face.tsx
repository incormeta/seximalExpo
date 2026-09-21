import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";

import { SeximalTime } from "@/src/seximal/time";
import { fonts, useTheme } from "@/src/theme";

export type FaceId = 1 | 2 | 3;

export const FACES: { id: FaceId; name: string; description: string }[] = [
  { id: 1, name: "Face 1", description: "Semi-diurnal · 12 hours around, thirds of an hour" },
  { id: 2, name: "Face 2", description: "Semi-diurnal · minutes outside, hours inside" },
  { id: 3, name: "Face 3", description: "Diurnal · 24-hour inner ring, minutes & seconds outside" },
];

type Props = { face: FaceId; size: number; time: SeximalTime };

const rad = (frac: number) => frac * Math.PI * 2 - Math.PI / 2;
const pt = (c: number, frac: number, dist: number) => ({
  x: c + Math.cos(rad(frac)) * dist,
  y: c + Math.sin(rad(frac)) * dist,
});

export function ClockFace({ face, size, time: t }: Props) {
  const { colors } = useTheme();
  const c = size / 2;
  const r = c - 44;
  const ri = r * 0.6;

  const minFrac = (t.minutes + t.seconds / 36 + t.instants / 1296) / 36;
  const secFrac = (t.seconds + t.instants / 36) / 36;
  const hourFrac =
    face === 3 ? (t.hours + minFrac) / 24 : ((t.hours % 12) + minFrac) / 12;

  const tick = (key: string, frac: number, from: number, to: number, color: string, width: number) => {
    const a = pt(c, frac, from);
    const b = pt(c, frac, to);
    return <Line key={key} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={width} strokeLinecap="round" />;
  };
  const label = (key: string, frac: number, dist: number, text: string, color: string, fontSize = 17) => {
    const p = pt(c, frac, dist);
    return (
      <SvgText
        key={key}
        x={p.x}
        y={p.y + fontSize * 0.36}
        fill={color}
        fontSize={fontSize}
        fontFamily={fonts.textMedium}
        textAnchor="middle"
      >
        {text}
      </SvgText>
    );
  };

  const elements: React.ReactNode[] = [];

  if (face === 1) {
    // 12 hours around; 36 ticks (major every hour, two minor ticks per hour). Labels outside.
    for (let i = 0; i < 36; i++) {
      const major = i % 3 === 0;
      elements.push(
        tick(`t${i}`, i / 36, major ? r - 22 : r - 10, r - 1, major ? colors.onSurface : colors.borderStrong, major ? 2.5 : 1),
      );
    }
    for (let h = 0; h < 12; h++) elements.push(label(`l${h}`, h / 12, r + 26, h.toString(6), colors.onSurface));
  } else if (face === 2) {
    // Outer: 36 minutes (major every 6, labelled 0,10..50 outside). Inner: 12 amber hours.
    for (let i = 0; i < 36; i++) {
      const major = i % 6 === 0;
      elements.push(
        major
          ? tick(`m${i}`, i / 36, r - 16, r + 16, colors.onSurface, 2.5)
          : tick(`m${i}`, i / 36, r, r + 8, colors.borderStrong, 1),
      );
      if (major) elements.push(label(`ml${i}`, i / 36, r + 34, i.toString(6), colors.onSurface));
    }
    for (let h = 0; h < 12; h++) {
      elements.push(tick(`h${h}`, h / 12, r - 30, r - 6, colors.brand, 2.5));
      elements.push(label(`hl${h}`, h / 12, r - 52, h.toString(6), colors.brand));
    }
  } else {
    // Outer ring: 36 minutes/seconds. Inner dashed ring: 24 hours (major every 6 → 0,10,20,30).
    for (let i = 0; i < 36; i++) {
      const major = i % 6 === 0;
      elements.push(
        tick(`m${i}`, i / 36, major ? r - 24 : r - 10, r - 2, major ? colors.onSurface : colors.borderStrong, major ? 2.5 : 1),
      );
      if (major) elements.push(label(`ml${i}`, i / 36, r + 30, i.toString(6), colors.onSurface));
    }
    elements.push(
      <Circle key="inner" cx={c} cy={c} r={ri} stroke={colors.borderStrong} strokeWidth={1} strokeDasharray="3 4" fill="none" />,
    );
    for (let h = 0; h < 24; h++) {
      const major = h % 6 === 0;
      elements.push(
        major ? tick(`h${h}`, h / 24, ri - 4, ri + 14, colors.brand, 2.5) : tick(`h${h}`, h / 24, ri - 7, ri, colors.brandPrimary, 1),
      );
      if (major) elements.push(label(`hl${h}`, h / 24, ri - 22, h.toString(6), colors.brand, 16));
    }
  }

  const hourLen = face === 3 ? ri * 0.85 : r * 0.55;
  const hourEnd = pt(c, hourFrac, hourLen);
  const minEnd = pt(c, minFrac, r * 0.8);
  const secEnd = pt(c, secFrac, r * 0.9);
  const secTail = pt(c, secFrac + 0.5, r * 0.12);

  return (
    <Svg width={size} height={size} testID={`clock-face-${face}`}>
      <Circle cx={c} cy={c} r={r} stroke={colors.borderStrong} strokeWidth={1.5} fill={colors.surface} />
      {elements}
      <Line x1={c} y1={c} x2={hourEnd.x} y2={hourEnd.y} stroke={colors.onSurface} strokeWidth={5} strokeLinecap="round" />
      <Line x1={c} y1={c} x2={minEnd.x} y2={minEnd.y} stroke={colors.onSurface} strokeWidth={3} strokeLinecap="round" />
      <Line x1={secTail.x} y1={secTail.y} x2={secEnd.x} y2={secEnd.y} stroke={colors.brand} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx={c} cy={c} r={5} fill={colors.onSurface} />
      <Circle cx={c} cy={c} r={2} fill={colors.brand} />
    </Svg>
  );
}
