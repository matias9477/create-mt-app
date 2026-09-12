import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenProps {
  children: ReactNode;
  /** Scrollable content (default). Set false for screens that manage their own list. */
  scroll?: boolean;
  className?: string;
}

/** Page wrapper: themed background + safe-area padding. */
export function Screen({ children, scroll = true, className = "" }: ScreenProps) {
  const insets = useSafeAreaInsets();
  if (!scroll) {
    return (
      <View
        className={`flex-1 bg-surface-page ${className}`}
        style={{ paddingBottom: insets.bottom }}
      >
        {children}
      </View>
    );
  }
  return (
    <ScrollView
      className={`flex-1 bg-surface-page ${className}`}
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}
