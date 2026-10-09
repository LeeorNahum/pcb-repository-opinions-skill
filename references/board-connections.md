# Board Connections

How boards join is fixed before anyone designs a board. The connections, their positions, and the net name on every pin are set in each project first, so boards built by different people meet.

- Name each connection by reference and document it by the edge it sits on and its nets in order.
- Pin 1 of every connection is ground, with a square pad. Keep one pin order across every board of a product.
- Where boards are separated from one panel, each stays useful on its own through its connection and its documented interface.

For boards joined by soldered wires:

- A connection is a row of bare plated holes near the edge with no header part. Nothing is placed by the assembler, and the wires are soldered straight in.
- Pitch follows who solders it: 2.54 mm with a 1.0 mm drill, which takes a standard 0.64 mm square header pin, where wires are soldered by hand or a header may be fitted later, 1.27 mm with a drill near 0.45 mm on a compact board or for a pogo row.
- Double the holes on a power path, and give a power row a second ground.
- Put a ground hole beside a sensitive pair.
- Leave room beside each hole for its printed net name and for an iron.
- Castellated edges are not the default. The electrical connection and the mechanical breakaway are separate decisions.

Ask before changing a connection's pin order, pitch, or position once another board or firmware depends on it.
