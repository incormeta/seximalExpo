import { useEffect, useRef } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, Text, View } from "react-native";

import { fonts, makeStyles, spacing } from "@/src/theme";

const ITEM_H = 44;
const VISIBLE = 5;

type Props = {
  count: number;
  value: number;
  onChange: (v: number) => void;
  label: string;
  format?: (v: number) => string;
  testID?: string;
};

/** Snapping wheel picker; item labels shown in base 6. */
export function WheelPicker({ count, value, onChange, label, format = (v) => v.toString(6).padStart(2, "0"), testID }: Props) {
  const styles = useStyles();
  const ref = useRef<ScrollView>(null);
  const lastEmitted = useRef(value);

  useEffect(() => {
    if (lastEmitted.current !== value) {
      ref.current?.scrollTo({ y: value * ITEM_H, animated: false });
      lastEmitted.current = value;
    }
  }, [value]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.min(count - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.y / ITEM_H)));
    if (idx !== lastEmitted.current) {
      lastEmitted.current = idx;
      onChange(idx);
    }
  };

  const pad = (ITEM_H * (VISIBLE - 1)) / 2;

  return (
    <View style={styles.col} testID={testID}>
      <View style={styles.wheelWrap}>
        <View pointerEvents="none" style={styles.highlight} />
        <ScrollView
          ref={ref}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_H}
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentOffset={{ x: 0, y: value * ITEM_H }}
          contentContainerStyle={{ paddingVertical: pad }}
          style={{ height: ITEM_H * VISIBLE }}
          nestedScrollEnabled
        >
          {Array.from({ length: count }).map((_, i) => (
            <View key={i} style={styles.item}>
              <Text style={[styles.itemText, i === value && styles.itemTextActive]} testID={`${testID ?? "wheel"}-item-${i}`}>
                {format(i)}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  col: { flex: 1, alignItems: "center", gap: spacing.xs },
  wheelWrap: { width: "100%", position: "relative" },
  highlight: {
    position: "absolute",
    left: 0,
    right: 0,
    top: (ITEM_H * (VISIBLE - 1)) / 2,
    height: ITEM_H,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 10,
  },
  item: { height: ITEM_H, alignItems: "center", justifyContent: "center" },
  itemText: { fontFamily: fonts.displayMedium, fontSize: 30, color: colors.muted },
  itemTextActive: { color: colors.onSurface },
  label: { fontFamily: fonts.textMedium, fontSize: 12, color: colors.muted, letterSpacing: 0.5 },
}));
