// Base-6 calculator engine. Expression state is a token list:
// number tokens are seximal strings (may start with "-"), operator tokens are one of OPS.
import { fromSeximal, toSeximal } from "./base";

export const OPS = ["+", "−", "×", "÷", "xʸ", "ʸ√x"] as const;
export type Op = (typeof OPS)[number];

export const CONSTANTS = {
  e: Math.E,
  π: Math.PI,
  φ: (1 + Math.sqrt(5)) / 2,
  τ: Math.PI * 2,
} as const;
export type Constant = keyof typeof CONSTANTS;
export type UnaryOp = "ln(x)" | "eˣ";

export type CalcState = {
  tokens: string[];
  justEvaluated: boolean;
  error: string | null;
};

export const initialCalcState: CalcState = { tokens: [], justEvaluated: false, error: null };

export const isOp = (t: string): t is Op => (OPS as readonly string[]).includes(t);

const prec: Record<Op, number> = { "+": 1, "−": 1, "×": 2, "÷": 2, "xʸ": 3, "ʸ√x": 3 };

export const isConstant = (t: string): t is Constant => t in CONSTANTS;

function apply(op: Op, a: number, b: number): number {
  switch (op) {
    case "+":
      return a + b;
    case "−":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return a / b;
    case "xʸ":
      return Math.pow(a, b);
    case "ʸ√x": {
      if (b === 0) return NaN;
      if (a < 0) {
        if (!Number.isInteger(b) || Math.abs(b % 2) !== 1) return NaN;
        return -Math.pow(-a, 1 / b);
      }
      return Math.pow(a, 1 / b);
    }
  }
}

/** Evaluate a token list. Returns a decimal number or throws. */
export function evaluateTokens(tokens: string[]): number {
  const toks = [...tokens];
  while (toks.length && isOp(toks[toks.length - 1])) toks.pop();
  if (!toks.length) return 0;
  const values: number[] = [];
  const ops: Op[] = [];
  const reduce = () => {
    const op = ops.pop()!;
    const b = values.pop()!;
    const a = values.pop()!;
    values.push(apply(op, a, b));
  };
  for (const t of toks) {
    if (isOp(t)) {
      // Powers and roots associate right-to-left: 2 xʸ 3 xʸ 2 = 2^(3^2).
      while (ops.length && (prec[ops[ops.length - 1]] > prec[t] || (prec[ops[ops.length - 1]] === prec[t] && prec[t] < 3))) reduce();
      ops.push(t);
    } else {
      const v = isConstant(t) ? CONSTANTS[t] : fromSeximal(t === "-" ? "0" : t);
      if (v === null) throw new Error("Invalid number");
      values.push(v);
    }
  }
  while (ops.length) reduce();
  const result = values[0];
  if (!Number.isFinite(result)) throw new Error("Undefined result");
  return result;
}

export type CalcKey = "0" | "1" | "2" | "3" | "4" | "5" | "." | Op | Constant | UnaryOp | "=" | "AC" | "⌫" | "±";

export function pressKey(state: CalcState, key: CalcKey): CalcState & { evaluated?: { expr: string; result: number } } {
  const tokens = [...state.tokens];
  const last = tokens[tokens.length - 1];
  const lastIsNum = last !== undefined && !isOp(last);
  const lastIsEditableNum = lastIsNum && !isConstant(last);

  if (key === "AC") return { ...initialCalcState };

  if (key === "⌫") {
    if (state.justEvaluated) return { ...initialCalcState };
    if (!tokens.length) return state;
    if (lastIsEditableNum && last.length > 1) tokens[tokens.length - 1] = last.slice(0, -1);
    else tokens.pop();
    if (tokens.length && tokens[tokens.length - 1] === "-") tokens.pop();
    return { tokens, justEvaluated: false, error: null };
  }

  if (key === "=") {
    if (!tokens.length) return state;
    try {
      const result = evaluateTokens(tokens);
      const expr = tokens.filter((t, i) => !(i === tokens.length - 1 && isOp(t))).join(" ");
      return { tokens: [toSeximal(result, 8)], justEvaluated: true, error: null, evaluated: { expr, result } };
    } catch (e) {
      return { tokens: [], justEvaluated: false, error: e instanceof Error ? e.message : "Error" };
    }
  }

  if (isOp(key)) {
    if (!tokens.length) {
      if (key === "−") return { tokens: ["-"], justEvaluated: false, error: null };
      return state;
    }
    if (lastIsNum) tokens.push(key);
    else tokens[tokens.length - 1] = key;
    return { tokens, justEvaluated: false, error: null };
  }

  if (key === "±") {
    if (!lastIsNum) return state;
    const value = isConstant(last) ? CONSTANTS[last] : fromSeximal(last);
    if (value === null) return state;
    tokens[tokens.length - 1] = toSeximal(-value, 12);
    return { tokens, justEvaluated: false, error: null };
  }

  if (key === "ln(x)" || key === "eˣ") {
    if (!lastIsNum) return state;
    const value = isConstant(last) ? CONSTANTS[last] : fromSeximal(last);
    if (value === null) return state;
    const result = key === "ln(x)" ? Math.log(value) : Math.exp(value);
    if (!Number.isFinite(result)) {
      return { tokens: [], justEvaluated: false, error: key === "ln(x)" ? "ln requires a positive number" : "Undefined result" };
    }
    tokens[tokens.length - 1] = toSeximal(result, 12);
    return { tokens, justEvaluated: false, error: null };
  }

  if (isConstant(key)) {
    if (state.justEvaluated || !tokens.length) return { tokens: [key], justEvaluated: false, error: null };
    if (!lastIsNum) tokens.push(key);
    else tokens[tokens.length - 1] = key;
    return { tokens, justEvaluated: false, error: null };
  }

  // digit or "."
  if (state.justEvaluated) {
    return { tokens: [key === "." ? "0." : key], justEvaluated: false, error: null };
  }
  if (lastIsEditableNum) {
    if (key === "." && last.includes(".")) return state;
    if (last === "0" && key !== ".") tokens[tokens.length - 1] = key;
    else if (last === "-0" && key !== ".") tokens[tokens.length - 1] = "-" + key;
    else if (last.replace("-", "").length >= 14) return state;
    else tokens[tokens.length - 1] = last + key;
  } else if (!lastIsNum) {
    tokens.push(key === "." ? "0." : key);
  }
  return { tokens, justEvaluated: false, error: null };
}

export function displayExpression(tokens: string[]): string {
  if (!tokens.length) return "0";
  return tokens.join(" ");
}
