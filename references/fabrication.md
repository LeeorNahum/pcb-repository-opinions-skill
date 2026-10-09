# Fabrication

The assembler places every part, and the board arrives working. Design for that: single-sided assembly where the board allows it, parts the assembler stocks, and files that come out of the tracked design by one command.

## Outputs

- Gerbers and drill files with the fabricator's layer naming, zipped as one set.
- A bill of materials with the columns the assembler's upload reads, one line per supplier number, designators written out one by one.
- A placement file in millimeters with the column names the assembler's upload reads, holding only the parts it places.
- Produce all three with one script from the tracked files. An output edited by hand has no source.

## Before Anyone Pays

- Open the outputs in the fabricator's own viewer and compare with the render: layer alignment, outline, drill hits, and the rotation of every chip and polarized part. Rotation conventions differ between a library and an assembler, and nothing in KiCad checks them.
- Confirm every supplier number resolves in the assembler's own tool.
- Rerun stock and price on the order day. The thinnest-stocked part sets how many boards can be built.
- Set the thickness, copper weight, and finish on the order on purpose.
- Order only a board that has been reviewed.

Ask before placing an order, paying a surcharge, or accepting the assembler's substitute for a part.
