// Design tokens for this app. Dark-first utility theme (obsidian + amber).
// Keys match the "color" block of /app/design_guidelines.json.
// Components build StyleSheets with makeStyles() and read useTheme().colors
// for color props. Never write color literals in components.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  surface: "#09090B",
  onSurface: "#FAFAFA",
  surfaceSecondary: "#18181B",
  onSurfaceSecondary: "#FAFAFA",
  surfaceTertiary: "#27272A",
  onSurfaceTertiary: "#FAFAFA",
  surfaceInverse: "#FAFAFA",
  onSurfaceInverse: "#09090B",
  muted: "#A1A1AA",

  brand: "#F59E0B",
  onBrand: "#09090B",
  brandPrimary: "#D97706",
  onBrandPrimary: "#000000",
  brandSecondary: "#FBBF24",
  onBrandSecondary: "#000000",
  brandTertiary: "#452202",
  onBrandTertiary: "#FDE68A",

  success: "#10B981",
  onSuccess: "#000000",
  warning: "#F59E0B",
  onWarning: "#000000",
  error: "#EF4444",
  onError: "#FFFFFF",
  info: "#A1A1AA",
  onInfo: "#000000",

  border: "#27272A",
  borderStrong: "#3F3F46",
  divider: "#27272A",

  // Extra tokens for this app
  keyDigit: "#27272A",
  keyOperator: "#3F3F46",
  scrim: "rgba(9,9,11,0.6)",
  ringTrack: "#27272A",
};

export type ThemeColors = typeof dark;

// The app is dark-only by design; both schemes resolve to the dark palette.
const light: ThemeColors = dark;

export const defaultScheme = "dark" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light, dark };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.("dark");

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme() as ColorScheme | null;
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

export const fonts = {
  display: "BarlowCondensed-SemiBold",
  displayMedium: "BarlowCondensed-Medium",
  displayRegular: "BarlowCondensed-Regular",
  text: "Barlow-Regular",
  textMedium: "Barlow-Medium",
  textSemiBold: "Barlow-SemiBold",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32, "3xl": 48 };
export const radius = { sm: 6, md: 12, lg: 20, pill: 999 };
