import Ionicons from "@react-native-vector-icons/ionicons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

import { ChipRow } from "@/src/components/chip-row";
import { formatBase, formatDecimal, parseBase } from "@/src/seximal/base";
import {
  CATEGORIES,
  NO_PREFIX,
  PREFIXES,
  Prefix,
  Unit,
  convertValue,
  unitLabel,
  unitSymbol,
} from "@/src/seximal/units";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { haptics } from "@/src/utils/haptics";

type Side = "from" | "to";
type InputBase = 6 | 10;
const MAGNITUDES = [...PREFIXES.filter((prefix) => prefix.power >= 0), ...PREFIXES.filter((prefix) => prefix.power < 0).reverse()];

export function UnitConverter({ bottomPadding }: { bottomPadding: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [catId, setCatId] = useState(CATEGORIES[0].id);
  const category = useMemo(() => CATEGORIES.find((c) => c.id === catId)!, [catId]);
  const [fromUnitId, setFromUnitId] = useState(category.units[0].id);
  const [toUnitId, setToUnitId] = useState(category.units[1].id);
  const [fromPrefix, setFromPrefix] = useState<Prefix>(NO_PREFIX);
  const [toPrefix, setToPrefix] = useState<Prefix>(NO_PREFIX);
  const [expanded, setExpanded] = useState<Side | null>(null);
  const [inputBase, setInputBase] = useState<InputBase>(6);
  const [inputSide, setInputSide] = useState<Side>("from");
  const [raw, setRaw] = useState("1");

  const fromUnit: Unit = category.units.find((u) => u.id === fromUnitId) ?? category.units[0];
  const toUnit: Unit = category.units.find((u) => u.id === toUnitId) ?? category.units[1];

  const enteredValue = parseBase(raw || "0", inputBase) ?? 0;
  const fromValue =
    inputSide === "from"
      ? enteredValue
      : convertValue(enteredValue, toUnit, toPrefix, fromUnit, fromPrefix);
  const toValue = convertValue(fromValue, fromUnit, fromPrefix, toUnit, toPrefix);

  const selectCategory = (id: string) => {
    const cat = CATEGORIES.find((c) => c.id === id)!;
    setCatId(id);
    setFromUnitId(cat.units[0].id);
    setToUnitId(cat.units[1].id);
    setFromPrefix(NO_PREFIX);
    setToPrefix(NO_PREFIX);
    setExpanded(null);
    setInputSide("from");
    setRaw("1");
    setInputBase(6);
  };

  const swap = () => {
    haptics.light();
    setFromUnitId(toUnitId);
    setToUnitId(fromUnitId);
    setFromPrefix(toPrefix);
    setToPrefix(fromPrefix);
    setRaw(formatBase(inputSide === "from" ? toValue : fromValue, inputBase, 6));
    setInputSide(inputSide === "from" ? "to" : "from");
  };

  const onChange = (text: string) => {
    const maxDigit = inputBase === 6 ? 5 : 9;
    let hasPoint = false;
    const cleaned = text
      .split("")
      .filter((character, index) => {
        if (character === "-" && index === 0) return true;
        if (character === "." && !hasPoint) {
          hasPoint = true;
          return true;
        }
        return character >= "0" && character <= String(maxDigit);
      })
      .join("")
      .slice(0, 14);
    setRaw(cleaned);
  };

  const toggleBase = () => {
    haptics.selection();
    const next: InputBase = inputBase === 6 ? 10 : 6;
    setRaw(enteredValue === 0 ? "" : formatBase(enteredValue, next, 6));
    setInputBase(next);
  };

  const renderBlock = (side: Side) => {
    const unit = side === "from" ? fromUnit : toUnit;
    const prefix = side === "from" ? fromPrefix : toPrefix;
    const setUnit = side === "from" ? setFromUnitId : setToUnitId;
    const setPrefix = side === "from" ? setFromPrefix : setToPrefix;
    const isOpen = expanded === side;
    const value = side === "from" ? fromValue : toValue;
    const isInput = inputSide === side;
    const shownBase = isInput ? inputBase : 6;
    const mainText = isInput ? raw : formatBase(value, 6, 6);
    const altText = shownBase === 6 ? `${formatDecimal(value, 8)} decimal` : `${formatBase(value, 6, 6)} seximal`;

    return (
      <View style={styles.block} testID={`convert-${side}-block`}>
        <View style={styles.blockHead}>
          <Text style={styles.blockLabel}>{side === "from" ? "FROM" : "TO"}</Text>
          {isInput ? (
            <Pressable onPress={toggleBase} style={styles.baseToggle} testID="convert-input-base-toggle">
              <Text style={styles.baseToggleText}>{inputBase === 6 ? "Seximal input" : "Decimal input"}</Text>
              <Ionicons name="repeat-outline" size={14} color={colors.brandSecondary} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          testID={`convert-${side}-unit-button`}
          onPress={() => {
            haptics.selection();
            setExpanded(isOpen ? null : side);
          }}
          style={styles.unitRow}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.unitName} testID={`convert-${side}-unit-name`}>
              {unitLabel(unit, prefix)}
            </Text>
            <Text style={styles.unitSymbol}>{unitSymbol(unit, prefix)}</Text>
          </View>
          <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.brand} />
        </Pressable>
        <TextInput
          style={[styles.value, isInput && styles.valueInput]}
          value={mainText || ""}
          onFocus={() => {
            if (!isInput) {
              setInputSide(side);
              setInputBase(6);
              setRaw(formatBase(value, 6, 6));
            }
          }}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          inputMode="decimal"
          selectTextOnFocus
          placeholder="0"
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          returnKeyType="done"
          testID={`convert-${side}-value`}
        />
        <Text style={styles.altValue} testID={`convert-${side}-alt`}>
          {altText}
        </Text>

        {unit.seximal ? (
          <View style={styles.prefixWrap} testID={`convert-${side}-magnitude`}>
            <Text style={styles.prefixTitle}>ORDER OF MAGNITUDE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prefixRow}>
              {MAGNITUDES.map((p) => {
                const active = p.power === prefix.power;
                return (
                  <Pressable
                    key={p.power}
                    testID={`convert-${side}-prefix-${p.name || "none"}`}
                    onPress={() => {
                      haptics.selection();
                      setPrefix(p);
                    }}
                    style={[styles.prefixChip, active && styles.prefixChipActive]}
                  >
                    <Text style={[styles.prefixName, active && styles.prefixNameActive]}>{p.name || "unit"}</Text>
                    <Text style={styles.prefixPow}>{p.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {isOpen ? (
          <Animated.View entering={FadeInDown.duration(160)} exiting={FadeOutUp.duration(120)} style={styles.picker}>
            {category.units.map((u) => {
              const active = u.id === unit.id;
              return (
                <Pressable
                  key={u.id}
                  testID={`convert-${side}-unit-option-${u.id}`}
                  onPress={() => {
                    haptics.light();
                    setUnit(u.id);
                    if (!u.seximal) setPrefix(NO_PREFIX);
                    setExpanded(null);
                  }}
                  style={[styles.pickerRow, active && styles.pickerRowActive]}
                >
                  <Text style={[styles.pickerName, active && styles.pickerNameActive]}>{u.name}</Text>
                  <Text style={styles.pickerSymbol}>{u.symbol}</Text>
                  {u.seximal ? (
                    <View style={styles.sexBadge}>
                      <Text style={styles.sexBadgeText}>SEX</Text>
                    </View>
                  ) : null}
                  {active ? <Ionicons name="checkmark" size={18} color={colors.brand} /> : null}
                </Pressable>
              );
            })}
          </Animated.View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <ChipRow
        options={CATEGORIES.map((c) => ({ value: c.id, label: c.name }))}
        value={catId}
        onChange={selectCategory}
        testID="convert-category-chip"
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + spacing.md }]}
        keyboardShouldPersistTaps="handled"
      >
        {renderBlock("from")}
        <View style={styles.swapRow}>
          <View style={styles.swapLine} />
          <Pressable onPress={swap} style={styles.swapBtn} testID="convert-swap-button">
            <Ionicons name="swap-vertical" size={20} color={colors.onBrand} />
          </Pressable>
          <View style={styles.swapLine} />
        </View>
        {renderBlock("to")}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  block: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  blockHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  blockLabel: { fontFamily: fonts.textSemiBold, fontSize: 12, color: colors.muted, letterSpacing: 1.2 },
  baseToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary,
  },
  baseToggleText: { fontFamily: fonts.textMedium, fontSize: 12, color: colors.onBrandTertiary },
  unitRow: { flexDirection: "row", alignItems: "center", minHeight: 36, gap: spacing.sm },
  unitName: { fontFamily: fonts.textSemiBold, fontSize: 18, color: colors.onSurfaceSecondary, textTransform: "capitalize" },
  unitSymbol: { fontFamily: fonts.text, fontSize: 13, color: colors.muted },
  value: {
    fontFamily: fonts.display,
    fontSize: 38,
    lineHeight: 44,
    minHeight: 48,
    paddingVertical: 0,
    color: colors.onSurface,
    textAlign: "right",
  },
  valueInput: { color: colors.brandSecondary },
  altValue: { fontFamily: fonts.text, fontSize: 13, color: colors.muted, textAlign: "right" },
  picker: { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.sm },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    gap: spacing.sm,
  },
  pickerRowActive: { backgroundColor: colors.surfaceTertiary },
  pickerName: { flex: 1, fontFamily: fonts.textMedium, fontSize: 15, color: colors.onSurfaceSecondary, textTransform: "capitalize" },
  pickerNameActive: { color: colors.brandSecondary },
  pickerSymbol: { fontFamily: fonts.text, fontSize: 13, color: colors.muted },
  sexBadge: { backgroundColor: colors.brandTertiary, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  sexBadgeText: { fontFamily: fonts.textSemiBold, fontSize: 10, color: colors.onBrandTertiary, letterSpacing: 1 },
  prefixWrap: { marginTop: spacing.xs, gap: spacing.xs },
  prefixTitle: { fontFamily: fonts.textSemiBold, fontSize: 11, color: colors.muted, letterSpacing: 1.2 },
  prefixRow: { gap: spacing.sm },
  prefixChip: {
    height: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  prefixChipActive: { borderColor: colors.brand, backgroundColor: colors.brandTertiary },
  prefixName: { fontFamily: fonts.textSemiBold, fontSize: 13, color: colors.onSurfaceTertiary },
  prefixNameActive: { color: colors.onBrandTertiary },
  prefixPow: { fontFamily: fonts.text, fontSize: 11, color: colors.muted },
  swapRow: { flexDirection: "row", alignItems: "center", height: 44, gap: spacing.md },
  swapLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  swapBtn: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
}));
