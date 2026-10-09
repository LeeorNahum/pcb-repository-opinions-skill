# AGENTS.md

Rules for editing the **pcb-repository-opinions** skill. User-facing opinions live in `SKILL.md` and `references/`. `README.md` is the human skim layer.

## File roles

| File | Role |
| --- | --- |
| `SKILL.md` | Trigger, default toolchain, reference-loading map, non-negotiables, the check script's route, audit |
| `references/*.md` | One single concept per file, named by paradigm |
| `assets/gitignore` | The starter ignore file a board repository copies to `.gitignore` |
| `scripts/check.mjs` | The agent-facing check: one project in, one PASS or FAIL line per check out. Node.js standard library only, run through an installed `kicad-cli` |
| `tests/check.test.mjs` | Break-it tests for the check script. Maintainer-only, never installed with the skill |
| `package.json` | Lets `npx` run the check from the published repository. Its `version` equals `metadata.version` |
| `README.md` | Short human summary |

One owner per opinion. Each reference owns its concept. Other files use the term or shape without restating the rule. The reference-loading map lives in `SKILL.md` once.

## Repository-Opinions Skill Layout

This skill follows the shared layout for repository-opinions skills. Keep that shape so the skill type stays consistent and grows cleanly:

- `SKILL.md` is a slim spine: a short thesis, a default-stack or default-toolchain table of swappable tool picks, the reference-loading map, the core non-negotiables, the repository audit, and a closing note that risky-change "Ask before" lines live in the references.
- `references/*.md` hold one concept each, named by paradigm, carrying the detailed opinions. Distribute each "Ask before" guardrail into the reference that owns its topic rather than a standalone section.
- `assets/` hold copyable starter configs that drop into a target repo. References explain the judgment. Assets are the copy-paste artifacts.
- `AGENTS.md` is this maintenance contract.
- `README.md` is the human skim layer.

A repository-opinions skill is opinionated and explicit, names its default tools as swappable picks, uses placeholder project names, and keeps one owner per opinion.

## Editing

- Bump `metadata.version` by the release-versioning skill's rules for skills, and `package.json` with it.
- Encode a default only when backed by user preference or real usage. Do not invent opinions the skill never stated.
- Admit an opinion only when it improves decisions across unrelated boards. Keep one board's part choices, net names, values, and layout out of the skill.
- Prefer an opinion that cost real time when it was absent. A rule that exists because a board came out wrong is worth more than one that sounds right.
- State each rule once, in its owning reference. A reason stays only where it changes what the reader does.
- Write what an agent would not arrive at alone: an opinion, a default, a trap, an order. Cut what a capable agent already knows about electronics or would find in a tool's own documentation.
- Judge an addition against the whole file, not the attention it got in the current session. Fit a narrow rule into its existing owner before adding a section.
- Prefer deletion over caveats. More words is not better.
- One opinion per reference. A new paradigm gets its own reference file and an entry in the `SKILL.md` reference-loading map.
- When an existing concept grows, refactor its reference rather than scattering the idea across several files.
- Preserve the distinction between electrical validity, visual readability, physical feasibility, and manufacturability.
- Preserve distinctive wording that carries intent, such as "source code with an additional physical reality", "a converted part is a draft", and "route by intent".
- Quote every frontmatter string value.
- **Opinionated and explicit.** State the preference clearly. This skill takes positions.
- **Paradigm-named, tool-stated.** Name files and sections for the job. KiCad is the stated default design tool and JLCPCB the stated default fabricator. Name other tools as swappable picks.
- **Numbers belong to a named source.** A limit is stated with the fabricator or the formula it comes from and the instruction to recheck it. A number with no owner is not added.
- **Conditions are stated.** A rule that holds for one kind of board opens with that condition. Core Non-Negotiables hold only what affects nearly every board.
- **Version-bound facts name the version.** A claim about what a KiCad release can or cannot do names the release it was checked on.
- **No project leakage.** Use placeholders such as `<Board Name>`, `<MPN>`, and `<supplier-number>`. Do not embed a real product's boards, parts, nets, people, or dates.
- **No sibling-skill pointers.** Do not reference other skills by name in the opinions. Where another skill's domain touches a topic, state the PCB opinion inline and stop.
- **No cross-reference pointers.** A reference never links to or points at another reference.
- **No em or en dashes.** Use commas, periods, parentheses, or "to".
- **No semicolons in prose.** Split the sentence instead.
- **Match depth to scope.** A single-concept reference stays short. Do not pad.
- **Capitalized bullets.** Start every bullet with a capital letter. Keep list voice consistent across all files.
- **Sparing examples.** Use a concrete example to clarify a shape, never to fix a choice a reader could copy verbatim.
- **Positive rules.** State the action to take, not the mistake to avoid.

## Check script

- Keep it dependency-free and cross-platform. No package to install and no network at run time.
- It leaves the project it checks exactly as it found it. Reports and copies go to a temporary folder, and a file `kicad-cli` adds to the project is taken away again.
- Every check comes from `kicad-cli` or from the project's own files, never from a guess about how KiCad would judge. To ask KiCad a question its check does not answer, add a rule to a temporary copy and let `kicad-cli` judge the copy.
- A check never passes on the absence of a report. KiCad drops a rules file it cannot read without a message, so a check that adds rules also adds one that must fire and fails when it does not.
- A finding the script cannot tell from an allowed exception is a warning, listed under its check, and fails the run only with `--strict`.
- A new check gets a row in the help text that says what it proves and what it does not, a PASS or FAIL line, and a break-it test in `tests/check.test.mjs`: break the thing it names on a copy of a finished project and confirm that check fails.
- After a change, run `node tests/check.test.mjs <finished-project-folder>` against a real finished board. It covers every check, the untouched project, and the exit codes.
- `SKILL.md` and `README.md` show the `npx` route beside the `node` route only while the repository is public.
- The `SKILL_NAME` constant equals the frontmatter name.

## Before finishing

- Every `references/*.md` file appears in the `SKILL.md` reference-loading map with a loading condition.
- No reference restates another reference's rule or names a tool in its title.
- Every bullet starts capitalized.
- No real proper nouns were introduced beyond the named default tools and the frontmatter author.
- The description still fires on board work that does not name the tool, such as importing a part, sizing a power trace, or getting files ready for a fabricator, fires on a firmware need that shapes the board, such as a pin choice or programming access, and stays quiet on circuit simulation and work on KiCad itself.
- `metadata.version` is bumped as the release-versioning skill requires, and `package.json` matches it.
- The README layout matches the actual files.
- The skill-forge validator passes.
