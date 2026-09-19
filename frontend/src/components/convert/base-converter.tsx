import Ionicons from "@react-native-vector-icons/ionicons";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { ChipRow } from "@/src/components/chip-row";
import { BASES, BaseId, formatBase, isValidDigit, parseBase } from "@/src/seximal/base";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { haptics } from "@/src/utils/haptics";

export function BaseConverter({ bottomPadding }: { bottomPadding: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [base, setBase] = useState<BaseId>(6);
  const [raw, setRaw] = useState("");

  const value = raw.trim() ? parseBase(raw, base) : 0;
  const invalid = raw.trim() !== "" && value === null;
  const baseInfo = BASES.find((b) => b.id === base)!;

  const onChange = (text: string) => {
    const cleaned = text
      .split("")
      .filter((ch, i) => (ch === "." ) || (ch === "-" && i === 0) || isValidDigit(ch, base))
      .join("")
      .toUpperCase();
    setRaw(cleaned);
  };

  const switchBase = (id: string) => {
    const next = Number(id) as BaseId;
    if (value !== null && raw.trim()) setRaw(formatBase(value, next, 8));
    setBase(next);
  };

  return (
    <KeyboardAwareScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + spacing.lg }]}
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
    >
      <ChipRow
        options={BASES.map((b) => ({ value: String(b.id), label: b.name }))}
        value={String(base)}
        onChange={switchBase}
        testID="bases-input-chip"
      />
      <View style={styles.inputCard}>
        <View style={styles.inputHead}>
          <Text style={styles.label}>INPUT · {baseInfo.name.toUpperCase()}</Text>
          <Text style={styles.hint}>{baseInfo.hint}</Text>
        </View>
        <View style={styles.inputRow}>
          <TextInput
            testID="bases-input"
            value={raw}
            onChangeText={onChange}
            placeholder="0"
            placeholderTextColor={colors.muted}
            style={[styles.input, invalid && styles.inputInvalid]}
            autoCapitalize="characters"
            autoCorrect={false}
            keyboardType={base === 16 || base === 12 ? "default" : "numbers-and-punctuation"}
            returnKeyType="done"
          />
          {raw ? (
            <Pressable
              testID="bases-clear-button"
              onPress={() => {
                haptics.selection();
                setRaw("");
              }}
              style={styles.clearBtn}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={22} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
        {invalid ? (
          <Text style={styles.errorText} testID="bases-error">
            Not a valid {baseInfo.name.toLowerCase()} number
          </Text>
        ) : null}
      </View>

      <View style={styles.results}>
        {BASES.filter((b) => b.id !== base).map((b) => (
          <Pressable
            key={b.id}
            testID={`bases-result-${b.id}`}
            onPress={() => {
              haptics.selection();
              switchBase(String(b.id));
            }}
            style={styles.resultRow}
          >
            <View style={styles.resultBadge}>
              <Text style={styles.resultBadgeText}>{b.short}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.resultName}>{b.name}</Text>
              <Text style={styles.resultValue} numberOfLines={1} adjustsFontSizeToFit testID={`bases-result-${b.id}-value`}>
                {value === null ? "—" : formatBase(value, b.id, 8)}
              </Text>
            </View>
            <Ionicons name="arrow-up-circle-outline" size={20} color={colors.muted} />
          </Pressable>
        ))}
      </View>
      <Text style={styles.footnote}>
        Dozenal uses X for ten and E for eleven. Tap any result to make it the input base.
      </Text>
    </KeyboardAwareScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1 },
  content: { gap: spacing.md },
  inputCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  inputHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontFamily: fonts.textSemiBold, fontSize: 12, color: colors.muted, letterSpacing: 1.2 },
  hint: { fontFamily: fonts.text, fontSize: 12, color: colors.muted },
  inputRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  input: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 44,
    color: colors.brandSecondary,
    paddingVertical: spacing.sm,
    minHeight: 64,
  },
  inputInvalid: { color: colors.error },
  clearBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  errorText: { fontFamily: fonts.textMedium, fontSize: 13, color: colors.error },
  results: { marginHorizontal: spacing.lg, backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, overflow: "hidden" },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  resultBadge: {
    width: 44,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  resultBadgeText: { fontFamily: fonts.textSemiBold, fontSize: 11, color: colors.onBrandTertiary, letterSpacing: 1 },
  resultName: { fontFamily: fonts.text, fontSize: 12, color: colors.muted },
  resultValue: { fontFamily: fonts.displayMedium, fontSize: 28, color: colors.onSurface },
  footnote: { marginHorizontal: spacing.lg, fontFamily: fonts.text, fontSize: 13, color: colors.muted, lineHeight: 18 },
}));
