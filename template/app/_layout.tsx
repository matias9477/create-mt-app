import "@/global.css";
import "@/src/i18n";

import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import migrations from "@/drizzle/migrations";
import { db } from "@/src/db/client";
import { initializeAds } from "@/src/features/ads/adsService";
import { LanguageSync } from "@/src/features/i18n/LanguageSync";
import { usePurchasesStore } from "@/src/features/purchases/purchasesStore";
import { ThemeSync } from "@/src/features/theme/ThemeSync";
import { WidgetSync } from "@/src/features/widgets/WidgetSync";
import { usePreferencesHydrated } from "@/src/stores/preferences";
import { ErrorBoundary } from "@/src/ui/error-boundary";
import { ThemeRoot } from "@/src/ui/theme-root";
import { useThemeColors } from "@/src/ui/theme-colors";

function RootStack() {
  const { t } = useTranslation();
  // expo-router no longer ships React Navigation's ThemeProvider —
  // theme the navigator through screenOptions instead.
  const c = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.surfaceCard },
        headerTintColor: c.textPrimary,
        contentStyle: { backgroundColor: c.surfacePage },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen
        name="__FEATURE__/new"
        options={{ presentation: "modal", title: t("home.new") }}
      />
      <Stack.Screen name="__FEATURE__/[id]" options={{ title: "" }} />
      <Stack.Screen
        name="paywall"
        options={{ presentation: "modal", title: t("paywall.title") }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const { t } = useTranslation();

  // Boot gates: nothing renders until the DB is migrated and prefs rehydrated.
  const { success: migrated, error: migrationError } = useMigrations(db, migrations);
  const hydrated = usePreferencesHydrated();

  useEffect(() => {
    usePurchasesStore.getState().initialize();
    initializeAds();
  }, []);

  if (migrationError) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-page p-6">
        <Text className="text-center text-base text-danger-fg">
          {t("common.error")}: {migrationError.message}
        </Text>
      </View>
    );
  }

  if (!migrated || !hydrated) {
    return <View className="flex-1 bg-surface-page" />;
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <ThemeRoot>
        <ErrorBoundary>
          <ThemeSync />
          <LanguageSync />
          <WidgetSync />
          <RootStack />
          <StatusBar style="auto" />
        </ErrorBoundary>
      </ThemeRoot>
    </GestureHandlerRootView>
  );
}
