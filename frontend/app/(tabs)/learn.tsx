import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usesNativeTabs } from "@/src/navigation";
import { CATEGORIES, PREFIXES } from "@/src/seximal/units";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

const HERO =
  "https://images.unsplash.com/photo-1709377195538-5522ed0f9e10?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

function Card({ title, children, testID }: { title: string; children: ReactNode; testID?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.card} testID={testID}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ a, b, c, head }: { a: string; b: string; c?: string; head?: boolean }) {
  const styles = useStyles();
  return (
    <View style={[styles.row, head && styles.rowHead]}>
      <Text style={[styles.cellA, head && styles.cellHead]}>{a}</Text>
      <Text style={[styles.cellB, head && styles.cellHead]}>{b}</Text>
      {c !== undefined ? <Text style={[styles.cellC, head && styles.cellHead]}>{c}</Text> : null}
    </View>
  );
}

export default function LearnScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  return (
    <View style={styles.screen} testID="learn-screen">
      <ScrollView contentContainerStyle={{ paddingBottom: bottomChrome + spacing.lg }}>
        <View style={styles.hero}>
          <Image source={{ uri: HERO }} style={styles.heroImage} contentFit="cover" transition={300} />
          <LinearGradient colors={["transparent", colors.scrim, colors.surface]} style={styles.heroScrim} />
          <View style={[styles.heroText, { paddingTop: insets.top + spacing.lg }]}>
            <Text style={styles.heroKicker}>LEARN</Text>
            <Text style={styles.heroTitle} testID="learn-header-title">
              Seximal
            </Text>
            <Text style={styles.heroSub}>Counting, measuring and telling time in base six.</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Card title="What is seximal?" testID="learn-card-intro">
            <Text style={styles.p}>
              Seximal (also called senary or heximal) is a positional numeral system with base six. It uses only
              the digits 0–5, so after 5 comes 10 (“six”), then 11, 12 … 15, 20 (“twelve”).
            </Text>
            <Text style={styles.p}>
              Six is the product of the first two primes, 2 × 3. That means halves, thirds, quarters (0.13) and
              ninths (0.04) all terminate neatly, and the multiplication table is tiny: only 25 non-trivial facts.
            </Text>
            <Text style={styles.p}>
              Reciprocals of primes are also short: 1/5 = 0.1111… and 1/7 = 0.0505… — the two primes adjacent to six
              give the shortest possible repeating fractions.
            </Text>
          </Card>

          <Card title="Counting to twelve" testID="learn-card-counting">
            <Row a="Decimal" b="Seximal" c="Name" head />
            {[
              ["1", "1", "one"],
              ["2", "2", "two"],
              ["3", "3", "three"],
              ["4", "4", "four"],
              ["5", "5", "five"],
              ["6", "10", "six"],
              ["7", "11", "seven"],
              ["8", "12", "eight"],
              ["9", "13", "nine"],
              ["10", "14", "ten"],
              ["11", "15", "eleven"],
              ["12", "20", "dozen"],
              ["36", "100", "nif"],
              ["1296", "10000", "unexian"],
            ].map(([d, s, n]) => (
              <Row key={d} a={d} b={s} c={n} />
            ))}
          </Card>

          <Card title="Prefixes · powers of six" testID="learn-card-prefixes">
            <Text style={styles.p}>
              Like SI’s kilo- and milli-, seximal prefixes scale a unit by a power of six. Even powers keep numbers
              tidy in base six, so prefixes step by 6².
            </Text>
            <Row a="Prefix" b="Power" c="Decimal ×" head />
            {[...PREFIXES]
              .filter((p) => p.power !== 0)
              .sort((a, b) => b.power - a.power)
              .map((p) => (
                <Row
                  key={p.power}
                  a={`${p.name}-`}
                  b={p.label}
                  c={Math.pow(6, p.power) >= 1 ? Math.pow(6, p.power).toLocaleString() : Math.pow(6, p.power).toExponential(2)}
                />
              ))}
          </Card>

          <Card title="Seximal time" testID="learn-card-time">
            <Text style={styles.p}>
              The base unit of time is the instant: 0.07716 s. Everything else is a power of six of it.
            </Text>
            <Row a="Unit" b="Instants" c="Standard" head />
            <Row a="instant" b="1" c="0.07716 s" />
            <Row a="second (nifa-instant)" b="6²" c="2.78 s" />
            <Row a="minute (kila-instant)" b="6⁴" c="100 s" />
            <Row a="hour (larga-instant)" b="6⁶" c="exactly 1 h" />
            <Row a="quarter day" b="6⁷" c="6 h" />
            <Text style={styles.p}>
              So a seximal clock reads hours : minutes : seconds where an hour has 36 (seximal 100) minutes and each
              minute has 36 seconds. A day is 24 hours, written 40 in seximal.
            </Text>
          </Card>

          <Card title="Seximal units" testID="learn-card-units">
            <Row a="Quantity" b="Unit" c="Equals" head />
            {CATEGORIES.map((c) => {
              const u = c.units.find((x) => x.seximal)!;
              return <Row key={c.id} a={c.name} b={`1 ${u.name}`} c={UNIT_EQUALS[c.id]} />;
            })}
          </Card>

          <Card title="Number base cheatsheet" testID="learn-card-bases">
            <Row a="Base" b="Digits" c="Example (dec 100)" head />
            <Row a="Seximal (6)" b="0–5" c="244" />
            <Row a="Decimal (10)" b="0–9" c="100" />
            <Row a="Dozenal (12)" b="0–9 X E" c="84" />
            <Row a="Binary (2)" b="0–1" c="1100100" />
            <Row a="Hexadecimal (16)" b="0–9 A–F" c="64" />
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const UNIT_EQUALS: Record<string, string> = {
  time: "0.07716 s",
  length: "2.29867 in",
  area: "5.28388 in²",
  volume: "199.0345 mL",
  speed: "0.75668 m/s",
  accel: "9.80664 m/s²",
  mass: "199.0345 g",
  force: "1.95186 N",
  pressure: "0.08304 psi",
  energy: "0.11396 J",
  temp: "1 °C",
  freq: "12.96 Hz",
  power: "1.47694 W",
};

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  hero: { height: 280, justifyContent: "flex-end" },
  heroImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  heroScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: 200 },
  heroText: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.xs },
  heroKicker: { fontFamily: fonts.textSemiBold, fontSize: 12, color: colors.brand, letterSpacing: 2 },
  heroTitle: { fontFamily: fonts.display, fontSize: 56, lineHeight: 60, color: colors.onSurface },
  heroSub: { fontFamily: fonts.text, fontSize: 15, color: colors.muted },
  body: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingTop: spacing.sm },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  cardTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.brandSecondary, marginBottom: spacing.xs },
  p: { fontFamily: fonts.text, fontSize: 15, lineHeight: 22, color: colors.onSurfaceSecondary },
  row: { flexDirection: "row", alignItems: "center", minHeight: 36, borderBottomWidth: 1, borderBottomColor: colors.divider, gap: spacing.sm },
  rowHead: { borderBottomColor: colors.borderStrong },
  cellA: { flex: 1.2, fontFamily: fonts.textMedium, fontSize: 14, color: colors.onSurfaceSecondary },
  cellB: { flex: 1, fontFamily: fonts.displayMedium, fontSize: 18, color: colors.brandSecondary },
  cellC: { flex: 1.1, fontFamily: fonts.text, fontSize: 14, color: colors.muted, textAlign: "right" },
  cellHead: { fontFamily: fonts.textSemiBold, fontSize: 11, color: colors.muted, letterSpacing: 1 },
}));
