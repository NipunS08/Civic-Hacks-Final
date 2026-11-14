"use client";

import { useState } from "react";

const INTERESTS = [
  { id: "nearby", label: "My neighbourhood", question: "Does the report name your street or neighbourhood? Check the affected area and any proposed changes to access or nearby work." },
  { id: "services", label: "Services I use", question: "Does the report name a service you use? Look for changes to hours, eligibility, routes or availability." },
  { id: "costs", label: "My costs", question: "Are changes to fees, taxes or other costs explicitly stated? Check amounts, who pays and whether they are proposed or approved." },
];

/** Preferences only generate reading questions, never claims about personal impact. */
export default function ImpactChecklist({ sourceUrl }: { sourceUrl: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <div className="cl-impact-checklist">
      <fieldset>
        <legend className="text-lg font-semibold">What matters to you?</legend>
        <p className="text-sm text-gray-600 mt-1 mb-4">Choose interests to build a reading checklist. Your choices stay on this page and are not saved.</p>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map(interest => <button key={interest.id} type="button" className="cl-interest-chip" aria-pressed={selected.includes(interest.id)} onClick={() => setSelected(current => current.includes(interest.id) ? current.filter(id => id !== interest.id) : [...current, interest.id])}>
            <span aria-hidden="true">{selected.includes(interest.id) ? "✓" : "+"}</span> {interest.label}
          </button>)}
        </div>
      </fieldset>
      <div className="mt-4" aria-live="polite" aria-atomic="true">
        {selected.length === 0 ? <p className="text-sm text-gray-600">Pick one or more interests to see what to check in the official report.</p> : <>
          <p className="font-semibold mb-2">Your reading checklist · {selected.length} {selected.length === 1 ? "question" : "questions"}</p>
          <ul className="space-y-3 text-base text-gray-700 list-disc pl-5">{INTERESTS.filter(i => selected.includes(i.id)).map(i => <li key={i.id}>{i.question}</li>)}</ul>
          <p className="text-sm text-gray-600 mt-3">These are questions to investigate, not confirmed effects on you.</p>
        </>}
      </div>
      {selected.length > 0 && <div className="flex flex-wrap gap-3 mt-4">
        <a href={sourceUrl} className="cl-btn">Check these in the official report →</a>
        <button type="button" className="cl-btn cl-btn-ghost" onClick={() => setSelected([])}>Clear choices</button>
      </div>}
    </div>
  );
}
