# Placement

Every part sits where its job puts it. Placement decides whether the board routes at all, so it is finished, looked at, and judged before the first track.

## Order

1. Mechanical constraints: the outline, board-to-board connections, connectors, antennas, sensors, and anything a person must reach.
2. Where a board carries load current from an input to an output, that path, in a line.
3. Critical loops: switching regulators, chargers, crystals, protection at the entry connector, and sensitive analog parts.
4. Each chip beside the thing it measures or drives.
5. Support parts at the pins they serve.

## Rules

- A decoupling capacitor's ground pad faces a via or the pour.
- Follow each power part's datasheet placement: input capacitor, switch, inductor, and output capacitor form one tight loop, with the feedback node away from it.
- Put protection at the entry connector with a short path to its return.
- Keep the board compact and its outline near square. Pull parts toward the middle and toward what they connect to. A part alone in a corner is a question.
- A pull resistor sits between the two pins it joins, never out at an edge with its supply carried round to it.
- Where a board may be trimmed by hand, keep pads, tracks, and fill out of the corners.
- Follow the exact antenna keepout from the module's maker, on every layer, including a neighboring board on the panel.
- Keep programming, test, and recovery contacts reachable after assembly.
- State the target outline in the README before layout starts, and draw it on the edge layer.
- Record what a footprint cannot encode, such as no copper under a sensor, as a rule area on the board.

## Rotation Follows The Wiring

- Turn each part so its pins face where their nets go. No trace then leaves a pad pointing away from its target or passes under another chip.
- Traces that leave a part side by side keep their order the whole way. Before placing a chip that receives a sense pair, a differential pair, or a bus, note the order the traces arrive in, and choose the chip's side and rotation so its pins meet them in that order.
- Where several chips share a bus, note the order at each chip before placing any of them, and decide where a crossing goes if one is needed.

## Printed Text Is A Constraint

Text that is already on the board and may not move, such as a net name beside each connection point, takes real area. No pad sits under it. Measure the text boxes first and treat what remains as the board.

On a board built as small as its parts allow, decide the connection points and the box each name needs as one step, before any part is placed. Names fitted into leftover space afterwards end up beside the wrong point. Text does not set such a board's size: shorten a name, turn a row of names, or move them to the other side before the outline grows.

Try a layout rule on one board before many boards follow it. A rule that reads well can fit none of them.

## When Routing Fails

If a net fails twice in the same place, by hand or by autorouter, stop routing and move parts. More attempts on the same placement are never the fix.

Ask before moving a board-to-board connection or changing an outline that another board, an enclosure, or a panel depends on.
