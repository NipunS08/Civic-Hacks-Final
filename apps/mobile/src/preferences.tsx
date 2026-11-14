import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { CITIES, TOPICS, DEFAULT_PREFERENCES } from "@civiclens/shared";
import { useResident } from "./store";
import { Card, Title, Copy, Button, s } from "./ui";
export function PreferencesEditor({
  tour = false,
  footer,
}: {
  tour?: boolean;
  footer?: React.ReactNode;
}) {
  const { preferences: p, setPreferences } = useResident();
  const [step, setStep] = useState(0);
  return (
    <ScrollView
      contentContainerStyle={s.page}
      keyboardShouldPersistTaps="handled"
    >
      <Title>
        {tour ? "A clearer view of your city" : "Your reading preferences"}
      </Title>
      <Copy>
        {tour
          ? `Step ${step + 1} of 3 · No account needed. Your choices stay on this device.`
          : "Change what appears in Discover. No location permission is needed."}
      </Copy>
      {(!tour || step === 0) && (
        <Card>
          <Title>Choose your city</Title>
          <View style={s.row}>
            {CITIES.map((c) => (
              <Button
                key={c.id}
                label={c.name}
                selected={p.city === c.id}
                onPress={() => setPreferences({ ...p, city: c.id })}
              />
            ))}
          </View>
        </Card>
      )}
      {(!tour || step === 1) && (
        <Card>
          <Title>What matters to you?</Title>
          <Copy>
            Choose any topics, or leave them off to explore everything.
          </Copy>
          <View style={s.row}>
            {TOPICS.map((t) => (
              <Button
                key={t.id}
                label={t.label}
                selected={p.topics.includes(t.id)}
                onPress={() =>
                  setPreferences({
                    ...p,
                    topics: p.topics.includes(t.id)
                      ? p.topics.filter((x) => x !== t.id)
                      : [...p.topics, t.id],
                  })
                }
              />
            ))}
          </View>
        </Card>
      )}
      {(!tour || step === 2) && (
        <Card>
          <Title>When?</Title>
          <View style={s.row}>
            {(["all", "upcoming", "past"] as const).map((v) => (
              <Button
                key={v}
                label={
                  v === "all"
                    ? "Upcoming + past"
                    : v === "past"
                      ? "Past meetings"
                      : "Coming up"
                }
                selected={p.timeframe === v}
                onPress={() => setPreferences({ ...p, timeframe: v })}
              />
            ))}
          </View>
          <Copy>Meeting dates are not submission deadlines.</Copy>
        </Card>
      )}
      {tour && (
        <>
          <Button
            label={step === 2 ? "Explore decisions" : "Next"}
            selected
            onPress={() =>
              step === 2
                ? setPreferences({ ...p, onboarded: true })
                : setStep(step + 1)
            }
          />
          {step > 0 && (
            <Button label="Back" onPress={() => setStep(step - 1)} />
          )}
          <Button
            label="Skip and explore"
            onPress={() =>
              setPreferences({ ...DEFAULT_PREFERENCES, onboarded: true })
            }
          />
        </>
      )}
      {footer}
    </ScrollView>
  );
}
