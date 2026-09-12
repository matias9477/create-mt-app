import { Alert, Text } from "react-native";
import { db } from "@/src/db/client";
import { __FEATURE__ } from "@/src/db/schema";
import { usePreferencesStore } from "@/src/stores/preferences";
import { Card } from "@/src/ui/card";
import { ListRow } from "@/src/ui/list-row";

/**
 * __DEV__-only tools for staging UI states (App Store screenshots, empty
 * states, onboarding re-runs) and exercising flows without hand-editing data.
 * Copy is intentionally English-only — it never ships to users. Rendered at
 * the bottom of Settings, gated on __DEV__ in one place (here).
 */
export function DeveloperSection() {
  const setOnboardingDone = usePreferencesStore((s) => s.setOnboardingDone);

  if (!__DEV__) return null;

  function resetOnboarding() {
    setOnboardingDone(false);
    Alert.alert("Onboarding reset", "Relaunch or navigate to see it again.");
  }

  function deleteAll() {
    Alert.alert("Delete ALL __FEATURE__?", "Dev-only: empties the table to stage empty states.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          db.delete(__FEATURE__)
            .then(() => Alert.alert("Done", "All rows deleted."))
            .catch((error) => console.error("[dev/deleteAll] failed", error));
        },
      },
    ]);
  }

  return (
    <>
      <Text className="mb-2 mt-6 px-1 text-sm font-semibold uppercase tracking-wide text-text-tertiary">
        Developer (dev builds only)
      </Text>
      <Card className="overflow-hidden p-0">
        <ListRow title="Reset onboarding flag" onPress={resetOnboarding} />
        <ListRow title="Delete all __FEATURE__ (stage empty states)" onPress={deleteAll} />
      </Card>
    </>
  );
}
