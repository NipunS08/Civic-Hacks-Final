import React from "react";
import { Tabs } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { usePalette } from "../../src/ui";
export default function TabLayout() {
  const p = usePalette();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: p.card },
        headerTintColor: p.ink,
        sceneStyle: { backgroundColor: p.bg },
        tabBarStyle: { backgroundColor: p.card, borderTopColor: p.border },
        tabBarActiveTintColor: p.blue,
        tabBarInactiveTintColor: p.muted,
      }}
    >
      {(
        [
          ["index", "Discover", "compass-outline"],
          ["saved", "Saved", "bookmark-outline"],
          ["civi", "Civi", "chat-outline"],
          ["settings", "Settings", "tune"],
        ] as const
      ).map(([name, title, icon]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name={icon}
                size={size}
                color={typeof color === "string" ? color : p.blue}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
