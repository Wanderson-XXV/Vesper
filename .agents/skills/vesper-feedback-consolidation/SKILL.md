---
name: vesper-feedback-consolidation
description: Use when the user rejects, corrects, or refines a Vesper result and the feedback may be useful for future agents; consolidate reusable lessons into project memory.
---

# Vesper Feedback Consolidation

The goal is to make future agents learn from project feedback without bloating AGENTS.md.

## Workflow
1. Extract each feedback item in neutral terms.
2. Classify it as:
   - `local`: only this scene/asset;
   - `reusable`: likely to recur;
   - `canon/decision`: changes the project's rules.
3. Do not turn one subjective preference into global law without evidence it is intended to persist.
4. For reusable feedback, create/update `docs/feedback/accepted/YYYY-MM-DD-<topic>.md`.
5. Promote the rule to the correct source of truth when appropriate:
   - writing -> `docs/canon/WRITING_RULES.md` / `CHARACTER_BIBLE.md`;
   - world -> `WORLD_RULES.md`;
   - visuals -> `docs/art/ART_DIRECTION.md`;
   - pedagogy -> `docs/pedagogy/`;
   - architecture -> `docs/decisions/`.
6. Add rejected solution patterns to `docs/feedback/REJECTED_PATTERNS.md` only when useful as a future failure shield.
7. Show a concise summary of memory changes made.

Never claim an agent “learned” unless the rule was actually persisted in the repo.
