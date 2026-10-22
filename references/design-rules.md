# Design Rules

Rules exist as data. Net classes, track and via sizes, clearances, and the fabricator's limits live in the project file and the rules file, where the command-line check applies them. Prose alone is not an implementation.

The project file owns each number. Every document that states a rule, such as a README, a rules file, a slide, or a screenshot, agrees with it. A width changed in one place and not the others is a finding.

## Floor And Class

- The fabricator's minimums are the floor it accepts, not a target. Put the floor in the board constraints, then widen in net classes to what the board needs.
- Board minimums are never stricter than the net classes they contain.
- Use a small, purpose-based set of net classes. Verify the numbers in the file before routing instead of trusting a class name.
- Carry the limits the constraints dialog cannot express in the rules file, each with a comment naming the fabricator it comes from.
- KiCad 10 drops a rules file it cannot read, whole and without a message, and the design rules check then passes without it. The check script's widths line fails when that happens.
- To find what a project changed on purpose, compare it with a fresh project from the same KiCad major version.

## Track Width

- Size each net from its real worst-case current, read from the design's own numbers: a regulator's limit, a load's rating, a fuse. A net's name is not a current.
- The thermal minimum comes from the IPC-2221 outer-layer formula, the one KiCad's own calculator uses. At 1 oz copper and a 10 degree rise, 0.5 A needs 0.12 mm, 1 A needs 0.30 mm, 2 A needs 0.78 mm, and 3 A needs 1.37 mm.
- Then check voltage drop over the whole series path, with every connector and joined board in it. A path that passes on each board can fail as a whole.
- A net that carries more than its class allows gets its own class, named for what it carries. A class that holds a net above its width is a defect, and a class filled by name pattern hides it.
- A differential pair's width and gap come from the stackup and its impedance target, not from current. On a thick 2-layer board the pair is wide, and that width is not a current rating. Recompute it when the board thickness changes.
- A short neck into a pin may be as narrow as the pin, and a sense branch on a power net stays thin. State that allowance once, beside the net classes in the README. A board that breaks its own stated width rule without saying so is a finding.
- KiCad's design rules check does not flag a track narrower than its net class. The check script lists each one. Where a width must hold, add a custom rule with a minimum for that net.

## Starting Numbers

For JLCPCB, 2 layers, 1 oz copper. Recheck each against the fabricator's own capability pages before an order.

| Limit | Value | Notes |
| --- | --- | --- |
| Track width and gap | 0.10 mm | The floor |
| Via | 0.3 mm hole in a 0.6 mm pad | The default, with no surcharge. Read the price steps at the source before going smaller |
| Plated hole ring | 0.18 mm | The floor. 0.25 mm recommended |
| Copper to a routed edge | 0.2 mm | 0.4 mm from a V-cut |
| Silkscreen to pad | 0.15 mm | Where text overlaps a pad opening, the opening wins |
| Silkscreen line | 0.15 mm | 0.1 mm stroke on the high-precision silkscreen option, from the character design guide |
| Silkscreen text height | 1.0 mm | The published minimum, or 0.8 mm on the high-precision silkscreen option, from the character design guide |

Default net classes, for a board with room and for a compact one:

| Setting | With room | Compact |
| --- | --- | --- |
| Signal track | 0.2 mm | 0.15 mm |
| Power track, to about 1 A | 0.5 mm | 0.4 mm |
| Clearance | 0.2 mm | 0.15 mm |
| Printed text height | 1.0 mm | 1.0 mm |

## Stackup

Set the board thickness in the board file on purpose, and read its price on the fabricator's live quote. KiCad's default thickness is nobody's decision.

## Zones

- Give every ground zone its net and check its layers. A rule area is not a zone.
- On a dense board, thermal reliefs on small surface pads leave too few spokes and the check reports each one. Use reliefs on through-hole pads, which are soldered by hand, and a solid connection for surface pads.
- Refill zones and save the board before running the check, which reads the fills as saved.

Ask before loosening a clearance, a severity, or a minimum, or editing a rules file that several boards share.
