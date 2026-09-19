// Positional number base helpers. Seximal = base 6.

const DIGITS = "0123456789ABCDEF";
const DOZENAL = "0123456789XE";

export type BaseId = 6 | 10 | 12 | 2 | 16;

export const BASES: { id: BaseId; name: string; short: string; hint: string }[] = [
  { id: 6, name: "Seximal", short: "SEX", hint: "digits 0–5" },
  { id: 10, name: "Decimal", short: "DEC", hint: "digits 0–9" },
  { id: 12, name: "Dozenal", short: "DOZ", hint: "digits 0–9, X, E" },
  { id: 2, name: "Binary", short: "BIN", hint: "digits 0–1" },
  { id: 16, name: "Hexadecimal", short: "HEX", hint: "digits 0–9, A–F" },
];

export function digitChar(d: number, base: number): string {
  return base === 12 ? DOZENAL[d] : DIGITS[d];
}

export function digitValue(ch: string, base: number): number {
  const c = ch.toUpperCase();
  if (base === 12) {
    if (c === "X" || c === "A") return 10;
    if (c === "E" || c === "B") return 11;
  }
  return DIGITS.indexOf(c);
}

export function isValidDigit(ch: string, base: number): boolean {
  const v = digitValue(ch, base);
  return v >= 0 && v < base;
}

/** Parse a string in `base` (supports sign and fractional point). Returns null if invalid. */
export function parseBase(input: string, base: number): number | null {
  let s = input.trim().replace(/\s+/g, "");
  if (!s) return null;
  let sign = 1;
  if (s.startsWith("-") || s.startsWith("−")) {
    sign = -1;
    s = s.slice(1);
  }
  if (!s || s === ".") return null;
  const parts = s.split(".");
  if (parts.length > 2) return null;
  const [intPart, fracPart = ""] = parts;
  let value = 0;
  for (const ch of intPart) {
    const v = digitValue(ch, base);
    if (v < 0 || v >= base) return null;
    value = value * base + v;
  }
  let scale = 1 / base;
  for (const ch of fracPart) {
    const v = digitValue(ch, base);
    if (v < 0 || v >= base) return null;
    value += v * scale;
    scale /= base;
  }
  return sign * value;
}

/** Format a number in `base` with up to `maxFrac` fractional digits (trailing zeros trimmed). */
export function formatBase(num: number, base: number, maxFrac = 6): string {
  if (Number.isNaN(num)) return "Error";
  if (!Number.isFinite(num)) return num > 0 ? "∞" : "-∞";
  const sign = num < 0 ? "-" : "";
  const abs = Math.abs(num);
  let intPart = Math.floor(abs);
  const frac = abs - intPart;
  const scaleN = Math.pow(base, maxFrac);
  let fracScaled = Math.round(frac * scaleN);
  if (fracScaled >= scaleN) {
    intPart += 1;
    fracScaled = 0;
  }
  let intStr: string;
  if (intPart < Number.MAX_SAFE_INTEGER) {
    intStr = BigInt(intPart).toString(base).toUpperCase();
  } else {
    intStr = intPart.toString(base).toUpperCase();
  }
  if (base === 12) intStr = intStr.replace(/A/g, "X").replace(/B/g, "E");
  let out = intStr;
  if (fracScaled > 0) {
    let fracStr = fracScaled.toString(base).toUpperCase().padStart(maxFrac, "0");
    if (base === 12) fracStr = fracStr.replace(/A/g, "X").replace(/B/g, "E");
    fracStr = fracStr.replace(/0+$/, "");
    if (fracStr) out += "." + fracStr;
  }
  return sign + out;
}

export const toSeximal = (n: number, maxFrac = 6) => formatBase(n, 6, maxFrac);
export const fromSeximal = (s: string) => parseBase(s, 6);

/** Integer padded in base 6 (for clock digits). */
export function pad6(n: number, width = 2): string {
  return Math.max(0, Math.floor(n)).toString(6).padStart(width, "0");
}

/** Format a decimal number compactly for the small helper labels. */
export function formatDecimal(n: number, sig = 6): string {
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e12 || abs < 1e-6) return n.toExponential(3);
  const s = Number(n.toPrecision(sig)).toString();
  return s;
}
