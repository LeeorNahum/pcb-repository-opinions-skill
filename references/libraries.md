# Libraries

A symbol that only resolves on one workstation is not finished. Every custom symbol, footprint, and 3D model lives inside the project folder and is committed, both library tables sit beside the project file, and every path in them and in the model line of each footprint the project owns starts with `${KIPRJMOD}`. A path into one person's computer is a defect.

## What Gets Imported

- Import only parts that need an exact symbol, footprint, and model: chips, connectors, inductors, modules, and anything with no stock equivalent.
- Resistors, capacitors, LEDs, crystals, and small transistors come from KiCad's stock library with its footprints, and carry their supplier number in a field.
- Source order for an asset: KiCad's stock libraries first, then a conversion from the assembler's catalog, then hand-drawn.

## One Folder Per Part

Each imported part gets its own folder named `<MPN>_<supplier-number>`, holding its symbol file, its footprint folder, and its 3D models. The library nickname in both tables is that same name, so a wrong part is visible at a glance in either chooser and in the bill of materials.

The part folders sit under one `lib/` folder inside the project folder, never loose beside the project file.

- Convert with `easyeda2kicad`, symbol, footprint, and model together, with project-relative model paths. When the repository has its own wrapper, use that: it carries the folder naming and the table registration.
- Send the converter's output to `lib/`. A converter that registers parts in the project's tables still finds the project from there.
- Check the names it produced before committing. A part name with a dot or a slash can come out cut short or with a nickname that differs between the two tables.
- Run import helpers one at a time when they share scratch files or caches.
- Keep one authoritative asset per part, and keep both tables in step with what is on disk.

## A Converted Part Is A Draft

Never approve an imported symbol or footprint on provenance alone. Review it against the manufacturer's drawing for the exact package:

- Pin numbers, names, and electrical types, hidden and power pins included
- Pad numbers, sizes, shapes, drills, pitch, row spacing, and layers
- Paste and solder mask openings, and the thermal pad
- Origin, rotation, and pin 1 orientation
- Courtyard, and the printed pin 1 mark
- 3D model alignment

Three faults are common in converted parts, and each one hides a real defect behind a passing check:

- Every pin typed as unspecified. ERC then warns on every connection, and the wall of warnings buries the one that matters. Give each pin its type from the datasheet.
- A courtyard drawn round the body only. The courtyard check then passes while leads touch a neighbor. Use the manufacturer's courtyard, and where it gives none, enclose the body and every pad with the clearance KiCad's own library convention gives that kind of package: 0.25 mm for most, more for connectors and ball grid arrays.
- A pin 1 mark too small to print, on a layer that is not printed, or under the body. Fix the mark in the footprint.

Record the result for each footprint, with the source drawing and the measured deviation, in the board's README, and say so when a land pattern differs from the manufacturer's but is kept.

Ask before deleting a library other projects copy from, or replacing a checked footprint with a fresh conversion.
