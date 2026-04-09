# Malicious

Data and heuristics that help surface **harmful or deceptive intent**: manipulation of public opinion, **financial fraud**, **“social charity”**–style scams, and related patterns — not a legal classification, but screening-oriented signals.

## Scope

- Risk and manipulation heuristics (keyword flags, urgency, impersonation, donation pressure) where the data supports triage
- Scam, urgency, impersonation, and donation-fraud patterns
- Boundaries: prototype proxies vs production-grade detection; these are **signals**, not verdicts

## Outputs & notes (index)

| Document | Summary |
|----------|---------|
| *(add `*.md` files in this folder)* | |

## Repo touchpoints (examples)

- Risk heuristics in UI dataset: `app/build_dataset.mjs` (`detectRisk`), `app/data/normalized.json`
- Brief context: `agents/RAVINEO_INTEL.md`, `agents/PROJECT_BRIEF.md`
