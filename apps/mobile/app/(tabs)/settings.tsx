import React from "react";
import { View, Alert, Platform } from "react-native";
import { PreferencesEditor } from "../../src/preferences";
import { useResident } from "../../src/store";
import { API_URL } from "../../src/api";
import { Card, Copy, Button, s } from "../../src/ui";
export default function Settings() {
  const { clear, storageError } = useResident();
  const reset = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Clear your local saved decisions and preferences?"))
        clear();
    } else
      Alert.alert(
        "Clear local data?",
        "This removes saved snapshots and resets preferences on this device.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Clear", style: "destructive", onPress: clear },
        ],
      );
  };
  return (
    <PreferencesEditor
      footer={
        <View style={s.section}>
          <Card>
            <Copy>
              No account, background location or push notifications. Saved items
              stay on this device; they are not monitored for updates.
            </Copy>
            <Copy small>API connection: {API_URL}</Copy>
            <Copy small>
              On a phone, localhost means the phone. Set EXPO_PUBLIC_API_URL to
              the website’s LAN or deployed URL, then restart Expo.
            </Copy>
            {storageError && <Copy>{storageError}</Copy>}
            <Button
              label="Clear saved decisions and preferences"
              onPress={reset}
            />
          </Card>
        </View>
      }
    />
  );
}
