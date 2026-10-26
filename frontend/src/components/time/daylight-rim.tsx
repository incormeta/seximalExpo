import { memo, useId } from "react";
import { Defs, G, Line, LinearGradient, Path, Stop } from "react-native-svg";

import { Daylight } from "@/src/seximal/daylight";
import { useTheme } from "@/src/theme";

export const diurnalPoint = (fraction: number, radius: number) => ({
  x: 180 + Math.sin(fraction * Math.PI * 2) * radius,
  y: 180 + Math.cos(fraction * Math.PI * 2) * radius,
});

function mix(a: string, b: string, amount: number) {
  const channels = [1, 3, 5].map((offset) => {
    const from = parseInt(a.slice(offset, offset + 2), 16);
    return Math.round(from + (parseInt(b.slice(offset, offset + 2), 16) - from) * amount);
  });
  return `rgb(${channels.join(",")})`;
}

// Memoized independently of the hands: the 96 continuously blended arcs only
// change with location/date. SVG works in native builds and offline Safari PWAs.
export const DaylightRim = memo(function DaylightRim({ daylight }: { daylight: Daylight }) {
  const { colors } = useTheme();
  const id = useId().replace(/:/g, "");
  const stops: [number, string][] = [
    [-18, colors.solarNight], [-6, colors.solarTwilight], [-0.833, colors.solarHorizon], [15, colors.solarDay],
  ];
  const color = (altitude: number) => {
    for (let i = 1; i < stops.length; i++) {
      if (altitude <= stops[i][0]) {
        return mix(stops[i - 1][1], stops[i][1], Math.max(0, (altitude - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0])));
      }
    }
    return colors.solarDay;
  };
  const arcs = daylight.altitudes.slice(0, -1).map((altitude, i) => {
    const from = diurnalPoint(i / 96, 145);
    const to = diurnalPoint((i + 1) / 96, 145);
    // A tiny overlap prevents hairline seams from SVG antialiasing.
    const edge = diurnalPoint((i + 1.025) / 96, 145);
    return { from, to, edge, startColor: color(altitude), endColor: color(daylight.altitudes[i + 1]) };
  });
  return (
    <G testID="daylight-rim">
      <Defs>
        {arcs.map(({ from, to, startColor, endColor }, i) => (
          <LinearGradient key={i} id={`${id}-${i}`} gradientUnits="userSpaceOnUse" x1={from.x} y1={from.y} x2={to.x} y2={to.y}>
            <Stop offset="0" stopColor={startColor} /><Stop offset="1" stopColor={endColor} />
          </LinearGradient>
        ))}
      </Defs>
      {arcs.map(({ from, edge }, i) => <Path key={i} d={`M ${from.x} ${from.y} A 145 145 0 0 0 ${edge.x} ${edge.y}`} stroke={`url(#${id}-${i})`} strokeWidth={10} fill="none" />)}
      {daylight.events.map((event, i) => {
        const from = diurnalPoint(event.fraction, 136);
        const to = diurnalPoint(event.fraction, 154);
        return (
          <G key={i} testID={`daylight-${event.kind}-marker`}>
            <Line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={colors.surface} strokeWidth={6} />
            <Line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={event.kind === "sunrise" ? colors.solarDay : colors.solarSunset} strokeWidth={2.5} />
          </G>
        );
      })}
    </G>
  );
});
