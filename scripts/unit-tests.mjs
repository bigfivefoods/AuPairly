/**
 * Lightweight unit tests (no DB) — run with: node scripts/unit-tests.mjs
 * Uses tsx to import TypeScript modules.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function runTs(code) {
  const r = spawnSync(
    "npx",
    ["tsx", "-e", code],
    { cwd: root, encoding: "utf8", env: process.env }
  );
  if (r.status !== 0) {
    console.error(r.stdout, r.stderr);
    throw new Error("tsx failed");
  }
  return r.stdout.trim();
}

// --- services ---
{
  const out = runTs(`
    import { parseServices, isServiceId, serviceFromParam, serializeServices } from "./src/lib/services.ts";
    console.log(JSON.stringify({
      parse: parseServices('["CHILDCARE","PET_SITTING"]'),
      is: isServiceId("CAREGIVING"),
      bad: isServiceId("YOGA"),
      slug: serviceFromParam("house-sitting"),
      ser: serializeServices(["CHILDCARE"]),
    }));
  `);
  const j = JSON.parse(out);
  assert.deepEqual(j.parse, ["CHILDCARE", "PET_SITTING"]);
  assert.equal(j.is, true);
  assert.equal(j.bad, false);
  assert.equal(j.slug, "HOUSE_SITTING");
  assert.equal(j.ser, '["CHILDCARE"]');
  console.log("ok services");
}

// --- completeness + gates ---
{
  const out = runTs(`
    import { computeCompleteness } from "./src/lib/completeness.ts";
    import { marketplaceReady, MIN_DISCOVER_PERCENT } from "./src/lib/gates.ts";
    const incomplete = computeCompleteness({ role: "AUPAIR", name: "A" });
    const ready = marketplaceReady({
      role: "AUPAIR",
      image: "https://x/y.jpg",
      headline: "Experienced sitter for kids and pets",
      bio: "I have years of experience with children of all ages and love animals. Available for live-in or drop-in care worldwide. First aid and driving ready.",
      city: "Cape Town",
      country: "South Africa",
      languages: '["English","Afrikaans"]',
      services: '["CHILDCARE","PET_SITTING"]',
      status: "ACTIVE",
      isVerified: true,
      experienceYears: 3,
      pocketMoneyMin: 200,
      availableFrom: new Date(),
      workRights: "CITIZEN",
      videoIntroUrl: "https://example.com/v.mp4",
      photos: '["https://x/1.jpg"]',
      referenceCount: 1,
      documentCount: 1,
      drivingLicense: true,
      firstAid: true,
    });
    console.log(JSON.stringify({
      incompletePct: incomplete.percent,
      min: MIN_DISCOVER_PERCENT,
      readyOk: ready.ok,
      readyPct: ready.percent,
    }));
  `);
  const j = JSON.parse(out);
  assert.ok(j.incompletePct < 50, "empty profile should be low");
  assert.equal(j.min, 70);
  assert.equal(j.readyOk, true, "full profile should pass gate");
  console.log("ok completeness/gates");
}

// --- matching shared services ---
{
  const out = runTs(`
    import { computeCompatibility } from "./src/lib/matching.ts";
    const r = computeCompatibility(
      { role: "PARENT", city: "Cape Town", country: "South Africa", services: '["PET_SITTING"]', languages: '["English"]' },
      { role: "AUPAIR", city: "Cape Town", country: "South Africa", services: '["PET_SITTING","CHILDCARE"]', languages: '["English"]' }
    );
    console.log(JSON.stringify({ score: r.score, reasons: r.reasons }));
  `);
  const j = JSON.parse(out);
  assert.ok(j.score > 40, "shared city+service should score well");
  assert.ok(j.reasons.some((x) => /pet sitting|Shared services/i.test(x)));
  console.log("ok matching");
}

console.log("\nAll unit tests passed.");
