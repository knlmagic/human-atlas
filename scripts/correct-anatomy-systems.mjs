/**
 * Correct known BodyParts3D display-system mapping errors.
 *
 * Usage:
 *   node scripts/correct-anatomy-systems.mjs [atlas.json]
 *
 * The original system-map inputs are unavailable, so this checked-in repair
 * keeps generated atlas updates deterministic and reviewable.
 */
import fs from 'node:fs';
import process from 'node:process';
import {ANATOMY_SYSTEM_CORRECTIONS} from './anatomy-system-corrections.mjs';

const atlasPath = process.argv[2] ?? new URL('../public/models/atlas.json', import.meta.url);

try {
 const atlas = JSON.parse(fs.readFileSync(atlasPath, 'utf8'));
 const parts = new Map(atlas.parts.map(part => [part.id, part]));
 for (const [partId, correction] of ANATOMY_SYSTEM_CORRECTIONS) {
  const part = parts.get(partId);
  if (!part) throw new Error(`Atlas is missing expected part ${partId}`);
  if (part.name !== correction.name) {
   throw new Error(`${partId} is ${part.name}, expected ${correction.name}`);
  }
  part.system = correction.system;
 }
 fs.writeFileSync(atlasPath, JSON.stringify(atlas));
 console.log(`Corrected display systems for ${ANATOMY_SYSTEM_CORRECTIONS.size} atlas parts.`);
} catch (error) {
 console.error(`Unable to correct atlas systems: ${error instanceof Error ? error.message : error}`);
 process.exitCode = 1;
}
