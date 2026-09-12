import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface ListRowProps {
  title: string;
  subtitle?: string | undefined;
  onPress?: () => void;
  right?: ReactNode;
}

/** Tappable settings/list row on a card surface. */
export function ListRow({ title, subtitle, onPress, right }: ListRowProps) {
  const content = (
    <View className="flex-row items-center justify-between border-b border-border-hairline bg-surface-card px-4 py-3.5">
      <View className="mr-3 flex-1">
        <Text className="text-base text-text-primary">{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-sm text-text-tertiary">{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-70">
      {content}
    </Pressable>
  );
}
