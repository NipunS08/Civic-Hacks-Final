import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ResidentProvider } from "../src/store";
import { CiviProvider } from "../src/civi";
import { usePalette } from "../src/ui";
export default function Root() {
  const p = usePalette();
  return (
    <SafeAreaProvider>
      <ResidentProvider>
        <CiviProvider>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: p.card },
              headerTintColor: p.ink,
              contentStyle: { backgroundColor: p.bg },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="item/[id]"
              options={{ title: "Decision", headerBackTitle: "Back" }}
            />
          </Stack>
        </CiviProvider>
      </ResidentProvider>
    </SafeAreaProvider>
  );
}
