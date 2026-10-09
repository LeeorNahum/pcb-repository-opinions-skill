# Routing

Route by intent. Every net is placed by someone who knows where it is going and why, in an order that gives the nets that matter the copper they need. A clean check is the floor, not the judgment: routing manners count.

## Order

1. Where the board has one, the path that carries load current from input to output.
2. Each sense pair and differential pair.
3. Supplies and their decoupling.
4. Signals, shortest and most constrained first.
5. Ground: the pour, then the vias that tie it together.

## A Load Path

- Wide, short copper on one layer, at its class width.
- It never passes through a chip's pin, and it does not change layer unless it must.
- Parallel parts that share the current each get their own connection of full width.
- A high-current node that belongs to no class, such as a converter's switch node or an inductor node, is drawn as wide as its pads.

## A Current-Sense Resistor

Wire it as a four-terminal connection even when the part has two terminals.

- Each sense trace starts inside the pad, at its inner edge, and leaves under the resistor's body. The load copper joins the pad from its outer side.
- The two traces run together as a pair to the chip, thin, apart from the copper that carries the load.
- Load current never crosses a sense pin on its way to the resistor. A board wired that way reads wrong.
- Check it by coordinates: where each sense track starts on the pad, and that no other copper of that net touches the pad in a way that defeats it.

## Manners

- No corner of 90 degrees or sharper. Turn at 45 degrees, and cut a right angle with a short diagonal.
- A trace goes toward its target. One that leaves a pad pointing away, loops round a part, passes under another chip, or doubles back is a finding.
- No trace hugs the board edge to get past something.
- A supply is not carried round the board to reach a point close by.
- Keep feedback and sense nodes away from noisy copper, and take them from the point the datasheet names.
- Route a differential pair as a pair, and keep its return path whole through protection parts and connectors.
- Leave no dangling copper and no via that connects one layer only.
- Keep vias and traces out of printed text. Use the gaps between lines of text, and turn below them.

## Crossings And Layers

- Solve crossings in placement first. A via pair is the remedy when the wiring order makes a crossing unavoidable.
- Spend vias on slow, low-current signals, not on a load path or a sense pair.
- A long supply trunk on the back boxes in every signal that needs to cross it. Keep supplies there short and off to a side.

## Ground

- Ground is a filled zone on every copper layer it can have, and every piece of it is tied to the rest.
- Tracks cut the pour into pieces. Keep every piece while vias go in, tie each piece to the main body through the other layer, and only then let the fill drop what is left.
- A pad boxed in by tracks gets its own short stub and via.
- Return current gets a continuous path. Ground is not automatically safe as a thin trace or a distant via.
- Stitch sparsely. A via does a job: beside a decoupling capacitor's ground pad, joining an isolated piece, or along a thin strip. A grid of vias in empty corners makes a board look filled, not finished.

## Autorouter

An autorouter is a helper for leftover signal nets, never for a load path, a sense pair, or a supply.

- Route the nets that matter by intent and lock them first.
- Give it a hard limit on tries. The same input gives the same failure.
- Let KiCad's own check judge the result, not the autorouter's count.
- Read its output as a picture before keeping it. It can send a trace along the board edge and leave stubs where it gave up.

Ask before rerouting a load path or a sense pair that someone else placed, or running an autorouter over a board with hand-placed copper.
