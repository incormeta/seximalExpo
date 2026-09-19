import { Pressable, Text, View } from "react-native";

import { fonts, makeStyles, radius, spacing } from "@/src/theme";
import { haptics } from "@/src/utils/haptics";

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  testID?: string;
};

export function SegmentedControl<T extends string>({ options, value, onChange, testID }: Props<T>) {
  const styles = useStyles();
  return (
    <View style={styles.track} testID={testID}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            testID={`${testID ?? "segment"}-${o.value}`}
            onPress={() => {
              if (!active) {
                haptics.selection();
                onChange(o.value);
              }
            }}
            style={[styles.item, active && styles.itemActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  track: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.xs,
    height: 44,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm + 2,
  },
  itemActive: {
    backgroundColor: colors.brand,
  },
  label: {
    fontFamily: fonts.textSemiBold,
    fontSize: 14,
    color: colors.muted,
  },
  labelActive: {
    color: colors.onBrand,
  },
}));
