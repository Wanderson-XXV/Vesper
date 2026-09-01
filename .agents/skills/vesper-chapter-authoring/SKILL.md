---
name: vesper-chapter-authoring
description: Use when planning or authoring a new Vesper case, chapter, mansion/location, investigation arc, set of clues, NPC arc, or reusable campaign skeleton.
---

# Vesper Chapter Authoring

## Read first
- `docs/canon/DESIGN_BIBLE.md`
- `docs/canon/NARRATIVE_BIBLE.md`
- `docs/canon/WORLD_RULES.md`
- `docs/architecture/AUTHORING_WORKFLOW.md`
- relevant pedagogy tracks

## Plan before implementation
Define:
- opening situation;
- central question;
- answer resolved in this chapter;
- larger question left open;
- mandatory clues;
- optional clues/reward;
- NPCs and what each knows/hides/wants;
- locations and connection logic;
- ritual slots and narrative consequences;
- final payoff and hook.

## Scorecard (required before any JSON)
1. **Mini puzzle-dependency chart** — nodes are actions/locks; no straight corridor; each act opens at least 2 parallel fronts and reconverges (diamond shape).
2. **Clue ledger** — every item of the internal truth mapped: where it is planted → where it pays off. A truth with no plant does not exist for the player.
3. **NPC knowledge map** — who knows / hides / wants what; every NPC has at least one conversation topic gated by `requires`.
4. **Scene/sequel alternation** — no 3 consecutive action scenes without reaction/dilemma/decision; no clean wins.
5. **Ritual verb table** — one verb per ritual (no repeats), law in one speakable sentence, physical cost declared, fingerprint ≥2 between consecutive rituals.
6. **Exploration budget** — N rituals ⇒ at least N exploration/document/conversation scenes between them; at least 2 optional clues; `secretClueThreshold` must match the real number of optional clues.

## Rules
- do not create a linear worksheet disguised as rooms;
- optional investigation should matter;
- each ritual result must change knowledge or world state;
- keep canon changes explicit in `docs/decisions/`;
- leave implementation until the chapter skeleton is coherent.
