# CivicLens documentation

Start with [local setup](setup/SETUP.md) for the website or the [mobile README](../apps/mobile/README.md) for Expo. The [root README](../README.md) maps the code folders and run commands. All nine original task briefs are in the [prompt archive](../prompts/README.md).

## Setup

| Document | Contents |
| --- | --- |
| [Local setup](setup/SETUP.md) | Account-free startup, checks and optional backend configuration |
| [Mobile instructions](../apps/mobile/README.md) | Expo, phone connectivity, walkthrough and native build commands |
| [Contributing](../.github/CONTRIBUTING.md) | Where files belong and how to validate a change |

## Architecture

| Document | Contents |
| --- | --- |
| [Website architecture](architecture/ARCHITECTURE.md) | Original design decisions and component responsibilities |
| [Adapters](architecture/ADAPTERS.md) | Official endpoints, parsing, provenance and source limitations |
| [Code walkthrough](architecture/CODE_WALKTHROUGH.md) | Plain-language explanation of the website modules |
| [UML diagrams](architecture/UML.md) | Use cases, components, sequences and database relationships |
| [Mobile architecture](architecture/mobile-architecture.md) | Workspace layout, public API, shared rules and feature status |

## Quality and verification

These are dated records of checks and findings. A passing check in a report applies to its recorded revision and environment; it is not a claim that every current workflow has been verified. Earlier website reports predate the account-free navigation and mobile app.

| Document | Contents |
| --- | --- |
| [Known limitations](quality/LIMITATIONS.md) | Source gaps, incomplete features and operational limits |
| [Website bug register](quality/BUG_REPORT.md) | Earlier bug IDs and resolution notes |
| [Full website audit](quality/CIVICLENS_BUG_AUDIT.md) | Reproduction evidence, severity and coverage limits |
| [Website repair report](quality/CIVICLENS_FIX_REPORT.md) | Changes for audit findings and remaining verification |
| [Mobile testing](quality/mobile-testing.md) | Compilation, API checks and outstanding device interaction checks |

## Hackathon materials

These materials were drafted at different stages. Check feature claims against the quality reports and current app before presenting them; the original demo script includes legacy account and alert flows.

| Document | Contents |
| --- | --- |
| [Demo script](hackathon/DEMO_SCRIPT.md) | Original presentation flow and talking points |
| [Municipal readiness report](hackathon/MUNICIPAL_READINESS_REPORT.md) | Judge-facing project report |
| [Workshop questions](hackathon/WORKSHOP_QUESTIONS.md) | Questions for municipal staff |
| [Credits and AI usage](hackathon/CREDITS.md) | Libraries, data licences and assistance disclosure |

## Historical archive

- [Original handoff](archive/HANDOFF.md)
- [Original build progress](archive/PROGRESS.md)

These snapshots retain their original feature descriptions, commit references and old file paths as historical context. Use this index for current file locations.

## Adding documents

Put installation guides in `setup/`, technical design in `architecture/`, dated audits and verification in `quality/`, presentation materials in `hackathon/`, and superseded handoffs in `archive/`. Add a relative link here when creating a document. Keep original task prompts in `../prompts/` and retain their filenames and contents.

The repository root keeps framework configuration, npm manifests, the main README and the discoverable `AGENTS.md` instruction file.
