# Fabrication

The assembler places every part, and the board arrives working. Design for that: single-sided assembly where the board allows it, parts the assembler stocks, and files that come out of the tracked design by one command.

## Outputs

One script in the repository writes the order set from the tracked files into `Fabrication/`, and nothing else goes in that folder. Write it when the repository has none:

- Gerbers and drill files with the fabricator's layer naming, zipped as one set.
- A bill of materials with the columns the assembler's upload reads, one line per supplier number, designators written out one by one.
- A placement file in millimeters with the column names the assembler's upload reads, holding only the parts it places.

The script checks before it writes, and writes nothing when a check fails: the design rules check with schematic parity, a supplier number on every placed part, no two bill lines for one part (the same number, or the same value and footprint with no number), stock for the whole order, the assembler's footprint landing on the pads at each placed rotation, and the same parts in the bill, the placement file, and the board. An output edited by hand has no source.

The KiCad Fabrication Toolkit plugin writes its own output to `production/`, and nothing else goes there. That output is not what is uploaded.

## Rotation

The assembler places each part with its own footprint for the supplier number, and that footprint's zero rotation can differ from the library's. The correction lives on the part, in an `FT Rotation Offset` field, which the Fabrication Toolkit plugin adds after its own rotation table. The repository's script computes rotation the same way, table and field, so both exports agree.

- The plugin's built-in rotation table guesses from the footprint's name and fits KiCad's stock footprints. A footprint converted from the assembler's catalog gets its own field, including one that cancels the table's turn when its name happens to match an entry.
- Find each turn by laying the assembler's footprint for the supplier number over the KiCad pads, and confirm it in the assembler's placement preview.

## Before Anyone Pays

- Open the outputs in the fabricator's own viewer and compare with the render: layer alignment, outline, drill hits, and the rotation of every chip and polarized part.
- Check the outline Gerber from the exact files being uploaded as geometry, not as a picture: every contour closed, no two contours overlapping, every edge meeting its neighbor at exactly the same point, and the contour count and enclosed area equal to KiCad's board outline. KiCad joins two endpoints that nearly meet within its own tolerance, while the fabricator can read the same outline as one solid region and fill a panel gap, and a rendered picture of it looks correct. Then confirm every mouse-bite hole is in the drill file and the fabricator's viewer shows every gap open.
- Confirm every supplier number resolves in the assembler's own tool.
- On the order day, print every line of the bill with its stock, price, Basic or Extended class with the Extended fee, and whether Economic assembly takes the part, each read from the assembler's parts library. A line with no stock stops the order. One part that only Standard assembly takes moves the whole order to Standard, so check every part, not a sample.
- The thinnest-stocked part sets how many boards can be built.
- Set the thickness, copper weight, and finish on the order on purpose.
- Order only a board that has been reviewed.

## The Order Record

An annotated tag named `order-YYYY-MM-DD` marks the commit each order was made from. The order set is regenerated from that tag, so no copy of it is kept in the repository.

Ask before placing an order, paying a surcharge, or accepting the assembler's substitute for a part.
