---
name: vesper-content-review
description: Use for final read-only or conservative review of Vesper content, tracks, scenes, UI changes, or a completed agent task before merge/delivery.
---

# Vesper Content Review

Review defect-first. Do not rewrite merely to match personal taste.

## Read
- root `AGENTS.md`
- `docs/INDEX.md`
- relevant domain docs
- changed files and their immediate dependencies

## Categories
- CONTEXT
- SPOILER
- SETTING
- VOICE
- PEDAGOGY
- FANTASY/DIEGESIS
- DIRECTION
- UI
- FLAG/STATE
- TRACK REGRESSION
- ASSET/LICENSING

## Workflow
1. Inspect complete diff/change set.
2. Trace affected scenes/flags/slots.
3. Report actionable findings with file/ID.
4. Run `npm run validate`.
5. Note tests not possible.

Severity: CRITICAL / IMPORTANT / POLISH.
