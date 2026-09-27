// Derive the season numbers used by app/data.js from the raw NASA POWER climatology JSON in data/climate/.
// Usage: node tools/climate-summary.mjs   (prints JSON; tests/static-checks.mjs compares it with app/data.js)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "climate");
const SEASONS = { autumn: ["SEP", "OCT", "NOV"], winter: ["DEC", "JAN", "FEB"] };
const r1 = (x) => Math.round(x * 10) / 10;
export function climateSummary() {
  const out = {};
  for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort()) {
    const j = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
    const p = j.properties.parameter;
    const id = f.replace(/\.json$/, "");
    const rec = { elev: Math.round(j.geometry.coordinates[2]) };
    for (const [s, ms] of Object.entries(SEASONS)) {
      const avg = (k) => ms.reduce((a, m) => a + p[k][m], 0) / 3;
      rec[s] = {
        t: r1(avg("T2M")),
        rh: Math.round(avg("RH2M")),
        pr: r1(avg("PRECTOTCORR")),
        months: ms.map((m) => r1(p.T2M[m])),
      };
    }
    out[id] = rec;
  }
  return out;
}
if (process.argv[1] && process.argv[1].endsWith("climate-summary.mjs")) {
  console.log(JSON.stringify(climateSummary()));
}
