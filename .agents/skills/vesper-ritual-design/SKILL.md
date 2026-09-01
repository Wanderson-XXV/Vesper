---
name: vesper-ritual-design
description: Use when creating or changing programming rituals, learning tracks, hints, Grimoire pedagogy, challenge difficulty, or the mapping between curriculum and story slots.
---

# Vesper Ritual Design

## Read first
- `docs/pedagogy/RITUAL_PEDAGOGY.md`
- the active track in `docs/pedagogy/`
- `docs/architecture/CONTENT_MODEL.md`
- `docs/canon/WORLD_RULES.md`
- `docs/canon/VESPER_WORLD_CATALOG.md` → "Declaração e trabalho" (o ritual como sistema de magia)

## Workflow
1. List what the learner already knows.
2. Define exactly one main new mental move for the ritual.
3. Choose the ritual's **verb** from the world ontology (medir, classificar, contar, localizar, comparar/confrontar, alinhar/afinar, isolar, cruzar, estabilizar, interromper). Verbs never repeat within a case.
4. State the world's **law** in one sentence a character could say, about an object the player can see. If it doesn't fit, redesign the ritual before writing anything else.
5. Write the problem in plain Portuguese before writing code/data.
6. Create a diegetic reason for the measurement/decision and declare the **physical cost of a wrong answer** before the HUD.
7. Define input, output, correct logic and edge cases.
8. Design three hint levels: conceptual -> structural -> near-operational, anchored in the physical object before syntax.
9. Define a narrative consequence of success (never a clean win: reveal something or open a risk).
10. Add/update Grimoire knowledge needed before the ritual.
11. Map to a track slot without breaking another track.
12. Check the **fingerprint**: consecutive rituals differ in at least 2 of {data source, intervention verb, new logical operation, consequence type}.
13. Run validation and test the ritual manually.

## Reject
- same puzzle copied six times with new skin;
- two rituals in the same case with the same verb or the same predicate;
- requiring arrays/loops in a conditionals-only track;
- “this exercise teaches X” in NPC dialogue;
- data with no meaning in the fiction;
- boss introducing an entirely new concept;
- enunciado (`narrative`/`outputHint`) naming data structures instead of world objects.
