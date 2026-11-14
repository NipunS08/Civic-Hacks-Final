import type { AgendaItem } from "@/types";
import SourceLink from "./SourceLink";
import ImplementationTimeline from "./ImplementationTimeline";
import { sourceLabelFor } from "@/lib/say-window";
import { agendaEvidence } from "@/lib/item-details";
import ImpactChecklist from "./ImpactChecklist";

/** Use source text for impacts and dates; a title cannot establish either. */
export default function ItemExplanation({ item }: { item: AgendaItem }) {
  const evidence = agendaEvidence(item.description);
  return (
    <div className="grid gap-5">
      <nav aria-label="On this item page" className="flex flex-wrap gap-2">
        <a href="#summary" className="cl-btn cl-btn-outline">Summary</a>
        <a href="#affects-you" className="cl-btn cl-btn-outline">How it affects you</a>
        <a href="#timeline" className="cl-btn cl-btn-outline">Implementation timeline</a>
        <a href="#votes" className="cl-btn cl-btn-outline">Votes</a>
        <a href="#participate" className="cl-btn cl-btn-ghost">Have your say →</a>
      </nav>

      <section id="summary" aria-labelledby="summary-title" className="scroll-mt-24 cl-card">
        <p className="cl-eyebrow mb-2">01 · Understand the issue</p>
        <h2 id="summary-title" className="text-2xl font-semibold mb-4">What the city says about it</h2>
        {item.description ? (
          <>
            <p className="text-base leading-relaxed text-gray-700 whitespace-pre-line">{evidence.overview}</p>
            <p className="mt-3 text-sm text-gray-600">From the official record, as published. This describes the item; see “Decision & recorded votes” above for what was decided.</p>
            <details className="mt-4 text-base text-gray-700">
              <summary className="cursor-pointer font-semibold">Read the full text from the city</summary>
              <p className="mt-3 whitespace-pre-line leading-relaxed">{item.description}</p>
            </details>
          </>
        ) : (
          <>
            <p className="text-base leading-relaxed text-gray-700">
              The city&apos;s listing only gives this topic&apos;s title, without a description. To read the full details,
              open the official page (link below). It usually includes a staff report explaining what is proposed and why.
            </p>
          </>
        )}
        <SourceLink url={item.source_url} label={sourceLabelFor(item)} retrievedAt={item.retrieved_at} className="mt-4" />
      </section>

      <section id="affects-you" aria-labelledby="affects-title" className="scroll-mt-24 cl-card">
        <p className="cl-eyebrow mb-2">02 · Make it relevant</p>
        <h2 id="affects-title" className="text-2xl font-semibold mb-4">How it affects you</h2>
        {evidence.impacts.length > 0 ? (
          <>
            <p className="font-semibold text-gray-900 mb-3">What the official agenda says about effects</p>
            {evidence.impacts.map((text, index) => <blockquote key={index} className="border-l-4 border-brand-200 pl-4 mb-3 text-base text-gray-700 whitespace-pre-line">{text}</blockquote>)}
            <p className="text-sm text-gray-600">These are source excerpts, not a determination of your personal circumstances.</p>
          </>
        ) : (
          <p className="text-base leading-relaxed text-gray-700">The city&apos;s listing doesn&apos;t say how this affects residents (for example, costs, services or your street). The official report is the best place to check.</p>
        )}
        {item.ward && <p className="mt-3 text-base text-gray-700"><strong>Location mentioned:</strong> {item.ward.startsWith("Ward") ? item.ward : `Ward ${item.ward}`}. This does not mean everyone in that ward is affected, or that effects stop at its boundary.</p>}
        <ImpactChecklist sourceUrl={item.source_url} />
        <details className="mt-4 text-base text-gray-700">
          <summary className="cursor-pointer font-semibold">Questions to check for your situation</summary>
          <ul className="list-disc pl-5 mt-3 space-y-2">
            <li>Does the report name your street, neighbourhood or a service you use?</li>
            <li>Does it describe changes to access, fees, taxes or service availability?</li>
            <li>Who can clarify whether the proposal applies to you?</li>
          </ul>
        </details>
        <a href={item.source_url} className="inline-block mt-4 text-brand-700 underline font-semibold">Check the official report for resident impacts →</a>
      </section>

      <ImplementationTimeline item={item} timing={evidence.timing} />
    </div>
  );
}
