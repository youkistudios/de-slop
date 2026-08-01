---
name: de-slop
description: Strip AI-slop patterns from a piece of writing while preserving the author's voice and meaning. Surgically removes the durable tells — the "X, not Y" antithesis, balanced see-saw pairs, reflexive triplets, em-dash punchlines, throat-clearing openers, puffery — per the Anti-Slop Rule Set, then reports what it cut and what it deliberately kept. Use when the user says "de-slop", "/de-slop", "deslop this", "run the de-slop process", "too many dashes", "remove the AI slop", or hands over copy that reads machine-made. NOT for generating new copy (that's the author agents) or scoring writing (that's /score).
---

# /de-slop — Strip the Machine Layer

Surgically remove AI-slop patterns from a piece of writing without flattening its voice or changing what it says. This is an **edit, not a rewrite.**

## The reference
If your setup has a house anti-slop ruleset, load it — the durable tells below stand alone otherwise. The durable tells (weight these; word-blocklists date fast):

- **"X, not Y" antithesis** — the #1 tell. Cut the "not"; state the thing; trust the reader. Keep at most one, and only if it does real semantic work.
- **"It's not just X, it's Y" / "not only… but also"** — delete; say Y.
- **Balanced see-saw pairs** — make the sentences asymmetric.
- **Reflexive triplets** — break at least one; vary item length.
- **Em-dash punchlines** — ≤2 per piece; swap for colons, commas, or periods.
- **Throat-clearing openers · puffery · restate-conclusions · hedges** — cut.

## The process
1. **Read the piece and the ruleset.** Name the author's voice and the intent — those are preserved.
2. **Scan and count** the tells: "X, not Y" contrasts, balanced pairs, triplets, em-dashes, filler adverbs, throat-clearing.
3. **Cut surgically** — the fewest words that remove each tell. Keep the meaning, the voice, and any single device that's genuinely earned (a signature contrast used once to make a real point stays).
4. **Earn the space back** with specificity where a cut leaves a gap — a concrete noun, a real detail. Never an invented statistic.
5. **Run the pre-ship check:** contrasts + balanced pairs ≤1 · em-dashes ≤2 · break a triplet · vary sentence length · one concrete specific · no line true of any business · voice survives.

## Output
- The **de-slopped version**.
- A short **audit**: what was cut (name the tells) and what was deliberately kept (earned devices).
- **In the audit, name what looked like a tell but is the author's voice, and say why it stays** — a deliberate fragment, an earned contrast, a signature device. (Grafted 2026-08-01 from the rejected humanizer-v2 merge; this line won the false-positive criterion in the blind bake-off.)
- If the piece was already clean, say so. Don't manufacture changes.

## Rules
- **Preserve voice and meaning.** If de-slopping would change what the copy says or strip the author's signature, stop and flag it instead of forcing it.
- A device used **once, deliberately, doing real work** is craft — leave it. Slop is density and reflex, not any single instance.
- **Never** add invented numbers or claims in the name of "specificity."
- Surgical. The fewest cuts that clear the tells.

*Pairs with: the Anti-Slop Rule Set (if you have one).*
