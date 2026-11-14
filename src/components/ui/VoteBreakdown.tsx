// Recorded votes for one item: result, tally and who voted For / Against / Absent.
// Each row has a text label and an icon, so nothing relies on colour alone.
// "No recorded vote" never implies a unanimous or missing decision.

import { Check, Gavel, Minus, X, CircleSlash, CircleHelp } from "lucide-react";
import type { AgendaItem, RecordedVote, VoteGroup } from "@/types";
import { getCity } from "@/lib/cities";
import { formatHumanDate, voteSummary } from "@/lib/item-display";
import { isTodayOrLater } from "@/lib/dates";

const KIND_ICON: Record<VoteGroup["kind"], typeof Check> = {
  for: Check, against: X, absent: Minus, abstain: CircleSlash, other: CircleHelp,
};

const MOTION_LABEL: Record<RecordedVote["motion_kind"], string> = {
  main: "Vote on the proposal",
  amendment: "Vote on a change to the proposal (not the final decision)",
  procedural: "Vote on how the meeting runs",
};

function VoteCard({ vote }: { vote: RecordedVote }) {
  const recorded = vote.groups.length > 0;
  // If the names don't add up to the published tally, say so rather than hide it
  const named = (kind: VoteGroup["kind"]) => vote.groups.filter(g => g.kind === kind).reduce((n, g) => n + g.names.length, 0);
  const incomplete = recorded && vote.tally !== null && (named("for") !== vote.tally.for || named("against") !== vote.tally.against);
  return (
    <div className="cl-vote">
      <div className="cl-vote-head">
        <span className={`cl-badge ${vote.motion_kind === "amendment" ? "cl-badge-amber" : "cl-badge-neutral"}`}>{MOTION_LABEL[vote.motion_kind]}</span>
        <span className="cl-vote-result"><Gavel size={18} aria-hidden="true" /> {voteSummary(vote)}</span>
        <span className="text-sm text-gray-600">Official wording: &ldquo;{vote.result}&rdquo;</span>
      </div>

      {vote.motion_text && (
        <details>
          <summary className="cursor-pointer text-sm font-semibold">Exact wording of what they voted on</summary>
          <p className="mt-2 text-sm whitespace-pre-line text-gray-700">{vote.motion_text}</p>
        </details>
      )}
      {(vote.moved_by || vote.seconded_by) && (
        <p className="text-sm text-gray-700">
          {vote.moved_by && <>Moved by {vote.moved_by}</>}
          {vote.moved_by && vote.seconded_by && " · "}
          {vote.seconded_by && <>Seconded by {vote.seconded_by}</>}
        </p>
      )}

      {recorded ? (
        <table className="cl-vote-table">
          <caption className="sr-only">How members voted: {voteSummary(vote)}</caption>
          <tbody>
            {vote.groups.map(g => {
              const Icon = KIND_ICON[g.kind];
              return (
                <tr key={g.label}>
                  <th scope="row" className={`cl-vote-${g.kind === "abstain" ? "absent" : g.kind}`}>
                    <span><Icon size={16} aria-hidden="true" /> {g.label.replace(/[:\s]*\(\d+\)$/, "")} ({g.names.length})</span>
                  </th>
                  <td className="cl-vote-names">{g.names.join(", ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-gray-700">The official result is listed, but not how each member voted (no recorded vote).</p>
      )}
      {incomplete && (
        <p className="text-sm text-gray-700">
          Note: the member list above doesn&apos;t add up to the published tally ({vote.tally!.for} for, {vote.tally!.against} against).
          The result and tally are as published; check the source for the full list.
        </p>
      )}

      <p className="text-xs text-gray-600">
        Source:{" "}
        <a href={vote.source_url} target="_blank" rel="noopener noreferrer" className="cl-link">
          {/opendatakingston|open\.toronto/.test(vote.source_url) ? "official open data voting record" : "official meeting minutes"}
          <span className="sr-only"> (opens in new tab)</span>
        </a>
        {vote.source_date && <> · vote date {formatHumanDate(vote.source_date)}</>}
      </p>
    </div>
  );
}

export default function VoteBreakdown({ item }: { item: AgendaItem }) {
  const votes = item.votes ?? [];
  const order = { main: 0, amendment: 1, procedural: 2 };
  const sorted = [...votes].sort((a, b) => order[a.motion_kind] - order[b.motion_kind]);
  const substantive = sorted.filter(v => v.motion_kind !== "procedural");
  const procedural = sorted.filter(v => v.motion_kind === "procedural");
  const city = getCity(item.municipality_id);

  if (votes.length === 0) {
    const upcoming = isTodayOrLater(item.meeting_date) && item.stage !== "decided";
    return (
      <div className="cl-empty-vote">
        <CircleHelp size={20} aria-hidden="true" style={{ flex: "none", marginTop: 2 }} />
        <p>
          {upcoming
            ? "Not voted on yet. Results appear here after the meeting, once the city publishes minutes."
            : city?.votesSource === "none"
              ? `No recorded vote in our sources. ${city.name} publishes minutes as PDF files we can't read automatically, so check the minutes on the official portal. A missing vote here does not mean no decision was made.`
              : "No recorded vote in our sources. Many decisions are made without a recorded (named) vote. This does not mean the item was approved unanimously or that no decision was made. Check the official minutes."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {substantive.map((v, i) => <VoteCard key={`m-${i}`} vote={v} />)}
      {substantive.length === 0 && (
        <div className="cl-empty-vote"><CircleHelp size={20} aria-hidden="true" /><p>Only procedural motions were recorded for this item.</p></div>
      )}
      {procedural.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-semibold">Votes on how the meeting runs ({procedural.length})</summary>
          <div className="grid gap-3 mt-3">{procedural.map((v, i) => <VoteCard key={`p-${i}`} vote={v} />)}</div>
        </details>
      )}
    </div>
  );
}
