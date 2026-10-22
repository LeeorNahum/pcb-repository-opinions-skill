# Schematic

Connectivity comes before appearance, and both are required. A label that looks adjacent can still be dangling, and a sheet that passes ERC can still be unreadable.

## Connectivity

- Determine whether the design is flat or hierarchical before adding labels. Same-name labels on one flat sheet are one net, even when boxes imply separation.
- Use scoped net names when independent circuits share a sheet, a project, or a panel. A power symbol joins its net across every sheet, so reuse a generic rail name only when shared copper is intended.
- A net that crosses between boards is spelled the same on both sides.
- Place label anchors and wire ends on the electrical grid.
- Join duplicated connector pins that carry one signal, unless the connector or the protection topology needs separate paths.
- Give every connector pin a role, a current it can carry, and a return path.
- Give every intentionally unused pin a no-connect flag.
- Put a power flag on each net that arrives through a connector or through a series part, and on ground. An undriven power pin elsewhere means a missing wire, not a missing flag.
- Keep the footprint filter check at error severity. It is the check that catches a capacitor footprint on a resistor.
- The schematic is reviewed before routing starts. After a later schematic change, update the board from it and run every check again.

## Default States

- Bias every address, mode, enable, reset, and configuration pin unless the datasheet says it may float. Its default is the safe state with the controller unpowered.
- Pull resistors are as high as the input allows. Keep a lower value only where a datasheet or a bus's speed demands one, and write the reason in the part's `Function` field.
- Leave out a pull the controller can supply from its own pin in software, unless the pin must hold its state while the controller is off.
- Pull-ups for a bus shared between boards exist in exactly one place in the assembled system. A generic board whose system is not known carries its own pair as an option the builder removes or leaves open, and the sheet says so.
- A strap that needs a default and an alternative is a fitted resistor for the default and an open solder bridge for the alternative. Say on the sheet what the resistor draws once the bridge is closed, and that removing it stops that.
- Pulls that hold the safe state with the controller off stay on the board that owns the input.
- Keep a device at the address its firmware driver assumes, and tie address pins explicitly.

## Readability

- Organize by signal flow and functional block: inputs and sources to the left, outputs and loads to the right, power above, ground below.
- Put a visible box around each functional block on a crowded sheet, with the short block name at the upper left inside it. Boxes communicate review scope, never electrical scope.
- Draw the main path as one continuous line of wire. A part that sits in parallel with another is drawn across it, on wires, so the relationship is visible without matching names.
- Place parts that form one local relationship together and join them by wire. A pull resistor, decoupling capacitor, feedback divider, address strap, or protection part should not become a cloud of one-pin labels.
- Use labels for block boundaries, repeated rails, distant interfaces, and connector-facing nets. A node used only inside one block stays unlabeled unless a label serves bring-up or test.
- A note states only what the drawing shows and stays true in every state of the circuit. A note about copper says it is about layout.
- State an unusual orientation in words beside it. A part wired the reverse of the usual way with no reason given gets "fixed" by the next reader.
- Start with the smallest standard sheet that holds readable, compact blocks. Compact the blocks before enlarging the sheet.
- Move symbols, labels, and wires as groups on the grid. Never scale a block by its coordinates: labels detach silently.
- Follow the symbol style the sheet already has.
- Treat overlapping pin names, values, references, and wires as defects even when ERC passes. A symbol that prints its pin names over its own drawing is fixed in the library.

Ask before changing a net name that another board, a connector, or firmware depends on.
