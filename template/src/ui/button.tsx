import { ActivityIndicator, Pressable, Text } from "react-native";
import { useThemeColors } from "./theme-colors";

type Variant = "primary" | "secondary" | "danger";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
}

const containerClasses: Record<Variant, string> = {
  primary: "bg-accent-fg",
  secondary: "bg-surface-sunken border border-border-hairline",
  danger: "bg-transparent",
};

const labelClasses: Record<Variant, string> = {
  primary: "text-accent-on",
  secondary: "text-text-primary",
  danger: "text-danger-fg",
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
}: ButtonProps) {
  const c = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      className={`min-h-12 items-center justify-center rounded-xl px-4 py-3 active:opacity-80 ${
        containerClasses[variant]
      } ${disabled ? "opacity-40" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? c.accentOn : c.textPrimary} />
      ) : (
        <Text className={`text-base font-semibold ${labelClasses[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
