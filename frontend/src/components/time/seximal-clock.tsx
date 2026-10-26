import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";

import { MonoDigits } from "@/src/components/mono-digits";
import { useClockTime } from "@/src/components/time/clock-time";
import { HueClock } from "@/src/components/time/hue-clock";
import { ProgressBars } from "@/src/components/time/progress-bars";
import { ClockSource } from "@/src/utils/clock-source";
import { ClockFace } from "@/src/components/time/clock-face";
import { DaylightLocationPicker } from "@/src/components/time/daylight-location-picker";
import { pad6 } from "@/src/seximal/base";
import { FaceId, FACES, restoredFace } from "@/src/seximal/clock-faces";
import { calculateDaylight, Daylight, DaylightLocation, daylightDuration, formatSunTime, parseLocation, zonedParts } from "@/src/seximal/daylight";
import { DEFAULT_DAYLIGHT_LOCATION } from "@/src/seximal/daylight-locations";
import { formatClock, formatStandardClock, msToSeximal, nowSeximal } from "@/src/seximal/time";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { haptics } from "@/src/utils/haptics";
import { storage } from "@/src/utils/storage";

const FACE_KEY = "seximal.clock.face.v2";
const LOCATION_KEY = "seximal.clock.daylight.location";

type Props = { availableHeight: number; clock: ClockSource; onFaceChange: (face: FaceId) => void };

export function SeximalClock({ availableHeight, clock, onFaceChange }: Props) {
  const styles = useStyles();
  const { width: windowWidth } = useWindowDimensions();
  const [width, setWidth] = useState(windowWidth);
  const [face, setFace] = useState(0);
  const [ready, setReady] = useState(false);
  const [location, setLocation] = useState(DEFAULT_DAYLIGHT_LOCATION);
  const [pickingLocation, setPickingLocation] = useState(false);
  const [storageNotice, setStorageNotice] = useState("");
  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const pagerRef = useRef<ScrollView>(null);
  const selected = useRef(0);
  const scrollTarget = useRef<number | null>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDaylight = FACES[face].id === "daylight";
  const isHue = FACES[face].id === "hue";
  const compactProgress = FACES[face].id === "progress" && availableHeight > 0 && availableHeight < 480;
  const showHeader = !isHue && !compactProgress;
  const now = useClockTime(clock, isDaylight);

  useEffect(() => { onFaceChange(FACES[face].id); }, [face, onFaceChange]);
  useEffect(() => () => { if (scrollTimer.current) clearTimeout(scrollTimer.current); }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([
      storage.getItem(FACE_KEY, ""), storage.getItem("seximal.clock.face", null), storage.getItem(LOCATION_KEY, ""),
    ]).then(([saved, legacy, place]) => {
      if (!active) return;
      const index = restoredFace(saved, legacy);
      selected.current = index;
      setFace(index);
      setLocation(parseLocation(place) ?? DEFAULT_DAYLIGHT_LOCATION);
      setReady(true);
    });
    return () => { active = false; };
  }, []);

  // Re-align after hydration, resizing or rotating an installed PWA. The page
  // width comes from the actual container, not an assumed device screen width.
  useEffect(() => {
    if (!ready) return;
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTarget.current = null;
    const frame = requestAnimationFrame(() => pagerRef.current?.scrollTo({ x: selected.current * width, animated: false }));
    return () => cancelAnimationFrame(frame);
  }, [width, ready]);

  const commitFace = useCallback((index: number) => {
    selected.current = index;
    setFace(index);
    void storage.setItem(FACE_KEY, String(FACES[index].id));
  }, []);

  const selectFace = (index: number) => {
    if (!ready) return;
    haptics.selection();
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTarget.current = index;
    commitFace(index);
    pagerRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const settle = (x: number) => {
    if (!ready || width <= 0) return;
    // A throttled scroll event can arrive while a button's smooth transition is
    // still in flight. Only settle that transition at its intended destination.
    if (scrollTarget.current !== null && Math.abs(x - scrollTarget.current * width) > 2) return;
    scrollTarget.current = null;
    const index = Math.min(FACES.length - 1, Math.max(0, Math.round(x / width)));
    if (selected.current !== index) commitFace(index);
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset;
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    // RN Web doesn't consistently emit native drag/momentum-end events.
    // RN Web exposes live offset getters; read at settlement, not at the first
    // animation frame. Native supplies its final snapshot in momentum-end.
    scrollTimer.current = setTimeout(() => settle(offset.x), 160);
  };

  const local = zonedParts(now, location.timeZone);
  const daylight = useMemo(() => calculateDaylight(local.date, location), [local.date, location]);
  const dialHeight = availableHeight > 0 && (!showHeader || headerHeight > 0) && footerHeight > 0
    ? Math.max(144, availableHeight - (showHeader ? headerHeight : 0) - footerHeight - spacing.lg * (showHeader ? 4 : 3))
    : 360;
  const size = Math.min(width - spacing.lg * 2, 360, dialHeight);
  const pageHeight = isHue ? dialHeight : FACES[face].id === "progress" ? Math.max(compactProgress ? 200 : 240, Math.min(dialHeight, 360)) : size;

  const saveLocation = async (value: DaylightLocation) => {
    // The storage wrapper accepts scalar values, so the location is one atomic
    // JSON document inside its string value, validated on every restore.
    const saved = await storage.setItem(LOCATION_KEY, JSON.stringify(value));
    setLocation(value);
    setStorageNotice(saved ? "" : "Location is active, but device storage is unavailable. It may reset when you reopen the app.");
    setPickingLocation(false);
  };
  const sunrise = daylight.events.find((event) => event.kind === "sunrise");
  const sunset = daylight.events.find((event) => event.kind === "sunset");

  return (
    <View style={[styles.root, isHue && { minHeight: Math.max(0, availableHeight) }]} onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)} testID="clock-view">
      {showHeader && <View style={styles.header} onLayout={({ nativeEvent }) => setHeaderHeight(nativeEvent.layout.height)}>
        <ClockHeader clock={clock} width={width} timeZone={isDaylight ? location.timeZone : undefined} />
      </View>}
      <ScrollView
        ref={pagerRef} horizontal pagingEnabled decelerationRate="fast" showsHorizontalScrollIndicator={false}
        onScroll={onScroll} scrollEventThrottle={16}
        onTouchStart={() => { scrollTarget.current = null; }}
        onScrollBeginDrag={() => { scrollTarget.current = null; }}
        {...(Platform.OS === "web" ? { onWheel: () => { scrollTarget.current = null; } } : {})}
        onMomentumScrollEnd={onScroll}
        onScrollEndDrag={onScroll}
        style={{ width, height: pageHeight, flexGrow: 0 }} testID="clock-face-pager"
      >
        {FACES.map((f, index) => (
          <View key={f.id} style={[styles.page, { width, height: pageHeight }]} aria-hidden={index !== face} accessibilityElementsHidden={index !== face} importantForAccessibility={index === face ? "auto" : "no-hide-descendants"}>
            <ClockPage face={f.id} clock={clock} active={index === face} size={size} width={width} height={pageHeight} daylight={daylight} timeZone={location.timeZone} />
          </View>
        ))}
      </ScrollView>
      <View style={[styles.bottom, { width }]} onLayout={({ nativeEvent }) => setFooterHeight(nativeEvent.layout.height)}>
        <View style={[styles.pagerFooter, isHue && styles.hueControls]}>
          <View style={styles.switcher}>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous clock face" disabled={!ready || face === 0} onPress={() => selectFace(Math.max(0, selected.current - 1))} style={[styles.arrow, face === 0 && styles.disabled]} testID="clock-face-previous"><Text style={styles.arrowText}>‹</Text></Pressable>
            <Text style={styles.position} aria-live="polite" accessibilityLiveRegion="polite" testID="clock-face-position">{FACES[face].name} · {face + 1} of {FACES.length}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Next clock face" disabled={!ready || face === FACES.length - 1} onPress={() => selectFace(Math.min(FACES.length - 1, selected.current + 1))} style={[styles.arrow, face === FACES.length - 1 && styles.disabled]} testID="clock-face-next"><Text style={styles.arrowText}>›</Text></Pressable>
          </View>
          <View style={styles.dots} accessibilityRole="tablist" accessibilityLabel="Clock faces" testID="clock-face-dots">
            {FACES.map((f, i) => (
              <Pressable key={f.id} testID={`clock-face-dot-${f.id}`} accessibilityRole="tab" aria-selected={i === face} accessibilityLabel={`${f.name}, ${i + 1} of ${FACES.length}`} accessibilityState={{ selected: i === face, disabled: !ready }} disabled={!ready} onPress={() => selectFace(i)} style={styles.dotButton}>
                <View style={[styles.dot, i === face && styles.dotActive]} />
              </Pressable>
            ))}
          </View>
          <Text style={styles.faceName} testID="clock-face-name">{FACES[face].description}</Text>
        </View>
        {isDaylight && <View style={styles.daylightDetails} testID="daylight-details">
          <Pressable accessibilityRole="button" accessibilityLabel={`Change daylight location, currently ${location.name}`} disabled={!ready} onPress={() => setPickingLocation(true)} style={styles.locationButton} testID="daylight-change-location">
            <Text style={styles.locationName}>{location.name} · Change location</Text>
          </Pressable>
          <Text style={styles.zone}>{location.timeZone.replace(/_/g, " ")}</Text>
          {daylight.state === "normal" ? <>
            <View style={styles.events}>
              <Text style={styles.sunrise} testID="daylight-sunrise">↑ Sunrise {sunrise ? formatSunTime(sunrise.at, location.timeZone) : "—"}</Text>
              <Text style={styles.sunset} testID="daylight-sunset">↓ Sunset {sunset ? formatSunTime(sunset.at, location.timeZone) : "—"}</Text>
            </View>
            <Text style={styles.zone}>{daylightDuration(daylight.daylightMs)} of daylight{!sunrise || !sunset ? " · — no event today" : ""}</Text>
          </> : <Text style={styles.polar} testID="daylight-polar-state">{daylight.state === "polar-day" ? "Polar day · sun stays above the horizon" : "Polar night · sun stays below the horizon"}</Text>}
          {!!storageNotice && <Text style={styles.notice} accessibilityRole="alert">{storageNotice}</Text>}
        </View>}
        {!isHue && <ClockFooter clock={clock} timeZone={isDaylight ? location.timeZone : undefined} />}
      </View>
      {pickingLocation && <DaylightLocationPicker location={location} onSave={saveLocation} onClose={() => setPickingLocation(false)} />}
    </View>
  );
}

function ClockPage({ face, clock, active, size, width, height, daylight, timeZone }: {
  face: FaceId; clock: ClockSource; active: boolean; size: number; width: number; height: number; daylight: Daylight; timeZone: string;
}) {
  if (face === "progress") return <ProgressBars clock={clock} active={active} width={Math.min(width - spacing.lg * 2, 640)} height={height} />;
  if (face === "hue") return <View style={{ height, justifyContent: "center" }}><HueClock clock={clock} active={active} width={width - spacing.xl * 2} /></View>;
  return <LiveAnalogFace face={face} clock={clock} active={active} size={size} daylight={daylight} timeZone={timeZone} />;
}

function LiveAnalogFace({ face, clock, active, size, daylight, timeZone }: {
  face: Exclude<FaceId, "progress" | "hue">; clock: ClockSource; active: boolean; size: number; daylight: Daylight; timeZone: string;
}) {
  const now = useClockTime(clock, active);
  return <ClockFace face={face} size={size} time={face === "daylight" ? msToSeximal(zonedParts(now, timeZone).timeMs) : nowSeximal(now)} daylight={face === "daylight" ? daylight : undefined} />;
}

function ClockHeader({ clock, width, timeZone }: { clock: ClockSource; width: number; timeZone?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const now = useClockTime(clock);
  const t = timeZone ? msToSeximal(zonedParts(now, timeZone).timeMs) : nowSeximal(now);
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

function ClockFooter({ clock, timeZone }: { clock: ClockSource; timeZone?: string }) {
  const styles = useStyles();
  const now = useClockTime(clock);
  const dateLabel = now.toLocaleDateString(undefined, { timeZone, weekday: "long", month: "long", day: "numeric" });
  return (
    <View style={styles.footer}>
      <Text style={styles.footerLabel}>{timeZone ? "LOCATION TIME" : "STANDARD TIME"}</Text>
      <Text style={styles.footerTime} testID="clock-standard">{timeZone ? new Intl.DateTimeFormat(undefined, { timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(now) : formatStandardClock(now)}</Text>
      <Text style={styles.footerDate} testID="clock-date">{dateLabel}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { width: "100%", alignItems: "center", gap: spacing.lg, paddingVertical: spacing.lg },
  header: { alignItems: "center", gap: spacing.sm },
  bottom: { alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg },
  digital: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center" },
  legend: { flexDirection: "row", gap: spacing.lg },
  legendItem: { fontFamily: fonts.text, fontSize: 12, color: colors.muted },
  page: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  pagerFooter: { alignItems: "center", width: "100%" },
  hueControls: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary },
  switcher: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: 320 },
  arrow: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, backgroundColor: colors.surfaceSecondary },
  arrowText: { fontFamily: fonts.text, fontSize: 30, color: colors.brand },
  disabled: { opacity: 0.3 },
  position: { fontFamily: fonts.textSemiBold, fontSize: 15, color: colors.onSurface },
  dots: { flexDirection: "row", alignItems: "center", width: "100%", maxWidth: 352 },
  dotButton: { flex: 1, height: 44, alignItems: "center", justifyContent: "center" },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.borderStrong },
  dotActive: { backgroundColor: colors.brand, width: 20 },
  faceName: { fontFamily: fonts.text, fontSize: 12, color: colors.muted, textAlign: "center" },
  daylightDetails: { alignItems: "center", gap: spacing.xs },
  locationButton: { minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm },
  locationName: { fontFamily: fonts.textSemiBold, fontSize: 15, color: colors.brand, textAlign: "center" },
  zone: { fontFamily: fonts.text, fontSize: 12, color: colors.muted, textAlign: "center" },
  events: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: spacing.md, marginTop: spacing.xs },
  sunrise: { fontFamily: fonts.textMedium, fontSize: 14, color: colors.solarDay },
  sunset: { fontFamily: fonts.textMedium, fontSize: 14, color: colors.solarSunset },
  polar: { fontFamily: fonts.textMedium, fontSize: 14, color: colors.solarDay, textAlign: "center" },
  notice: { fontFamily: fonts.text, fontSize: 12, color: colors.warning, textAlign: "center" },
  footer: { alignItems: "center", gap: spacing.xs },
  footerLabel: { fontFamily: fonts.textSemiBold, fontSize: 11, color: colors.muted, letterSpacing: 1.2 },
  footerTime: { fontFamily: fonts.displayMedium, fontSize: 28, color: colors.onSurface },
  footerDate: { fontFamily: fonts.text, fontSize: 14, color: colors.muted, textAlign: "center" },
}));
