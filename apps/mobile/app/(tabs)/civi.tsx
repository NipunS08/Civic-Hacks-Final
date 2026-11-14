import React from "react";
import { ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { useCivi } from "../../src/civi";
import { Title, Copy, Card, Button, s } from "../../src/ui";
export default function Civi() {
  const { open } = useCivi();
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={s.page}>
      <Image
        source={require("../../assets/civi.png")}
        accessibilityLabel="Civi waving hello"
        style={{ width: 160, height: 160, alignSelf: "center" }}
      />
      <Title>A little help finding your way</Title>
      <Copy>
        I’m Civi, your CivicLens guide. Open me from a decision page for
        guidance about that record.
      </Copy>
      <Card>
        <Copy>
          Staff recommendations, committee advice and council decisions are
          different stages. A recorded vote may concern an amendment rather than
          final approval.
        </Copy>
        <Button label="Open Civi guide" onPress={open} />
        <Button label="Find a decision" onPress={() => router.navigate("/")} />
      </Card>
      <Copy small>
        Predetermined guidance, linked to published records. Independent
        project, not an official municipal service.
      </Copy>
    </ScrollView>
  );
}
