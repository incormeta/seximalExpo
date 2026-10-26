import { useFocusEffect } from "expo-router";
import { useCallback, useState, useSyncExternalStore } from "react";
import { AppState, Platform } from "react-native";

import { ClockSource, createClockSource } from "@/src/utils/clock-source";

export function useClockSource(enabled: boolean, smooth: boolean): ClockSource {
  const [clock] = useState(createClockSource);

  useFocusEffect(useCallback(() => {
    if (!enabled) return;
    const browserDocument = Platform.OS === "web" && typeof document !== "undefined" ? document : null;
    const sync = () => {
      clock.stop();
      if ((!AppState.currentState || AppState.currentState === "active") && !browserDocument?.hidden) {
        clock.start(smooth);
      }
    };
    const subscription = AppState.addEventListener("change", sync);
    browserDocument?.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      clock.stop();
      subscription.remove();
      browserDocument?.removeEventListener("visibilitychange", sync);
    };
  }, [clock, enabled, smooth]));

  return clock;
}

const noSubscription = () => () => {};

export function useClockTime(clock: ClockSource, active = true, smooth = false): Date {
  const getSnapshot = smooth ? clock.getAnimationSnapshot : clock.getSnapshot;
  const subscribe = active ? (smooth ? clock.subscribeAnimation : clock.subscribe) : noSubscription;
  return new Date(useSyncExternalStore(subscribe, getSnapshot, getSnapshot));
}
