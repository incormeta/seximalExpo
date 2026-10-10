import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import Head from "expo-router/head";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { LogBox, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { useTheme } from "@/src/theme";
import { registerPwa } from "@/src/utils/pwa";

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true);

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { colors } = useTheme();
  // Prewarm icon font + custom fonts so Expo Go (Android) renders them on first paint.
  const [loaded] = useFonts({
    Ionicons: require("@react-native-vector-icons/ionicons/fonts/Ionicons.ttf"),
    "BarlowCondensed-SemiBold": require("../assets/fonts/BarlowCondensed-SemiBold.ttf"),
    "BarlowCondensed-Medium": require("../assets/fonts/BarlowCondensed-Medium.ttf"),
    "BarlowCondensed-Regular": require("../assets/fonts/BarlowCondensed-Regular.ttf"),
    "Barlow-Regular": require("../assets/fonts/Barlow-Regular.ttf"),
    "Barlow-Medium": require("../assets/fonts/Barlow-Medium.ttf"),
    "Barlow-SemiBold": require("../assets/fonts/Barlow-SemiBold.ttf"),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  useEffect(() => { registerPwa(); }, []);

  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.surface }} />;

  // One app level ErrorBoundary; a render crash shows a reload screen
  // instead of a blank app.
  return (
    <ErrorBoundary>
      <Head><title>Seximal</title></Head>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.surface }}>
          <KeyboardProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }} />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
