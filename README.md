# pcb-repository-opinions-skill

An opinionated, modular skill for circuit board repositories: project layout, editing design files without the editor's window, part libraries and supplier fields, trace widths and fabricator rules, placement, routing, printed text, board-to-board connections, panels, and what has to pass before a board is called checked.

It keeps the layers of a board explicit (schematic, copper, datasheets, libraries, the fabricator's rules, the assembler's catalog, and the files they are sent) so a board can be checked, ordered, and built from the repository alone. The opinions are paradigm-named and tool-stated, with KiCad as the default design tool and JLCPCB as the default fabricator.

## Layout

- `SKILL.md` is the spine: thesis, default toolchain, the reference-loading map, core non-negotiables, and the repository audit.
- `references/` holds one concept per file, loaded on demand.
- `assets/gitignore` is the starter ignore file for a board repository.
- `scripts/check.mjs` checks a board project through `kicad-cli` and prints one PASS or FAIL line per check. Needs Node.js 18 or later and an installed KiCad.
- `tests/check.test.mjs` breaks a copy of a finished board once per check and confirms each check fails.
- `package.json` describes the check script as a runnable package.
- `AGENTS.md` is the maintenance contract for this skill.

## Running the check

```bash
node scripts/check.mjs <project>
```

Run it with `--help` for what each check proves.
