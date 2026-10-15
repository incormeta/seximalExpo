import { StyleSheet, View } from "react-native";

import { MonoDigits } from "@/src/components/mono-digits";
import { useClockTime } from "@/src/components/time/clock-time";
import { contrastingForeground, hueClockColor } from "@/src/seximal/clock-faces";
import { formatClock, nowSeximal } from "@/src/seximal/time";
import { fonts, useTheme } from "@/src/theme";
import { ClockSource } from "@/src/utils/clock-source";

/** Covers the Time screen, behind its themed navigation and carousel controls. */
export function HueBackground({ clock }: { clock: ClockSource }) {
  const now = useClockTime(clock, true, true);
  return (
    <View
      pointerEvents="none"
      accessible={false}
      style={[StyleSheet.absoluteFill, { backgroundColor: hueClockColor(now).background }]}
      testID="clock-hue-background"
    />
  );
}

export function HueClock({ clock, active, width }: { clock: ClockSource; active: boolean; width: number }) {
  const { colors } = useTheme();
  const now = useClockTime(clock, active);
  const text = formatClock(nowSeximal(now));
  const color = contrastingForeground(hueClockColor(now).rgb, [colors.onSurface, colors.onSurfaceInverse]);

  return (
    <View accessible accessibilityLabel={`Base six time ${text}`} testID="clock-face-hue">
      <MonoDigits
        text={text}
        fontSize={52}
        maxWidth={width}
        fontFamily={fonts.displayRegular}
        color={color}
        testID="clock-hue-time"
      />
    </View>
  );
}
