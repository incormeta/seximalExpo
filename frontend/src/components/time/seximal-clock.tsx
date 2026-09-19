import { useEffect, useState } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";

import { MonoDigits } from "@/src/components/mono-digits";
import { pad6 } from "@/src/seximal/base";
import { INSTANT_MS, formatClock, formatStandardClock, nowSeximal } from "@/src/seximal/time";
import { fonts, makeStyles, spacing, useTheme } from "@/src/theme";

export function SeximalClock() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), INSTANT_MS);
    return () => clearInterval(id);
  }, []);

  const t = nowSeximal(now);
  const size = Math.min(width - spacing.lg * 4, 300);
  const c = size / 2;
  const r = c - 12;

  // Hands: hour hand sweeps the full 24h (seximal "40") day; minute/second hands use 36 divisions.
  const hourFrac = (t.hours + t.minutes / 36 + t.seconds / 1296) / 24;
  const minFrac = (t.minutes + t.seconds / 36 + t.instants / 1296) / 36;
  const secFrac = (t.seconds + t.instants / 36) / 36;
  const hand = (frac: number, len: number) => {
    const a = frac * Math.PI * 2 - Math.PI / 2;
    return { x2: c + Math.cos(a) * len, y2: c + Math.sin(a) * len };
  };
  const h = hand(hourFrac, r * 0.5);
  const m = hand(minFrac, r * 0.72);
  const s = hand(secFrac, r * 0.85);

  const dateLabel = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <View style={styles.root} testID="clock-view">
      <View style={styles.digital}>
        <MonoDigits
          text={formatClock(t)}
          fontSize={88}
          maxWidth={width - spacing.lg * 2 - 70}
          color={colors.onSurface}
          separatorColor={colors.brand}
          testID="clock-digital"
        />
        <MonoDigits
          text={`.${pad6(t.instants)}`}
          fontSize={34}
          lineHeight={60}
          color={colors.brandSecondary}
          fontFamily={fonts.displayMedium}
          testID="clock-instants"
        />
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendItem}>hours · 6⁶ inst</Text>
        <Text style={styles.legendItem}>minutes · 6⁴ inst</Text>
        <Text style={styles.legendItem}>seconds · 6² inst</Text>
      </View>

      <Svg width={size} height={size} testID="clock-analog">
        <Circle cx={c} cy={c} r={r} stroke={colors.border} strokeWidth={1.5} fill={colors.surfaceSecondary} />
        {Array.from({ length: 36 }).map((_, i) => {
          const a = (i / 36) * Math.PI * 2 - Math.PI / 2;
          const major = i % 6 === 0;
          const inner = r - (major ? 14 : 7);
          return (
            <Line
              key={i}
              x1={c + Math.cos(a) * inner}
              y1={c + Math.sin(a) * inner}
              x2={c + Math.cos(a) * (r - 2)}
              y2={c + Math.sin(a) * (r - 2)}
              stroke={major ? colors.onSurface : colors.borderStrong}
              strokeWidth={major ? 2.5 : 1}
            />
          );
        })}
        {[0, 1, 2, 3, 4, 5].map((k) => {
          const a = (k / 6) * Math.PI * 2 - Math.PI / 2;
          const rr = r - 30;
          return (
            <SvgText
              key={k}
              x={c + Math.cos(a) * rr}
              y={c + Math.sin(a) * rr + 6}
              fill={colors.muted}
              fontSize={16}
              fontFamily={fonts.displayMedium}
              textAnchor="middle"
            >
              {k === 0 ? "0" : `${k}0`}
            </SvgText>
          );
        })}
        <Line x1={c} y1={c} x2={h.x2} y2={h.y2} stroke={colors.onSurface} strokeWidth={6} strokeLinecap="round" />
        <Line x1={c} y1={c} x2={m.x2} y2={m.y2} stroke={colors.onSurface} strokeWidth={4} strokeLinecap="round" />
        <Line x1={c} y1={c} x2={s.x2} y2={s.y2} stroke={colors.brand} strokeWidth={2} strokeLinecap="round" />
        <Circle cx={c} cy={c} r={5} fill={colors.brand} />
      </Svg>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>STANDARD TIME</Text>
        <Text style={styles.footerTime} testID="clock-standard">
          {formatStandardClock(now)}
        </Text>
        <Text style={styles.footerDate}>{dateLabel}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { alignItems: "center", gap: spacing.lg, paddingVertical: spacing.lg },
  digital: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center" },
  legend: { flexDirection: "row", gap: spacing.lg, marginTop: -spacing.sm },
  legendItem: { fontFamily: fonts.text, fontSize: 12, color: colors.muted },
  footer: { alignItems: "center", gap: spacing.xs },
  footerLabel: { fontFamily: fonts.textSemiBold, fontSize: 11, color: colors.muted, letterSpacing: 1.2 },
  footerTime: { fontFamily: fonts.displayMedium, fontSize: 28, color: colors.onSurface },
  footerDate: { fontFamily: fonts.text, fontSize: 14, color: colors.muted },
}));
