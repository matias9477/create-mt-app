import { Link, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { AdBanner } from "@/src/features/ads/ad-banner";
import { useAll__FEATURE_PASCAL__ } from "@/src/features/__FEATURE__/queries";
import { ListRow } from "@/src/ui/list-row";
import { DURATION } from "@/src/ui/motion";
import { Screen } from "@/src/ui/screen";
import { EmptyState, ErrorState, LoadingState } from "@/src/ui/state-views";
import { useThemeColors } from "@/src/ui/theme-colors";

export default function HomeScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const { data, isLoading, error } = useAll__FEATURE_PASCAL__();

  return (
    <Screen scroll={false}>
      <Stack.Screen
        options={{
          title: t("home.title"),
          headerRight: () => (
            <Link href="/__FEATURE__/new" className="px-2 py-1">
              <Text className="text-base font-semibold" style={{ color: c.accentFg }}>
                {t("home.new")}
              </Text>
            </Link>
          ),
        }}
      />
      {error ? (
        <ErrorState />
      ) : isLoading ? (
        <LoadingState />
      ) : (
        <Animated.FlatList
          data={data}
          // Rows slide into place when one is added/deleted instead of jumping.
          itemLayoutAnimation={LinearTransition.duration(DURATION.layout)}
          keyExtractor={(item) => String(item.id)}
          contentContainerClassName="py-2"
          ListEmptyComponent={<EmptyState message={t("home.empty")} />}
          renderItem={({ item }) => (
            <Link href={{ pathname: "/__FEATURE__/[id]", params: { id: String(item.id) } }} asChild>
              <ListRow title={item.title} subtitle={item.notes ?? undefined} onPress={() => {}} />
            </Link>
          )}
        />
      )}
      <AdBanner />
    </Screen>
  );
}
