# Silkscreen

Printed text is for the person holding the finished board with a soldering iron or a probe. Print what that person needs, where it stays readable after assembly, and nothing that covers a pad.

- Label every header pin and wire hole with its net name, beside it and inside the board's outline, on the front, or on the back where the front has no room. No label is smaller than the fabricator's published minimum text height for the silkscreen option on the order.
- A name belongs to exactly one point: it is nearer its own point than any other, centred on it, with no other name between. Where names are wider than the pitch, turn the whole row, never stagger it.
- Print the board's name on the board.
- Set one text height and line width as both the minimum and the default in the project, so every label matches and the check catches a smaller one.
- Printed text and outlines keep the fabricator's clearance from every pad and do not overlap each other.
- Every chip and every polarized part has exactly one printed pin 1 mark, outside the part, visible after assembly.
- Place a mark where it cannot be read as part of a nearby word. A dot after a net name reads as a full stop, and so does an open via beside a name.
- A pin 1 dot the size of a via, among vias, is not a mark. Keep vias away from it or give it another shape.
- Chips, transistors, and connectors carry their reference designator on the board. Where passives are too close together for a readable name each, their designators go on the fabrication layer.
- A designator reads the same way up as the text around it and does not stand between a part and a label so that the two read as one.
- Mark a keepout a person must respect in words.

Ask before moving or renaming printed text that a document, a fixture, or another board's assembly depends on.
