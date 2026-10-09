# Validation

A board is checked when its own files say so under its own rules, and when someone has looked at it. Each check below is a separate fact.

## What Checked Means

| Check | Produced by | Passes when |
| --- | --- | --- |
| ERC, DRC, unrouted nets, parity, outline, zones, library paths, supplier numbers | The check script | Each line says PASS and every warning under it is classified |
| Widths | The check script's list of tracks narrower than their class | Each is covered by the board's stated allowance or a written reason |
| Nets | The exported netlist against the reviewed baseline or the intended table | Every pin is on its net |
| Datasheets | A pin-by-pin read | Pins, addresses, defaults, decoupling, and each state of the circuit agree |
| Footprints | Each land pattern against its package drawing | Pads, drills, paste, mask, courtyard, and pin 1 agree |
| Documents | Every stated rule against the project file | They agree |
| The picture | A plot of each layer and a render of each side | It has been looked at and judged, and every fitted part shows its 3D model |
| The panel, when there is one | The fabricator's viewer | Tabs, gaps, rails, and fiducials are where its process needs them |
| Prepared settings, when someone else prepared the project | A comparison with the project as it was handed over | Nothing that was set has moved or been renamed |

Run the check script after the final edit. When a row is open, say the board is not checked and name the row.

## Reading The Reports

- Report by category, never only a total: new errors from the change, existing errors outside it, pin-type noise from imported symbols, library-copy mismatches, intentional no-connects, and real dangling labels, clearance failures, or parity failures.
- A warning is accepted only with a reason and an owner, written beside the check results in the board's README.
- Ask of each check what would have to be true for it to pass while the thing it names is broken. A courtyard check passes when the courtyard is drawn wrong. Break the guard on a copy, see the check fail, then trust it.

## Looking At The Board

Electrical tools do not evaluate communication or physical plausibility. Review each functional block in a tight crop, then the whole, for what only a picture shows:

- A power path with a neck or a detour
- An empty quarter beside a cramped one
- A blank spot in the render where a part should be
- Text that overlaps, sits under a via, or reads as part of another word
- Pin 1 marks or polarity hidden after assembly

Give a second reviewer the files and the specification, not the story of how they were made.

## Human Review Handoff

Make each review item independently answerable: the exact part or block, the decision being confirmed, the literal pins, nets, values, and footprints, a link to the exact datasheet page, the remaining risk, and a checkbox with a blank quoted comment line below it for the reviewer's note.

```markdown
- [ ] Decision stated in one concise sentence. ([datasheet, p. N](https://example.invalid/datasheet.pdf))

> 
```

One decision per checkbox, so a reviewer can reject one choice without rejecting a whole block. A design with several blocks gets one checklist per block.

## Final Report

State what changed, each check's result as its own line, the datasheet checks completed, the checks not run and why, the decisions left to a person, and whether the work tree is clean, dirty, or committed. State literal part pins, net labels, values, and footprints, and keep a net's label distinct from its class.
