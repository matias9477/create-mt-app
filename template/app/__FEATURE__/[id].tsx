import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, Text, View } from "react-native";
import {
  delete__FEATURE_PASCAL__,
  update__FEATURE_PASCAL__,
  use__FEATURE_PASCAL__ById,
} from "@/src/features/__FEATURE__/queries";
import { __FEATURE_PASCAL__Form } from "@/src/features/__FEATURE__/__FEATURE__-form";
import { Button } from "@/src/ui/button";
import { Screen } from "@/src/ui/screen";

export default function __FEATURE_PASCAL__DetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const { row, isLoading } = use__FEATURE_PASCAL__ById(id);

  function confirmDelete() {
    Alert.alert(t("detail.deleteConfirmTitle"), t("detail.deleteConfirmMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          void delete__FEATURE_PASCAL__(id).then(() => router.back());
        },
      },
    ]);
  }

  if (isLoading) {
    return <Screen scroll={false}>{null}</Screen>;
  }

  if (!row) {
    return (
      <Screen scroll={false}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-base text-text-tertiary">{t("detail.notFound")}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: row.title }} />
      <__FEATURE_PASCAL__Form
        defaultValues={{ title: row.title, notes: row.notes ?? "" }}
        submitLabel={t("form.update")}
        onSubmit={async (values) => {
          await update__FEATURE_PASCAL__(id, values);
          router.back();
        }}
      />
      <View className="mt-4">
        <Button label={t("common.delete")} variant="danger" onPress={confirmDelete} />
      </View>
    </Screen>
  );
}
