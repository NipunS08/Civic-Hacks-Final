import React, { useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import {
  COVERAGE_NOTE,
  filterMobileItems,
  getCity,
  type AgendaItem,
} from "@civiclens/shared";
import { useResident } from "../../src/store";
import { PreferencesEditor } from "../../src/preferences";
import { loadItems } from "../../src/api";
import { ItemCard } from "../../src/item-card";
import { Title, Copy, Button, Busy, Card, usePalette, s } from "../../src/ui";
export default function Discover() {
  const { ready, preferences, storageError } = useResident();
  const p = usePalette();
  const router = useRouter();
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState("");
  const [body, setBody] = useState("all");
  useEffect(() => {
    if (!ready || !preferences.onboarded) return;
    const controller = new AbortController();
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setLoading(true);
        setError(undefined);
        setItems([]);
      }
    });
    loadItems(`?city=${preferences.city}`, controller.signal)
      .then((v) => {
        if (active) setItems(v);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [ready, preferences.city, preferences.onboarded, retry]);
  if (!ready) return <Busy label="Reading your preferences…" />;
  if (!preferences.onboarded) return <PreferencesEditor tour />;
  const filtered = filterMobileItems(items, preferences, query, body);
  return (
    <FlatList
      data={filtered}
      keyExtractor={(i) => i.item_number}
      contentContainerStyle={s.page}
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      renderItem={({ item }) => <ItemCard item={item} />}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => setRetry((x) => x + 1)}
          tintColor={p.blue}
        />
      }
      ListHeaderComponent={
        <View style={{ gap: 16, marginBottom: 20 }}>
          <View
            style={{
              backgroundColor: p.blue,
              padding: 24,
              borderRadius: 24,
              gap: 10,
            }}
          >
            <Text style={[s.eyebrow, { color: p.bg }]}>
              YOUR CITY. A CLEARER VIEW.
            </Text>
            <Text
              accessibilityRole="header"
              style={{
                fontSize: 30,
                lineHeight: 37,
                fontWeight: "700",
                color: p.bg,
              }}
            >
              What’s happening in {getCity(preferences.city)?.name}?
            </Text>
            <Text style={{ fontSize: 16, lineHeight: 24, color: p.bg }}>
              Follow decisions. Understand the record. Find your way to have a
              say.
            </Text>
          </View>
          <Button
            label="Change city, topics or timeframe"
            onPress={() => router.navigate("/settings")}
          />
          {storageError && <Copy>{storageError}</Copy>}
          <TextInput
            accessibilityLabel="Search titles and reference codes"
            placeholder="Search housing, parks, a street…"
            placeholderTextColor={p.muted}
            value={query}
            onChangeText={setQuery}
            style={[
              s.input,
              { borderColor: p.border, color: p.ink, backgroundColor: p.card },
            ]}
            clearButtonMode="while-editing"
          />
          <Copy small>Who is deciding</Copy>
          <View style={s.row}>
            {[
              ["all", "All"],
              ["staff", "Staff"],
              ["committee", "Committee"],
              ["council", "Council"],
              ["board", "Panel/board"],
              ["mayor", "Mayor"],
            ].map(([id, label]) => (
              <Button
                key={id}
                label={label}
                selected={body === id}
                onPress={() => setBody(id)}
              />
            ))}
          </View>
          <Copy small>{COVERAGE_NOTE}</Copy>
          <Copy>{filtered.length} matching items</Copy>
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <Busy />
        ) : error ? (
          <Card>
            <Title>Couldn’t load this city</Title>
            <Copy>{error}</Copy>
            <Button label="Try again" onPress={() => setRetry((x) => x + 1)} />
            <Button
              label="Check API connection in Settings"
              onPress={() => router.navigate("/settings")}
            />
          </Card>
        ) : (
          <Card>
            <Title>No matching items</Title>
            <Copy>
              Try another keyword, body, topic or timeframe. Toronto’s source
              only contains past recorded votes.
            </Copy>
            <Button
              label="Clear search and body filter"
              onPress={() => {
                setQuery("");
                setBody("all");
              }}
            />
            <Button
              label="Change preferences"
              onPress={() => router.navigate("/settings")}
            />
          </Card>
        )
      }
    />
  );
}
