import Ionicons from "@react-native-vector-icons/ionicons";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usesNativeTabs } from "@/src/navigation";
import { fonts, useTheme } from "@/src/theme";

const TABS = [
  { name: "index", title: "Calc", icon: "calculator", sf: "plus.forwardslash.minus" },
  { name: "convert", title: "Convert", icon: "swap-horizontal", sf: "arrow.left.arrow.right" },
  { name: "time", title: "Time", icon: "time", sf: "clock.fill" },
  { name: "learn", title: "Learn", icon: "book", sf: "book.fill" },
] as const;

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (usesNativeTabs) {
    return (
      <NativeTabs tintColor={colors.brand}>
        {TABS.map((t) => (
          <NativeTabs.Trigger key={t.name} name={t.name}>
            <NativeTabs.Trigger.Icon sf={t.sf} />
            <NativeTabs.Trigger.Label>{t.title}</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        ))}
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.surface },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surfaceSecondary,
          borderTopColor: colors.border,
          ...(Platform.OS === "web" ? { height: 64 + insets.bottom, paddingBottom: insets.bottom } : {}),
        },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarLabelStyle: { fontFamily: fonts.textSemiBold, fontSize: 12 },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarButtonTestID: `tab-${t.title.toLowerCase()}`,
            tabBarIcon: ({ color, size }) => <Ionicons name={t.icon} size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
