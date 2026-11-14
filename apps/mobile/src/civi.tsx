import React, { createContext, useContext, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  ScrollView,
  Pressable,
  AccessibilityInfo,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  civiResponse,
  type AgendaItem,
  type GuideChoice,
} from "@civiclens/shared";
import { Button, Title, Copy, SourceButton, usePalette } from "./ui";
const Context = createContext<{
  setItem: React.Dispatch<React.SetStateAction<AgendaItem | undefined>>;
  open: () => void;
} | null>(null);
export function useCivi() {
  const v = useContext(Context);
  if (!v) throw Error("CiviProvider missing");
  return v;
}
export function CiviProvider({ children }: { children: React.ReactNode }) {
  const [item, setItem] = useState<AgendaItem>();
  const [visible, setVisible] = useState(false);
  const [choice, setChoice] = useState<GuideChoice>();
  const p = usePalette();
  const inset = useSafeAreaInsets();
  const launcher = useRef<React.ComponentRef<typeof View>>(null);
  const close = () => {
    setVisible(false);
    requestAnimationFrame(() => launcher.current?.focus());
  };
  return (
    <Context.Provider
      value={{
        setItem,
        open: () => {
          setChoice(undefined);
          setVisible(true);
        },
      }}
    >
      {children}
      <Pressable
        ref={launcher}
        accessibilityRole="button"
        accessibilityLabel="Open Civi site guide"
        onPress={() => {
          setChoice(undefined);
          setVisible(true);
        }}
        style={{
          position: "absolute",
          right: 16,
          bottom: 90 + inset.bottom,
          flexDirection: "row",
          alignItems: "center",
          paddingRight: 16,
          borderWidth: 1,
          borderColor: p.border,
          borderRadius: 32,
          backgroundColor: p.card,
          minHeight: 56,
          elevation: 5,
        }}
      >
        <Image
          source={require("../assets/civi.png")}
          style={{ width: 64, height: 64 }}
          accessibilityIgnoresInvertColors
        />
        <Text style={{ color: p.blue, fontWeight: "700", fontSize: 17 }}>
          Civi
        </Text>
      </Pressable>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={close}
        onShow={() =>
          AccessibilityInfo.announceForAccessibility("Civi site guide opened")
        }
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#0008",
            justifyContent: "flex-end",
            paddingTop: inset.top + 30,
          }}
          accessibilityViewIsModal
          onAccessibilityEscape={close}
        >
          <View
            style={{
              backgroundColor: p.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "90%",
              paddingBottom: Math.max(inset.bottom, 20),
            }}
          >
            <ScrollView
              contentContainerStyle={{ padding: 24, gap: 16 }}
              keyboardShouldPersistTaps="handled"
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <Image
                  source={require("../assets/civi.png")}
                  style={{ width: 76, height: 76 }}
                />
                <Title>Hi, I’m Civi</Title>
              </View>
              <Copy>
                I’m a CivicLens guide, not an official city service or a
                chatbot.
              </Copy>
              {item && <Copy small>About: {item.title}</Copy>}
              {choice ? (
                <>
                  <Copy>{civiResponse(choice, item)}</Copy>
                  {item && <SourceButton url={item.source_url} />}
                  <Button
                    label="Back to choices"
                    onPress={() => setChoice(undefined)}
                  />
                </>
              ) : (
                <>
                  {(
                    [
                      ["meaning", "What does this mean?"],
                      ["impact", "How could this affect me?"],
                      ["participate", "Can I still provide input?"],
                      ["sources", "Show original sources"],
                    ] as const
                  ).map(([id, label]) => (
                    <Button
                      key={id}
                      label={label}
                      onPress={() => {
                        setChoice(id);
                        AccessibilityInfo.announceForAccessibility(
                          civiResponse(id, item),
                        );
                      }}
                    />
                  ))}
                </>
              )}
              <Button
                label="Restart guide"
                onPress={() => setChoice(undefined)}
              />
              <Button label="Close Civi" selected onPress={close} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Context.Provider>
  );
}
