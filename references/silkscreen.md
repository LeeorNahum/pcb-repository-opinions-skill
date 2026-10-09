# Silkscreen

Printed text is for the person holding the finished board with a soldering iron or a probe. Print what that person needs, where it stays readable after assembly, and nothing that covers a pad.

- Label every hand-soldered connection point with its net name, beside it, on the side it is soldered from.
- Print the board's name on the board.
- Set one text height and line width as both the minimum and the default in the project, so every label matches and the check catches a smaller one.
- Printed text and outlines keep the fabricator's clearance from every pad and do not overlap each other.
- Every chip and every polarized part has exactly one printed pin 1 mark, outside the part, visible after assembly.
- Place a mark where it cannot be read as part of a nearby word. A dot after a net name reads as a full stop.
- Chips, transistors, and connectors carry their reference designator on the board. Where passives are too close together for a readable name each, their designators go on the fabrication layer.
- A designator reads the same way up as the text around it and does not stand between a part and a label so that the two read as one.
- Mark a keepout a person must respect in words.

Ask before moving or renaming printed text that a document, a fixture, or another board's assembly depends on.
