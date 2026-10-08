import { Link, Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { LinearTransition } from "react-native-reanimated";
import { AdBanner } from "@/src/features/ads/ad-banner";
import { useAll__FEATURE_PASCAL__ } from "@/src/features/__FEATURE__/queries";
import { ListRow } from "@/src/ui/list-row";
import { DURATION } from "@/src/ui/motion";
import { Screen } from "@/src/ui/screen";
import { EmptyState, ErrorState, LoadingState } from "@/src/ui/state-views";

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, error } = useAll__FEATURE_PASCAL__();

  return (
    <Screen scroll={false}>
      {/* Native header item — iOS 26 renders it as a liquid-glass button. */}
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="plus"
          accessibilityLabel={t("home.new")}
          onPress={() => router.push("/__FEATURE__/new")}
        />
      </Stack.Toolbar>
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
          contentInsetAdjustmentBehavior="automatic"
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
