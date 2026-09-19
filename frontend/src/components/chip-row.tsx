import { Pressable, ScrollView, Text } from "react-native";

import { fonts, makeStyles, radius, spacing } from "@/src/theme";
import { haptics } from "@/src/utils/haptics";

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  testID?: string;
};

/** Horizontal, non-wrapping chip row (fixed 56pt row, 36pt chips). */
export function ChipRow<T extends string>({ options, value, onChange, testID }: Props<T>) {
  const styles = useStyles();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.content}
      testID={testID}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            testID={`${testID ?? "chip"}-${o.value}`}
            onPress={() => {
              haptics.selection();
              onChange(o.value);
            }}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { height: 56, flexGrow: 0, flexShrink: 0 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.sm, alignItems: "center" },
  chip: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    flexShrink: 0,
  },
  chipActive: { backgroundColor: colors.brandTertiary, borderColor: colors.brand },
  label: { fontFamily: fonts.textMedium, fontSize: 14, color: colors.muted },
  labelActive: { color: colors.onBrandTertiary },
}));
