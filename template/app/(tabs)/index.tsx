import { Link, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { useAll__FEATURE_PASCAL__ } from "@/src/features/__FEATURE__/queries";
import { ListRow } from "@/src/ui/list-row";
import { Screen } from "@/src/ui/screen";
import { useThemeColors } from "@/src/ui/theme-colors";

export default function HomeScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const { data, isLoading } = useAll__FEATURE_PASCAL__();

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
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={c.accentFg} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          contentContainerClassName="py-2"
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8 pt-24">
              <Text className="text-center text-base text-text-tertiary">{t("home.empty")}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Link href={{ pathname: "/__FEATURE__/[id]", params: { id: String(item.id) } }} asChild>
              <ListRow title={item.title} subtitle={item.notes ?? undefined} onPress={() => {}} />
            </Link>
          )}
        />
      )}
    </Screen>
  );
}
