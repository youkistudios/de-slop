# de-slop

A Claude Code skill that surgically removes AI-writing tells from a draft while preserving the author's voice and meaning.

> **Status: v1.** Stable in daily use on real pre-publication drafts. It is one Markdown skill with no runtime dependencies — it guides an editing pass, it does not run automated tests against your prose or guarantee the result is good.

## The problem

Drafts that pass through an LLM pick up a recognizable machine layer: the "X, not Y" antithesis, balanced see-saw pairs, reflexive triplets, em-dash punchlines, throat-clearing openers, puffery. Most cleanup approaches are word-blocklists — banned-word lists that date fast as models shift their defaults. A blocklist also can't tell a slop pattern from the same construction used once, deliberately, as craft.

## How it works

de-slop weights durable **structural** tells over vocabulary:

- **"X, not Y" antithesis** — the number one tell. Cut the "not," state the thing, trust the reader.
- **"It's not just X, it's Y"** and "not only… but also" constructions — delete, say Y.
- **Balanced see-saw pairs** — rebalance the sentence so it isn't symmetric.
- **Reflexive triplets** — break at least one; vary item length.
- **Em-dash punchlines** — cap at two per piece; swap for colons, commas, or periods.

It edits, it does not rewrite. The pass reads the piece, names the author's voice, counts the tells, and cuts the fewest words that clear each one — filling any gap the cut leaves with a concrete specific, never an invented statistic.

The output is the de-slopped draft plus a short audit: what was cut, what was deliberately kept, and — the one addition since v1 — a line that names what looked like a tell but is actually the author's voice, and says why it stays. A device used once, deliberately, to do real work is craft, not slop.

## Quick start

**Claude Code**: copy or symlink `skills/de-slop` into `~/.claude/skills/`.

```bash
git clone https://github.com/youkistudios/de-slop
cp -R de-slop/skills/de-slop ~/.claude/skills/
```

Start a new session, then say "de-slop this" with a draft.

The skill is plain Markdown with no code and no external references beyond an optional house ruleset, so it is portable to any agent harness that reads Markdown skill files.

## Repository map

- `skills/de-slop/SKILL.md` — the skill.
- `README.md` — this file.
- `PROVENANCE.md` — origin of the skill and its one derived line.
- `SECURITY.md`, `SUPPORT.md` — standard repository policies.
- `LICENSE` — MIT.

## Honest limits

- The pattern list is opinionated and English-centric.
- It was tuned on one founder's writing pipeline, not a broad corpus.
- Its comparative evidence is a single blind bake-off on one real draft, judged by one (blind) evaluator — not a benchmark suite. On 2026-08-01, in a fresh-context, anonymized-output, frozen-criteria comparison against a four-donor merged challenger, de-slop scored 8.33 against the challenger's 8.50 on a real pre-publication draft audit, under a house rule requiring a ≥2.0 margin to displace the incumbent. The merge did not clear that bar and was rejected; the one line it did win outright — naming a false positive as the author's voice — was grafted into this skill.
- de-slop does not classify whether text is AI-written. It removes named patterns from a draft; it makes no claim about detection.

## License

MIT © 2026 Youki Studios. See [LICENSE](LICENSE).
