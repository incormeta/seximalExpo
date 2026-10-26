import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SegmentedControl } from "@/src/components/segmented-control";
import { DaylightLocation, isTimeZone } from "@/src/seximal/daylight";
import { searchCities } from "@/src/seximal/daylight-locations";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export function DaylightLocationPicker({ location, onSave, onClose }: {
  location: DaylightLocation;
  onSave: (location: DaylightLocation) => Promise<void>;
  onClose: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"city" | "manual">("city");
  const [query, setQuery] = useState("");
  const [name, setName] = useState(location.name);
  const [latitude, setLatitude] = useState(String(location.latitude));
  const [longitude, setLongitude] = useState(String(location.longitude));
  const [timeZone, setTimeZone] = useState(location.timeZone);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (value: DaylightLocation) => {
    setSaving(true);
    try { await onSave(value); } finally { setSaving(false); }
  };
  const saveManual = () => {
    const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
    if (!decimal.test(latitude.trim()) || Math.abs(Number(latitude)) > 90) {
      setError("Enter a latitude from −90 to 90."); return;
    }
    if (!decimal.test(longitude.trim()) || Math.abs(Number(longitude)) > 180) {
      setError("Enter a longitude from −180 to 180."); return;
    }
    if (!isTimeZone(timeZone.trim())) {
      setError("Enter a valid time zone, such as Europe/London or America/New_York."); return;
    }
    void save({ name: name.trim() || "Custom location", latitude: Number(latitude), longitude: Number(longitude), timeZone: timeZone.trim() });
  };
  const input = { style: styles.input, placeholderTextColor: colors.muted, autoCorrect: false, autoCapitalize: "none" as const };
  const cities = searchCities(query);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.overlay, { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.card} accessibilityViewIsModal testID="daylight-location-picker">
          <View style={styles.heading}>
            <Text style={styles.title} accessibilityRole="header">Daylight location</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close location picker" style={styles.close}><Text style={styles.link}>Close</Text></Pressable>
          </View>
          <Text style={styles.help}>Choose a city or enter coordinates. Works offline and saves on this device.</Text>
          <SegmentedControl options={[{ value: "city", label: "City" }, { value: "manual", label: "Coordinates" }]} value={mode} onChange={(value) => { setMode(value); setError(""); }} testID="daylight-location-mode" />
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {mode === "city" ? <>
              <TextInput {...input} accessibilityLabel="Search cities" placeholder="Search cities" value={query} onChangeText={setQuery} testID="daylight-city-search" />
              {cities.length === 0 && <Text style={styles.help}>No city found. Use Coordinates for any location.</Text>}
              {cities.map((city) => (
                <Pressable key={city.name} accessibilityRole="button" accessibilityLabel={`Select ${city.name}`} disabled={saving} onPress={() => void save(city)} style={styles.city}>
                  <Text style={styles.cityName}>{city.name}{city.name === location.name ? " · selected" : ""}</Text>
                  <Text style={styles.help}>{city.timeZone}</Text>
                </Pressable>
              ))}
            </> : <>
              <Text style={styles.label}>Location name</Text>
              <TextInput {...input} accessibilityLabel="Location name" value={name} onChangeText={setName} maxLength={80} />
              <Text style={styles.label}>Latitude · decimal degrees</Text>
              <TextInput {...input} accessibilityLabel="Latitude" value={latitude} onChangeText={setLatitude} placeholder="−90 to 90" />
              <Text style={styles.label}>Longitude · decimal degrees</Text>
              <TextInput {...input} accessibilityLabel="Longitude" value={longitude} onChangeText={setLongitude} placeholder="−180 to 180" />
              <Text style={styles.help}>North and east are positive; south and west are negative.</Text>
              <Text style={styles.label}>Time zone</Text>
              <TextInput {...input} accessibilityLabel="Time zone" value={timeZone} onChangeText={setTimeZone} placeholder="Europe/London" />
              <Text style={styles.help}>Use the location’s time zone. Daylight saving adjusts automatically.</Text>
              <Pressable accessibilityRole="button" onPress={() => setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)} style={styles.close}><Text style={styles.link}>Use device time zone</Text></Pressable>
              {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
              <Pressable accessibilityRole="button" disabled={saving} onPress={saveManual} style={styles.save} testID="daylight-save-location"><Text style={styles.saveLabel}>{saving ? "Saving…" : "Save location"}</Text></Pressable>
            </>}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  overlay: { flex: 1, backgroundColor: colors.scrim, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg },
  card: { width: "100%", maxWidth: 480, maxHeight: "100%", flexShrink: 1, padding: spacing.lg, gap: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSecondary },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: fonts.textSemiBold, color: colors.onSurface, fontSize: 20, flexShrink: 1 },
  close: { minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.sm, alignSelf: "flex-start" },
  link: { color: colors.brand, fontFamily: fonts.textSemiBold, fontSize: 14 },
  help: { color: colors.muted, fontFamily: fonts.text, fontSize: 13, lineHeight: 18 },
  scroll: { flexShrink: 1 },
  content: { gap: spacing.sm, paddingBottom: spacing.sm },
  input: { minHeight: 44, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.sm, padding: spacing.md, color: colors.onSurface, backgroundColor: colors.surface, fontFamily: fonts.text, fontSize: 16 },
  city: { paddingVertical: spacing.md, borderBottomWidth: 1, borderColor: colors.border, gap: spacing.xs },
  cityName: { fontFamily: fonts.textSemiBold, fontSize: 16, color: colors.onSurface },
  label: { fontFamily: fonts.textMedium, fontSize: 14, color: colors.onSurface, marginTop: spacing.sm },
  error: { fontFamily: fonts.text, fontSize: 14, color: colors.error },
  save: { minHeight: 44, backgroundColor: colors.brand, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  saveLabel: { fontFamily: fonts.textSemiBold, fontSize: 16, color: colors.onBrand },
}));
