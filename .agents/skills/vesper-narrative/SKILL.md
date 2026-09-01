---
name: vesper-narrative
description: Use when writing, revising, auditing, or polishing Vesper scenes, dialogue options, NPC voices, pacing, narration, mystery reveals, or ritual introductions.
---

# Vesper Narrative

## Read first
1. `docs/canon/NARRATIVE_BIBLE.md`
2. `docs/canon/CHARACTER_BIBLE.md`
3. `docs/canon/WRITING_RULES.md`
4. relevant pedagogy track if a ritual is involved
5. `docs/feedback/REJECTED_PATTERNS.md`

## Workflow
1. Locate the target scene and read the previous and next scene.
2. Resolve every `requires`/flag/topic that affects the scene.
3. State the scene's job in one sentence.
4. Audit for missing context, exposition, spoiler, voice drift, setting violations and weak direction.
5. For large rewrites, propose the revised beat order before editing JSON.
6. Preserve IDs unless a structural change truly requires new ones.
7. After editing, reread the three-scene window and run `npm run validate`.

## Checks
- Does the player know why the conversation is happening?
- Is every dialogue option contextually earned?
- Does Tomás remain clear — and does he explain the phenomenon without deducing the mystery for the player?
- Is narration observable rather than interpretive?
- Does a ritual scene state the world's law (in one speakable sentence) and the physical cost of error before the HUD?
- Does the protagonist reformulate the objective rather than recite the algorithmic procedure?
- Is the scene's speaker/event structure different from the previous ritual intro (no repeated template)?
- Does the scene give a clue, consequence, choice, or useful direction?
- Does the case open with arrival/caller/motive rather than dropping the player into the main room?
- Do clues accumulate (planted → paid) so the final choice is earned?

## Output
Summarize changed scenes, reasons, and any unresolved human-review points.
