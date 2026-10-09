# Repo Layout

One KiCad project makes exactly one board. A product built from several boards is one repository with one folder and one project per board, so each person owns a folder.

```text
<product>-pcb/
  README.md
  .gitignore
  <Board Name>/
    README.md
    <Board Name>.kicad_pro
    <Board Name>.kicad_sch
    <Board Name>.kicad_pcb
    <Board Name>.kicad_dru
    sym-lib-table
    fp-lib-table
    lib/
      <MPN>_<supplier-number>/
    <Board Footprints>.pretty/
```

A repository with a single board keeps the same files at its root. The board folder and its project, schematic, board, and rules files carry one name, and an established project is never renamed. A footprint folder beside the project file holds only footprints drawn for this board, such as its board-to-board connections.

Work in the project the repository provides. A second project created inside the folder starts without the net classes, rules, and connection points the first one was given.

## Tracked And Ignored

- Track the project, schematic, board, and rules files, both library tables, every part folder with its 3D models, and each README.
- Ignore what is per user or regenerated: backups, autosaves, lock files, local project state, exported netlists and tables, autorouter files, the converter's cache, and one scratch folder.
- Keep disposable exports (reports, plots, renders) in that scratch folder. A picture is tracked only when the repository keeps it on purpose, such as a before and after pair for a review.
- Track fabrication outputs only as a dated, zipped set for an order that was placed, and confirm with `git check-ignore` that no file of the set is ignored.

## The README

The root README names the KiCad major version and lists every board in a table: folder, owner, target size, and one sentence on what it is.

Each board's README states what the board does, its target size, every board-to-board connection with its nets in order, the parts to import with supplier number and datasheet link, and the stock parts with value, footprint, and supplier number. When a connection reaches a controller on another board, the README says which pin it lands on and why that pin.

When projects are prepared by one person and finished by others, the root README also says what is already set in each project and what ERC and DRC report before any work starts, so a message that remains at the end is a finding. What must be identical across boards is set before anyone starts: board-to-board connections with their net names, net classes, fabricator rules, text sizes, and board thickness.

## Working Together

- Each person owns whole files. Git merges two edits to one schematic or board without complaint, and the result is a broken file or silently wrong nets.
- The default branch always opens and always passes ERC. Work reaches it through a pull request.
- A schematic or board change cannot be reviewed as a text diff. Attach a picture of the sheet or the layer before and after.

Ask before renaming a project or moving a board between repositories.
