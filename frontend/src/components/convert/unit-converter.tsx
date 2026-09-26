import Ionicons from "@react-native-vector-icons/ionicons";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

import { formatBase, formatDecimal, parseBase } from "@/src/seximal/base";
import { CATEGORIES, NO_PREFIX, Unit, convertValue } from "@/src/seximal/units";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { haptics } from "@/src/utils/haptics";

type Side = "from" | "to";
type InputBase = 6 | 10;
type UnitGroup = "Seximal" | "Metric & SI" | "US & Imperial" | "Other";

const IMPERIAL_IDS = new Set([
  "in", "ft", "yd", "mi", "in2", "ft2", "yd2", "acre", "mi2", "floz", "tsp", "tbsp", "cup", "pt", "qt", "gal",
  "in3", "ft3", "yd3", "mph", "fps", "oz", "lb", "st", "short-ton", "lbf", "ozf", "kip", "psi", "inhg", "f", "r", "hp", "btuh", "ftlbs", "btu", "ftlb",
]);

function groupFor(unit: Unit): UnitGroup {
  if (unit.seximal) return "Seximal";
  if (IMPERIAL_IDS.has(unit.id)) return "US & Imperial";
  if (["day", "week", "yr", "nmi", "kn", "mach", "g", "atm", "torr", "rpm", "bpm"].includes(unit.id)) return "Other";
  return "Metric & SI";
}

export function UnitConverter({ bottomPadding, onEditingChange }: { bottomPadding: number; onEditingChange?: (editing: boolean) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [catId, setCatId] = useState("length");
  const category = useMemo(() => CATEGORIES.find((c) => c.id === catId) ?? CATEGORIES[0], [catId]);
  const [fromUnitId, setFromUnitId] = useState("m");
  const [toUnitId, setToUnitId] = useState("ft");
  const [inputSide, setInputSide] = useState<Side>("from");
  const [inputBase, setInputBase] = useState<InputBase>(10);
  const [raw, setRaw] = useState("1");
  const [dimensionsOpen, setDimensionsOpen] = useState(false);
  const [unitPicker, setUnitPicker] = useState<Side | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    onEditingChange?.(editing);
  }, [editing, onEditingChange]);

  const fromUnit = category.units.find((u) => u.id === fromUnitId) ?? category.units[0];
  const toUnit = category.units.find((u) => u.id === toUnitId) ?? category.units[1];
  const entered = parseBase(raw || "0", inputBase) ?? 0;
  const fromValue = inputSide === "from" ? entered : convertValue(entered, toUnit, NO_PREFIX, fromUnit, NO_PREFIX);
  const toValue = convertValue(fromValue, fromUnit, NO_PREFIX, toUnit, NO_PREFIX);

  const selectCategory = (id: string) => {
    const next = CATEGORIES.find((c) => c.id === id)!;
    setCatId(id);
    setFromUnitId(next.units[0].id);
    setToUnitId(next.units[1].id);
    setInputSide("from");
    setInputBase(6);
    setRaw("1");
    setDimensionsOpen(false);
  };

  const startEditing = (side: Side) => {
    const value = side === "from" ? fromValue : toValue;
    const unit = side === "from" ? fromUnit : toUnit;
    const preferredBase: InputBase = unit.seximal ? 6 : 10;
    setInputSide(side);
    setInputBase(preferredBase);
    setRaw(preferredBase === 6 ? formatBase(value, 6, 6) : formatDecimal(value, 8));
    setEditing(true);
  };

  const toggleBase = () => {
    const next: InputBase = inputBase === 6 ? 10 : 6;
    setRaw(entered === 0 ? "" : formatBase(entered, next, 6));
    setInputBase(next);
    haptics.selection();
  };

  const keyPress = (key: string) => {
    haptics.selection();
    if (key === "clear") return setRaw("");
    if (key === "back") return setRaw((value) => value.slice(0, -1));
    if (key === "done") return setEditing(false);
    setRaw((value) => {
      if (key === "." && value.includes(".")) return value;
      if (value.length >= 14) return value;
      return value === "0" && key !== "." ? key : value + key;
    });
  };

  const swap = () => {
    setFromUnitId(toUnit.id);
    setToUnitId(fromUnit.id);
    setRaw(formatBase(inputSide === "from" ? toValue : fromValue, inputBase, 6));
    setInputSide(inputSide === "from" ? "to" : "from");
    haptics.light();
  };

  const panel = (side: Side) => {
    const unit = side === "from" ? fromUnit : toUnit;
    const value = side === "from" ? fromValue : toValue;
    const active = side === inputSide;
    const displayBase: InputBase = active ? inputBase : unit.seximal ? 6 : 10;
    const displayed = active ? raw || "0" : displayBase === 6 ? formatBase(value, 6, 6) : formatDecimal(value, 8);
    return (
      <View style={[styles.valuePanel, editing && styles.valuePanelEditing, active && styles.valuePanelActive]} testID={`convert-${side}-block`}>
        <View style={styles.panelTop}>
          <Pressable style={styles.unitButton} onPress={() => setUnitPicker(side)} testID={`convert-${side}-unit-button`}>
            <View style={styles.unitIcon}><Text style={styles.unitIconText}>{unit.symbol}</Text></View>
            <View style={styles.unitCopy}><Text style={styles.unitName} testID={`convert-${side}-unit-name`}>{unit.name}</Text></View>
            <Ionicons name="chevron-down" size={19} color={colors.brandSecondary} />
          </Pressable>
        </View>
        <Pressable style={styles.numberButton} onPress={() => startEditing(side)} testID={`convert-${side}-value`}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.value, active && styles.valueActive]}>{displayed}</Text>
          <Text style={styles.symbol}>{unit.symbol}</Text>
        </Pressable>
        <Text style={styles.altValue} testID={`convert-${side}-alt`}>
          {displayBase === 6 ? `${formatDecimal(value, 8)} decimal` : `${formatBase(value, 6, 6)} seximal`}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <Pressable style={[styles.dimensionHeader, editing && styles.dimensionHeaderEditing]} onPress={() => setDimensionsOpen(true)} testID="convert-dimension-button">
        <View style={styles.dimensionIcon}><Ionicons name={category.icon as any} size={24} color={colors.onBrand} /></View>
        <View style={{ flex: 1 }}>{!editing ? <Text style={styles.dimensionOverline}>DIMENSION</Text> : null}<Text style={styles.dimensionTitle}>{category.name}</Text></View>
        {!editing ? <><Text style={styles.changeText}>Change</Text><Ionicons name="chevron-down" size={20} color={colors.brandSecondary} /></> : null}
      </Pressable>

      <ScrollView scrollEnabled={!editing} style={styles.scroll} contentContainerStyle={[styles.content, editing && styles.contentEditing, { paddingBottom: editing ? spacing.sm : bottomPadding + spacing.lg }]}>
        {panel("from")}
        <View style={styles.swapWrap}>
          <View style={styles.line} />
          <Pressable onPress={swap} style={styles.swap} testID="convert-swap-button"><Ionicons name="swap-vertical" size={22} color={colors.onBrand} /></Pressable>
          <View style={styles.line} />
        </View>
        {panel("to")}
      </ScrollView>

      {editing ? <ConversionKeypad base={inputBase} onToggleBase={toggleBase} onPress={keyPress} /> : null}
      <DimensionModal visible={dimensionsOpen} selected={catId} onClose={() => setDimensionsOpen(false)} onSelect={selectCategory} />
      <UnitModal side={unitPicker} units={category.units} selected={unitPicker === "from" ? fromUnit.id : toUnit.id} onClose={() => setUnitPicker(null)} onSelect={(unit) => {
        if (unitPicker === inputSide) {
          const preferredBase: InputBase = unit.seximal ? 6 : 10;
          setRaw(preferredBase === 6 ? formatBase(entered, 6, 6) : formatDecimal(entered, 8));
          setInputBase(preferredBase);
        }
        if (unitPicker === "from") setFromUnitId(unit.id); else setToUnitId(unit.id);
        setUnitPicker(null);
      }} />
    </View>
  );
}

function ConversionKeypad({ base, onToggleBase, onPress }: { base: InputBase; onToggleBase: () => void; onPress: (key: string) => void }) {
  const styles = useStyles();
  const digits = base === 6 ? [["1", "2", "3"], ["4", "5", "."], ["0"]] : [["7", "8", "9"], ["4", "5", "6"], ["1", "2", "3"], ["0", "."]];
  return <View style={styles.keypad} testID="convert-keypad">
    <View style={styles.keypadTop}><Text style={styles.keypadTitle}>ENTER VALUE</Text><Pressable onPress={onToggleBase} style={styles.baseButton} testID="convert-input-base-toggle"><Text style={styles.baseText}>{base === 6 ? "BASE 6 · SEXIMAL" : "BASE 10 · DECIMAL"}</Text><Ionicons name="repeat" size={16} style={styles.baseText} /></Pressable></View>
    <View style={styles.keysBody}><View style={styles.digitGrid}>{digits.map((row, i) => <View style={styles.keyRow} key={i}>{row.map((key) => <Pressable key={key} onPress={() => onPress(key)} style={({ pressed }) => [styles.key, pressed && styles.pressed]} testID={`convert-key-${key === "." ? "point" : key}`}><Text style={styles.keyText}>{key}</Text></Pressable>)}</View>)}</View>
      <View style={styles.actionColumn}><Pressable style={styles.actionKey} onPress={() => onPress("back")} testID="convert-key-backspace"><Ionicons name="backspace-outline" size={25} style={styles.actionText} /></Pressable><Pressable style={styles.actionKey} onPress={() => onPress("clear")} testID="convert-key-clear"><Text style={styles.actionText}>C</Text></Pressable><Pressable style={styles.doneKey} onPress={() => onPress("done")} testID="convert-key-done"><Ionicons name="checkmark" size={26} style={styles.doneText} /><Text style={styles.doneText}>OK</Text></Pressable></View>
    </View>
  </View>;
}

function DimensionModal({ visible, selected, onClose, onSelect }: { visible: boolean; selected: string; onClose: () => void; onSelect: (id: string) => void }) {
  const styles = useStyles(); const { colors } = useTheme();
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalRoot}><Pressable style={styles.scrim} onPress={onClose} /><View style={styles.sheet}>
    <View style={styles.sheetHead}><View><Text style={styles.sheetEyebrow}>CONVERT</Text><Text style={styles.sheetTitle}>Choose a dimension</Text></View><Pressable style={styles.close} onPress={onClose}><Ionicons name="close" size={23} color={colors.onSurface} /></Pressable></View>
    <ScrollView contentContainerStyle={styles.dimensionGrid}>{CATEGORIES.map((cat) => <Pressable key={cat.id} testID={`convert-category-${cat.id}`} onPress={() => onSelect(cat.id)} style={[styles.dimensionCard, selected === cat.id && styles.dimensionCardActive]}><View style={[styles.categoryIcon, selected === cat.id && styles.categoryIconActive]}><Ionicons name={cat.icon as any} size={25} color={selected === cat.id ? colors.onBrand : colors.brandSecondary} /></View><Text style={[styles.categoryName, selected === cat.id && styles.categoryNameActive]}>{cat.name}</Text>{selected === cat.id ? <Ionicons name="checkmark-circle" size={18} color={colors.brand} /> : null}</Pressable>)}</ScrollView>
  </View></View></Modal>;
}

function UnitModal({ side, units, selected, onClose, onSelect }: { side: Side | null; units: Unit[]; selected: string; onClose: () => void; onSelect: (unit: Unit) => void }) {
  const styles = useStyles(); const { colors } = useTheme();
  const groups: UnitGroup[] = ["Seximal", "Metric & SI", "US & Imperial", "Other"];
  return <Modal visible={side !== null} transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalRoot}><Pressable style={styles.scrim} onPress={onClose} /><View style={styles.sheet}>
    <View style={styles.sheetHead}><View><Text style={styles.sheetEyebrow}>{side === "from" ? "CONVERT FROM" : "CONVERT TO"}</Text><Text style={styles.sheetTitle}>Choose a unit</Text></View><Pressable style={styles.close} onPress={onClose}><Ionicons name="close" size={23} color={colors.onSurface} /></Pressable></View>
    <ScrollView contentContainerStyle={styles.unitList}>{groups.map((group) => { const choices = units.filter((unit) => groupFor(unit) === group); if (!choices.length) return null; return <View key={group} style={styles.group}><View style={styles.groupHead}><Ionicons name={group === "Seximal" ? "sparkles" : group === "Metric & SI" ? "globe-outline" : group === "US & Imperial" ? "flag-outline" : "apps-outline"} size={17} color={colors.brandSecondary} /><Text style={styles.groupTitle}>{group}</Text></View><View style={styles.unitChips}>{choices.map((unit) => <Pressable key={unit.id} testID={`convert-${side}-unit-option-${unit.id}`} onPress={() => onSelect(unit)} style={[styles.unitChip, selected === unit.id && styles.unitChipActive]}><Text style={[styles.unitChipName, selected === unit.id && styles.unitChipNameActive]}>{unit.name}</Text><Text style={styles.unitChipSymbol}>{unit.symbol}</Text></Pressable>)}</View></View>; })}</ScrollView>
  </View></View></Modal>;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1 }, scroll: { flex: 1 }, content: { padding: spacing.lg }, contentEditing: { paddingTop: spacing.xs, paddingBottom: spacing.sm },
  dimensionHeader: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, minHeight: 70, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.borderStrong, flexDirection: "row", alignItems: "center", gap: spacing.md },
  dimensionHeaderEditing: { minHeight: 52, paddingVertical: spacing.xs, borderWidth: 0, backgroundColor: colors.surface, marginBottom: 0 },
  dimensionIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" }, dimensionOverline: { color: colors.muted, fontFamily: fonts.textSemiBold, fontSize: 10, letterSpacing: 1.5 }, dimensionTitle: { color: colors.onSurface, fontFamily: fonts.display, fontSize: 27 }, changeText: { color: colors.brandSecondary, fontFamily: fonts.textSemiBold, fontSize: 12 },
  valuePanel: { borderRadius: radius.lg, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, padding: spacing.md }, valuePanelEditing: { paddingVertical: spacing.sm }, valuePanelActive: { borderColor: colors.brandPrimary }, panelTop: { flexDirection: "row" }, unitButton: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm }, unitIcon: { minWidth: 42, height: 34, paddingHorizontal: 7, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary, justifyContent: "center", alignItems: "center" }, unitIconText: { color: colors.brandSecondary, fontFamily: fonts.display, fontSize: 18 }, unitCopy: { flex: 1 }, panelEyebrow: { color: colors.muted, fontFamily: fonts.textSemiBold, fontSize: 10, letterSpacing: 1.3 }, unitName: { color: colors.onSurfaceSecondary, fontFamily: fonts.textSemiBold, fontSize: 16, textTransform: "capitalize" }, numberButton: { minHeight: 62, flexDirection: "row", justifyContent: "flex-end", alignItems: "baseline", gap: spacing.sm }, value: { color: colors.onSurface, fontFamily: fonts.displayRegular, fontSize: 48, maxWidth: "82%" }, valueActive: { color: colors.brandSecondary }, symbol: { color: colors.muted, fontFamily: fonts.displayRegular, fontSize: 25 }, altValue: { textAlign: "right", color: colors.muted, fontFamily: fonts.text, fontSize: 13 }, swapWrap: { height: 48, flexDirection: "row", alignItems: "center", gap: spacing.md }, line: { height: 1, backgroundColor: colors.divider, flex: 1 }, swap: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  keypad: { backgroundColor: colors.surfaceSecondary, borderTopWidth: 1, borderTopColor: colors.borderStrong, padding: spacing.sm, paddingBottom: spacing.md, gap: spacing.sm }, keypadTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.xs }, keypadTitle: { color: colors.muted, fontFamily: fonts.textSemiBold, fontSize: 10, letterSpacing: 1.3 }, baseButton: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.brandTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.md, height: 28 }, baseText: { color: colors.onBrandTertiary, fontFamily: fonts.textSemiBold, fontSize: 11 }, keysBody: { flexDirection: "row", gap: spacing.sm }, digitGrid: { flex: 3, gap: 5, justifyContent: "space-between" }, keyRow: { flexDirection: "row", gap: 5, flex: 1 }, key: { flex: 1, minHeight: 38, borderRadius: radius.sm, backgroundColor: colors.keyDigit, alignItems: "center", justifyContent: "center" }, keyText: { color: colors.onSurface, fontFamily: fonts.displayMedium, fontSize: 25 }, pressed: { opacity: .55 }, actionColumn: { width: 82, gap: 5 }, actionKey: { minHeight: 38, flex: 1, backgroundColor: colors.surfaceTertiary, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" }, actionText: { color: colors.brandSecondary, fontFamily: fonts.displayMedium, fontSize: 23 }, doneKey: { flex: 2, minHeight: 50, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" }, doneText: { color: colors.onBrand, fontFamily: fonts.textSemiBold, fontSize: 13 },
  modalRoot: { flex: 1, justifyContent: "flex-end" }, scrim: { ...({ position: "absolute", inset: 0 } as any), backgroundColor: colors.scrim }, sheet: { maxHeight: "88%", backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: colors.borderStrong, paddingTop: spacing.lg }, sheetHead: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, sheetEyebrow: { color: colors.brandSecondary, fontFamily: fonts.textSemiBold, letterSpacing: 1.5, fontSize: 11 }, sheetTitle: { color: colors.onSurface, fontFamily: fonts.display, fontSize: 30 }, close: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  dimensionGrid: { padding: spacing.lg, paddingTop: spacing.xs, flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingBottom: spacing["3xl"] }, dimensionCard: { width: "48%", minHeight: 76, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: spacing.sm }, dimensionCardActive: { borderColor: colors.brand, backgroundColor: colors.brandTertiary }, categoryIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" }, categoryIconActive: { backgroundColor: colors.brand }, categoryName: { flex: 1, color: colors.onSurfaceTertiary, fontFamily: fonts.textSemiBold, fontSize: 15 }, categoryNameActive: { color: colors.onBrandTertiary },
  unitList: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing["3xl"], gap: spacing.lg }, group: { gap: spacing.sm }, groupHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm }, groupTitle: { color: colors.onSurface, fontFamily: fonts.display, fontSize: 21 }, unitChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, unitChip: { minWidth: "47%", flexGrow: 1, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.border }, unitChipActive: { backgroundColor: colors.brandTertiary, borderColor: colors.brand }, unitChipName: { color: colors.onSurfaceTertiary, fontFamily: fonts.textSemiBold, fontSize: 14, textTransform: "capitalize" }, unitChipNameActive: { color: colors.onBrandTertiary }, unitChipSymbol: { color: colors.muted, fontFamily: fonts.text, fontSize: 12, marginTop: 2 },
}));
