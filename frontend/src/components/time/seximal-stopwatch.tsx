import { useEffect, useState } from "react";
import { Text, View, useWindowDimensions } from "react-native";

import { MonoDigits } from "@/src/components/mono-digits";
import { RoundButton } from "@/src/components/round-button";
import { pad6 } from "@/src/seximal/base";
import { formatDuration } from "@/src/seximal/time";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export function SeximalStopwatch() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [running, setRunning] = useState(false);
  const [startAt, setStartAt] = useState(0);
  const [accumulated, setAccumulated] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((t) => t + 1), 40);
    return () => clearInterval(id);
  }, [running]);

  const elapsed = accumulated + (running ? Date.now() - startAt : 0);
  const lapsTotal = laps.reduce((a, b) => a + b, 0);
  const currentLap = elapsed - lapsTotal;

  const startStop = () => {
    if (running) {
      setAccumulated(elapsed);
      setRunning(false);
    } else {
      setStartAt(Date.now());
      setRunning(true);
    }
  };
  const lapReset = () => {
    if (running) {
      setLaps((l) => [...l, currentLap]);
    } else {
      setAccumulated(0);
      setLaps([]);
    }
  };

  const fastest = laps.length > 1 ? Math.min(...laps) : null;
  const slowest = laps.length > 1 ? Math.max(...laps) : null;
  const started = elapsed > 0 || running;

  return (
    <View style={styles.root} testID="stopwatch-view">
      <View style={styles.display}>
        <MonoDigits
          text={formatDuration(elapsed)}
          fontSize={80}
          maxWidth={width - spacing.lg * 2}
          color={colors.onSurface}
          separatorColor={colors.brand}
          testID="stopwatch-elapsed"
        />
        <Text style={styles.units}>minutes · seconds · instants</Text>
      </View>

      <View style={styles.actions}>
        <RoundButton
          label={running ? "Lap" : "Reset"}
          onPress={lapReset}
          bg={colors.surfaceTertiary}
          fg={colors.onSurfaceTertiary}
          disabled={!started}
          testID="stopwatch-lap-reset-button"
        />
        <RoundButton
          label={running ? "Stop" : "Start"}
          onPress={startStop}
          bg={running ? colors.error : colors.brand}
          fg={running ? colors.onError : colors.onBrand}
          testID="stopwatch-start-stop-button"
        />
      </View>

      <View style={styles.laps} testID="stopwatch-laps">
        {started ? (
          <View style={styles.lapRow}>
            <Text style={styles.lapName}>Lap {pad6(laps.length + 1)}</Text>
            <MonoDigits text={formatDuration(currentLap)} fontSize={22} color={colors.onSurfaceSecondary} fontFamily={fonts.displayMedium} testID="stopwatch-current-lap" />
          </View>
        ) : (
          <Text style={styles.empty}>Laps appear here. Lap numbers are shown in base 6.</Text>
        )}
        {[...laps].reverse().map((lap, i) => {
          const idx = laps.length - i;
          const tint = lap === fastest ? colors.success : lap === slowest ? colors.error : colors.onSurface;
          return (
            <View key={idx} style={styles.lapRow} testID={`stopwatch-lap-${idx}`}>
              <Text style={[styles.lapName, { color: tint }]}>Lap {pad6(idx)}</Text>
              <MonoDigits text={formatDuration(lap)} fontSize={22} color={tint} fontFamily={fonts.displayMedium} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { gap: spacing.xl, paddingVertical: spacing.lg, paddingHorizontal: spacing.lg },
  display: { alignItems: "center", paddingVertical: spacing.lg },
  units: { fontFamily: fonts.text, fontSize: 12, color: colors.muted, letterSpacing: 1 },
  actions: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.lg },
  laps: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, paddingHorizontal: spacing.lg, overflow: "hidden" },
  lapRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  lapName: { fontFamily: fonts.textMedium, fontSize: 15, color: colors.onSurfaceSecondary },
  empty: { fontFamily: fonts.text, fontSize: 13, color: colors.muted, paddingVertical: spacing.lg, textAlign: "center" },
}));
