// Timer alarm: in-app looping sound + repeating vibration, plus a scheduled local
// notification so the alarm still fires when the app is backgrounded / screen is off.
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef } from "react";
import { Linking, Platform, Vibration } from "react-native";

const CHANNEL_ID = "seximal-timer";
const VIBRATION_PATTERN = [0, 600, 300, 600, 300, 600, 800];

if (Platform.OS !== "web") {
  // While the app is in the foreground we ring the in-app alarm instead of a banner.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export type NotifStatus = "granted" | "undetermined" | "denied" | "blocked" | "unsupported";

export async function getNotificationStatus(): Promise<NotifStatus> {
  if (Platform.OS === "web") return "unsupported";
  const p = await Notifications.getPermissionsAsync();
  if (p.granted) return "granted";
  if (p.status === "undetermined") return "undetermined";
  return p.canAskAgain ? "denied" : "blocked";
}

export async function requestNotificationPermission(): Promise<NotifStatus> {
  if (Platform.OS === "web") return "unsupported";
  const p = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  if (p.granted) return "granted";
  return p.canAskAgain ? "denied" : "blocked";
}

export const openNotificationSettings = () => Linking.openSettings().catch(() => {});

export async function scheduleTimerNotification(endAt: number, label: string): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Seximal timer",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: VIBRATION_PATTERN,
        enableVibrate: true,
        bypassDnd: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "Seximal timer finished",
        body: `Your ${label} timer is done.`,
        sound: true,
        vibrate: VIBRATION_PATTERN,
        priority: Notifications.AndroidNotificationPriority.MAX,
        ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(endAt) },
    });
  } catch {
    return null;
  }
}

export async function cancelTimerNotification(id: string | null) {
  if (!id || Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

export function dismissDeliveredNotifications() {
  if (Platform.OS === "web") return;
  Notifications.dismissAllNotificationsAsync().catch(() => {});
}

/** Looping alarm sound + repeating vibration while ringing. */
export function useAlarm() {
  const player = useAudioPlayer(require("../../assets/sounds/alarm.wav"));
  const ringing = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability -- Expo Audio exposes loop as a mutable player property.
    player.loop = true;
  }, [player]);

  const start = useCallback(() => {
    if (ringing.current) return;
    ringing.current = true;
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    player.seekTo(0).catch(() => {});
    try {
      player.play();
    } catch {}
    if (Platform.OS !== "web") Vibration.vibrate(VIBRATION_PATTERN, true);
    dismissDeliveredNotifications();
  }, [player]);

  const stop = useCallback(() => {
    if (!ringing.current) return;
    ringing.current = false;
    try {
      player.pause();
    } catch {}
    if (Platform.OS !== "web") Vibration.cancel();
  }, [player]);

  useEffect(() => stop, [stop]);

  // Browsers need a user gesture to enable audio; the web implementation unlocks it.
  const prepare = useCallback(() => {}, []);
  return { start, stop, prepare };
}
