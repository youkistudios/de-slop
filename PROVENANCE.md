# Provenance

de-slop was developed in-house by Youki Studios, with Claude (Anthropic), as an
editing pass for the studio's own writing pipeline. The rule set, process, and
audit format shipped in `skills/de-slop/SKILL.md` are original to this
repository.

On 2026-08-01, one line was added to the skill's audit output: the instruction
to name what looked like a slop pattern but is actually the author's voice,
and say why it stays. That line is derived from an in-house merge experiment
("humanizer-v2") that combined de-slop with several other candidate rule
sets. The other donors surveyed in that experiment included MIT-licensed
public repositories — petergyang/no-ai-slop, a skill based on Wikipedia's
signs-of-AI-writing guidance, and DietrichGebert/ponytail — none of whose code
or text is vendored here. The merged challenger was evaluated against de-slop
in a blind bake-off on a real pre-publication draft, under frozen criteria and
a house rule requiring a margin of at least 2.0 to displace the incumbent. It
scored 8.50 to de-slop's 8.33, did not clear that bar, and was rejected in
full. The one criterion it won outright — correctly flagging a false
positive as voice, not slop — was grafted back into this skill as the single
line described above. No other content from that experiment was adopted.

The MIT license in [LICENSE](LICENSE) governs this repository.
