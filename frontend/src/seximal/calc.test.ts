import assert from "node:assert/strict";
import test from "node:test";

import { CONSTANTS, CalcKey, evaluateTokens, formatCalculatorExpression, initialCalcState, pressKey } from "./calc";
import { fromSeximal } from "./base";

const closeTo = (actual: number, expected: number, tolerance = 1e-10) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be close to ${expected}`);

function enter(keys: CalcKey[]) {
  return keys.reduce((state, key) => {
    const { evaluated: _evaluated, ...next } = pressKey(state, key);
    return next;
  }, initialCalcState);
}

test("exponentiation uses seximal operands and standard precedence", () => {
  assert.equal(evaluateTokens(["2", "xʸ", "3"]), 8);
  assert.equal(evaluateTokens(["2", "+", "3", "xʸ", "2"]), 11);
  assert.equal(evaluateTokens(["2", "xʸ", "3", "xʸ", "2"]), 512);
});

test("radicals treat the first operand as the radicand and second as the degree", () => {
  assert.equal(evaluateTokens(["4", "ʸ√x", "2"]), 2);
  assert.equal(evaluateTokens(["43", "ʸ√x", "3"]), 3);
  assert.equal(evaluateTokens(["-43", "ʸ√x", "3"]), -3);
  assert.throws(() => evaluateTokens(["-4", "ʸ√x", "2"]), /Undefined result/);
  assert.throws(() => evaluateTokens(["4", "ʸ√x", "0"]), /Undefined result/);
});

test("scientific constants retain their symbols and evaluate accurately", () => {
  for (const [symbol, value] of Object.entries(CONSTANTS)) {
    const state = pressKey(initialCalcState, symbol as CalcKey);
    assert.deepEqual(state.tokens, [symbol]);
    closeTo(evaluateTokens(state.tokens), value);
  }
  closeTo(evaluateTokens(["τ", "÷", "π"]), 2);
  closeTo(evaluateTokens(["φ", "xʸ", "2"]), CONSTANTS.φ + 1);
});

test("natural logarithm and e-to-x operate on the current entry", () => {
  const logE = enter(["e", "ln(x)"]);
  closeTo(fromSeximal(logE.tokens[0])!, 1);

  const expOne = enter(["1", "eˣ"]);
  closeTo(fromSeximal(expOne.tokens[0])!, Math.E, 1e-8);

  const domainError = enter(["0", "ln(x)"]);
  assert.equal(domainError.error, "ln requires a positive number");
  assert.deepEqual(domainError.tokens, []);
});

test("sign toggle works for entries, constants, and evaluated results", () => {
  assert.deepEqual(enter(["1", "2", "±"]).tokens, ["-12"]);
  assert.deepEqual(enter(["1", "2", "±", "±"]).tokens, ["12"]);
  closeTo(fromSeximal(enter(["π", "±"]).tokens[0])!, -Math.PI, 1e-8);

  const evaluated = pressKey(enter(["2", "+", "3"]), "=");
  const toggled = pressKey(evaluated, "±");
  assert.equal(fromSeximal(toggled.tokens[0]), -5);
});

test("a complete power calculation reports an expression and seximal result", () => {
  const result = pressKey(enter(["2", "xʸ", "3"]), "=");
  assert.equal(result.tokens[0], "12");
  assert.equal(result.evaluated?.expr, "2 xʸ 3");
  assert.equal(result.evaluated?.result, 8);
});

test("operators can be replaced and unary keys do nothing without an entry", () => {
  assert.deepEqual(enter(["2", "xʸ", "ʸ√x"]).tokens, ["2", "ʸ√x"]);
  assert.deepEqual(pressKey(initialCalcState, "ln(x)"), initialCalcState);
  assert.deepEqual(pressKey(initialCalcState, "eˣ"), initialCalcState);
  assert.deepEqual(pressKey(initialCalcState, "±"), initialCalcState);
});

test("power and radical controls use mathematical display notation", () => {
  assert.equal(formatCalculatorExpression(["2", "xʸ", "3"]), "2³");
  assert.equal(formatCalculatorExpression(["4", "ʸ√x", "5"]), "⁵√(4)");
  assert.equal(formatCalculatorExpression(["2", "+", "3", "xʸ", "2"]), "2 + 3²");
});
