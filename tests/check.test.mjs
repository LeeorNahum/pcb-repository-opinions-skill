#!/usr/bin/env node
// Break-it tests for scripts/check.mjs. Each one copies a finished project, breaks the one
// thing a check names, and confirms that check fails. A check that still passes on its own
// broken subject proves nothing.
//
// Usage: node tests/check.test.mjs <finished-project-folder>
//
// The folder holds one .kicad_pro that passes every check, with imported parts under lib/
// and at least one track. It is copied to a temporary folder and never changed.

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CHECK = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts", "check.mjs");
const source = resolve(process.argv[2] || "");
if (!process.argv[2] || !existsSync(source)) {
  console.error("Usage: node tests/check.test.mjs <finished-project-folder>");
  process.exit(2);
}
const name = readdirSync(source).find((f) => f.endsWith(".kicad_pro"))?.replace(/\.kicad_pro$/, "");
if (!name) {
  console.error(`No .kicad_pro file in ${source}`);
  process.exit(2);
}

const scratch = mkdtempSync(join(tmpdir(), "check-test-"));
let copies = 0;
// A fresh copy as a clean clone would have it: no backups, locks, or local settings.
function copy(parent = join(scratch, String(++copies))) {
  const to = join(parent, name);
  cpSync(source, to, { recursive: true, filter: (from) => !/(-backups|\.lck|\.kicad_prl)$/.test(from) });
  return to;
}
const ignore = (kind, key) => (t) => {
  const project = JSON.parse(t);
  (kind === "erc" ? project.erc : project.board.design_settings).rule_severities[key] = "ignore";
  return JSON.stringify(project);
};
// Every schematic sheet of a copy, the root and each hierarchical sheet, outside the part libraries.
const sheetsOf = (folder) => readdirSync(folder, { recursive: true }).map(String).filter((p) => p.endsWith(".kicad_sch") && !/^lib[\\/]/.test(p));
const eachSheet = (folder, change) => sheetsOf(folder).forEach((p) => writeFileSync(join(folder, p), change(readFileSync(join(folder, p), "utf8"))));
const file = (folder, ext) => join(folder, ext.startsWith(".") ? `${name}${ext}` : ext);
const edit = (folder, ext, change) => writeFileSync(file(folder, ext), change(readFileSync(file(folder, ext), "utf8")));

function run(args) {
  const done = spawnSync(process.execPath, [CHECK, ...args], { encoding: "utf8" });
  let json = null;
  try {
    json = JSON.parse(done.stdout);
  } catch {
    // Not every run prints JSON.
  }
  return { code: done.status, json, out: done.stdout + done.stderr };
}
const check = (result, key, at = 0) => result.json.projects[at].checks.find((c) => c.check === key);
const failed = (result, at = 0) => result.json.projects[at].checks.filter((c) => !c.ok).map((c) => c.check);

// Remove every block that opens with "(name" and passes the test, at any depth.
function removeBlocks(text, blockName, test = () => true) {
  let out = "";
  let from = 0;
  const open = new RegExp(`\\(${blockName}(?=[\\s)])`, "g");
  for (let m; (m = open.exec(text)); ) {
    let depth = 0;
    let end = m.index;
    let inString = false;
    for (; end < text.length; end++) {
      const c = text[end];
      if (inString) {
        if (c === "\\") end++;
        else if (c === '"') inString = false;
      } else if (c === '"') inString = true;
      else if (c === "(") depth++;
      else if (c === ")" && --depth === 0) break;
    }
    if (test(text.slice(m.index, end + 1))) {
      out += text.slice(from, m.index);
      from = end + 1;
    }
    open.lastIndex = end + 1;
  }
  return out + text.slice(from);
}

function hashes(folder) {
  const out = {};
  for (const entry of readdirSync(folder, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const path = join(entry.parentPath, entry.name);
    out[path.slice(folder.length)] = createHash("sha1").update(readFileSync(path)).digest("hex");
  }
  return JSON.stringify(out, Object.keys(out).sort());
}

const results = [];
function test(title, body) {
  try {
    const problem = body();
    results.push([!problem, title, problem]);
  } catch (error) {
    results.push([false, title, error.message]);
  }
  const [ok, , problem] = results[results.length - 1];
  console.log(`${ok ? "PASS" : "FAIL"}  ${title}${ok ? "" : `: ${problem}`}`);
}
// A broken copy must fail the run and the check that names the defect.
function breaks(title, key, mutate, extra = () => null) {
  test(`${key}: ${title}`, () => {
    const folder = copy();
    mutate(folder);
    const result = run([folder, "--json"]);
    if (result.code !== 1) return `exit ${result.code}, expected 1`;
    if (check(result, key).ok) return `${key} still passes. Failed instead: ${failed(result).join(", ") || "nothing"}`;
    return extra(result);
  });
}

let firstPart = "";
test("a finished project passes, exits 0, and is left exactly as it was", () => {
  const folder = copy();
  const before = hashes(folder);
  const result = run([folder, "--json"]);
  if (result.code !== 0) return `exit ${result.code}: ${failed(result).join(", ")} failed`;
  if (hashes(folder) !== before) return "the check changed or added a file in the project";
  firstPart = existsSync(join(folder, "lib")) ? readdirSync(join(folder, "lib"))[0] : "";
  if (!firstPart) return "the project has no part folder under lib/, so the library tests cannot run";
  return null;
});
test("a project with local settings gets them back byte for byte", () => {
  const folder = copy();
  // Valid settings that KiCad would rewrite in its own form if it saved them.
  writeFileSync(file(folder, ".kicad_prl"), '{"meta":{"filename":"x.kicad_prl","version":5}}');
  const before = hashes(folder);
  const result = run([folder, "--json"]);
  if (result.code !== 0 || result.json.projects[0].checks.length !== 9) return `the check did not run to the end: exit ${result.code}`;
  return hashes(folder) === before ? null : "the check changed a file in the project";
});

breaks("every wire removed from every sheet", "erc", (f) => eachSheet(f, (t) => removeBlocks(t, "wire")));
breaks("a 10 mm minimum clearance in the project", "drc", (f) => edit(f, ".kicad_pro", (t) => {
  const project = JSON.parse(t);
  project.board.design_settings.rules.min_clearance = 10;
  return JSON.stringify(project);
}));
breaks("the pin connection check switched off", "erc", (f) => edit(f, ".kicad_pro", ignore("erc", "pin_not_connected")));
breaks("the clearance check switched off", "drc", (f) => edit(f, ".kicad_pro", ignore("drc", "clearance")));
breaks("every track removed", "routed", (f) => edit(f, ".kicad_pcb", (t) => removeBlocks(removeBlocks(t, "segment"), "arc")));
breaks("one footprint removed from the board", "parity", (f) => edit(f, ".kicad_pcb", (t) => {
  // A footprint drawn on the board alone, such as a panel hole, has no symbol to differ from.
  let done = false;
  return removeBlocks(t, "footprint", (block) => !done && /\(path "/.test(block) && (done = true));
}));
breaks("every shape removed from Edge.Cuts", "outline", (f) => edit(f, ".kicad_pcb", (t) =>
  ["gr_line", "gr_rect", "gr_arc", "gr_circle", "gr_poly", "gr_curve"].reduce((text, kind) => removeBlocks(text, kind, (b) => b.includes('"Edge.Cuts"')), t)));
breaks("the saved zone fills removed", "zones", (f) => edit(f, ".kicad_pcb", (t) => removeBlocks(t, "filled_polygon")));
// Blank the "LCSC Part" field of placed symbols whose footprint passes the test, in every sheet of the copy,
// up to the limit. Returns the references blanked.
function blankSupplier(folder, limit = Infinity, test = () => true) {
  const blanked = [];
  for (const entry of sheetsOf(folder)) {
    const path = join(folder, entry);
    const text = readFileSync(path, "utf8");
    let out = "";
    let from = 0;
    const open = /\(symbol\s+\(lib_id "/g;
    for (let m; (m = open.exec(text)); ) {
      let depth = 0;
      let end = m.index;
      for (let inString = false; end < text.length; end++) {
        const c = text[end];
        if (inString) {
          if (c === "\\") end++;
          else if (c === '"') inString = false;
        } else if (c === '"') inString = true;
        else if (c === "(") depth++;
        else if (c === ")" && --depth === 0) break;
      }
      const block = text.slice(m.index, end + 1);
      const footprint = (block.match(/\(property "Footprint" "([^"]*)"/) || [])[1] || "";
      if (blanked.length < limit && test(footprint) && /\(property "LCSC Part" "[^"]+"/.test(block)) {
        out += text.slice(from, m.index) + block.replace(/\(property "LCSC Part" "[^"]*"/, '(property "LCSC Part" ""');
        from = end + 1;
        blanked.push((block.match(/\(property "Reference" "([^"]*)"/) || [])[1]);
      }
      open.lastIndex = end + 1;
    }
    writeFileSync(path, out + text.slice(from));
  }
  return blanked;
}

breaks("every supplier number blanked", "supplier", (f) => blankSupplier(f));
let blankedPart = "";
breaks("the supplier number blanked on one part", "supplier", (f) => {
  [blankedPart] = blankSupplier(f, 1);
  if (!blankedPart) throw new Error("no part has a supplier number to blank");
}, (r) => (check(r, "supplier").details.some((d) => d.startsWith(`${blankedPart} (`)) ? null : `${blankedPart} is not named as missing its number`));
let blankedPassive = "";
breaks("the supplier number blanked on one stock resistor or capacitor", "supplier", (f) => {
  [blankedPassive] = blankSupplier(f, 1, (footprint) => /^(Resistor|Capacitor)_/.test(footprint));
  if (!blankedPassive) throw new Error("no stock resistor or capacitor has a supplier number to blank");
}, (r) => (check(r, "supplier").details.some((d) => d.startsWith(`${blankedPassive} (`)) ? null : `${blankedPassive} is not named as missing its number`));

breaks("a table path made absolute", "libraries", (f) => edit(f, "sym-lib-table", (t) => t.replace("${KIPRJMOD}", f.replace(/\\/g, "/"))),
  (r) => (check(r, "erc").ok ? null : "erc failed too, so the absolute path did not resolve and the test proves less than it claims"));
breaks("a table path in the wrong letter case", "libraries", (f) => edit(f, "fp-lib-table", (t) => t.replace(`/lib/${firstPart}/`, `/LIB/${firstPart}/`)));
breaks("a table path to a folder that is not there", "libraries", (f) => edit(f, "fp-lib-table", (t) => t.replace(`/lib/${firstPart}/`, `/lib/${firstPart}-gone/`)));
breaks("a part folder moved out of lib/", "libraries", (f) => {
  renameSync(join(f, "lib", firstPart), join(f, firstPart));
  for (const table of ["sym-lib-table", "fp-lib-table"]) edit(f, table, (t) => t.replaceAll(`/lib/${firstPart}/`, `/${firstPart}/`));
}, (r) => (check(r, "libraries").details.some((d) => d.includes("not under lib/")) ? null : "the part folder was not named"));
breaks("a symbol file loose beside the project file", "libraries", (f) => writeFileSync(join(f, "Loose.kicad_sym"), "(kicad_symbol_lib)"));
breaks("a part registered from a nested folder outside lib/", "libraries", (f) => {
  mkdirSync(join(f, "parts"));
  renameSync(join(f, "lib", firstPart), join(f, "parts", firstPart));
  for (const table of ["sym-lib-table", "fp-lib-table"]) edit(f, table, (t) => t.replaceAll(`/lib/${firstPart}/`, `/parts/${firstPart}/`));
}, (r) => (check(r, "libraries").details.some((d) => d.includes("is not under lib/")) ? null : "the table path was not named"));
breaks("a 3D model the project does not hold", "libraries", (f) => edit(f, ".kicad_pcb", (t) => t.replace(/\(model "\$\{KIPRJMOD\}\/lib\//, '(model "${KIPRJMOD}/lib/gone/')));
breaks("a 3D model under a variable only one machine sets", "libraries", (f) => edit(f, ".kicad_pcb", (t) => t.replace(/\(model "\$\{KIPRJMOD\}/, '(model "${SOMEONE_MODELS}')));
breaks("a 3D model named by an absolute path", "libraries", (f) => edit(f, ".kicad_pcb", (t) => t.replace(/\(model "\$\{KIPRJMOD\}/, '(model "C:/Users/someone')));

test("widths: a narrowed track is listed with its own net and class, and fails the run only with --strict", () => {
  const folder = copy();
  // A width no other track has, thinner than any net class and above the usual fabricator floor, so the design rules check stays quiet.
  let net = "";
  edit(folder, ".kicad_pcb", (t) => t.replace(/(\(segment[^]*?\(width )[\d.]+([^]*?\(net (?:\d+ )?"([^"]*)"\))/, (all, head, tail, name) => {
    net = name;
    return `${head}0.101${tail}`;
  }));
  // The class the project file gives that net by an exact name, or the default class.
  const settings = JSON.parse(readFileSync(file(folder, ".kicad_pro"), "utf8")).net_settings;
  const named = (settings.netclass_patterns || []).find((p) => p.pattern === net);
  const expected = settings.classes.find((c) => c.name === (named ? named.netclass : "Default"));
  const plain = run([folder, "--json"]);
  const mine = check(plain, "widths").details.filter((d) => d.includes(": 0.101 mm wide, "));
  if (mine.length !== 1) return `${mine.length} lines name the narrowed track, expected 1`;
  if (!mine[0].includes(`[${net}]`)) return `the line does not name the net ${net}: ${mine[0]}`;
  if (!mine[0].endsWith(`class ${expected.name} sets ${expected.track_width} mm`)) return `the line does not name class ${expected.name} at ${expected.track_width} mm: ${mine[0]}`;
  if (!check(plain, "widths").ok || plain.code !== 0) return "the narrowed track failed the run without --strict";
  if (!check(plain, "drc").ok) return "the design rules check failed too, so the test proves less than it claims";
  const strict = run([folder, "--json", "--strict"]);
  return check(strict, "widths").ok || strict.code !== 1 ? "widths passed with --strict" : null;
});
breaks("a rules file KiCad cannot read", "widths", (f) => {
  const rules = file(f, ".kicad_dru");
  const before = existsSync(rules) ? readFileSync(rules, "utf8") : "(version 1)\n";
  writeFileSync(rules, `${before}\n(rule "unreadable"\n\t(condition "A.noSuchFunction()")\n\t(constraint track_width (min 0.1mm)))\n`);
});

test("two projects of one name, one with no schematic: exit 1, and the whole one still passes", () => {
  const parent = join(scratch, "pair");
  mkdirSync(join(parent, "a"), { recursive: true });
  mkdirSync(join(parent, "b"));
  copy(join(parent, "a"));
  rmSync(file(copy(join(parent, "b")), ".kicad_sch"));
  // Each project sits one level down, in a folder that holds several projects.
  renameSync(join(parent, "a", name), join(parent, "whole"));
  renameSync(join(parent, "b", name), join(parent, "broken"));
  rmSync(join(parent, "a"), { recursive: true });
  rmSync(join(parent, "b"), { recursive: true });
  const result = run([parent, "--json"]);
  if (result.code !== 1) return `exit ${result.code}, expected 1`;
  const whole = result.json.projects.findIndex((p) => p.project.includes("whole"));
  if (failed(result, whole).length) return `the whole project failed ${failed(result, whole).join(", ")}`;
  return failed(result, 1 - whole).includes("erc") ? null : "the project with no schematic passed erc";
});
test("a missing path exits 2", () => (run([join(scratch, "nowhere")]).code === 2 ? null : "wrong exit code"));
test("a kicad-cli that does not exist exits 3", () => (run([copy(), "--kicad-cli", join(scratch, "no-kicad-cli")]).code === 3 ? null : "wrong exit code"));
test("--help exits 0 and names every check", () => {
  const help = run(["--help"]);
  if (help.code !== 0) return `exit ${help.code}`;
  const missing = ["erc", "drc", "routed", "parity", "outline", "zones", "widths", "libraries", "supplier"].filter((key) => !new RegExp(`^  ${key}\\s`, "m").test(help.out));
  return missing.length ? `no help row for ${missing.join(", ")}` : null;
});

rmSync(scratch, { recursive: true, force: true });
const bad = results.filter(([ok]) => !ok).length;
console.log(bad ? `\n${bad} of ${results.length} tests failed.` : `\nAll ${results.length} tests passed.`);
process.exit(bad ? 1 : 0);
