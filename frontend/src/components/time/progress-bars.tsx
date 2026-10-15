import { Text, View } from "react-native";
import Svg, { Line, Text as SvgText } from "react-native-svg";

import { useClockTime } from "@/src/components/time/clock-time";
import { toSeximal } from "@/src/seximal/base";
import { DAY_TICKS, SEXIMAL_TICKS } from "@/src/seximal/clock-faces";
import { clockProgress } from "@/src/seximal/time";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { ClockSource } from "@/src/utils/clock-source";

const BARS = [
  { id: "day", label: "DAY", total: 24, ticks: DAY_TICKS },
  { id: "hour", label: "HOUR", total: 36, ticks: SEXIMAL_TICKS },
  { id: "minute", label: "MINUTE", total: 36, ticks: SEXIMAL_TICKS },
] as const;

type Props = { clock: ClockSource; active: boolean; width: number; height: number };

export function ProgressBars({ clock, active, width, height }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { width, height }]} testID="clock-face-progress">
      {BARS.map((bar) => (
        <View key={bar.id} style={styles.row}>
          <Text style={styles.label}>{bar.label}</Text>
          <View style={styles.scale}>
            <ProgressFill clock={clock} active={active} bar={bar} />
            <Svg width={width} height={44} pointerEvents="none" accessible={false} aria-hidden>
              {bar.ticks.map((tick) => (
                <Line
                  key={`tick-${tick.value}`}
                  x1={tick.progress * (width - 2) + 1}
                  x2={tick.progress * (width - 2) + 1}
                  y1={tick.major ? 0 : 4}
                  y2={tick.major ? 20 : 14}
                  stroke={tick.major ? colors.onSurface : colors.muted}
                  strokeWidth={tick.major ? 2 : 1}
                />
              ))}
              {bar.ticks.filter((tick) => tick.major).map((tick) => (
                <SvgText
                  key={`label-${tick.value}`}
                  x={tick.progress * (width - 2) + 1}
                  y={38}
                  fill={colors.muted}
                  fontFamily={fonts.textMedium}
                  fontSize={12}
                  textAnchor={tick.progress === 0 ? "start" : tick.progress === 1 ? "end" : "middle"}
                >
                  {tick.label}
                </SvgText>
              ))}
            </Svg>
          </View>
        </View>
      ))}
    </View>
  );
}

// The tick scales stay static while these small leaves update each frame.
function ProgressFill({ clock, active, bar }: Pick<Props, "clock" | "active"> & { bar: typeof BARS[number] }) {
  const styles = useStyles();
  const now = useClockTime(clock, active, true);
  const progress = clockProgress(now)[bar.id];

  return (
    <View
      style={styles.track}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${bar.label.toLowerCase()} progress`}
      aria-valuetext={`${toSeximal(progress * bar.total, 2)} of ${toSeximal(bar.total)} in base six`}
      testID={`clock-progress-${bar.id}`}
    >
      <View style={[styles.fill, { width: `${progress * 100}%` }]} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { justifyContent: "space-evenly" },
  row: { gap: spacing.sm },
  label: { fontFamily: fonts.textSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.muted },
  scale: { height: 44 },
  track: { position: "absolute", top: 0, left: 0, right: 0, height: 12, borderRadius: radius.sm, backgroundColor: colors.ringTrack, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.brand },
}));
