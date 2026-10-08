import Ionicons from "@expo/vector-icons/Ionicons";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useThemeColors } from "./theme-colors";

interface ListRowProps {
  title: string;
  subtitle?: string | undefined;
  onPress?: () => void;
  /** Trailing control (switch, checkmark). Tappable rows without one get a chevron. */
  right?: ReactNode;
}

/**
 * One row of a ListSection (or a grouped list). No border or background of
 * its own — the section draws the card and the separators.
 */
export function ListRow({ title, subtitle, onPress, right }: ListRowProps) {
  const c = useThemeColors();
  const trailing =
    right ??
    (onPress ? <Ionicons name="chevron-forward" size={18} color={c.textTertiary} /> : null);
  const content = (
    <View className="min-h-11 flex-row items-center justify-between px-4 py-3">
      <View className="mr-3 flex-1">
        <Text className="text-base text-text-primary">{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-sm text-text-tertiary">{subtitle}</Text> : null}
      </View>
      {trailing}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="active:bg-surface-sunken">
      {content}
    </Pressable>
  );
}
