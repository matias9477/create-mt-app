import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { useAll__FEATURE_PASCAL__ } from "@/src/features/__FEATURE__/queries";
import __FEATURE_PASCAL__Widget from "@/widgets/__FEATURE_PASCAL__Widget";

/**
 * Invisible provider: pushes the latest __FEATURE__ into the home-screen
 * widget snapshot. Strings are pre-translated on the JS side — the widget
 * receives display text, never i18n keys. Widget sync must never break the
 * app, hence the catch-all. Mounted once in app/_layout.tsx.
 */
export function WidgetSync(): null {
  const { t } = useTranslation();
  const { data } = useAll__FEATURE_PASCAL__();

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    try {
      const latest = data[0];
      __FEATURE_PASCAL__Widget.updateSnapshot({
        title: latest?.title ?? "",
        subtitle: t("home.title").toUpperCase(),
        emptyText: t("widget.empty"),
        hasData: latest !== undefined,
      });
    } catch (error) {
      console.error("[widgets/WidgetSync] snapshot update failed", error);
    }
  }, [data, t]);

  return null;
}
