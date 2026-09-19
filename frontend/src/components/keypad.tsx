import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, Text, View } from "react-native";

import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { haptics } from "@/src/utils/haptics";

export type KeyDef = {
  key: string;
  label?: string;
  icon?: string;
  variant?: "digit" | "operator" | "action" | "primary";
  span?: number;
  disabled?: boolean;
};

type Props = {
  rows: KeyDef[][];
  onPress: (key: string) => void;
  keyHeight?: number;
  testIDPrefix?: string;
};

export function Keypad({ rows, onPress, keyHeight = 64, testIDPrefix = "key" }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.grid} testID={`${testIDPrefix}-pad`}>
      {rows.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((k) => {
            const variant = k.variant ?? "digit";
            return (
              <Pressable
                key={k.key}
                testID={`${testIDPrefix}-${keyName(k.key)}`}
                disabled={k.disabled}
                onPress={() => {
                  variant === "primary" ? haptics.light() : haptics.selection();
                  onPress(k.key);
                }}
                style={({ pressed }) => [
                  styles.key,
                  { flex: k.span ?? 1, height: keyHeight },
                  variant === "operator" && styles.keyOperator,
                  variant === "action" && styles.keyAction,
                  variant === "primary" && styles.keyPrimary,
                  k.disabled && styles.keyDisabled,
                  pressed && styles.keyPressed,
                ]}
              >
                {k.icon ? (
                  <Ionicons
                    name={k.icon as any}
                    size={26}
                    color={variant === "primary" ? colors.onBrandPrimary : colors.onSurface}
                  />
                ) : (
                  <Text
                    style={[
                      styles.label,
                      variant === "operator" && styles.labelOperator,
                      variant === "primary" && styles.labelPrimary,
                      variant === "action" && styles.labelAction,
                      k.disabled && styles.labelDisabled,
                    ]}
                  >
                    {k.label ?? k.key}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function keyName(k: string) {
  const map: Record<string, string> = {
    "+": "plus",
    "−": "minus",
    "×": "multiply",
    "÷": "divide",
    "=": "equals",
    ".": "point",
    "⌫": "backspace",
    "±": "negate",
    AC: "clear",
  };
  return map[k] ?? k.toLowerCase();
}

const useStyles = makeStyles((colors) => ({
  grid: { gap: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm },
  key: {
    backgroundColor: colors.keyDigit,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  keyOperator: { backgroundColor: colors.brandTertiary },
  keyAction: { backgroundColor: colors.surfaceSecondary },
  keyPrimary: { backgroundColor: colors.brand },
  keyDisabled: { opacity: 0.3 },
  keyPressed: { opacity: 0.6, transform: [{ scale: 0.97 }] },
  label: { fontFamily: fonts.displayMedium, fontSize: 30, color: colors.onSurface },
  labelOperator: { color: colors.onBrandTertiary, fontSize: 32 },
  labelPrimary: { color: colors.onBrandPrimary, fontFamily: fonts.display },
  labelAction: { color: colors.brandSecondary, fontSize: 24, fontFamily: fonts.textSemiBold },
  labelDisabled: { color: colors.muted },
}));
