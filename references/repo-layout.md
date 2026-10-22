# Repo Layout

One repository holds one KiCad project. A product built from several boards draws each board as one hierarchical sheet of that project, and lays every board out in its one board file, which is the panel that is ordered.

```text
<product>-pcb/
  README.md
  .gitignore
  <Product>.kicad_pro
  <Product>.kicad_sch
  <Product>.kicad_pcb
  <Product>.kicad_dru
  sym-lib-table
  fp-lib-table
  Sheets/
    <Board Name>.kicad_sch
  lib/
    <MPN>_<supplier-number>/
  <Product Footprints>.pretty/
```

The root sheet holds one sheet symbol per board and nothing else. A repository with a single board draws it on the root sheet. The project, schematic, board, and rules files carry one name, and an established project is never renamed. A footprint folder beside the project file holds only footprints drawn for this repository, such as its board-to-board connections.

Each board's reference designators take a hundred of their own, such as 101 to 199 for one board and 201 to 299 for the next. KiCad's annotation option that numbers from the sheet number times 100 does this, counting the root sheet as sheet 1.

Work in the project the repository provides. A second project created inside the folder starts without the net classes, rules, and connection points the first one was given.

## Tracked And Ignored

- Track the project, schematic, board, and rules files, every sheet, both library tables, every part folder with its 3D models, and the README.
- Ignore what is per user or regenerated: backups, autosaves, lock files, KiCad's footprint cache, local project state, exported netlists and tables, autorouter files, fabrication outputs, the converter's cache, and one scratch folder.
- Keep disposable exports (reports, plots, renders) in that scratch folder. A picture is tracked only when the repository keeps it on purpose, such as a before and after pair for a review.

## The README

One README covers the repository. It names the KiCad major version and lists every board in a table: sheet, designator hundred, target size, and one sentence on what it is.

Each board's section states what the board does, its target size, every board-to-board connection with its nets in order, the parts to import with supplier number and datasheet link, and the stock parts with value, footprint, and supplier number. When a connection reaches a controller on another board, the section says which pin it lands on and why that pin.

When the project is prepared by one person and its boards are finished by others, the README also says what is already set and what ERC and DRC report before any work starts, so a message that remains at the end is a finding. What must be identical across boards is set before anyone starts: board-to-board connections with their net names, net classes, fabricator rules, text sizes, and board thickness.

## Working Together

- Each person owns whole files: their board's sheet, and the board file one person at a time. Git merges two edits to one schematic or board without complaint, and the result is a broken file or silently wrong nets.
- The default branch always opens and always passes ERC. Work reaches it through a pull request.
- A schematic or board change cannot be reviewed as a text diff. Attach a picture of the sheet or the layer before and after.

Ask before renaming a project or moving a board between repositories.
