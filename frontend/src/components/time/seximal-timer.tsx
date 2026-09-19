import Ionicons from "@react-native-vector-icons/ionicons";
import { useEffect, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";

import { ProgressRing } from "@/src/components/progress-ring";
import { RoundButton } from "@/src/components/round-button";
import { WheelPicker } from "@/src/components/time/wheel-picker";
import { pad6 } from "@/src/seximal/base";
import { INSTANT_MS, SECOND_MS, formatClock, formatDuration, formatStandardClock, nowSeximal, seximalToMs } from "@/src/seximal/time";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { haptics } from "@/src/utils/haptics";

type Status = "idle" | "running" | "paused" | "done";

export function SeximalTimer() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [h, setH] = useState(0);
  const [m, setM] = useState(5);
  const [s, setS] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [total, setTotal] = useState(0);
  const [endAt, setEndAt] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => setTick((t) => t + 1), 40);
    return () => clearInterval(id);
  }, [status]);

  const liveRemaining = status === "running" ? Math.max(0, endAt - Date.now()) : remaining;

  useEffect(() => {
    if (status === "running" && liveRemaining <= 0) {
      setStatus("done");
      setRemaining(0);
      haptics.success();
    }
  }, [status, liveRemaining, tick]);

  const pickedMs = seximalToMs({ hours: h, minutes: m, seconds: s });

  const start = () => {
    if (pickedMs <= 0) return;
    setTotal(pickedMs);
    setEndAt(Date.now() + pickedMs);
    setRemaining(pickedMs);
    setStatus("running");
  };
  const pause = () => {
    setRemaining(Math.max(0, endAt - Date.now()));
    setStatus("paused");
  };
  const resume = () => {
    setEndAt(Date.now() + remaining);
    setStatus("running");
  };
  const cancel = () => {
    setStatus("idle");
    setRemaining(0);
  };

  const ringSize = Math.min(width - spacing.lg * 4, 300);
  const endDate = new Date(status === "running" ? endAt : Date.now() + (status === "paused" ? remaining : pickedMs));

  return (
    <View style={styles.root} testID="timer-view">
      {status === "done" ? (
        <Animated.View entering={FadeInUp} exiting={FadeOutUp} style={styles.banner} testID="timer-done-banner">
          <Ionicons name="alarm-outline" size={20} color={colors.onBrand} />
          <Text style={styles.bannerText}>Timer finished</Text>
          <Pressable onPress={cancel} hitSlop={8} testID="timer-done-dismiss">
            <Ionicons name="close" size={20} color={colors.onBrand} />
          </Pressable>
        </Animated.View>
      ) : null}

      {status === "idle" ? (
        <View style={styles.pickerCard} testID="timer-picker">
          <View style={styles.pickerRow}>
            <WheelPicker count={24} value={h} onChange={setH} label="hours" testID="timer-wheel-hours" />
            <Text style={styles.pickerColon}>:</Text>
            <WheelPicker count={36} value={m} onChange={setM} label="minutes · 6⁴" testID="timer-wheel-minutes" />
            <Text style={styles.pickerColon}>:</Text>
            <WheelPicker count={36} value={s} onChange={setS} label="seconds · 6²" testID="timer-wheel-seconds" />
          </View>
          <Text style={styles.pickerHint} testID="timer-picker-summary">
            {pad6(h)}:{pad6(m)}:{pad6(s)} seximal ≈ {(pickedMs / 1000).toFixed(1)} standard seconds
          </Text>
        </View>
      ) : (
        <View style={styles.ringWrap}>
          <ProgressRing size={ringSize} strokeWidth={10} progress={total ? liveRemaining / total : 0} color={status === "done" ? colors.success : colors.brand}>
            <Text style={styles.remaining} testID="timer-remaining" adjustsFontSizeToFit numberOfLines={1}>
              {formatDuration(liveRemaining, false)}
            </Text>
            <Text style={styles.remainingInst}>.{pad6(Math.floor((liveRemaining % SECOND_MS) / INSTANT_MS))}</Text>
            <View style={styles.endsAt}>
              <Ionicons name="notifications-outline" size={14} color={colors.muted} />
              <Text style={styles.endsAtText} testID="timer-ends-at">
                {formatClock(nowSeximal(endDate))} · {formatStandardClock(endDate)}
              </Text>
            </View>
          </ProgressRing>
        </View>
      )}

      {status === "idle" ? (
        <Text style={styles.endsHint} testID="timer-idle-ends-at">
          Ends at {formatClock(nowSeximal(endDate))} seximal · {formatStandardClock(endDate)}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <RoundButton
          label="Cancel"
          onPress={cancel}
          bg={colors.surfaceTertiary}
          fg={colors.onSurfaceTertiary}
          disabled={status === "idle"}
          testID="timer-cancel-button"
        />
        {status === "running" ? (
          <RoundButton label="Pause" onPress={pause} bg={colors.brandTertiary} fg={colors.onBrandTertiary} ring={colors.brand} testID="timer-pause-button" />
        ) : status === "paused" ? (
          <RoundButton label="Resume" onPress={resume} bg={colors.brand} fg={colors.onBrand} testID="timer-resume-button" />
        ) : (
          <RoundButton
            label="Start"
            onPress={start}
            bg={colors.brand}
            fg={colors.onBrand}
            disabled={pickedMs <= 0}
            testID="timer-start-button"
          />
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { alignItems: "center", gap: spacing.xl, paddingVertical: spacing.lg, paddingHorizontal: spacing.lg },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 48,
    alignSelf: "stretch",
  },
  bannerText: { flex: 1, fontFamily: fonts.textSemiBold, fontSize: 15, color: colors.onBrand },
  pickerCard: { alignSelf: "stretch", backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  pickerRow: { flexDirection: "row", alignItems: "center" },
  pickerColon: { fontFamily: fonts.display, fontSize: 30, color: colors.brand, marginBottom: spacing.lg },
  pickerHint: { fontFamily: fonts.text, fontSize: 13, color: colors.muted, textAlign: "center" },
  ringWrap: { alignItems: "center" },
  remaining: { fontFamily: fonts.display, fontSize: 68, lineHeight: 74, color: colors.onSurface },
  remainingInst: { fontFamily: fonts.displayMedium, fontSize: 24, color: colors.brandSecondary, marginTop: -spacing.sm },
  endsAt: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.sm },
  endsAtText: { fontFamily: fonts.text, fontSize: 13, color: colors.muted },
  endsHint: { fontFamily: fonts.text, fontSize: 13, color: colors.muted },
  actions: { flexDirection: "row", justifyContent: "space-between", alignSelf: "stretch", paddingHorizontal: spacing.lg },
}));
