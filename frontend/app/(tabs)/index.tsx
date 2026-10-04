import Ionicons from "@react-native-vector-icons/ionicons";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyDef, Keypad } from "@/src/components/keypad";
import { usesNativeTabs } from "@/src/navigation";
import { formatDecimal, fromSeximal } from "@/src/seximal/base";
import { CalcKey, CalcState, formatCalculatorExpression, initialCalcState, pressKey } from "@/src/seximal/calc";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { haptics } from "@/src/utils/haptics";
import { storage } from "@/src/utils/storage";

type HistoryItem = { expr: string; result: string; decimal: string };
const HISTORY_KEY = "seximal.calc.history";

const ROWS: KeyDef[][] = [
  [
    { key: "xʸ", variant: "action" },
    { key: "ʸ√x", variant: "action" },
    { key: "ln(x)", variant: "action" },
    { key: "eˣ", variant: "action" },
  ],
  [
    { key: "e", variant: "action" },
    { key: "π", variant: "action" },
    { key: "φ", variant: "action" },
    { key: "τ", variant: "action" },
  ],
  [
    { key: "AC", variant: "action" },
    { key: "⌫", icon: "backspace-outline", variant: "action" },
    { key: "÷", variant: "operator" },
    { key: "×", variant: "operator" },
  ],
  [{ key: "3" }, { key: "4" }, { key: "5" }, { key: "−", variant: "operator" }],
  [{ key: "0" }, { key: "1" }, { key: "2" }, { key: "+", variant: "operator" }],
  [{ key: "±" }, { key: "." }, { key: "=", variant: "primary", span: 2 }],
];

export default function CalcScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const [state, setState] = useState<CalcState>(initialCalcState);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const historyRef = useRef<ScrollView>(null);

  useEffect(() => {
    storage.getItem(HISTORY_KEY, "[]").then((raw) => {
      try {
        setHistory(JSON.parse(raw ?? "[]"));
      } catch {
        setHistory([]);
      }
    });
  }, []);

  const saveHistory = (items: HistoryItem[]) => {
    setHistory(items);
    storage.setItem(HISTORY_KEY, JSON.stringify(items));
  };

  const onKey = (key: string) => {
    const next = pressKey(state, key as CalcKey);
    if (next.evaluated) {
      haptics.light();
      const item: HistoryItem = {
        expr: next.evaluated.expr,
        result: next.tokens[0],
        decimal: formatDecimal(next.evaluated.result, 8),
      };
      saveHistory([...history, item].slice(-30));
      requestAnimationFrame(() => historyRef.current?.scrollToEnd({ animated: true }));
    }
    const { evaluated: _e, ...rest } = next;
    setState(rest);
  };

  const exprText = formatCalculatorExpression(state.tokens);
  const lastToken = state.tokens[state.tokens.length - 1];
  const currentValue = lastToken && !["+", "−", "×", "÷"].includes(lastToken) ? fromSeximal(lastToken) : null;
  const decimalHint =
    currentValue !== null && currentValue !== undefined ? `${formatDecimal(currentValue, 8)} in decimal` : " ";

  return (
    <View style={styles.screen} testID="calc-screen">
      <Pressable
        testID="calc-clear-history-button"
        onPress={() => saveHistory([])}
        hitSlop={8}
        style={[styles.iconBtn, { top: insets.top + spacing.xs }]}
      >
        <Ionicons name="trash-outline" size={20} color={colors.muted} />
      </Pressable>

      <ScrollView
        ref={historyRef}
        style={styles.history}
        contentContainerStyle={[styles.historyContent, { paddingTop: insets.top + spacing.md }]}
        testID="calc-history-list"
      >
        {history.length === 0 ? (
          <Text style={styles.historyEmpty} testID="calc-history-empty">
            Base-6 only · digits 0–5 · after 5 comes 10
          </Text>
        ) : (
          history.map((h, i) => (
            <Pressable
              key={i}
              testID={`calc-history-item-${i}`}
              onPress={() => {
                haptics.selection();
                setState({ tokens: [h.result], justEvaluated: true, error: null });
              }}
              style={styles.historyItem}
            >
              <Text style={styles.historyExpr}>{formatCalculatorExpression(h.expr.split(" "))} =</Text>
              <Text style={styles.historyResult}>{h.result}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      <View style={styles.display}>
        <Text
          style={styles.expr}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          testID="calc-display"
        >
          {state.error ?? exprText}
        </Text>
        <Text style={styles.hint} testID="calc-decimal-hint">
          {state.error ? "Press AC to start again" : decimalHint}
        </Text>
      </View>

      <View style={[styles.keypadWrap, { paddingBottom: bottomChrome + spacing.lg }]}>
        <Keypad rows={ROWS} onPress={onKey} keyHeight={54} testIDPrefix="calc-key" />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  iconBtn: {
    position: "absolute",
    right: spacing.md,
    zIndex: 1,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  history: { flex: 1 },
  historyContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm, justifyContent: "flex-end", flexGrow: 1 },
  historyEmpty: { fontFamily: fonts.text, fontSize: 14, color: colors.muted, textAlign: "right" },
  historyItem: { alignItems: "flex-end" },
  historyExpr: { fontFamily: fonts.displayRegular, fontSize: 18, color: colors.muted },
  historyResult: { fontFamily: fonts.displayMedium, fontSize: 22, color: colors.onSurface },
  display: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  expr: { fontFamily: fonts.display, fontSize: 64, lineHeight: 72, color: colors.brandSecondary, textAlign: "right" },
  hint: { fontFamily: fonts.text, fontSize: 14, color: colors.muted, marginTop: spacing.xs },
  keypadWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
}));
