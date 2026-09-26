import { useState } from "react";
import { View } from "react-native";
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
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const [mode, setMode] = useState<Mode>("units");
  const [unitEntryActive, setUnitEntryActive] = useState(false);

  return (
    <View style={styles.screen} testID="convert-screen">
      {!unitEntryActive ? <View style={[styles.segmentWrap, { paddingTop: insets.top + spacing.sm }]}>
        <SegmentedControl<Mode>
          options={[
            { value: "units", label: "Units" },
            { value: "bases", label: "Number bases" },
          ]}
          value={mode}
          onChange={setMode}
          testID="convert-mode"
        />
      </View> : <View style={{ height: insets.top }} />}
      {mode === "units" ? (
        <UnitConverter bottomPadding={bottomChrome + spacing.lg} onEditingChange={setUnitEntryActive} />
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
