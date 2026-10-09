# Headless Editing

Pick the route by the job, not by habit. Each job has one route that is reliable without the editor's window.

| Job | Route | Why |
| --- | --- | --- |
| A change to a schematic | Edit the `.kicad_sch` text, then let KiCad re-save it | KiCad 10 has no scripting interface for schematics |
| Footprints onto a board, placement, tracks, vias, zones, fills | KiCad's Python bindings, `pcbnew` | They load real footprints, compute pad positions, and fill zones the way the editor does |
| A one-line change to a board, a rule, or a library file | Text | Smaller than a script and easy to review |
| ERC, DRC, parity, netlist, BOM, plots, renders, fabrication files | `kicad-cli` | Its verdict is the one the project's own rules give |

These routes hold on KiCad 10. Check each against the installed version before relying on it.

## Edit In Place

- Change only what the task names. A whole KiCad file is never regenerated or normalized to fix a local problem. The one whole-file rewrite is KiCad's own re-save of a schematic after a text edit, which keeps UUIDs and changes only the form.
- Run `git status` before the first edit, and leave uncommitted changes that are not yours in place.
- Saving a board through `pcbnew` can rewrite the project file with its keys reordered. Copy the project file before the save and put it back afterward unless a setting in it was meant to change.
- Use an interpreter that can import `pcbnew`. Where KiCad ships its own Python, that is the one.

## A Board Built By Script

Only where the repository owns a generated board, with its complete inputs tracked:

- Keep placement and copper in one table of data: each part's position and rotation, and each track as a net, a layer, a width, and a list of points.
- Name points by pad, with an offset where needed. A track that starts at a named pad moves with the part.
- Rebuild the board from the table on every change, then run the checks.
- KiCad 10 has no command that updates a board from its schematic. In Python: export the netlist, load each footprint from its library, set its reference, value, fields, and the link to its symbol, and give each pad its net. Then let `kicad-cli pcb drc --schematic-parity` confirm the result.

## Changing A Schematic As Text

- Embed every library symbol a new instance uses in the sheet's `lib_symbols`, or the instance renders as an outline with unknown pins. A derived symbol is stored flattened: its parent's drawing under the child's name and fields.
- Compute each pin's position from the library symbol, the instance's position, and its rotation. Draw wires and labels to those points, on the electrical grid.
- Store the fields of a rotated symbol rotated with it, or they read sideways.
- Write a line break inside a text as backslash n. A raw line break makes KiCad refuse the whole file with no reason given.
- Re-save an edited file with `kicad-cli sch upgrade --force`, so what is committed is in the form the Schematic Editor writes.
- When KiCad refuses a file without saying why, remove one kind of new element at a time until it loads.

## Guarding Connectivity

- Before a reviewed schematic is touched, export its netlist as the baseline. Compare the netlist after every change, and refresh the baseline only after the owner accepts a net change.
- For a new schematic, write the intended nets as a table, pin by pin, from the specification and not from the script that draws the sheet, and compare the exported netlist with it. A drawing can look right and connect nothing, and ERC cannot know what was intended.

## Seeing The Result

Plot each copper layer to a PDF with `kicad-cli pcb export pdf`, one side per file, and render the board with `kicad-cli pcb render` from the top, the bottom, and an angle. Look at every picture after every pass. A plot with both copper layers on one page hides the back.

Ask before regenerating a schematic or board that a person has laid out, because their layout, UUIDs, and formatting do not survive it.
