// Seximal units and prefixes.

export type Prefix = { name: string; power: number; label: string };

export const PREFIXES: Prefix[] = [
  { name: "pico", power: -16, label: "6⁻¹⁶" },
  { name: "nano", power: -12, label: "6⁻¹²" },
  { name: "micro", power: -8, label: "6⁻⁸" },
  { name: "tini", power: -6, label: "6⁻⁶" },
  { name: "milli", power: -4, label: "6⁻⁴" },
  { name: "nivi", power: -2, label: "6⁻²" },
  { name: "", power: 0, label: "6⁰" },
  { name: "nifa", power: 2, label: "6²" },
  { name: "kila", power: 4, label: "6⁴" },
  { name: "larga", power: 6, label: "6⁶" },
  { name: "mega", power: 8, label: "6⁸" },
  { name: "giga", power: 12, label: "6¹²" },
  { name: "tera", power: 16, label: "6¹⁶" },
  { name: "peta", power: 20, label: "6²⁰" },
  { name: "exa", power: 24, label: "6²⁴" },
];

export const prefixMultiplier = (p: Prefix) => Math.pow(6, p.power);
export const NO_PREFIX = PREFIXES.find((p) => p.power === 0)!;

export type Unit = {
  id: string;
  name: string;
  plural?: string;
  symbol: string;
  /** multiply by this to get the category base value (SI) */
  factor: number;
  seximal?: boolean;
  /** temperature-style affine units */
  toBase?: (v: number) => number;
  fromBase?: (v: number) => number;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  baseSymbol: string;
  units: Unit[];
};

const IN = 0.0254;

export const CATEGORIES: Category[] = [
  {
    id: "time",
    name: "Time",
    icon: "time-outline",
    baseSymbol: "s",
    units: [
      { id: "instant", name: "instant", symbol: "inst", factor: 100 / 1296, seximal: true }, // 0.07716 s (exact: 6⁶ instants = 1 h)
      { id: "s", name: "second", symbol: "s", factor: 1 },
      { id: "ms", name: "millisecond", symbol: "ms", factor: 1e-3 },
      { id: "us", name: "microsecond", symbol: "μs", factor: 1e-6 },
      { id: "ns", name: "nanosecond", symbol: "ns", factor: 1e-9 },
      { id: "min", name: "minute", symbol: "min", factor: 60 },
      { id: "h", name: "hour", symbol: "h", factor: 3600 },
      { id: "day", name: "day", symbol: "d", factor: 86400 },
      { id: "week", name: "week", symbol: "wk", factor: 604800 },
      { id: "yr", name: "year", symbol: "yr", factor: 31557600 },
    ],
  },
  {
    id: "length",
    name: "Length",
    icon: "resize-outline",
    baseSymbol: "m",
    units: [
      { id: "thumb", name: "thumb", symbol: "th", factor: 2.29867 * IN, seximal: true },
      { id: "mm", name: "millimetre", symbol: "mm", factor: 1e-3 },
      { id: "um", name: "micrometre", symbol: "μm", factor: 1e-6 },
      { id: "nm", name: "nanometre", symbol: "nm", factor: 1e-9 },
      { id: "cm", name: "centimetre", symbol: "cm", factor: 1e-2 },
      { id: "m", name: "metre", symbol: "m", factor: 1 },
      { id: "km", name: "kilometre", symbol: "km", factor: 1e3 },
      { id: "in", name: "inch", symbol: "in", factor: IN },
      { id: "ft", name: "foot", plural: "feet", symbol: "ft", factor: 0.3048 },
      { id: "yd", name: "yard", symbol: "yd", factor: 0.9144 },
      { id: "mi", name: "mile", symbol: "mi", factor: 1609.344 },
      { id: "nmi", name: "nautical mile", symbol: "nmi", factor: 1852 },
    ],
  },
  {
    id: "area",
    name: "Area",
    icon: "square-outline",
    baseSymbol: "m²",
    units: [
      { id: "bock", name: "bock", symbol: "bk", factor: 5.28388 * IN * IN, seximal: true },
      { id: "cm2", name: "square centimetre", symbol: "cm²", factor: 1e-4 },
      { id: "mm2", name: "square millimetre", symbol: "mm²", factor: 1e-6 },
      { id: "m2", name: "square metre", symbol: "m²", factor: 1 },
      { id: "ha", name: "hectare", symbol: "ha", factor: 1e4 },
      { id: "km2", name: "square kilometre", symbol: "km²", factor: 1e6 },
      { id: "in2", name: "square inch", plural: "square inches", symbol: "in²", factor: IN * IN },
      { id: "ft2", name: "square foot", plural: "square feet", symbol: "ft²", factor: 0.09290304 },
      { id: "yd2", name: "square yard", symbol: "yd²", factor: 0.83612736 },
      { id: "acre", name: "acre", symbol: "ac", factor: 4046.8564224 },
      { id: "mi2", name: "square mile", symbol: "mi²", factor: 2589988.110336 },
    ],
  },
  {
    id: "volume",
    name: "Volume",
    icon: "cube-outline",
    baseSymbol: "mL",
    units: [
      { id: "fill", name: "fill", symbol: "fl", factor: 199.0345, seximal: true },
      { id: "ml", name: "millilitre", symbol: "mL", factor: 1 },
      { id: "cm3", name: "cubic centimetre", symbol: "cm³", factor: 1 },
      { id: "l", name: "litre", symbol: "L", factor: 1000 },
      { id: "m3", name: "cubic metre", symbol: "m³", factor: 1e6 },
      { id: "floz", name: "US fluid ounce", symbol: "fl oz", factor: 29.5735295625 },
      { id: "tsp", name: "teaspoon", symbol: "tsp", factor: 4.92892159375 },
      { id: "tbsp", name: "tablespoon", symbol: "tbsp", factor: 14.78676478125 },
      { id: "cup", name: "US cup", symbol: "cup", factor: 236.5882365 },
      { id: "pt", name: "US pint", symbol: "pt", factor: 473.176473 },
      { id: "qt", name: "US quart", symbol: "qt", factor: 946.352946 },
      { id: "gal", name: "US gallon", symbol: "gal", factor: 3785.411784 },
      { id: "in3", name: "cubic inch", plural: "cubic inches", symbol: "in³", factor: 16.387064 },
      { id: "ft3", name: "cubic foot", plural: "cubic feet", symbol: "ft³", factor: 28316.846592 },
      { id: "yd3", name: "cubic yard", symbol: "yd³", factor: 764554.857984 },
    ],
  },
  {
    id: "speed",
    name: "Speed",
    icon: "speedometer-outline",
    baseSymbol: "m/s",
    units: [
      { id: "rapid", name: "rapid", symbol: "rpd", factor: 0.75668, seximal: true },
      { id: "mps", name: "metre per second", plural: "metres per second", symbol: "m/s", factor: 1 },
      { id: "kmh", name: "kilometre per hour", plural: "kilometres per hour", symbol: "km/h", factor: 1 / 3.6 },
      { id: "mph", name: "mile per hour", plural: "miles per hour", symbol: "mph", factor: 0.44704 },
      { id: "fps", name: "foot per second", plural: "feet per second", symbol: "ft/s", factor: 0.3048 },
      { id: "kn", name: "knot", symbol: "kn", factor: 0.514444 },
      { id: "mach", name: "Mach (at 20 °C)", plural: "Mach", symbol: "Ma", factor: 343 },
    ],
  },
  {
    id: "accel",
    name: "Acceleration",
    icon: "trending-up-outline",
    baseSymbol: "m/s²",
    units: [
      { id: "grav", name: "grav", symbol: "grv", factor: 9.80664, seximal: true },
      { id: "mps2", name: "metre per second²", plural: "metres per second²", symbol: "m/s²", factor: 1 },
      { id: "fps2", name: "foot per second²", plural: "feet per second²", symbol: "ft/s²", factor: 0.3048 },
      { id: "galileo", name: "galileo", symbol: "Gal", factor: 0.01 },
      { id: "g", name: "standard gravity", plural: "standard gravities", symbol: "g", factor: 9.80665 },
    ],
  },
  {
    id: "mass",
    name: "Mass",
    icon: "scale-outline",
    baseSymbol: "g",
    units: [
      { id: "heft", name: "heft", symbol: "hft", factor: 199.0345, seximal: true },
      { id: "mg", name: "milligram", symbol: "mg", factor: 1e-3 },
      { id: "ug", name: "microgram", symbol: "μg", factor: 1e-6 },
      { id: "g", name: "gram", symbol: "g", factor: 1 },
      { id: "kg", name: "kilogram", symbol: "kg", factor: 1000 },
      { id: "t", name: "tonne", symbol: "t", factor: 1e6 },
      { id: "oz", name: "ounce", symbol: "oz", factor: 28.349523125 },
      { id: "lb", name: "pound", symbol: "lb", factor: 453.59237 },
      { id: "st", name: "stone", plural: "stone", symbol: "st", factor: 6350.29318 },
      { id: "short-ton", name: "short ton", symbol: "US ton", factor: 907184.74 },
    ],
  },
  {
    id: "force",
    name: "Force",
    icon: "arrow-forward-outline",
    baseSymbol: "N",
    units: [
      { id: "fort", name: "fort", symbol: "frt", factor: 1.95186, seximal: true },
      { id: "n", name: "newton", symbol: "N", factor: 1 },
      { id: "mn", name: "millinewton", symbol: "mN", factor: 1e-3 },
      { id: "kn", name: "kilonewton", symbol: "kN", factor: 1000 },
      { id: "mn-large", name: "meganewton", symbol: "MN", factor: 1e6 },
      { id: "dyn", name: "dyne", symbol: "dyn", factor: 1e-5 },
      { id: "lbf", name: "pound-force", symbol: "lbf", factor: 4.4482216152605 },
      { id: "ozf", name: "ounce-force", symbol: "ozf", factor: 0.27801385095378125 },
      { id: "kip", name: "kip-force", symbol: "kip", factor: 4448.2216152605 },
      { id: "kgf", name: "kilogram-force", symbol: "kgf", factor: 9.80665 },
    ],
  },
  {
    id: "pressure",
    name: "Pressure",
    icon: "contract-outline",
    baseSymbol: "Pa",
    units: [
      { id: "presh", name: "presh", plural: "presh", symbol: "prs", factor: 0.08304 * 6894.757293168, seximal: true },
      { id: "pa", name: "pascal", symbol: "Pa", factor: 1 },
      { id: "kpa", name: "kilopascal", symbol: "kPa", factor: 1000 },
      { id: "mpa", name: "megapascal", symbol: "MPa", factor: 1e6 },
      { id: "hpa", name: "hectopascal", symbol: "hPa", factor: 100 },
      { id: "bar", name: "bar", plural: "bar", symbol: "bar", factor: 1e5 },
      { id: "psi", name: "pound per square inch", plural: "pounds per square inch", symbol: "psi", factor: 6894.757293168 },
      { id: "atm", name: "atmosphere", symbol: "atm", factor: 101325 },
      { id: "mmhg", name: "millimetre of mercury", plural: "millimetres of mercury", symbol: "mmHg", factor: 133.322387415 },
      { id: "inhg", name: "inch of mercury", plural: "inches of mercury", symbol: "inHg", factor: 3386.389 },
      { id: "torr", name: "torr", plural: "torr", symbol: "Torr", factor: 101325 / 760 },
    ],
  },
  {
    id: "energy",
    name: "Energy",
    icon: "flash-outline",
    baseSymbol: "J",
    units: [
      { id: "nerg", name: "nerg", symbol: "nrg", factor: 0.11396, seximal: true },
      { id: "j", name: "joule", symbol: "J", factor: 1 },
      { id: "kj", name: "kilojoule", symbol: "kJ", factor: 1000 },
      { id: "mj", name: "megajoule", symbol: "MJ", factor: 1e6 },
      { id: "cal", name: "calorie", symbol: "cal", factor: 4.184 },
      { id: "kcal", name: "kilocalorie", symbol: "kcal", factor: 4184 },
      { id: "wh", name: "watt-hour", symbol: "Wh", factor: 3600 },
      { id: "kwh", name: "kilowatt-hour", symbol: "kWh", factor: 3.6e6 },
      { id: "btu", name: "BTU", symbol: "BTU", factor: 1055.05585262 },
      { id: "ftlb", name: "foot-pound", symbol: "ft⋅lbf", factor: 1.3558179483314004 },
      { id: "erg", name: "erg", symbol: "erg", factor: 1e-7 },
    ],
  },
  {
    id: "temp",
    name: "Temperature",
    icon: "thermometer-outline",
    baseSymbol: "°C",
    units: [
      { id: "celce", name: "celce", symbol: "°ce", factor: 1, seximal: true },
      { id: "c", name: "degree Celsius", plural: "degrees Celsius", symbol: "°C", factor: 1 },
      {
        id: "f",
        name: "degree Fahrenheit",
        plural: "degrees Fahrenheit",
        symbol: "°F",
        factor: 1,
        toBase: (f) => ((f - 32) * 5) / 9,
        fromBase: (c) => (c * 9) / 5 + 32,
      },
      { id: "k", name: "kelvin", plural: "kelvin", symbol: "K", factor: 1, toBase: (k) => k - 273.15, fromBase: (c) => c + 273.15 },
      {
        id: "r",
        name: "degree Rankine",
        plural: "degrees Rankine",
        symbol: "°R",
        factor: 1,
        toBase: (r) => (r - 491.67) * (5 / 9),
        fromBase: (c) => (c + 273.15) * (9 / 5),
      },
    ],
  },
  {
    id: "freq",
    name: "Frequency",
    icon: "pulse-outline",
    baseSymbol: "Hz",
    units: [
      { id: "freckle", name: "freckle", symbol: "frk", factor: 12.96, seximal: true },
      { id: "hz", name: "hertz", plural: "hertz", symbol: "Hz", factor: 1 },
      { id: "khz", name: "kilohertz", plural: "kilohertz", symbol: "kHz", factor: 1e3 },
      { id: "mhz", name: "megahertz", plural: "megahertz", symbol: "MHz", factor: 1e6 },
      { id: "ghz", name: "gigahertz", plural: "gigahertz", symbol: "GHz", factor: 1e9 },
      { id: "rpm", name: "revolution per minute", plural: "revolutions per minute", symbol: "rpm", factor: 1 / 60 },
      { id: "bpm", name: "beat per minute", plural: "beats per minute", symbol: "BPM", factor: 1 / 60 },
    ],
  },
  {
    id: "power",
    name: "Power",
    icon: "battery-charging-outline",
    baseSymbol: "W",
    units: [
      { id: "pow", name: "pow", symbol: "pow", factor: 1.47694, seximal: true },
      { id: "w", name: "watt", symbol: "W", factor: 1 },
      { id: "kw", name: "kilowatt", symbol: "kW", factor: 1000 },
      { id: "mw", name: "megawatt", symbol: "MW", factor: 1e6 },
      { id: "gw", name: "gigawatt", symbol: "GW", factor: 1e9 },
      { id: "hp", name: "horsepower", plural: "horsepower", symbol: "hp", factor: 745.69987158227 },
      { id: "btuh", name: "BTU per hour", plural: "BTU per hour", symbol: "BTU/h", factor: 0.29307107 },
      { id: "ftlbs", name: "foot-pound per second", symbol: "ft⋅lbf/s", factor: 1.3558179483314004 },
    ],
  },
];

export function convertValue(
  value: number,
  from: Unit,
  fromPrefix: Prefix,
  to: Unit,
  toPrefix: Prefix,
): number {
  const fromMult = from.seximal ? prefixMultiplier(fromPrefix) : 1;
  const toMult = to.seximal ? prefixMultiplier(toPrefix) : 1;
  const base = from.toBase ? from.toBase(value * fromMult) : value * fromMult * from.factor;
  const out = to.fromBase ? to.fromBase(base) : base / to.factor;
  return out / toMult;
}

export function unitLabel(unit: Unit, prefix: Prefix): string {
  if (!unit.seximal || prefix.power === 0) return unit.name;
  return prefix.name + unit.name;
}

export function unitSymbol(unit: Unit, prefix: Prefix): string {
  if (!unit.seximal || prefix.power === 0) return unit.symbol;
  return `${prefix.name}·${unit.symbol}`;
}
