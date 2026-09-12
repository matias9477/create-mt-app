import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { usePreferencesStore } from "@/src/stores/preferences";
import { useThemeColors } from "@/src/ui/theme-colors";

export default function TabsLayout() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const onboardingDone = usePreferencesStore((s) => s.onboardingDone);

  if (!onboardingDone) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.accentFg,
        tabBarInactiveTintColor: c.textTertiary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabs.settings"),
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
