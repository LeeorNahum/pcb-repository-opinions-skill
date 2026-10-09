# Part Fields

The supplier number lives in one symbol field with one name on every part an assembler places, the same field the part converter writes. One column of the bill of materials then covers imported and stock parts alike, and a blank cell is a finding.

## Fields

- A stock part also carries what constrains an acceptable substitute: tolerance where it affects regulation, sensing, timing, addressing, or protection, and voltage and dielectric wherever DC bias, temperature, or aging changes effective capacitance.
- Where a board must stay open to substitution until it is ordered, leave a stock part's supplier number blank, make its constraint fields complete, and fill the number when the bill of materials is produced. Until then the supplier check fails on those parts. Say in the final report that those numbers are open.
- A `Function` field holds one line on what the part does, or why its value or package is what it is. Intent goes in net names and fields, not in reference designators.
- Use the exact manufacturer part number and package variant for semiconductors, connectors, magnetics, protection devices, and electromechanical parts. A similar suffix can change pinout, rating, or exposed pad.

## Package

Smallest package that works. 0402 is the default for stock resistors and capacitors. Go larger only for a concrete reason: current, voltage rating, dissipation, effective capacitance under DC bias, a datasheet requirement, or rework by hand. Record the reason in the `Function` field when the circuit does not make it obvious.

Regulator and charger passives are circuit parts chosen from the datasheet's stability and derating requirements.

## What Is Drawn

- Draw only what gets built.
- An option is drawn only when it has one unambiguous default and a written population rule. Its unfitted footprint is marked do-not-populate.
- Make an option with a small zero-ohm link or an open solder bridge. No default requires cutting a trace.
- A connection with no part, such as a bare hole for a wire or a breakaway pattern, is excluded from the bill of materials and the placement file by its footprint's attributes, and left out of the documented part lists. Nothing an assembler fits is excluded.

## Locking A Part

A locked part is one the owner has fixed in writing. A stock shortage changes an unlocked part's supplier number, never the choice of a locked one.

- Lock a regulator's inductor and capacitors, a protection part, or a connector only after every rating its job depends on is read from the datasheet at the board's real conditions.
- If a required number is absent from the datasheet, document the estimate and the test plan in the board's README.

## Sourcing

- Choose parts the assembler can supply. Check the assembler's own parts library, not only the distributor's site.
- Record stock, price, lifecycle, and assembly class for each exact part, with the date read, beside the part list in the board's README.

## The Bill Of Materials

Compare the exported bill of materials with the documented part list line by line, by script: supplier number, quantity, value, and footprint. A matching count by eye is not a match.

Ask before substituting a locked part, changing a supplier number to a different part, or accepting an end-of-life or second-source part.
