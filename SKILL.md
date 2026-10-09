---
name: "pcb-repository-opinions"
description: "Use for any circuit board design work: planning, drawing a schematic, choosing or importing parts, placing, routing, reviewing, auditing, or preparing a PCB for fabrication and assembly, in KiCad or another design tool, and for the board decisions firmware depends on, such as pin assignment, programming and boot access, and sleep current. That includes any edit to `.kicad_sch`, `.kicad_pcb`, `.kicad_pro`, or `.kicad_dru` files, symbol and footprint libraries, net classes, design rules, trace widths, a board's bill of materials, or ERC and DRC results, and any change to a board project made from a script or the command line. Holds opinionated defaults for board repository layout, part libraries and supplier fields, fabricator rules, placement and routing, and what has to pass before a board is called done. Not for circuit simulation or developing KiCad or its plugins. When unsure whether it applies, load it."
compatibility: "The bundled check script requires Node.js 18 or later and an installed KiCad that provides `kicad-cli`."
metadata:
  author: "Leeor Nahum"
  version: "1.0.0"
---

# PCB Repository Opinions

Treat hardware design files as source code with an additional physical reality. A parseable schematic is not necessarily electrically correct, a clean ERC is not necessarily readable, and a routed PCB is not necessarily manufacturable.

A board is more than its design files. The real product is schematic and copper plus the datasheet behind every part, the libraries the project resolves, the fabricator's rules, the assembler's catalog, and the files they are sent. Keep those layers explicit so the board can be checked, ordered, and built from the repository alone.

These are opinionated defaults, not one board's specification. Apply what fits the repo. The named tools below are swappable defaults. The paradigms around them are not.

## Default Toolchain

Prefer these unless the board has a stronger reason not to. Swap the tool, keep the paradigm.

| Role | Default | Swap when |
| --- | --- | --- |
| Design tool | KiCad, one major version named in the README | An existing design lives in another tool |
| Checks, exports, and pictures | `kicad-cli` | The installed version lacks the command |
| Board edits by program | KiCad's Python bindings, `pcbnew` | The change is small enough to make as text |
| Schematic edits by program | The `.kicad_sch` text, re-saved by KiCad | The installed KiCad offers a schematic scripting interface |
| Fabricator and assembler | JLCPCB | The board needs a process it does not offer |
| Parts catalog | LCSC, with the number in a symbol field named `LCSC Part` | Another assembler places the board |
| Part converter | `easyeda2kicad`, through the repository's own wrapper when it has one | The manufacturer publishes a checked KiCad asset |
| Common passives | KiCad's stock symbols and footprints | The part has no stock equivalent |

## Reference Loading

This skill's substance lives in its references. Read every reference that could touch what you are about to plan, draw, place, route, review, or order, in full, before acting on it. Loading one more reference is cheap. Acting on a topic blind is not. Re-read the owning reference whenever a decision in its area comes back up.

Repository:

- Read [repo-layout.md](references/repo-layout.md) when creating a board repository, adding a board to one, starting work in a project someone else prepared, deciding what is tracked or ignored, or writing its README. Copy [assets/gitignore](assets/gitignore) to `.gitignore` when starting a repository.
- Read [headless-editing.md](references/headless-editing.md) before changing any KiCad file from a script or the command line, and when choosing between a text edit, KiCad's Python, and `kicad-cli` for a job.
- Read [evidence.md](references/evidence.md) when two sources disagree, when stating a value, pin, or rating, and before approving a part against its datasheet.

Parts:

- Read [libraries.md](references/libraries.md) when importing, creating, replacing, or approving a symbol, footprint, or 3D model, or editing a library table.
- Read [part-fields.md](references/part-fields.md) when choosing a part or package, setting symbol fields, carrying a supplier number, or producing a bill of materials.

Design:

- Read [schematic.md](references/schematic.md) before changing schematic connectivity, symbols, labels, fields, or the arrangement of a sheet.
- Read [design-rules.md](references/design-rules.md) when setting or reading net classes, trace widths, clearances, vias, zone settings, the stackup, or custom rules for a fabricator, and when writing any document that states one of those numbers.
- Read [placement.md](references/placement.md) before placing or moving footprints, choosing a part's rotation, or setting a board outline.
- Read [routing.md](references/routing.md) before routing or rerouting any net, pouring or stitching ground, wiring a current-sense resistor, or using an autorouter.
- Read [silkscreen.md](references/silkscreen.md) when adding or moving printed text, reference designators, pin 1 marks, or labels beside connection points.
- Read [board-connections.md](references/board-connections.md) when joining boards, or choosing an edge connection, its pitch, or its pin order.
- Read [panels.md](references/panels.md) when arranging boards on a panel, or adding tabs, mouse bites, rails, or fiducials.

Shipping:

- Read [validation.md](references/validation.md) after any hardware-file change, before calling a board checked or done, and when reviewing a repository for electrical, visual, or manufacturing readiness.
- Read [fabrication.md](references/fabrication.md) when exporting Gerbers, drill files, a bill of materials, or a placement file, and before any order.

## Core Non-Negotiables

- One project makes one board. Work in the project the repository provides.
- A clone opens with nothing missing. Every imported part lives under the project's `lib/` folder and resolves through `${KIPRJMOD}`.
- Make the smallest coherent change. Preserve UUIDs, references, fields, net names, and formatting that do not need to change, and leave other people's uncommitted work alone.
- Electrical intent is data. Net classes, clearances, and fabricator rules live in the project and rules files, and every document that states one agrees with them.
- A converted part is a draft until it is checked against the manufacturer's drawing.
- A power trace is as wide as its net's real worst-case current needs, never as wide as its name suggests.
- The schematic is reviewed before routing starts, and placement is judged before the first track.
- The nets that matter are routed by intent, in an order that gives them the copper they need. A clean check is the floor: routing manners count.
- Current capacity, return paths, protection, thermal behavior, assembly, and physical access are implementation constraints, not later polish.
- Checks answer by category, not by a total: ERC, DRC, parity, unrouted nets, the datasheet read, and a look at the picture are separate facts.
- Never suppress a warning to lower a count. Fix the model the warning points at.
- Never present an estimate as a datasheet value.

## The Check Script

Run the [check script](scripts/check.mjs) after the last edit and before calling a board checked:

```bash
node <skill-root>/scripts/check.mjs <project>
```

It drives `kicad-cli`, leaves the project as it found it, and prints a PASS or FAIL line for each of ERC, DRC, unrouted nets, schematic parity, the outline, zone fills, track widths, library paths, and the supplier number, with the first twenty errors and the first twenty warnings listed under each check. It exits 0 only when every check passes. `--json` prints every finding, and `--help` lists the other options and says what each check proves.

## PCB Repository Audit

When invoked to audit a PCB repo:

1. Inspect the folder tree, the README, `.gitignore`, the project, schematic, board, and rules files, and both library tables.
2. Run the check script with `--json` and classify every error and warning it lists, each narrow track included.
3. Compare net classes, constraints, severities, and custom rules with the named fabricator's limits, and each net's width with the current the design gives it.
4. Compare every document that states a rule with the project file.
5. Check every imported part against its datasheet: pin table, land pattern, courtyard, and pin 1 mark.
6. Compare the exported bill of materials with the documented part list, and name every fitted part that is excluded from it.
7. Look at a plot of each copper layer and a render of each side for placement, routing manners, printed text, and missing 3D models.
8. Confirm fabrication outputs come from the tracked files by one command and that nothing generated is edited by hand.
9. Report findings as a Markdown table of category, file, and finding, with introduced defects apart from inherited ones.

Several references end with an "Ask before" line for their riskiest changes, such as placing an order, changing a connection another board depends on, substituting a locked part, loosening a rule, and regenerating a design file. Honor those where the topic lives.
