/**
 * Smoke checks for critical pure helpers + HTTP health (no browser).
 * Run: node scripts/smoke-checks.mjs
 * Optional: SMOKE_BASE=https://www.aupairly.me node scripts/smoke-checks.mjs
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function runTs(code) {
  const r = spawnSync("npx", ["tsx", "-e", code], {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  });
  if (r.status !== 0) {
    console.error(r.stdout, r.stderr);
    throw new Error("tsx failed");
  }
  return r.stdout.trim();
}

// Publish gate
{
  const out = runTs(`
    import { canPublishActive, marketplaceReady } from "./src/lib/gates.ts";
    const incomplete = canPublishActive({
      role: "AUPAIR",
      headline: "Hi",
      bio: "short",
      city: "",
      country: "",
    });
    const complete = canPublishActive({
      role: "AUPAIR",
      image: "https://x/y.jpg",
      headline: "Experienced sitter in Cape Town",
      bio: "I have five years of childcare experience with infants and school-age kids. First aid certified.",
      city: "Cape Town",
      country: "South Africa",
      languages: '["English"]',
      services: '["CHILDCARE"]',
      experienceYears: 5,
      status: "DRAFT",
    });
    console.log(JSON.stringify({ incompleteOk: incomplete.ok, completeOk: complete.ok, percent: complete.percent }));
  `);
  const j = JSON.parse(out);
  assert.equal(j.incompleteOk, false);
  assert.equal(j.completeOk, true);
  console.log("✓ publish gate");
}

// Matching
{
  const out = runTs(`
    import { computeCompatibility } from "./src/lib/matching.ts";
    const r = computeCompatibility(
      { role: "PARENT", city: "Cape Town", country: "South Africa", languages: '["English"]', services: '["CHILDCARE"]', startDate: new Date().toISOString(), pocketMoney: 4000 },
      { role: "AUPAIR", city: "Cape Town", country: "South Africa", languages: '["English","Afrikaans"]', services: '["CHILDCARE"]', availableFrom: new Date().toISOString(), pocketMoneyMin: 3500 }
    );
    console.log(JSON.stringify({ score: r.score, reasons: r.reasons }));
  `);
  const j = JSON.parse(out);
  assert.ok(j.score >= 50, "same-city match should score well");
  assert.ok(j.reasons.some((x) => /Cape Town|city|language|service/i.test(x)));
  console.log("✓ matching reasons");
}

// House swap date overlap
{
  const out = runTs(`
    import { dateRangesOverlap } from "./src/lib/house-swap-match.ts";
    const ok = dateRangesOverlap("2026-07-01", "2026-07-20", "2026-07-10", "2026-07-30");
    const no = dateRangesOverlap("2026-01-01", "2026-01-10", "2026-02-01", "2026-02-10");
    console.log(JSON.stringify({ ok, no }));
  `);
  const j = JSON.parse(out);
  assert.equal(j.ok, true);
  assert.equal(j.no, false);
  console.log("✓ swap date overlap");
}

// Optional live health
const base = process.env.SMOKE_BASE;
if (base) {
  const url = base.replace(/\/$/, "") + "/api/health";
  const res = await fetch(url);
  assert.ok(res.ok, `health ${url} -> ${res.status}`);
  console.log("✓ health", url);
} else {
  console.log("· skip live health (set SMOKE_BASE to enable)");
}

console.log("\nAll smoke checks passed.");
