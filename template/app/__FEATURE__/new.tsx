import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { __FEATURE_PASCAL__Form } from "@/src/features/__FEATURE__/__FEATURE__-form";
import { create__FEATURE_PASCAL__ } from "@/src/features/__FEATURE__/queries";
import { haptics } from "@/src/features/haptics/haptics";
import { Screen } from "@/src/ui/screen";

export default function New__FEATURE_PASCAL__Screen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen>
      <__FEATURE_PASCAL__Form
        submitLabel={t("form.create")}
        onSubmit={async (values) => {
          await create__FEATURE_PASCAL__(values);
          haptics.success();
          router.back();
        }}
      />
    </Screen>
  );
}
