import { Text, TextInput, type TextInputProps, View } from "react-native";
import { useThemeColors } from "./theme-colors";

interface FieldProps extends TextInputProps {
  label: string;
  error?: string | undefined;
}

/** Labeled text input with an error slot — pairs with react-hook-form's Controller. */
export function Field({ label, error, ...inputProps }: FieldProps) {
  const c = useThemeColors();
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm font-medium text-text-secondary">{label}</Text>
      <TextInput
        placeholderTextColor={c.textTertiary}
        className={`rounded-xl border bg-surface-card px-4 py-3 text-base text-text-primary ${
          error ? "border-danger-fg" : "border-border-hairline"
        }`}
        {...inputProps}
      />
      {error ? <Text className="mt-1 text-sm text-danger-fg">{error}</Text> : null}
    </View>
  );
}
