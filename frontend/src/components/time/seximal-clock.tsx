import { useEffect, useRef, useState } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";

import { MonoDigits } from "@/src/components/mono-digits";
import { ClockFace } from "@/src/components/time/clock-face";
import { useClockTime } from "@/src/components/time/clock-time";
import { HueClock } from "@/src/components/time/hue-clock";
import { ProgressBars } from "@/src/components/time/progress-bars";
import { pad6 } from "@/src/seximal/base";
import { FaceId, FACES } from "@/src/seximal/clock-faces";
import { formatClock, formatStandardClock, nowSeximal } from "@/src/seximal/time";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { ClockSource } from "@/src/utils/clock-source";
import { haptics } from "@/src/utils/haptics";
import { storage } from "@/src/utils/storage";

const FACE_KEY = "seximal.clock.face";

type Props = { availableHeight: number; clock: ClockSource; onFaceChange: (face: FaceId) => void };

export function SeximalClock({ availableHeight, clock, onFaceChange }: Props) {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const [face, setFace] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const pagerRef = useRef<ScrollView>(null);
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const faceRef = useRef(face);
  const isHue = FACES[face].id === "hue";
  const compactProgress = FACES[face].id === "progress" && availableHeight > 0 && availableHeight < 480;
  const showHeader = !isHue && !compactProgress;

  useEffect(() => {
    faceRef.current = face;
    onFaceChange(FACES[face].id);
  }, [face, onFaceChange]);

  // Keep the selected page aligned when rotating or resizing the app.
  useEffect(() => {
    pagerRef.current?.scrollTo({ x: faceRef.current * width, animated: false });
  }, [width]);

  useEffect(() => () => clearTimeout(scrollEndTimer.current), []);

  useEffect(() => {
    let mounted = true;
    storage.getItem(FACE_KEY, 0).then((v) => {
      if (!mounted) return;
      const idx = typeof v === "number" && Number.isInteger(v) && v >= 0 && v < FACES.length ? v : 0;
      setFace(idx);
      requestAnimationFrame(() => pagerRef.current?.scrollTo({ x: idx * width, animated: false }));
    });
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Measure the text separately so the dial fits above standard time and date.
  // Keep scrolling available on very short screens or with large accessibility text.
  const dialHeight = availableHeight > 0 && (!showHeader || headerHeight > 0) && footerHeight > 0
    ? Math.max(144, availableHeight - (showHeader ? headerHeight : 0) - footerHeight - spacing.lg * (showHeader ? 4 : 3))
    : 360;
  const size = Math.min(width - spacing.lg * 2, 360, dialHeight);
  const pageHeight = isHue ? dialHeight : FACES[face].id === "progress" ? Math.max(compactProgress ? 200 : 240, Math.min(dialHeight, 360)) : size;

  const selectSettledPage = (settledX: number) => {
    const idx = Math.min(FACES.length - 1, Math.max(0, Math.round(settledX / width)));
    if (idx !== face) {
      setFace(idx);
      storage.setItem(FACE_KEY, idx);
    }
  };

  const onPagerScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // iOS reports the page it will settle on in targetContentOffset while the
    // drag is still ending. Using it avoids briefly selecting the page that is
    // merely closest to the finger before the native paging animation finishes.
    const settledX = e.nativeEvent.targetContentOffset?.x ?? e.nativeEvent.contentOffset.x;
    selectSettledPage(settledX);
  };

  const onWebPagerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // React Native Web emits onScroll, but not the native momentum-end event.
    // Wait until scrolling settles so a long button-driven scroll doesn't select
    // every face it passes, changing the background and layout along the way.
    const x = e.nativeEvent.contentOffset.x;
    clearTimeout(scrollEndTimer.current);
    scrollEndTimer.current = setTimeout(() => selectSettledPage(x), 120);
  };

  return (
    <View style={[styles.root, isHue && { minHeight: Math.max(0, availableHeight) }]} testID="clock-view">
      {showHeader && (
        <View style={styles.header} onLayout={({ nativeEvent }) => setHeaderHeight(nativeEvent.layout.height)}>
          <ClockHeader clock={clock} width={width} />
        </View>
      )}

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onPagerScrollEnd}
        onScrollEndDrag={onPagerScrollEnd}
        onScroll={Platform.OS === "web" ? onWebPagerScroll : undefined}
        scrollEventThrottle={64}
        style={{ width, height: pageHeight, flexGrow: 0 }}
        testID="clock-face-pager"
      >
        {FACES.map((f, i) => (
          <View
            key={f.id}
            style={[styles.page, { width, height: pageHeight }]}
            accessibilityElementsHidden={i !== face}
            importantForAccessibility={i === face ? "auto" : "no-hide-descendants"}
            aria-hidden={i !== face}
          >
            <ClockPage face={f.id} clock={clock} active={i === face} size={size} width={width} height={pageHeight} />
          </View>
        ))}
      </ScrollView>
      <View style={styles.bottom} onLayout={({ nativeEvent }) => setFooterHeight(nativeEvent.layout.height)}>
        <View style={[styles.pagerFooter, isHue && styles.hueControls]}>
          <View style={styles.dots} testID="clock-face-dots">
            {FACES.map((f, i) => (
              <Pressable
                key={f.id}
                testID={`clock-face-dot-${f.id}`}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel={`Show ${f.name}`}
                aria-selected={i === face}
                onPress={() => {
                  haptics.selection();
                  setFace(i);
                  storage.setItem(FACE_KEY, i);
                  pagerRef.current?.scrollTo({ x: i * width, animated: true });
                }}
                style={styles.dotButton}
              >
                <View style={[styles.dot, i === face && styles.dotActive]} />
              </Pressable>
            ))}
          </View>
          <Text style={styles.faceName} testID="clock-face-name">
            {FACES[face].name} · {FACES[face].description}
          </Text>
        </View>

        {!isHue && <ClockFooter clock={clock} />}
      </View>
    </View>
  );
}

function ClockPage({ face, clock, active, size, width, height }: {
  face: FaceId; clock: ClockSource; active: boolean; size: number; width: number; height: number;
}) {
  if (face === "progress") return <ProgressBars clock={clock} active={active} width={Math.min(width - spacing.lg * 2, 640)} height={height} />;
  if (face === "hue") return <View style={{ height, justifyContent: "center" }}><HueClock clock={clock} active={active} width={width - spacing.xl * 2} /></View>;
  return <LiveAnalogFace face={face} clock={clock} active={active} size={size} />;
}

function LiveAnalogFace({ face, clock, active, size }: {
  face: Exclude<FaceId, "progress" | "hue">; clock: ClockSource; active: boolean; size: number;
}) {
  const now = useClockTime(clock, active);
  return <ClockFace face={face} size={size} time={nowSeximal(now)} />;
}

function ClockHeader({ clock, width }: { clock: ClockSource; width: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const t = nowSeximal(useClockTime(clock));
  return (
    <>
      <View style={styles.digital}>
        <MonoDigits text={formatClock(t)} fontSize={88} maxWidth={width - spacing.lg * 2 - 70} color={colors.onSurface} separatorColor={colors.brand} testID="clock-digital" />
        <MonoDigits text={`.${pad6(t.instants)}`} fontSize={34} lineHeight={60} color={colors.brandSecondary} fontFamily={fonts.displayMedium} testID="clock-instants" />
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendItem}>hours · 6⁶ inst</Text>
        <Text style={styles.legendItem}>minutes · 6⁴ inst</Text>
        <Text style={styles.legendItem}>seconds · 6² inst</Text>
      </View>
    </>
  );
}

function ClockFooter({ clock }: { clock: ClockSource }) {
  const styles = useStyles();
  const now = useClockTime(clock);
  const dateLabel = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  return (
    <View style={styles.footer}>
      <Text style={styles.footerLabel}>STANDARD TIME</Text>
      <Text style={styles.footerTime} testID="clock-standard">{formatStandardClock(now)}</Text>
      <Text style={styles.footerDate} testID="clock-date">{dateLabel}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { alignItems: "center", gap: spacing.lg, paddingVertical: spacing.lg },
  header: { alignItems: "center", gap: spacing.sm },
  bottom: { alignItems: "center", gap: spacing.lg, paddingHorizontal: spacing.lg },
  digital: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center" },
  legend: { flexDirection: "row", gap: spacing.lg },
  legendItem: { fontFamily: fonts.text, fontSize: 12, color: colors.muted },
  page: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  pagerFooter: { alignItems: "center", gap: spacing.sm },
  hueControls: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary },
  dots: { flexDirection: "row", alignItems: "center", height: 44 },
  dotButton: { width: 36, height: 44, alignItems: "center", justifyContent: "center" },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.borderStrong },
  dotActive: { backgroundColor: colors.brand, width: 20 },
  faceName: { fontFamily: fonts.text, fontSize: 12, color: colors.muted, textAlign: "center" },
  footer: { alignItems: "center", gap: spacing.xs },
  footerLabel: { fontFamily: fonts.textSemiBold, fontSize: 11, color: colors.muted, letterSpacing: 1.2 },
  footerTime: { fontFamily: fonts.displayMedium, fontSize: 28, color: colors.onSurface },
  footerDate: { fontFamily: fonts.text, fontSize: 14, color: colors.muted, textAlign: "center" },
}));
