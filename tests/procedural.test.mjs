// Tests for src/lib/procedural.ts using real Ottawa eScribe titles (2026-11-12).
import { test } from "node:test";
import assert from "node:assert/strict";
import { isProceduralTitle } from "../src/lib/procedural.ts";

test("filters procedure, ceremony and section headings", () => {
  for (const t of [
    "Call to order and moment of reflection", "National Anthem", "Roll Call", "Regrets",
    "Announcements / Ceremonial Activities", "Recognition of HMCS Ottawa and HMCS Carleton",
    "Recognition of the Territory of the Anishinābe Algonquin Nation",
    "Confirmation of Agenda", "Declarations of Interest Including Those Originally Arising from Prior Meetings",
    "Minutes 87 of the City Council meeting of October 8, 2026", "FCSC Minutes 37 – 1 September 2026",
    "Notices of Motions (For Consideration at Subsequent Meeting)",
    "Notices and meeting information for meeting participants and the public",
    "Public notices and meeting information", "Inquiries", "Responses to Inquiries",
    "In Camera Items", "Consideration of Motion to Move In Camera", "Next Meeting",
    "Information Previously Distributed", "Items of Business", "Reports",
    "Planning, Development and Building Services Department", "Office of the City Clerk", "Legal Services",
    "Presentation to Outgoing Councillors",
    "Petitions", "Other communications received", "Motion to Introduce Reports", "City Clerk",
    "Bulk Consent Agenda", "Planning and Housing Committee Report 72", "Audit Committee Report 19",
    "Adoption of agenda", "Presentations", "Motions",
  ]) {
    assert.equal(isProceduralTitle(t), true, t);
  }
});

test("keeps real decisions residents can comment on", () => {
  for (const t of [
    "2027 Budget Process and Timeline",
    "Designation of 936 March Road, under Part IV of the Ontario Heritage Act",
    "Demolition of the accessory structure at 166 Huron Avenue North",
    "Application for Approval to Expropriate Lands – Brian Coburn Widening",
    "Comprehensive Legal Services Report for the Period January 1 to June 30, 2026",
    "Delegation of Authority Updates",
    "Maple Grove Health Hub Request for Proposals",
    "ECCC-2024-02 - Wood burning fireplaces",
    "City Clerk – Summary of Oral and Written Public Submissions",
    "Zoning By-law Amendment – 475 Terry Fox Drive",
    "Office of the Auditor General (OAG) – Audit of 3-1-1",
    "Presentations on the 2027 Budget", "Motions to improve transit service",
  ]) {
    assert.equal(isProceduralTitle(t), false, t);
  }
});
