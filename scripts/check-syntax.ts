/**
 * check-syntax.ts — run with: bun scripts/check-syntax.ts
 *
 * Verifies every source file in this build parses as TypeScript/TSX,
 * using Bun's transpiler (no module resolution — react and three are
 * externals of the host app, so they are NOT installed here and must
 * NOT be resolved). Also checks that every import is either a relative
 * path that exists on disk or one of the declared externals.
 *
 * Exit 0 when every file parses and every import resolves; exit 1 otherwise.
 */

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const EXTERNALS = new Set(["react", "react/jsx-dev-runtime", "three"]);
const transpiler = new Bun.Transpiler({ loader: "tsx" });

function collect(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collect(p));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(p);
  }
  return out;
}

let failures = 0;
const files = collect(join(ROOT, "src"));
console.log(`Checking ${files.length} source files under src/`);

for (const file of files) {
  const rel = file.slice(ROOT.length + 1);
  const code = readFileSync(file, "utf8");
  try {
    transpiler.transformSync(code);
    console.log(`[PASS] parses — ${rel}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message.split("\n").slice(0, 3).join(" ") : String(e);
    console.log(`[FAIL] parse — ${rel}: ${msg}`);
    failures += 1;
    continue;
  }
  // Import check: relative imports must exist; bare imports must be externals.
  const importRe = /(?:from\s+["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\))/g;
  let m: RegExpExecArray | null;
  while ((m = importRe.exec(code)) !== null) {
    const spec = m[1] ?? m[2];
    if (spec.startsWith(".")) {
      const base = resolve(dirname(file), spec);
      const ok =
        existsSync(base) ||
        existsSync(base + ".ts") ||
        existsSync(base + ".tsx") ||
        existsSync(join(base, "index.ts")) ||
        existsSync(join(base, "index.tsx"));
      if (!ok) {
        console.log(`[FAIL] import — ${rel}: cannot resolve "${spec}"`);
        failures += 1;
      }
    } else if (!EXTERNALS.has(spec)) {
      console.log(`[FAIL] import — ${rel}: bare import "${spec}" is not a declared external`);
      failures += 1;
    }
  }
}

console.log("");
if (failures === 0) {
  console.log("SYNTAX OK — all files parse; all imports resolve to local files or declared externals (react, three).");
  process.exit(0);
} else {
  console.log(`SYNTAX FAILED — ${failures} problem(s).`);
  process.exit(1);
}
