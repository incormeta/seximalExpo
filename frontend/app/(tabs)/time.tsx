import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/src/components/screen-header";
import { SegmentedControl } from "@/src/components/segmented-control";
import { SeximalClock } from "@/src/components/time/seximal-clock";
import { SeximalStopwatch } from "@/src/components/time/seximal-stopwatch";
import { SeximalTimer } from "@/src/components/time/seximal-timer";
import { usesNativeTabs } from "@/src/navigation";
import { makeStyles, spacing } from "@/src/theme";

type Mode = "clock" | "timer" | "stopwatch";

export default function TimeScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const [mode, setMode] = useState<Mode>("clock");

  return (
    <View style={styles.screen} testID="time-screen">
      <ScreenHeader title="Time" testID="time-header">
        <View style={styles.segmentWrap}>
          <SegmentedControl<Mode>
            options={[
              { value: "clock", label: "Clock" },
              { value: "timer", label: "Timer" },
              { value: "stopwatch", label: "Stopwatch" },
            ]}
            value={mode}
            onChange={setMode}
            testID="time-mode"
          />
        </View>
      </ScreenHeader>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomChrome + spacing.lg }}
        nestedScrollEnabled
      >
        {mode === "clock" ? <SeximalClock /> : null}
        <View style={mode === "timer" ? undefined : styles.hidden}>
          <SeximalTimer />
        </View>
        <View style={mode === "stopwatch" ? undefined : styles.hidden}>
          <SeximalStopwatch />
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  segmentWrap: { paddingTop: spacing.sm },
  scroll: { flex: 1 },
  hidden: { display: "none" },
}));
