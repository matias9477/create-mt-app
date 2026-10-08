import { Stack } from "expo-router";
import { Platform } from "react-native";
import { useThemeColors } from "./theme-colors";

/**
 * The native stack inside each tab: large title that collapses into the
 * iOS 26 liquid-glass bar on scroll. Don't give the header a backgroundColor
 * on iOS — any solid fill turns the glass off. Scroll views underneath must
 * set contentInsetAdjustmentBehavior="automatic" (Screen does) so content
 * starts below the title and clears the floating tab bar.
 */
export function TabStack({ title }: { title: string }) {
  const c = useThemeColors();
  const ios = Platform.OS === "ios";

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: ios,
        headerTransparent: ios,
        headerShadowVisible: false,
        headerTintColor: c.textPrimary,
        headerLargeTitleStyle: { color: c.textPrimary },
        headerTitleStyle: { color: c.textPrimary },
        ...(ios ? {} : { headerStyle: { backgroundColor: c.surfacePage } }),
        contentStyle: { backgroundColor: c.surfacePage },
      }}
    >
      <Stack.Screen name="index" options={{ title }} />
    </Stack>
  );
}
