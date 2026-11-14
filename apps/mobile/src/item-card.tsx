import React from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  explainItem,
  stageBadge,
  itemStatus,
  formatHumanDate,
  getCity,
  type AgendaItem,
} from "@civiclens/shared";
import { Card, Copy, Button, usePalette, s } from "./ui";
export function ItemCard({ item }: { item: AgendaItem }) {
  const router = useRouter();
  const p = usePalette();
  const plain = explainItem(item);
  return (
    <Card>
      <View style={s.row}>
        <MaterialCommunityIcons name="gavel" color={p.blue} size={22} />
        <Text style={{ color: p.green, fontSize: 13, fontWeight: "700" }}>
          {itemStatus(item) === "upcoming"
            ? "Coming up"
            : itemStatus(item) === "held"
              ? "Outcome unknown"
              : itemStatus(item) === "deferred"
                ? "Delayed"
                : itemStatus(item) === "referred"
                  ? "Referred"
                  : "Decided"}{" "}
          · {getCity(item.municipality_id)?.name}
        </Text>
      </View>
      <Text
        accessibilityRole="header"
        style={{
          fontSize: 21,
          fontWeight: "700",
          color: p.ink,
          lineHeight: 28,
        }}
      >
        {plain.headline}
      </Text>
      <Copy small>
        {stageBadge(item).label} · {formatHumanDate(item.meeting_date)}
      </Copy>
      <Copy>{plain.details ?? plain.whatsHappening}</Copy>
      <Copy small>
        Retrieved {new Date(item.retrieved_at).toLocaleString()}
      </Copy>
      <Button
        label="Read decision →"
        onPress={() =>
          router.push({
            pathname: "/item/[id]",
            params: { id: item.item_number },
          })
        }
      />
    </Card>
  );
}
