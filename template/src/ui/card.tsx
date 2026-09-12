import type { ReactNode } from "react";
import { View } from "react-native";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <View className={`rounded-2xl border border-border-hairline bg-surface-card p-4 ${className}`}>
      {children}
    </View>
  );
}
