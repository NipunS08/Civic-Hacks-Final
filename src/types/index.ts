// Core domain types for CivicLens.
// Every type that touches user-facing data requires source_url + retrieved_at.

/** A municipality (e.g. Toronto) served by one platform adapter */
export interface Municipality {
  id: string;
  name: string;
  province: string;
  platform: string; // e.g. "toronto-opendata", "escribe", "civicweb"
  portal_url: string;
  timezone: string;
}

/** A committee or council meeting session */
export interface Meeting {
  id: string;
  municipality_id: string;
  committee: string;        // e.g. "City Council", "Planning and Housing Committee"
  committee_code: string;   // e.g. "CC", "PH", "EX"
  meeting_number: string;   // e.g. "12"
  date: string;             // ISO 8601 date "2026-11-20"
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  status: "upcoming" | "in_progress" | "completed";
  source_url: string;       // REQUIRED: official page or dataset URL
  retrieved_at: string;     // ISO 8601 datetime when we fetched this
}

/** A single item on a meeting agenda */
export interface AgendaItem {
  participation_evidence?: import("../lib/participation-state").ParticipationEvidence;
  id: string;
  municipality_id: string;
  meeting_id: string | null;        // null if we don't have a linked meeting record
  item_number: string;              // e.g. "2026.CC12.4"
  title: string;
  description: string | null;       // may be null if not in open data
  committee: string;
  committee_code: string;
  meeting_date: string;             // ISO date
  ward: string | null;
  address: string | null;           // raw address if present in title/description
  lat: number | null;               // geocoded from address
  lng: number | null;
  stage: ItemStage;
  content_hash: string;             // sha256 of title+description — used to detect real changes
  source_url: string;               // REQUIRED
  retrieved_at: string;             // REQUIRED
  // ---- Optional enrichments (added for multi-city support) ----
  /** Official reference shown as a secondary "Item ID" (e.g. "2026.CC12.4", "GIC 26-013").
   *  Internal IDs we generate (OTT-…) are never shown to residents. */
  official_code?: string | null;
  /** Which body the record represents — drives the "Staff recommendation /
   *  Committee decision / Council decision" badge. */
  decision_body?: DecisionBody;
  /** Outcome status when the record says so (e.g. minutes say "Deferred"). */
  status_override?: "deferred" | "referred" | null;
  /** Recorded votes found in minutes or open data. Empty = no recorded vote. */
  votes?: RecordedVote[];
  /** Participation links exactly as exposed on the official meeting/item page. */
  official_links?: OfficialItemLink[];
  /** Official meeting page for context, when different from source_url
   *  (e.g. the agenda for an item whose source is the minutes). */
  meeting_url?: string | null;
}

/** What kind of record an item is: a staff recommendation going to committee,
 *  a committee's decision (not final), a council decision, or a mayoral decision. */
export type DecisionBody = "staff" | "committee" | "council" | "mayor" | "board";

/** One group of voters as published, e.g. "In Favour (11)" → kind "for". */
export interface VoteGroup {
  label: string;            // label exactly as the city published it
  kind: "for" | "against" | "absent" | "abstain" | "other";
  names: string[];
}

/** One recorded vote on one motion. */
export interface RecordedVote {
  motion_kind: "main" | "amendment" | "procedural";
  motion_text: string | null;   // plain text of the motion, if published
  result: string;               // e.g. "Carried (20 to 4)" as published
  tally: { for: number; against: number } | null;
  groups: VoteGroup[];
  moved_by: string | null;
  seconded_by: string | null;
  source_url: string;           // REQUIRED: minutes page or dataset
  source_date: string;          // ISO date of the meeting/vote
}

/** A participation link shown only when the official page exposes it. */
export interface OfficialItemLink {
  kind: "delegation" | "comment";
  label: string;            // e.g. "Request to speak (Delegation request)"
  url: string;
}

/** The procedural stage of an item — drives the Say-Window display */
export type ItemStage =
  | "committee"           // at a standing committee or community council
  | "city_council"        // referred to / scheduled for City Council
  | "appeal"              // OMB/LPAT/OLT appeal window
  | "decided"             // voted on and completed
  | "unknown";

/** How residents can participate in a decision */
export interface Participation {
  id: string;
  item_id: string;
  method: "written_comment" | "deputation" | "petition" | "appeal" | "other";
  deadline: string | null;          // ISO datetime
  deadline_source_excerpt: string | null; // exact text the deadline was parsed from
  instructions_url: string;         // link to official "how to submit" page
  form_url: string | null;          // direct form or email link if available
  source_url: string;               // REQUIRED
  retrieved_at: string;             // REQUIRED
}

/** Vote outcome for a decided item */
export interface VoteRecord {
  id: string;
  item_id: string;
  committee: string;
  vote_date: string;
  motion_type: string;      // "Adopt Item", "Amend Item", etc.
  result: string;           // "Carried, 7-3" etc.
  source_url: string;
  retrieved_at: string;
}

/** User profile (stored in Supabase; extends auth.users) */
export interface Profile {
  id: string;               // matches auth.users.id
  municipality_id: string;
  ward: string | null;      // derived from geocoded address
  lat: number | null;       // coarse point, never raw address text
  lng: number | null;
  alert_radius_m: number;   // metres for "near me" alerts
  created_at: string;
}

/** Alert preference record for a user */
export interface AlertPreference {
  id: string;
  user_id: string;
  topics: string[];         // keyword filters
  ward: string | null;
  radius_m: number | null;
  channels: AlertChannel[];
  digest: boolean;          // true = daily digest, false = immediate
  municipality_id: string;
}

export type AlertChannel = "email" | "console";

/** Logged notification send */
export interface NotificationLog {
  id: string;
  user_id: string;
  item_id: string;
  channel: AlertChannel;
  sent_at: string;
  content_hash: string;    // so we don't re-alert on unchanged items
}

/** What the Toronto CKAN meeting schedule row looks like */
export interface CKANMeetingRow {
  _id: number;
  Term: string;
  Committee: string;
  "MTG #": string;
  Date: string;
  "Start Time": string;
  "End Time": string;
  Location: string;
}

/** What the Toronto CKAN voting record row looks like */
export interface CKANVoteRow {
  _id: number;
  Term: string;
  "First Name": string;
  "Last Name": string;
  Committee: string;
  "Date/Time": string;
  "Agenda Item #": string;
  "Agenda Item Title": string;
  "Motion Type": string;
  Vote: string;
  Result: string;
  "Vote Description": string;
}
