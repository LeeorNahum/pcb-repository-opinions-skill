#!/usr/bin/env node
// Check what kicad-cli and a KiCad board project's own files can answer: ERC, DRC with
// schematic parity, unrouted nets, the board outline, filled zones, tracks
// narrower than their net class, library paths, and the supplier number on
// every part in the bill of materials. Every result comes from kicad-cli or
// from the project's own files, so it holds without the KiCad window.
//
// Run with --help for the options.
//
// Needs Node.js 18 or later, an installed KiCad that provides kicad-cli, and
// no packages. It writes its reports to a temporary folder and leaves the
// project as it found it.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";

const SKILL_NAME = "pcb-repository-opinions";
const CHECKS = ["erc", "drc", "routed", "parity", "outline", "zones", "widths", "libraries", "supplier"];
// A line that vouches for a whole category passes only while the project keeps that category switched on.
const ROUTED_KEYS = ["unconnected_items"];
const PARITY_KEYS = ["missing_footprint", "extra_footprint", "duplicate_footprints", "net_conflict", "footprint_symbol_mismatch"];
// The checks behind the erc and drc lines. A project that ignores one has not passed it.
const ERC_KEYS = ["pin_not_connected", "pin_not_driven", "power_pin_not_driven", "pin_to_pin", "label_dangling", "wire_dangling"];
const DRC_KEYS = ["clearance", "shorting_items", "tracks_crossing", "hole_clearance", "copper_edge_clearance"];
// The rules the widths check adds to its own copy of the project.
const CLASS_RULE = "net class width ";
const PROOF_RULE = "added rules loaded";

const HELP = `${SKILL_NAME}: check what kicad-cli and the project's own files can answer about a KiCad board.

Usage:
  node <skill-root>/scripts/check.mjs <project> [options]

<project> is a .kicad_pro file, a folder that holds one, or a folder whose
subfolders each hold one. Every project found is checked.

Checks, each from kicad-cli or the project's own files:
  erc        Electrical rules check reports no errors, with the pin, label, and wire
             connection checks switched on in the project.
  drc        Design rules check reports no errors, under the project's own rules,
             on the zone fills as they are saved, which is the copper that is plotted,
             with the clearance, short, and crossing checks switched on.
  routed     No unconnected items, with that check switched on in the project.
  parity     The board matches the schematic, with the parity checks switched on.
  outline    The board has shapes on Edge.Cuts, and the outline check, which must be
             switched on in the project, finds them closed.
  zones      Every copper zone has a net and a saved fill on each of its layers.
  widths     Lists every track narrower than the width its net class sets, which the
             design rules check does not report. kicad-cli judges a temporary copy of
             the board with one added rule per net class. A short neck into a pin and
             a thin sense branch are allowed and cannot be told from a mistake here,
             so each is a warning to match with its written reason.
  libraries  Every path in the project's library tables starts with \${KIPRJMOD}, exists
             in that letter case, and sits under lib/. Every 3D model is a file in the
             project or sits under KiCad's stock model folder, where its presence is
             not checked. A footprint folder beside the project file is taken as
             drawn for the project. It does not prove that a symbol or footprint is
             correct.
  supplier   Every part listed in the bill of materials has its supplier number.
             Parts marked do-not-populate or excluded from the bill are not counted.

Every project gets all nine lines. A check that could not run is a FAIL that says why,
and so is a line whose named checks the project has set to ignore. Errors and warnings are
listed under their check, the first twenty of each, and --json prints them all.
Warnings fail the run only with --strict. A violation the project excludes is
listed as excluded and counted with the warnings.

A pass here is not a checked board. The datasheet read, the footprint review, the
netlist comparison, and a look at the picture are separate.

Options:
  --supplier-field NAME  The symbol field that holds the supplier number. Default: "LCSC Part".
  --no-supplier          Skip the supplier check, for a board no assembler will place.
  --strict               Fail on any warning as well as on errors.
  --json                 Print one JSON object and nothing else, also when the run fails.
  --kicad-cli PATH       The kicad-cli to run, and no other. Default: the KICAD_CLI
                         variable, then the PATH, then the usual install folders.
  --keep                 Keep the temporary reports and print their folder.
  --help                 Show this help.

Exit codes:
  0  Every check passed in every project.
  1  At least one check failed.
  2  Bad arguments, or no project was found.
  3  kicad-cli was not found, or the one named could not run.`;

class Failure extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function versionOf(candidate) {
  return execFileSync(candidate, ["version"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function findKicadCli(explicit) {
  // A caller who names one kicad-cli is choosing a KiCad version. Never fall back to another.
  for (const [named, source] of [[explicit, "--kicad-cli"], [process.env.KICAD_CLI, "KICAD_CLI"]]) {
    if (!named) continue;
    try {
      return { path: named, version: versionOf(named) };
    } catch {
      throw new Failure(3, `The kicad-cli named with ${source} could not run: ${named}`);
    }
  }
  const names = process.platform === "win32" ? ["kicad-cli.exe"] : ["kicad-cli"];
  const candidates = [];
  for (const dir of (process.env.PATH || "").split(process.platform === "win32" ? ";" : ":")) {
    for (const name of names) if (dir) candidates.push(join(dir, name));
  }
  // The usual install folders, newest version first, for a machine where KiCad is not on the PATH.
  const roots =
    process.platform === "win32"
      ? [process.env.ProgramFiles, process.env["ProgramFiles(x86)"]].filter(Boolean).map((p) => join(p, "KiCad"))
      : process.platform === "darwin"
        ? ["/Applications/KiCad/KiCad.app/Contents/MacOS", "/Applications/KiCad"]
        : ["/usr/bin", "/usr/local/bin", "/snap/bin"];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const name of names) candidates.push(join(root, name));
    let versions = [];
    try {
      versions = readdirSync(root).sort((a, b) => parseFloat(b) - parseFloat(a));
    } catch {
      versions = [];
    }
    for (const version of versions) {
      for (const name of names) {
        candidates.push(join(root, version, "bin", name));
        candidates.push(join(root, version, "KiCad.app", "Contents", "MacOS", name));
      }
    }
  }
  for (const candidate of candidates) {
    try {
      if (!existsSync(candidate) || !statSync(candidate).isFile()) continue;
      return { path: candidate, version: versionOf(candidate) };
    } catch {
      // Try the next candidate.
    }
  }
  throw new Failure(3, "kicad-cli was not found. Install KiCad, or pass --kicad-cli <path>, or set KICAD_CLI.");
}

function findProjects(target) {
  const full = resolve(target);
  if (!existsSync(full)) throw new Failure(2, `No such file or folder: ${target}`);
  if (statSync(full).isFile()) {
    if (!full.endsWith(".kicad_pro")) throw new Failure(2, `Not a .kicad_pro file: ${target}`);
    return [full];
  }
  const here = readdirSync(full).filter((f) => f.endsWith(".kicad_pro"));
  if (here.length) return here.map((f) => join(full, f));
  const found = [];
  for (const entry of readdirSync(full, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const dir = join(full, entry.name);
    for (const f of readdirSync(dir)) if (f.endsWith(".kicad_pro")) found.push(join(dir, f));
  }
  if (!found.length) throw new Failure(2, `No .kicad_pro file in ${target} or in its subfolders.`);
  return found.sort();
}

// Run one kicad-cli command that writes a report. The report is removed first, so one
// left by an earlier project or run can never stand in for this one. kicad-cli states its
// findings in the report, so its exit code is not the verdict, but its last line is kept
// to explain a report that never appeared.
function run(cli, args, out) {
  rmSync(out, { force: true });
  try {
    execFileSync(cli, [...args, "-o", out], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return existsSync(out) ? null : "no report written";
  } catch (error) {
    if (existsSync(out)) return null;
    const lines = String(error.stderr || error.stdout || error.message).trim().split(/\r?\n/);
    return lines[lines.length - 1] || "no report written";
  }
}

function bySeverity(all) {
  // A violation the project excludes on purpose is listed with the warnings, so it fails the run only with --strict.
  const excluded = (v) => v.excluded === true || v.severity === "exclusion";
  const violations = all.filter((v) => !excluded(v));
  const errors = violations.filter((v) => v.severity === "error");
  const warnings = [...violations.filter((v) => v.severity !== "error"), ...all.filter(excluded).map((v) => ({ ...v, severity: "excluded" }))];
  const types = {};
  for (const v of warnings) types[v.type] = (types[v.type] || 0) + 1;
  const byType = Object.entries(types).map(([t, n]) => `${n} ${t}`).join(", ");
  return { errors, warnings, summary: `${errors.length} errors, ${warnings.length} warnings${byType ? ` (${byType})` : ""}` };
}

function describe(violation) {
  const where = (violation.items || []).map((i) => i.description).filter(Boolean).slice(0, 2).join(" and ");
  const kind = violation.severity === "error" || !violation.severity ? "" : `${violation.severity} `;
  return `${kind}${violation.type}: ${violation.description}${where ? ` (${where})` : ""}`;
}

// Split a board file into its top-level blocks of one kind without a full parser:
// find each "(name" at depth one and walk to its matching parenthesis.
function topLevelBlocks(text, name) {
  const blocks = [];
  const open = `(${name}`;
  let depth = 0;
  let inString = false;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (c === "\\") i++;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "(") {
      if (depth === 1 && text.startsWith(open, i) && /\s/.test(text[i + open.length] || "")) start = i;
      depth++;
    } else if (c === ")") {
      depth--;
      if (depth === 1 && start >= 0) {
        blocks.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return blocks;
}

// The copper layers the board declares, from its layer table.
function copperLayers(boardText) {
  const table = topLevelBlocks(boardText, "layers")[0] || "";
  const found = [...table.matchAll(/\(\d+\s+"([^"]+\.Cu)"/g)].map((m) => m[1]);
  return found.length ? found : ["F.Cu", "B.Cu"];
}

// A zone names its layers one by one or as a set: "*.Cu" is every copper layer,
// "F&B.Cu" the two outer ones.
function expandLayers(names, all) {
  const out = [];
  for (const name of names) {
    if (name === "*.Cu") out.push(...all);
    else if (name === "F&B.Cu") out.push("F.Cu", "B.Cu");
    else if (name.endsWith(".Cu")) out.push(name);
  }
  return [...new Set(out)];
}

function checkZones(boardText) {
  const problems = [];
  let copper = 0;
  const all = copperLayers(boardText);
  for (const block of topLevelBlocks(boardText, "zone")) {
    if (/\(keepout\b/.test(block)) continue; // A rule area is not a copper zone.
    const layerList = block.match(/\(layers?\s+([^)]*)\)/);
    const layers = layerList ? expandLayers([...layerList[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]), all) : [];
    if (!layers.length) continue;
    copper++;
    const net = (block.match(/\(net_name\s+"([^"]*)"\)/) || block.match(/\(net\s+(?:\d+\s+)?"([^"]*)"\)/) || [])[1] || "";
    const label = net ? `zone on net ${net}` : "zone with no net";
    if (!net) problems.push(`${label} on ${layers.join(", ")} connects to nothing`);
    for (const layer of layers) {
      const filled = block.includes(`(filled_polygon`) && new RegExp(`\\(filled_polygon\\s*\\(layer\\s+"${layer.replace(/[.*+?^${}()|[\]\\&]/g, "\\$&")}"\\)`).test(block);
      if (!filled) problems.push(`${label} has no saved fill on ${layer}`);
    }
  }
  return { copper, problems };
}

// True when the board file itself holds at least one shape on the edge layer,
// in the board or inside a footprint.
function hasEdgeShapes(boardText) {
  const onEdge = (block) => /\(layer\s+"Edge\.Cuts"\)/.test(block);
  for (const kind of ["line", "rect", "arc", "circle", "poly", "curve"]) {
    if (topLevelBlocks(boardText, `gr_${kind}`).some(onEdge)) return true;
  }
  // A footprint can carry the outline too. Each of its shapes ends before the next item opens.
  return boardText.split(/\((?=fp_|pad\b|property\b|footprint\b)/).some((piece) => /^fp_(?:line|rect|arc|circle|poly|curve)\b/.test(piece) && onEdge(piece));
}

// A path only one machine has: a drive letter, a leading slash, or a home folder.
const isAbsolute = (path) => /^(?:[A-Za-z]:[\\/]|[\\/]|~)/.test(path);

// True when every step of the path exists under root in the same letter case, so a path
// that resolves on a case-blind file system is caught before it is cloned to another.
function existsExactly(root, relative) {
  let here = root;
  for (const step of relative.split(/[\\/]+/).filter(Boolean)) {
    if (!existsSync(here) || !statSync(here).isDirectory() || !readdirSync(here).includes(step)) return false;
    here = join(here, step);
  }
  return true;
}

function checkLibraries(folder, boardText) {
  const problems = [];
  let paths = 0;
  const footprintFolders = [];
  for (const table of ["sym-lib-table", "fp-lib-table"]) {
    const file = join(folder, table);
    if (!existsSync(file)) continue;
    for (const [, uri] of readFileSync(file, "utf8").matchAll(/\(uri\s+"((?:[^"\\]|\\.)*)"\)/g)) {
      paths++;
      const inside = uri.match(/^\$\{KIPRJMOD\}[\\/]+(.+)$/);
      if (!inside) problems.push(`${table}: ${uri} does not start with \${KIPRJMOD}`);
      else if (!existsExactly(folder, inside[1])) problems.push(`${table}: ${uri} is not in the project folder under that exact name`);
      else {
        // The one library allowed outside lib/ is a footprint folder beside the project file,
        // which is taken as drawn for the project itself.
        const steps = inside[1].split(/[\\/]+/).filter(Boolean);
        const ownFootprints = table === "fp-lib-table" && steps.length === 1 && steps[0].endsWith(".pretty");
        if (steps[0] !== "lib" && !ownFootprints) problems.push(`${table}: ${uri} is not under lib/`);
        if (table === "fp-lib-table") footprintFolders.push(join(folder, inside[1]));
      }
    }
  }
  // A 3D model is the project's own, under ${KIPRJMOD} and present, or one of KiCad's stock models.
  const modelProblems = (text) => {
    const found = new Set();
    for (const [, path] of text.matchAll(/\(model\s+"((?:[^"\\]|\\.)*)"/g)) {
      const own = path.match(/^\$\{KIPRJMOD\}[\\/]+(.+)$/);
      if (own ? !existsExactly(folder, own[1]) : !/^\$\{(?:KICAD\d*_3DMODEL_DIR|KISYS3DMOD)\}/.test(path)) {
        found.add(isAbsolute(path) ? `an absolute path: ${path}` : own ? `a path that is not in the project folder under that exact name: ${path}` : `a path outside the project and KiCad's stock models: ${path}`);
      }
    }
    return found;
  };
  for (const problem of modelProblems(boardText || "")) problems.push(`the board names a 3D model by ${problem}`);
  for (const dir of footprintFolders) {
    if (!statSync(dir).isDirectory()) continue;
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".kicad_mod"))) {
      for (const problem of modelProblems(readFileSync(join(dir, f), "utf8"))) problems.push(`${basename(dir)}/${f} names a 3D model by ${problem}`);
    }
  }
  // Libraries no table names: a symbol file beside the project file, or a folder beside it
  // that holds a symbol file or a footprint folder.
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".kicad_sym")) problems.push(`symbol file ${entry.name} sits beside the project file, not under lib/`);
    if (!entry.isDirectory() || entry.name === "lib" || entry.name.startsWith(".") || entry.name.endsWith(".pretty")) continue;
    const holds = readdirSync(join(folder, entry.name));
    if (holds.some((f) => f.endsWith(".kicad_pro"))) continue; // Another board's folder.
    if (holds.some((f) => f.endsWith(".kicad_sym") || f.endsWith(".pretty"))) problems.push(`part folder ${entry.name} sits beside the project file, not under lib/`);
  }
  return { paths, problems };
}

// List every track narrower than the width its net class sets. KiCad's check has no such
// test, so KiCad is asked on a copy: one track width rule per net class, the class of
// highest priority last so it wins as it does in the editor. One more rule that every
// routed net breaks proves the rules were loaded, because KiCad drops a whole rules file
// it cannot read and then reports nothing.
function checkWidths(cli, folder, name, boardText, scratch) {
  const tracks = [...topLevelBlocks(boardText, "segment"), ...topLevelBlocks(boardText, "arc")];
  if (!tracks.length) return { ok: true, summary: "no tracks", details: [] };
  let project;
  try {
    project = JSON.parse(readFileSync(join(folder, `${name}.kicad_pro`), "utf8"));
  } catch (error) {
    return { ok: false, summary: `not run: the project file could not be read (${error.message})`, details: [] };
  }
  const classes = (project.net_settings?.classes || []).filter((c) => typeof c.track_width === "number" && c.track_width > 0);
  if (!classes.length) return { ok: false, summary: "not run: the project file sets no net class track width", details: [] };
  const unwritable = classes.filter((c) => /['"\\]/.test(c.name)).map((c) => c.name);
  if (unwritable.length) return { ok: false, summary: `not run: a rule cannot name the net class ${unwritable.join(", ")}`, details: [] };
  const rules = [...classes].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)).map((c) =>
    `(rule "${CLASS_RULE}${c.name}"\n\t(condition "A.hasNetclass('${c.name}')")\n\t(constraint track_width (min ${c.track_width}mm)))`);
  rules.push(`(rule "${PROOF_RULE}"\n\t(constraint length (min 100000mm)))`);
  const copy = join(scratch, "widths");
  mkdirSync(copy);
  const severities = (((project.board ||= {}).design_settings ||= {}).rule_severities ||= {});
  severities.track_width = "error";
  severities.length_out_of_range = "error";
  writeFileSync(join(copy, `${name}.kicad_pro`), JSON.stringify(project));
  writeFileSync(join(copy, `${name}.kicad_pcb`), boardText);
  const ownRules = join(folder, `${name}.kicad_dru`);
  const before = existsSync(ownRules) ? readFileSync(ownRules, "utf8").trimEnd() : "(version 1)";
  writeFileSync(join(copy, `${name}.kicad_dru`), `${before}\n${rules.join("\n")}\n`);
  const out = join(copy, "drc.json");
  const failure = run(cli, ["pcb", "drc", "--severity-all", "--format", "json", join(copy, `${name}.kicad_pcb`)], out);
  if (failure) return { ok: false, summary: `not run: kicad-cli could not check the copy (${failure})`, details: [] };
  const violations = JSON.parse(readFileSync(out, "utf8")).violations || [];
  if (!violations.some((v) => v.description.includes(PROOF_RULE))) {
    return { ok: false, summary: "not run: KiCad could not read the rules file, the project's own rules or the ones added here, so no custom rule was applied", details: [] };
  }
  const widthOf = new Map(tracks.map((t) => [(t.match(/\(uuid\s+"([^"]+)"\)/) || [])[1], (t.match(/\(width\s+([\d.]+)\)/) || [])[1]]));
  const details = [];
  for (const v of violations) {
    const rule = v.type === "track_width" && v.description.split(CLASS_RULE)[1];
    if (!rule) continue;
    const set = classes.filter((c) => rule.startsWith(`${c.name}'`)).sort((a, b) => b.name.length - a.name.length)[0];
    const item = (v.items || [])[0] || {};
    const at = item.pos ? ` at ${item.pos.x}, ${item.pos.y}` : "";
    details.push(`warning ${item.description || "track"}${at}: ${widthOf.get(item.uuid) || "?"} mm wide, class ${set?.name} sets ${set?.track_width} mm`);
  }
  return { narrow: details.length, summary: `${tracks.length} tracks, ${details.length} narrower than their net class${details.length ? ", each to match with its written reason" : ""}`, details };
}

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      cells.push(cell);
      cell = "";
    } else cell += c;
  }
  cells.push(cell);
  return cells;
}

function checkProject(projectFile, cli, options, scratch) {
  const folder = dirname(projectFile);
  const name = basename(projectFile, ".kicad_pro");
  const schematic = join(folder, `${name}.kicad_sch`);
  const board = join(folder, `${name}.kicad_pcb`);
  const results = new Map();
  const add = (key, ok, summary, details = []) => results.set(key, { check: key, ok, summary, details });
  const notRun = (keys, why) => keys.forEach((key) => add(key, false, `not run: ${why}`));

  if (!existsSync(schematic)) notRun(["erc", "supplier"], `no schematic named ${name}.kicad_sch beside the project file`);
  else {
    const out = join(scratch, "erc.json");
    const failure = run(cli, ["sch", "erc", "--severity-all", "--format", "json", schematic], out);
    if (failure) notRun(["erc"], `kicad-cli could not check the schematic (${failure})`);
    else {
      const report = JSON.parse(readFileSync(out, "utf8"));
      const { errors, warnings, summary } = bySeverity((report.sheets || []).flatMap((s) => s.violations || []));
      const off = ERC_KEYS.filter((key) => (report.ignored_checks || []).some((c) => c.key === key));
      if (off.length) add("erc", false, `the project ignores ${off.join(", ")}, so nothing vouches for those connections`, [...errors, ...warnings].map(describe));
      else add("erc", errors.length === 0 && (!options.strict || warnings.length === 0), summary, [...errors, ...warnings].map(describe));
    }
    if (!options.supplier) add("supplier", true, "skipped with --no-supplier");
    else {
      const bom = join(scratch, "bom.csv");
      const field = options.supplierField;
      const bomFailure = run(cli, ["sch", "export", "bom", "--fields", `Reference,Value,${field}`, "--labels", "Reference,Value,Supplier",
        "--exclude-dnp", schematic], bom);
      if (bomFailure) notRun(["supplier"], `kicad-cli could not export the bill of materials (${bomFailure})`);
      else {
        const rows = readFileSync(bom, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean).slice(1).map(parseCsvLine);
        const missing = rows.filter((r) => !(r[2] || "").trim()).map((r) => `${r[0]} (${r[1]})`);
        add("supplier", missing.length === 0,
          missing.length ? `${missing.length} of ${rows.length} parts in the bill have no "${field}"` : `${rows.length} parts in the bill, each with "${field}"`,
          missing);
      }
    }
  }

  const boardText = existsSync(board) ? readFileSync(board, "utf8") : null;
  const libraries = checkLibraries(folder, boardText);
  add("libraries", libraries.problems.length === 0,
    libraries.problems.length ? `${libraries.problems.length} library problems` : libraries.paths ? `${libraries.paths} library paths, each under \${KIPRJMOD} and present` : "no project library tables",
    libraries.problems);

  if (boardText === null) notRun(["drc", "routed", "parity", "outline", "zones", "widths"], `no board named ${name}.kicad_pcb beside the project file`);
  else {
    const out = join(scratch, "drc.json");
    const failure = run(cli, ["pcb", "drc", "--severity-all", "--schematic-parity", "--format", "json", board], out);
    if (failure) notRun(["drc", "routed", "parity", "outline"], `kicad-cli could not check the board (${failure})`);
    else {
      const report = JSON.parse(readFileSync(out, "utf8"));
      const violations = report.violations || [];
      const ignored = (report.ignored_checks || []).map((c) => c.key);
      const outline = violations.filter((v) => v.type === "invalid_outline");
      const { errors, warnings, summary } = bySeverity(violations.filter((v) => v.type !== "invalid_outline"));
      const off = (keys) => keys.filter((key) => ignored.includes(key));
      if (off(DRC_KEYS).length) add("drc", false, `the project ignores ${off(DRC_KEYS).join(", ")}, so nothing vouches for that copper`, [...errors, ...warnings].map(describe));
      else add("drc", errors.length === 0 && (!options.strict || warnings.length === 0), summary, [...errors, ...warnings].map(describe));
      const unconnected = report.unconnected_items || [];
      if (off(ROUTED_KEYS).length) add("routed", false, `the project ignores ${off(ROUTED_KEYS).join(", ")}, so nothing vouches for the routing`);
      else add("routed", unconnected.length === 0, `${unconnected.length} unconnected items`, unconnected.map(describe));
      const parity = report.schematic_parity || [];
      if (!existsSync(schematic)) add("parity", false, `not run: no schematic named ${name}.kicad_sch to compare the board with`);
      else if (off(PARITY_KEYS).length) add("parity", false, `the project ignores ${off(PARITY_KEYS).join(", ")}, so nothing vouches for parity`);
      else add("parity", parity.length === 0, `${parity.length} differences between board and schematic`, parity.map(describe));
      // No reported outline error is not proof of an outline: the project can switch that check off.
      if (ignored.includes("invalid_outline")) add("outline", false, "the project ignores the outline check, so nothing vouches for the outline");
      else if (outline.length) add("outline", false, outline[0].description);
      else if (!hasEdgeShapes(boardText)) add("outline", false, "no shape on Edge.Cuts");
      else add("outline", true, "closed outline on Edge.Cuts");
    }
    const zones = checkZones(boardText);
    add("zones", zones.problems.length === 0,
      zones.problems.length ? `${zones.problems.length} zone problems` : zones.copper ? `${zones.copper} copper ${zones.copper === 1 ? "zone, with" : "zones, each with"} a net and a saved fill` : "no copper zones",
      zones.problems);
    const widths = checkWidths(cli, folder, name, boardText, scratch);
    add("widths", widths.ok ?? (!options.strict || widths.narrow === 0), widths.summary, widths.details);
  }
  const checks = CHECKS.map((key) => results.get(key));
  return { project: projectFile, ok: checks.every((c) => c.ok), checks };
}

function main(json) {
  let parsed;
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: {
        "supplier-field": { type: "string", default: "LCSC Part" },
        "no-supplier": { type: "boolean", default: false },
        strict: { type: "boolean", default: false },
        json: { type: "boolean", default: false },
        "kicad-cli": { type: "string" },
        keep: { type: "boolean", default: false },
        help: { type: "boolean", default: false },
      },
    });
  } catch (error) {
    throw new Failure(2, `${error.message}. Run --help.`);
  }
  const { values, positionals } = parsed;
  if (values.help) {
    console.log(HELP);
    return 0;
  }
  if (positionals.length !== 1) throw new Failure(2, "Give one project: a .kicad_pro file or a folder. Run --help.");
  const projects = findProjects(positionals[0]);
  const cli = findKicadCli(values["kicad-cli"]);
  const scratch = mkdtempSync(join(tmpdir(), `${SKILL_NAME}-`));
  const options = { strict: values.strict, supplier: !values["no-supplier"], supplierField: values["supplier-field"] };
  let results;
  try {
    // Each project gets its own report folder, so two projects of one name never share a report.
    results = projects.map((p, i) => {
      const own = join(scratch, String(i + 1));
      mkdirSync(own);
      // kicad-cli may write the local settings file beside the project. Put it back as it was.
      const local = p.replace(/\.kicad_pro$/, ".kicad_prl");
      const before = existsSync(local) ? readFileSync(local) : null;
      try {
        return checkProject(p, cli.path, options, own);
      } finally {
        if (before === null) rmSync(local, { force: true });
        else if (!before.equals(readFileSync(local))) writeFileSync(local, before);
      }
    });
  } finally {
    if (!values.keep) rmSync(scratch, { recursive: true, force: true });
  }
  const ok = results.every((r) => r.ok);
  const warnings = results.flatMap((r) => r.checks).flatMap((c) => c.details).filter((d) => /^(warning|excluded) /.test(d)).length;
  if (json) {
    console.log(JSON.stringify({ ok, warnings, kicadCli: cli.path, kicadVersion: cli.version, reports: values.keep ? scratch : null, projects: results }, null, 2));
  } else {
    console.log(`kicad-cli ${cli.version} at ${cli.path}`);
    for (const result of results) {
      console.log(`\n${result.project}`);
      for (const c of result.checks) {
        console.log(`  ${c.ok ? "PASS" : "FAIL"}  ${c.check.padEnd(10)} ${c.summary}`);
        // Errors and warnings are cut separately, so a long list of one never hides the other.
        const isWarning = (line) => /^(warning|excluded) /.test(line);
        for (const group of [c.details.filter((d) => !isWarning(d)), c.details.filter(isWarning)]) {
          for (const line of group.slice(0, 20)) console.log(`          ${line}`);
          if (group.length > 20) console.log(`          and ${group.length - 20} more of these. --json prints the full list.`);
        }
      }
    }
    if (values.keep) console.log(`\nReports kept in ${scratch}`);
    const passed = warnings ? `OK: no check failed. ${warnings} warnings are listed above, each to classify.` : "OK: every check passed.";
    console.log(ok ? `\n${passed}` : "\nFAILED: fix the lines marked FAIL, then run again.");
  }
  return ok ? 0 : 1;
}

const wantsJson = process.argv.includes("--json");
try {
  process.exitCode = main(wantsJson);
} catch (error) {
  if (!(error instanceof Failure)) throw error;
  if (wantsJson) console.log(JSON.stringify({ ok: false, error: error.message }, null, 2));
  else console.error(`ERROR: ${error.message}`);
  process.exitCode = error.code;
}
