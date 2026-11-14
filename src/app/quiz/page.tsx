// The old three-question quiz was replaced by the header municipality picker and
// the feed's filters ("What's happening near you"). Old /quiz links redirect to
// the matching feed view so nothing shared earlier breaks.

import { redirect } from "next/navigation";
import { parseCityId } from "@/lib/cities";
import { parseTopicIds } from "@/lib/topics";

export const instant = false;

type SearchParams = { city?: string; topics?: string | string[]; show?: string };

export default async function QuizRedirect({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const next = new URLSearchParams({ municipality: parseCityId(params.city) });
  for (const t of parseTopicIds(params.topics)) next.append("topics", t);
  if (params.show === "past" || params.show === "upcoming") next.set("when", params.show);
  redirect(`/feed?${next.toString()}`);
}
