import Ionicons from "@react-native-vector-icons/ionicons";
import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { SOLAR_CITIES } from "@/src/solar/cities";
import { SolarLocation, SunTimes, isSolarLocation } from "@/src/solar/sun";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

type Props = { location: SolarLocation | null; times: SunTimes | null; onChange: (location: SolarLocation) => void };

export function DaylightLocation({ location, times, onChange }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const [search, setSearch] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [timeZone, setTimeZone] = useState("");
  const [error, setError] = useState("");
  const choose = (next: SolarLocation) => { onChange(next); setOpen(false); };
  const showPicker = () => {
    setSearch(""); setManual(false); setError("");
    setLatitude(location ? String(location.latitude) : "");
    setLongitude(location ? String(location.longitude) : "");
    setTimeZone(location?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC");
    setOpen(true);
  };
  const saveCoordinates = () => {
    const lat = Number(latitude.trim());
    const lon = Number(longitude.trim());
    if (!latitude.trim() || !longitude.trim() || !Number.isFinite(lat) || Math.abs(lat) > 90
      || !Number.isFinite(lon) || Math.abs(lon) > 180) {
      setError("Enter a latitude from −90 to 90 and a longitude from −180 to 180, in decimal degrees.");
      return;
    }
    const next = { name: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`, latitude: lat, longitude: lon, timeZone: timeZone.trim() };
    if (!isSolarLocation(next)) { setError("Enter a valid time zone, such as Europe/London or America/New_York."); return; }
    choose(next);
  };
  const time = (date: Date) => date.toLocaleTimeString(undefined, { timeZone: location!.timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ø/g, "o");
  const cities = SOLAR_CITIES.filter((city) => normalize(city.name).includes(normalize(search.trim())));

  return (
    <View style={styles.details} testID="daylight-location">
      {times?.kind === "normal" ? (
        <View style={styles.events}>
          <View style={styles.event}><Ionicons name="sunny-outline" size={16} color={colors.solarDawn} /><Text style={styles.eventText}>Sunrise {time(times.sunrise)}</Text></View>
          <View style={styles.event}><Ionicons name="moon-outline" size={16} color={colors.solarPredawn} /><Text style={styles.eventText}>Sunset {time(times.sunset)}</Text></View>
        </View>
      ) : times ? <Text style={styles.eventText}>{times.kind === "polar-day" ? "Midnight sun · daylight all day" : "Polar night · no sunrise today"}</Text>
        : <Text style={styles.hint}>Choose a location to see daylight on the rim.</Text>}
      <Pressable accessibilityRole="button" accessibilityLabel={location ? `Change location, ${location.name}` : "Choose daylight location"} onPress={showPicker} style={styles.locationButton} testID="daylight-location-button">
        <Ionicons name="location-outline" size={16} color={colors.brandSecondary} />
        <Text style={styles.locationText}>{location?.name ?? "Choose location"}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.brandSecondary} />
      </Pressable>
      {location && <Text style={styles.hint}>Estimated · standard time · {location.timeZone.replace(/_/g, " ")}</Text>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close location picker" />
          <View style={styles.sheet} accessibilityViewIsModal testID="daylight-location-picker">
            <View style={styles.sheetHeader}>
              <Text style={styles.title}>Daylight location</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close location picker"><Ionicons name="close" size={24} color={colors.onSurface} /></Pressable>
            </View>
            <Text style={styles.explanation}>The sun and rim follow this location’s local time. Your choice is saved on this device.</Text>
            <View style={styles.tabs}>
              {[false, true].map((custom) => <Pressable key={String(custom)} accessibilityRole="button" accessibilityState={{ selected: manual === custom }} onPress={() => { setManual(custom); setError(""); }} style={[styles.tab, manual === custom && styles.tabActive]}><Text style={manual === custom ? styles.tabTextActive : styles.tabText}>{custom ? "Coordinates" : "City"}</Text></Pressable>)}
            </View>
            {manual ? (
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
                <Text style={styles.hint}>Use decimal degrees: north/east positive, south/west negative. Longitude is needed to place sunrise and sunset on the clock.</Text>
                <Text style={styles.label}>Latitude</Text>
                <TextInput value={latitude} onChangeText={setLatitude} placeholder="e.g. 51.5074" placeholderTextColor={colors.muted} style={styles.input} accessibilityLabel="Latitude in decimal degrees" testID="daylight-latitude" autoCorrect={false} />
                <Text style={styles.label}>Longitude</Text>
                <TextInput value={longitude} onChangeText={setLongitude} placeholder="e.g. -0.1278" placeholderTextColor={colors.muted} style={styles.input} accessibilityLabel="Longitude in decimal degrees" testID="daylight-longitude" autoCorrect={false} />
                <Text style={styles.label}>Time zone</Text>
                <TextInput value={timeZone} onChangeText={setTimeZone} placeholder="e.g. Europe/London" placeholderTextColor={colors.muted} style={styles.input} accessibilityLabel="IANA time zone" testID="daylight-timezone" autoCapitalize="none" autoCorrect={false} />
                <Text style={styles.hint}>Use the time zone for these coordinates, such as Europe/London.</Text>
                {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
                <Pressable onPress={saveCoordinates} style={styles.saveButton} accessibilityRole="button" testID="daylight-save-coordinates"><Text style={styles.saveText}>Use coordinates</Text></Pressable>
              </ScrollView>
            ) : (
              <>
                <TextInput value={search} onChangeText={setSearch} placeholder="Search cities" placeholderTextColor={colors.muted} style={styles.input} accessibilityLabel="Search cities" testID="daylight-city-search" autoCorrect={false} />
                <ScrollView keyboardShouldPersistTaps="handled" style={styles.cityList}>
                  {cities.map((city) => <Pressable key={city.name} onPress={() => choose(city)} style={styles.cityRow} accessibilityRole="button" accessibilityLabel={city.name}>
                    <View style={styles.cityCopy}><Text style={styles.cityName}>{city.name}</Text><Text style={styles.hint}>{city.timeZone.replace(/_/g, " ")}</Text></View>
                    <Ionicons name={location?.name === city.name ? "checkmark" : "chevron-forward"} size={18} color={colors.brandSecondary} />
                  </Pressable>)}
                  {cities.length === 0 && <Text style={styles.explanation}>No matching city. Use Coordinates for any location.</Text>}
                </ScrollView>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  details: { alignItems: "center", gap: spacing.xs, width: "100%" },
  events: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: spacing.lg },
  event: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  eventText: { fontFamily: fonts.textMedium, color: colors.onSurface, fontSize: 14, textAlign: "center" },
  hint: { fontFamily: fonts.text, color: colors.muted, fontSize: 12, textAlign: "center" },
  locationButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, minHeight: 44, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surfaceSecondary, maxWidth: "100%" },
  locationText: { fontFamily: fonts.textMedium, color: colors.brandSecondary, fontSize: 14, flexShrink: 1 },
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl, backgroundColor: colors.scrim },
  backdrop: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0 },
  sheet: { width: "100%", maxWidth: 440, maxHeight: "90%", padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.borderStrong, gap: spacing.md },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.onSurface },
  explanation: { fontFamily: fonts.text, fontSize: 14, color: colors.muted },
  tabs: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.sm, padding: spacing.xs },
  tab: { flex: 1, alignItems: "center", padding: spacing.sm, borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.brand },
  tabText: { fontFamily: fonts.textMedium, color: colors.muted, fontSize: 14 },
  tabTextActive: { fontFamily: fonts.textSemiBold, color: colors.onBrand, fontSize: 14 },
  input: { fontFamily: fonts.text, fontSize: 16, color: colors.onSurface, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.sm, padding: spacing.md, minHeight: 46, backgroundColor: colors.surface },
  cityList: { flexShrink: 1 },
  cityRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  cityCopy: { flex: 1, alignItems: "flex-start", gap: spacing.xs },
  cityName: { fontFamily: fonts.textMedium, fontSize: 16, color: colors.onSurface },
  form: { gap: spacing.sm, paddingBottom: spacing.sm },
  label: { fontFamily: fonts.textSemiBold, fontSize: 13, color: colors.onSurface, marginTop: spacing.xs },
  error: { fontFamily: fonts.text, fontSize: 14, color: colors.error },
  saveButton: { alignItems: "center", justifyContent: "center", minHeight: 46, backgroundColor: colors.brand, borderRadius: radius.sm, marginTop: spacing.sm },
  saveText: { fontFamily: fonts.textSemiBold, fontSize: 16, color: colors.onBrand },
}));
