import { useState } from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BaseConverter } from "@/src/components/convert/base-converter";
import { UnitConverter } from "@/src/components/convert/unit-converter";
import { SegmentedControl } from "@/src/components/segmented-control";
import { usesNativeTabs } from "@/src/navigation";
import { makeStyles, spacing } from "@/src/theme";

type Mode = "units" | "bases";

export default function ConvertScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  // Native tabs float over the scene on iOS 26 instead of reducing its height.
  // Reserve both the home-indicator inset and the tab control itself so custom
  // bottom controls (notably the converter numpad) remain fully tappable.
  const bottomChrome = usesNativeTabs && Platform.OS === "ios" ? insets.bottom + 64 : 0;
  const [mode, setMode] = useState<Mode>("units");
  const [enteringUnitValue, setEnteringUnitValue] = useState(false);

  return (
    <View style={styles.screen} testID="convert-screen">
      {!enteringUnitValue ? <View style={[styles.segmentWrap, { paddingTop: insets.top + spacing.sm }]}>
        <SegmentedControl<Mode>
          options={[
            { value: "units", label: "Units" },
            { value: "bases", label: "Number bases" },
          ]}
          value={mode}
          onChange={setMode}
          testID="convert-mode"
        />
      </View> : null}
      {mode === "units" ? (
        <UnitConverter bottomPadding={bottomChrome} onEditingChange={setEnteringUnitValue} />
      ) : (
        <BaseConverter bottomPadding={bottomChrome} />
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  segmentWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
}));
