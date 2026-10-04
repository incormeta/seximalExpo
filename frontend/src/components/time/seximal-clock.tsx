import { useEffect, useRef, useState } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";

import { MonoDigits } from "@/src/components/mono-digits";
import { ClockFace, FACES } from "@/src/components/time/clock-face";
import { pad6 } from "@/src/seximal/base";
import { INSTANT_MS, formatClock, formatStandardClock, nowSeximal } from "@/src/seximal/time";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { haptics } from "@/src/utils/haptics";
import { storage } from "@/src/utils/storage";

const FACE_KEY = "seximal.clock.face";

export function SeximalClock() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [now, setNow] = useState(() => new Date());
  const [face, setFace] = useState(0);
  const pagerRef = useRef<ScrollView>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), INSTANT_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    storage.getItem(FACE_KEY, 0).then((v) => {
      const idx = typeof v === "number" && v >= 0 && v < FACES.length ? v : 0;
      setFace(idx);
      requestAnimationFrame(() => pagerRef.current?.scrollTo({ x: idx * width, animated: false }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = nowSeximal(now);
  const size = Math.min(width - spacing.lg * 2, 360);

  const onPagerScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // iOS reports the page it will settle on in targetContentOffset while the
    // drag is still ending. Using it avoids briefly selecting the page that is
    // merely closest to the finger before the native paging animation finishes.
    const settledX = e.nativeEvent.targetContentOffset?.x ?? e.nativeEvent.contentOffset.x;
    const idx = Math.min(FACES.length - 1, Math.max(0, Math.round(settledX / width)));
    if (idx !== face) {
      setFace(idx);
      storage.setItem(FACE_KEY, idx);
    }
  };

  const dateLabel = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <View style={styles.root} testID="clock-view">
      <View style={styles.digital}>
        <MonoDigits
          text={formatClock(t)}
          fontSize={88}
          maxWidth={width - spacing.lg * 2 - 70}
          color={colors.onSurface}
          separatorColor={colors.brand}
          testID="clock-digital"
        />
        <MonoDigits
          text={`.${pad6(t.instants)}`}
          fontSize={34}
          lineHeight={60}
          color={colors.brandSecondary}
          fontFamily={fonts.displayMedium}
          testID="clock-instants"
        />
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendItem}>hours · 6⁶ inst</Text>
        <Text style={styles.legendItem}>minutes · 6⁴ inst</Text>
        <Text style={styles.legendItem}>seconds · 6² inst</Text>
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onPagerScrollEnd}
        onScrollEndDrag={onPagerScrollEnd}
        style={{ width, flexGrow: 0 }}
        testID="clock-face-pager"
      >
        {FACES.map((f) => (
          <View key={f.id} style={[styles.page, { width }]}>
            <ClockFace face={f.id} size={size} time={t} />
          </View>
        ))}
      </ScrollView>
      <View style={styles.pagerFooter}>
        <View style={styles.dots} testID="clock-face-dots">
          {FACES.map((f, i) => (
            <Pressable
              key={f.id}
              testID={`clock-face-dot-${f.id}`}
              hitSlop={10}
              onPress={() => {
                haptics.selection();
                pagerRef.current?.scrollTo({ x: i * width, animated: true });
              }}
              style={[styles.dot, i === face && styles.dotActive]}
            />
          ))}
        </View>
        <Text style={styles.faceName} testID="clock-face-name">
          {FACES[face].name} · {FACES[face].description}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>STANDARD TIME</Text>
        <Text style={styles.footerTime} testID="clock-standard">
          {formatStandardClock(now)}
        </Text>
        <Text style={styles.footerDate}>{dateLabel}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { alignItems: "center", gap: spacing.lg, paddingVertical: spacing.lg },
  digital: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center" },
  legend: { flexDirection: "row", gap: spacing.lg, marginTop: -spacing.sm },
  legendItem: { fontFamily: fonts.text, fontSize: 12, color: colors.muted },
  page: { alignItems: "center", justifyContent: "center" },
  pagerFooter: { alignItems: "center", gap: spacing.sm, marginTop: -spacing.sm },
  dots: { flexDirection: "row", gap: spacing.sm, alignItems: "center", height: 20 },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.borderStrong },
  dotActive: { backgroundColor: colors.brand, width: 20 },
  faceName: { fontFamily: fonts.text, fontSize: 12, color: colors.muted },
  footer: { alignItems: "center", gap: spacing.xs },
  footerLabel: { fontFamily: fonts.textSemiBold, fontSize: 11, color: colors.muted, letterSpacing: 1.2 },
  footerTime: { fontFamily: fonts.displayMedium, fontSize: 28, color: colors.onSurface },
  footerDate: { fontFamily: fonts.text, fontSize: 14, color: colors.muted },
}));
