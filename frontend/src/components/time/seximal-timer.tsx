import Ionicons from "@react-native-vector-icons/ionicons";
import { useEffect, useState } from "react";
import { Platform, Pressable, Text, View, useWindowDimensions } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";

import { MonoDigits } from "@/src/components/mono-digits";
import { ProgressRing } from "@/src/components/progress-ring";
import { RoundButton } from "@/src/components/round-button";
import { WheelPicker } from "@/src/components/time/wheel-picker";
import { pad6 } from "@/src/seximal/base";
import { INSTANT_MS, SECOND_MS, formatClock, formatDuration, formatStandardClock, nowSeximal, seximalToMs } from "@/src/seximal/time";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import {
  NotifStatus,
  cancelTimerNotification,
  getNotificationStatus,
  openNotificationSettings,
  requestNotificationPermission,
  scheduleTimerNotification,
  useAlarm,
} from "@/src/utils/alarm";
import { haptics } from "@/src/utils/haptics";

type Status = "idle" | "running" | "paused" | "done";

export function SeximalTimer() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const alarm = useAlarm();
  const ringAlarm = alarm.start;
  const [h, setH] = useState(0);
  const [m, setM] = useState(5);
  const [s, setS] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [total, setTotal] = useState(0);
  const [endAt, setEndAt] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [notifId, setNotifId] = useState<string | null>(null);
  const [notifStatus, setNotifStatus] = useState<NotifStatus>("unsupported");
  const [notifPromptDismissed, setNotifPromptDismissed] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      const timestamp = Date.now();
      setNow(timestamp);
      if (status === "running" && timestamp >= endAt) {
        setStatus("done");
        setRemaining(0);
        haptics.success();
        ringAlarm();
      }
    }, status === "running" ? 40 : 1000);
    return () => clearInterval(id);
  }, [status, endAt, ringAlarm]);

  const liveRemaining = status === "running" ? Math.max(0, endAt - now) : remaining;

  const pickedMs = seximalToMs({ hours: h, minutes: m, seconds: s });
  const label = `${pad6(h)}:${pad6(m)}:${pad6(s)}`;

  const schedule = async (at: number) => {
    const st = await getNotificationStatus();
    setNotifStatus(st);
    if (st === "granted") setNotifId(await scheduleTimerNotification(at, label));
  };
  const unschedule = () => {
    cancelTimerNotification(notifId);
    setNotifId(null);
  };

  const start = () => {
    if (pickedMs <= 0) return;
    alarm.prepare();
    const timestamp = Date.now();
    const at = timestamp + pickedMs;
    setNow(timestamp);
    setTotal(pickedMs);
    setEndAt(at);
    setRemaining(pickedMs);
    setStatus("running");
    schedule(at);
  };
  const pause = () => {
    setRemaining(Math.max(0, endAt - Date.now()));
    setStatus("paused");
    unschedule();
  };
  const resume = () => {
    alarm.prepare();
    const timestamp = Date.now();
    const at = timestamp + remaining;
    setNow(timestamp);
    setEndAt(at);
    setStatus("running");
    schedule(at);
  };
  const cancel = () => {
    alarm.stop();
    setStatus("idle");
    setRemaining(0);
    unschedule();
  };

  const allowNotifications = async () => {
    haptics.light();
    const st = await requestNotificationPermission();
    setNotifStatus(st);
    if (st === "granted" && status === "running") setNotifId(await scheduleTimerNotification(endAt, label));
  };

  const ringSize = Math.min(width - spacing.lg * 4, 300);
  const endDate = new Date(status === "running" ? endAt : now + (status === "paused" ? remaining : pickedMs));
  const showNotifPrompt =
    status !== "idle" && status !== "done" && !notifPromptDismissed && (notifStatus === "undetermined" || notifStatus === "denied" || notifStatus === "blocked");

  return (
    <View style={styles.root} testID="timer-view">
      {Platform.OS === "web" ? (
        <Text style={styles.pickerHint} testID="timer-web-notice">
          Keep the app open and your screen awake to hear the alarm. Browsers can pause timers in the background.
        </Text>
      ) : null}
      {status === "done" ? (
        <Animated.View entering={FadeInUp} exiting={FadeOutUp} style={styles.banner} testID="timer-done-banner">
          <Ionicons name="alarm-outline" size={20} color={colors.onBrand} />
          <Text style={styles.bannerText}>{Platform.OS === "web" ? "Timer finished" : "Timer finished · ringing"}</Text>
          <Pressable onPress={cancel} style={styles.bannerStop} testID="timer-done-dismiss">
            <Text style={styles.bannerStopText}>Stop</Text>
          </Pressable>
        </Animated.View>
      ) : null}

      {showNotifPrompt ? (
        <View style={styles.notice} testID="timer-notification-prompt">
          <Ionicons name="notifications-outline" size={18} color={colors.brandSecondary} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text style={styles.noticeText}>
              {notifStatus === "blocked"
                ? "Notifications are off, so the alarm can’t ring with the screen off."
                : "Allow notifications so the alarm rings even when the screen is off."}
            </Text>
            <View style={styles.noticeActions}>
              {notifStatus === "blocked" ? (
                <Pressable onPress={openNotificationSettings} style={styles.noticeBtn} testID="timer-open-settings-button">
                  <Text style={styles.noticeBtnText}>Open Settings</Text>
                </Pressable>
              ) : (
                <Pressable onPress={allowNotifications} style={styles.noticeBtn} testID="timer-allow-notifications-button">
                  <Text style={styles.noticeBtnText}>Allow</Text>
                </Pressable>
              )}
              <Pressable onPress={() => setNotifPromptDismissed(true)} style={styles.noticeGhost} testID="timer-notifications-not-now-button">
                <Text style={styles.noticeGhostText}>Not now</Text>
              </Pressable>
            </View>
          </View>
        </View>
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
            {label} seximal ≈ {(pickedMs / 1000).toFixed(1)} standard seconds
          </Text>
        </View>
      ) : (
        <View style={styles.ringWrap}>
          <ProgressRing size={ringSize} strokeWidth={10} progress={total ? liveRemaining / total : 0} color={status === "done" ? colors.success : colors.brand}>
            <MonoDigits
              text={formatDuration(liveRemaining, false)}
              fontSize={68}
              maxWidth={ringSize - 56}
              color={colors.onSurface}
              separatorColor={colors.brand}
              testID="timer-remaining"
            />
            <MonoDigits
              text={`.${pad6(Math.floor((liveRemaining % SECOND_MS) / INSTANT_MS))}`}
              fontSize={24}
              color={colors.brandSecondary}
              fontFamily={fonts.displayMedium}
              testID="timer-remaining-instants"
            />
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
        ) : status === "done" ? (
          <RoundButton label="Stop" onPress={cancel} bg={colors.error} fg={colors.onError} testID="timer-stop-alarm-button" />
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
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    height: 52,
    alignSelf: "stretch",
  },
  bannerText: { flex: 1, fontFamily: fonts.textSemiBold, fontSize: 15, color: colors.onBrand },
  bannerStop: { height: 36, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.onBrand, justifyContent: "center" },
  bannerStopText: { fontFamily: fonts.textSemiBold, fontSize: 14, color: colors.brand },
  notice: {
    flexDirection: "row",
    gap: spacing.md,
    alignSelf: "stretch",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noticeText: { fontFamily: fonts.text, fontSize: 14, lineHeight: 19, color: colors.onSurfaceSecondary },
  noticeActions: { flexDirection: "row", gap: spacing.sm },
  noticeBtn: { height: 36, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.brand, justifyContent: "center" },
  noticeBtnText: { fontFamily: fonts.textSemiBold, fontSize: 13, color: colors.onBrand },
  noticeGhost: { height: 36, paddingHorizontal: spacing.md, justifyContent: "center" },
  noticeGhostText: { fontFamily: fonts.textMedium, fontSize: 13, color: colors.muted },
  pickerCard: { alignSelf: "stretch", backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  pickerRow: { flexDirection: "row", alignItems: "center" },
  pickerColon: { fontFamily: fonts.display, fontSize: 30, color: colors.brand, marginBottom: spacing.lg },
  pickerHint: { fontFamily: fonts.text, fontSize: 13, color: colors.muted, textAlign: "center" },
  ringWrap: { alignItems: "center" },
  endsAt: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.sm },
  endsAtText: { fontFamily: fonts.text, fontSize: 13, color: colors.muted },
  endsHint: { fontFamily: fonts.text, fontSize: 13, color: colors.muted },
  actions: { flexDirection: "row", justifyContent: "space-between", alignSelf: "stretch", paddingHorizontal: spacing.lg },
}));
