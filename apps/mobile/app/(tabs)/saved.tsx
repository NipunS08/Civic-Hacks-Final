import React from "react";
import { FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { useResident } from "../../src/store";
import { ItemCard } from "../../src/item-card";
import { Title, Copy, Card, Button, s } from "../../src/ui";
export default function Saved() {
  const { saved, storageError } = useResident();
  const router = useRouter();
  return (
    <FlatList
      data={saved}
      contentContainerStyle={s.page}
      keyExtractor={(i) => i.item_number}
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      renderItem={({ item }) => <ItemCard item={item} />}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 16 }}>
          <Title>Your saved decisions</Title>
          <Copy>
            Stored on this device. These are snapshots, not live updates; open
            an item to refresh it.
          </Copy>
          {storageError && <Copy>{storageError}</Copy>}
        </View>
      }
      ListEmptyComponent={
        <Card>
          <Copy>
            Save a decision from its detail page to return to it later.
          </Copy>
          <Button
            label="Explore decisions"
            onPress={() => router.navigate("/")}
          />
        </Card>
      }
    />
  );
}
