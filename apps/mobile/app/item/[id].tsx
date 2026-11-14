import React, { useEffect, useState } from "react";
import { ScrollView, View, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  explainItem,
  agendaEvidence,
  stageBadge,
  itemStatus,
  participationState,
  decisionMilestone,
  formatHumanDate,
  getCity,
  voteSummary,
  type AgendaItem,
} from "@civiclens/shared";
import { loadItems, recentItems } from "../../src/api";
import { useResident } from "../../src/store";
import { useCivi } from "../../src/civi";
import {
  Title,
  Copy,
  Card,
  Button,
  SourceButton,
  Busy,
  usePalette,
  s,
} from "../../src/ui";
export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { saved, toggleSaved, storageError } = useResident();
  const { setItem: setContext } = useCivi();
  const router = useRouter();
  const p = usePalette();
  const [record, setItem] = useState<AgendaItem | undefined>(
    () => recentItems.get(id) ?? saved.find((i) => i.item_number === id),
  );
  const item =
    record?.item_number === id
      ? record
      : (recentItems.get(id) ?? saved.find((i) => i.item_number === id));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [retry, setRetry] = useState(0);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (active) {
        setLoading(true);
        setError(undefined);
      }
    });
    loadItems(`/${encodeURIComponent(id)}`, controller.signal)
      .then((items) => {
        if (active) setItem(items[0]);
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
  }, [id, retry]);
  useEffect(() => {
    setContext(item);
    return () => setContext(undefined);
  }, [item, setContext]);
  if (!item)
    return (
      <ScrollView contentContainerStyle={s.page}>
        {loading ? (
          <Busy />
        ) : (
          <Card>
            <Title>Record unavailable</Title>
            <Copy>
              {error ?? "This item is not in the current source feed."}
            </Copy>
            <Button label="Try again" onPress={() => setRetry((x) => x + 1)} />
            <Button
              label="Browse decisions"
              onPress={() => router.navigate("/")}
            />
          </Card>
        )}
      </ScrollView>
    );
  const plain = explainItem(item);
  const evidence = agendaEvidence(item.description);
  const eligibility = participationState(item);
  const decision = decisionMilestone(item);
  const isSaved = saved.some((i) => i.item_number === item.item_number);
  const city = getCity(item.municipality_id);
  return (
    <ScrollView contentContainerStyle={s.page}>
      {loading && <Copy small>Refreshing this official record…</Copy>}
      {error && (
        <Card>
          <Copy>Showing a previously retrieved snapshot. {error}</Copy>
          <Button
            label="Retry refresh"
            onPress={() => setRetry((x) => x + 1)}
          />
        </Card>
      )}
      <View style={s.row}>
        <Text
          style={[
            s.pill,
            { backgroundColor: p.tint, color: p.green, fontWeight: "700" },
          ]}
        >
          {itemStatus(item) === "upcoming"
            ? "Coming up"
            : itemStatus(item) === "held"
              ? "Result unknown"
              : itemStatus(item)}
        </Text>
        <Copy small>{city?.name}</Copy>
      </View>
      <Title>{plain.headline}</Title>
      <Copy>{plain.whatsHappening}</Copy>
      <Button
        label={isSaved ? "Remove from saved" : "Save this decision"}
        selected={isSaved}
        onPress={() => toggleSaved(item)}
      />
      {storageError && <Copy>{storageError}</Copy>}
      <Card>
        <Text accessibilityRole="header" style={[s.heading, { color: p.ink }]}>
          Current status
        </Text>
        <Copy>{stageBadge(item).label}</Copy>
        <Copy>{stageBadge(item).explain}</Copy>
        <Copy small>
          {item.committee} · Meeting {formatHumanDate(item.meeting_date)}
        </Copy>
      </Card>
      <Card>
        <Text accessibilityRole="header" style={[s.heading, { color: p.ink }]}>
          What is proposed?
        </Text>
        <Copy>
          {plain.details ??
            "The listing does not include a description of the proposal. Open the official report for its scope."}
        </Copy>
        {item.description && <>
          <Copy>{expanded ? item.description : evidence.overview}</Copy>
          <Button label={expanded ? "Collapse published text" : "Read full published text"} onPress={() => setExpanded(v => !v)} />
        </>}
        <SourceButton url={item.source_url} />
      </Card>
      <Card>
        <Text accessibilityRole="header" style={[s.heading, { color: p.ink }]}>
          Why?
        </Text>
        <Copy>
          The listing may not include the rationale or all conditions. Check the
          staff report and exact motion at the official source; CivicLens does
          not infer reasons from a title.
        </Copy>
      </Card>
      <Card>
        <Text accessibilityRole="header" style={[s.heading, { color: p.ink }]}>
          Who and where may be affected?
        </Text>
        <Copy>
          {evidence.impacts.length
            ? evidence.impacts.join("\n\n")
            : "Personal impacts are not established by this listing. Check for changes to your street, services, access or costs in the report."}
        </Copy>
        {item.ward && (
          <Copy>
            Location mentioned: {item.ward}. This does not define the full
            affected area.
          </Copy>
        )}
        <Copy small>
          Source excerpts are not an assessment of your personal circumstances.
        </Copy>
      </Card>
      <Card>
        <Text accessibilityRole="header" style={[s.heading, { color: p.ink }]}>
          Recorded votes
        </Text>
        {item.votes?.length ? (
          item.votes.map((vote, index) => (
            <View
              key={index}
              style={{
                gap: 8,
                borderTopWidth: index ? 1 : 0,
                borderColor: p.border,
                paddingTop: index ? 12 : 0,
              }}
            >
              <Copy>
                {vote.motion_kind === "amendment"
                  ? "Amendment — not a final decision"
                  : vote.motion_kind === "procedural"
                    ? "Procedural motion"
                    : "Recorded motion"}{" "}
                · {voteSummary(vote)}
              </Copy>
              {vote.motion_text && <Copy small>{vote.motion_text}</Copy>}
              {vote.groups.map((g, n) => (
                <Copy small key={n}>
                  {g.label}: {g.names.join(", ")}
                </Copy>
              ))}
              {vote.groups.length === 0 && (
                <Copy small>
                  Individual votes were not published in our source.
                </Copy>
              )}
              <SourceButton
                url={vote.source_url}
                label="Check the exact motion ↗"
              />
            </View>
          ))
        ) : (
          <Copy>
            No recorded vote is available here. This does not establish
            unanimity or imply that no decision happened.
          </Copy>
        )}
      </Card>
      <Card>
        <Text accessibilityRole="header" style={[s.heading, { color: p.ink }]}>
          Key dates & timeline
        </Text>
        {[
          {
            title: "City meeting",
            date: formatHumanDate(item.meeting_date),
            note: "Municipality calendar date, not a submission cutoff.",
            known: true,
          },
          {
            title: decision.title,
            date: decision.known
              ? formatHumanDate(decision.date)
              : decision.date,
            note: decision.note,
            known: decision.known,
          },
          {
            title: "Work begins",
            date: "Not confirmed",
            note: "A published implementation schedule is needed.",
            known: false,
          },
          {
            title: "Completion",
            date: "Not confirmed",
            note: "A recorded vote is not evidence of completed delivery.",
            known: false,
          },
        ].map((m, index) => (
          <View key={m.title} style={{ flexDirection: "row", gap: 14 }}>
            <View style={{ alignItems: "center", width: 28 }}>
              <Text
                style={{
                  borderWidth: 2,
                  borderColor: m.known ? p.green : p.border,
                  color: p.ink,
                  borderRadius: 14,
                  width: 28,
                  height: 28,
                  textAlign: "center",
                  paddingTop: 2,
                }}
              >
                {index + 1}
              </Text>
              {index < 3 && (
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 25,
                    backgroundColor: p.border,
                  }}
                />
              )}
            </View>
            <View style={{ flex: 1, paddingBottom: 18, gap: 4 }}>
              <Text style={{ fontWeight: "700", color: p.ink, fontSize: 16 }}>
                {m.title} · {m.date}
              </Text>
              <Copy small>{m.note}</Copy>
            </View>
          </View>
        ))}
        <Copy small>
          Illustrative delivery milestones may not apply to reviews or
          information reports. {decision.explanation}
        </Copy>
      </Card>
      <Card>
        <Text accessibilityRole="header" style={[s.heading, { color: p.ink }]}>
          How to have a say
        </Text>
        <Copy>
          {eligibility === "verified_open"
            ? "The published item-specific input window is open. Check official instructions for eligibility."
            : eligibility === "verified_closed"
              ? "The published input window is closed."
              : "Input availability and deadline are unverified. A meeting date does not mean comments are still accepted."}
        </Copy>
        {eligibility !== "unknown" && item.participation_evidence?.deadline && (
          <Copy>
            Published deadline:{" "}
            {new Date(item.participation_evidence.deadline).toLocaleString(
              undefined,
              { timeZoneName: "short" },
            )}
          </Copy>
        )}
        <SourceButton
          url={item.participation_evidence?.source_url ?? item.source_url}
          label="Check official participation options ↗"
        />
        {city?.participationUrl && (
          <>
            <Copy small>
              This general guide is not proof of an open window for this item.
            </Copy>
            <SourceButton
              url={city.participationUrl}
              label={`${city.name} participation guide ↗`}
            />
          </>
        )}
      </Card>
      <Card>
        <Text accessibilityRole="header" style={[s.heading, { color: p.ink }]}>
          Sources & freshness
        </Text>
        <Copy small>
          Retrieved{" "}
          {new Date(item.retrieved_at).toLocaleString(undefined, {
            timeZoneName: "short",
          })}
          . A cached or saved record may be out of date.
        </Copy>
        <SourceButton url={item.source_url} />
        {item.meeting_url && (
          <SourceButton
            url={item.meeting_url}
            label="Official meeting page ↗"
          />
        )}
      </Card>
    </ScrollView>
  );
}
