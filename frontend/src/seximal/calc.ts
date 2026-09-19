// Base-6 calculator engine. Expression state is a token list:
// number tokens are seximal strings (may start with "-"), operator tokens are one of OPS.
import { fromSeximal, toSeximal } from "./base";

export const OPS = ["+", "−", "×", "÷"] as const;
export type Op = (typeof OPS)[number];

export type CalcState = {
  tokens: string[];
  justEvaluated: boolean;
  error: string | null;
};

export const initialCalcState: CalcState = { tokens: [], justEvaluated: false, error: null };

export const isOp = (t: string): t is Op => (OPS as readonly string[]).includes(t);

const prec: Record<Op, number> = { "+": 1, "−": 1, "×": 2, "÷": 2 };

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
      while (ops.length && prec[ops[ops.length - 1]] >= prec[t]) reduce();
      ops.push(t);
    } else {
      const v = fromSeximal(t === "-" ? "0" : t);
      if (v === null) throw new Error("Invalid number");
      values.push(v);
    }
  }
  while (ops.length) reduce();
  const result = values[0];
  if (!Number.isFinite(result)) throw new Error("Cannot divide by zero");
  return result;
}

export type CalcKey = "0" | "1" | "2" | "3" | "4" | "5" | "." | Op | "=" | "AC" | "⌫" | "±";

export function pressKey(state: CalcState, key: CalcKey): CalcState & { evaluated?: { expr: string; result: number } } {
  const tokens = [...state.tokens];
  const last = tokens[tokens.length - 1];
  const lastIsNum = last !== undefined && !isOp(last);

  if (key === "AC") return { ...initialCalcState };

  if (key === "⌫") {
    if (state.justEvaluated) return { ...initialCalcState };
    if (!tokens.length) return state;
    if (lastIsNum && last.length > 1) tokens[tokens.length - 1] = last.slice(0, -1);
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
    tokens[tokens.length - 1] = last.startsWith("-") ? last.slice(1) : "-" + last;
    return { tokens, justEvaluated: false, error: null };
  }

  // digit or "."
  if (state.justEvaluated) {
    return { tokens: [key === "." ? "0." : key], justEvaluated: false, error: null };
  }
  if (lastIsNum) {
    if (key === "." && last.includes(".")) return state;
    if (last === "0" && key !== ".") tokens[tokens.length - 1] = key;
    else if (last === "-0" && key !== ".") tokens[tokens.length - 1] = "-" + key;
    else if (last.replace("-", "").length >= 14) return state;
    else tokens[tokens.length - 1] = last + key;
  } else {
    tokens.push(key === "." ? "0." : key);
  }
  return { tokens, justEvaluated: false, error: null };
}

export function displayExpression(tokens: string[]): string {
  if (!tokens.length) return "0";
  return tokens.join(" ");
}
