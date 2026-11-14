import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useColorScheme,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { officialUrl } from "@civiclens/shared";
export function usePalette() {
  return useColorScheme() === "dark"
    ? {
        bg: "#0b1622",
        card: "#112233",
        ink: "#e6eef6",
        muted: "#a9bacb",
        blue: "#8cc4f5",
        green: "#45d6bb",
        border: "#56728c",
        tint: "#0f2438",
      }
    : {
        bg: "#f5f8fb",
        card: "#ffffff",
        ink: "#12304a",
        muted: "#435b6d",
        blue: "#004890",
        green: "#006b5b",
        border: "#6c8aa1",
        tint: "#eaf2fa",
      };
}
export function Title({ children }: { children: React.ReactNode }) {
  const p = usePalette();
  return (
    <Text
      accessibilityRole="header"
      style={{ fontSize: 28, fontWeight: "700", color: p.ink, lineHeight: 35 }}
    >
      {children}
    </Text>
  );
}
export function Copy({
  children,
  small = false,
}: {
  children: React.ReactNode;
  small?: boolean;
}) {
  const p = usePalette();
  return (
    <Text
      style={{
        color: p.muted,
        fontSize: small ? 13 : 16,
        lineHeight: small ? 20 : 25,
      }}
    >
      {children}
    </Text>
  );
}
export function Card({ children }: { children: React.ReactNode }) {
  const p = usePalette();
  return (
    <View
      style={{
        backgroundColor: p.card,
        borderColor: p.border,
        borderWidth: 1,
        borderRadius: 20,
        padding: 20,
        gap: 12,
      }}
    >
      {children}
    </View>
  );
}
export function Button({
  label,
  onPress,
  selected = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
}) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        justifyContent: "center",
        backgroundColor: selected ? p.blue : p.card,
        borderColor: p.border,
        borderWidth: 1,
        opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          color: selected ? p.bg : p.blue,
          fontSize: 15,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export async function openOfficial(url: string) {
  if (!officialUrl(url)) {
    Alert.alert(
      "Link unavailable",
      "Only secure official web links can be opened.",
    );
    return;
  }
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      "Could not open the link",
      "Check your connection and try again.",
    );
  }
}
export function SourceButton({
  url,
  label = "Open official source ↗",
}: {
  url: string;
  label?: string;
}) {
  return (
    <Button
      label={label}
      onPress={() => {
        void openOfficial(url);
      }}
    />
  );
}
export function Busy({
  label = "Loading official records…",
}: {
  label?: string;
}) {
  const p = usePalette();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      style={{ padding: 24, gap: 12 }}
    >
      <ActivityIndicator color={p.blue} />
      <Copy>
        {label} You can leave this screen; requests time out after one minute.
      </Copy>
    </View>
  );
}
export const s = StyleSheet.create({
  page: { padding: 20, gap: 20, paddingBottom: 120 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  section: { gap: 12 },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1.5 },
  heading: { fontSize: 20, fontWeight: "700" },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    minHeight: 50,
  },
});
