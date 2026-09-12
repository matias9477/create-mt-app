import Constants from "expo-constants";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Text, View } from "react-native";
import { DeveloperSection } from "@/src/features/dev/developer-section";
import { useIsPro, usePurchasesStore } from "@/src/features/purchases/purchasesStore";
import { requestReviewExplicitly } from "@/src/lib/review-prompt";
import {
  type LanguagePreference,
  type ThemePreference,
  usePreferencesStore,
} from "@/src/stores/preferences";
import { Card } from "@/src/ui/card";
import { ListRow } from "@/src/ui/list-row";
import { Screen } from "@/src/ui/screen";

const PRIVACY_POLICY_URL = "https://www.matiasturra.dev/privacy/__SLUG__";

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="mb-2 mt-6 px-1 text-sm font-semibold uppercase tracking-wide text-text-tertiary">
      {children}
    </Text>
  );
}

function Check({ visible }: { visible: boolean }) {
  return visible ? <Text className="text-base font-bold text-accent-fg">✓</Text> : null;
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const themePreference = usePreferencesStore((s) => s.themePreference);
  const setThemePreference = usePreferencesStore((s) => s.setThemePreference);
  const languagePreference = usePreferencesStore((s) => s.languagePreference);
  const setLanguagePreference = usePreferencesStore((s) => s.setLanguagePreference);
  const isPro = useIsPro();
  const restore = usePurchasesStore((s) => s.restore);
  const [restoring, setRestoring] = useState(false);
  const version = Constants.expoConfig?.version ?? "—";

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: "system", label: t("settings.themeSystem") },
    { value: "light", label: t("settings.themeLight") },
    { value: "dark", label: t("settings.themeDark") },
  ];
  const languageOptions: { value: LanguagePreference; label: string }[] = [
    { value: "system", label: t("settings.languageSystem") },
    { value: "en", label: t("settings.languageEnglish") },
    { value: "es", label: t("settings.languageSpanish") },
  ];

  async function onRestore() {
    setRestoring(true);
    const restored = await restore();
    setRestoring(false);
    Alert.alert(restored ? t("settings.restoreSuccess") : t("settings.restoreNone"));
  }

  function openPrivacyPolicy() {
    void WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL).catch((error) => {
      console.error("[settings/openPrivacyPolicy] failed", error);
    });
  }

  return (
    <Screen>
      <SectionTitle>{t("settings.appearance")}</SectionTitle>
      <Card className="overflow-hidden p-0">
        {themeOptions.map((option) => (
          <ListRow
            key={option.value}
            title={option.label}
            onPress={() => setThemePreference(option.value)}
            right={<Check visible={themePreference === option.value} />}
          />
        ))}
      </Card>

      <SectionTitle>{t("settings.language")}</SectionTitle>
      <Card className="overflow-hidden p-0">
        {languageOptions.map((option) => (
          <ListRow
            key={option.value}
            title={option.label}
            onPress={() => setLanguagePreference(option.value)}
            right={<Check visible={languagePreference === option.value} />}
          />
        ))}
      </Card>

      <SectionTitle>{t("settings.pro")}</SectionTitle>
      <Card className="overflow-hidden p-0">
        <ListRow
          title={isPro ? t("settings.proActive") : t("settings.proInactive")}
          {...(!isPro && {
            subtitle: t("settings.goPro"),
            onPress: () => router.push("/paywall"),
          })}
        />
        <ListRow
          title={restoring ? t("common.loading") : t("settings.restorePurchases")}
          onPress={() => void onRestore()}
        />
      </Card>

      <SectionTitle>{t("settings.about")}</SectionTitle>
      <Card className="overflow-hidden p-0">
        <ListRow
          title={t("settings.leaveReview")}
          onPress={() => void requestReviewExplicitly()}
        />
        <ListRow title={t("settings.privacyPolicy")} onPress={openPrivacyPolicy} />
        <ListRow title={t("settings.viewOnboarding")} onPress={() => router.push("/onboarding")} />
      </Card>

      <DeveloperSection />

      <View className="mt-8 items-center">
        <Text className="text-sm text-text-tertiary">
          {t("settings.version")} {version}
        </Text>
      </View>
    </Screen>
  );
}
