/**
 * Append registered historical muscles to the optimized BodyParts3D 4.0 atlas.
 *
 * Usage:
 *   node scripts/augment-missing-muscles.mjs
 *
 * Existing body chunks are never rewritten. The four meshes are simplified,
 * normalised, packed into one new chunk, gzipped, and mapped to FMA concepts.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {MeshoptSimplifier} from 'meshoptimizer';

await MeshoptSimplifier.ready;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modelDirectory = path.join(root, 'public/models');
const atlasPath = process.argv[2] ?? path.join(modelDirectory, 'atlas.json');
const sourceDirectory = process.argv[3] ??
 path.join(root, 'assets/anatomy/bodyparts3d-3.0/registered');
const additions = [
 {
  sourceId: 'FMA13358',
  partId: 'BP3D3-FMA13358',
  conceptId: 'FMA13358',
  name: 'Right latissimus dorsi',
 },
 {
  sourceId: 'FMA13359',
  partId: 'BP3D3-FMA13359',
  conceptId: 'FMA13359',
  name: 'Left latissimus dorsi',
 },
 {
  sourceId: 'FMA13377',
  partId: 'BP3D3-FMA13377',
  conceptId: 'FMA13377',
  name: 'Right rectus abdominis',
 },
 {
  sourceId: 'FMA13378',
  partId: 'BP3D3-FMA13378',
  conceptId: 'FMA13378',
  name: 'Left rectus abdominis',
 },
];
const concepts = [
 {id: 'FMA13357', name: 'Latissimus dorsi', elements: ['BP3D3-FMA13358', 'BP3D3-FMA13359']},
 {id: 'FMA13358', name: 'Right latissimus dorsi', elements: ['BP3D3-FMA13358']},
 {id: 'FMA13359', name: 'Left latissimus dorsi', elements: ['BP3D3-FMA13359']},
 {id: 'FMA9628', name: 'Rectus abdominis', elements: ['BP3D3-FMA13377', 'BP3D3-FMA13378']},
 {id: 'FMA13377', name: 'Right rectus abdominis', elements: ['BP3D3-FMA13377']},
 {id: 'FMA13378', name: 'Left rectus abdominis', elements: ['BP3D3-FMA13378']},
];

function parseObj(filename) {
 const positions = [];
 const indices = [];
 const lines = fs.readFileSync(filename, 'utf8').split(/\r?\n/);
 for (const line of lines) {
  if (line.startsWith('v ')) {
   const values = line.trim().split(/\s+/).slice(1, 4).map(Number);
   if (values.length !== 3 || values.some(value => !Number.isFinite(value))) {
    throw new Error(`Invalid vertex in ${filename}`);
   }
   positions.push(...values);
  } else if (line.startsWith('f ')) {
   const face = line.trim().split(/\s+/).slice(1).map(value => {
    const index = Number(value.split('/')[0]);
    if (!Number.isInteger(index) || index <= 0) {
     throw new Error(`Unsupported face index in ${filename}`);
    }
    return index - 1;
   });
   for (let index = 1; index < face.length - 1; index += 1) {
    indices.push(face[0], face[index], face[index + 1]);
   }
  }
 }
 if (!positions.length || !indices.length) {
  throw new Error(`No mesh geometry found in ${filename}`);
 }
 let maximumIndex = -1;
 for (const index of indices) maximumIndex = Math.max(maximumIndex, index);
 if (maximumIndex >= positions.length / 3) {
  throw new Error(`Face index exceeds vertex count in ${filename}`);
 }
 return {
  positions: new Float32Array(positions),
  indices: new Uint32Array(indices),
 };
}

function compactMesh(positions, indices) {
 const target = Math.max(96, Math.floor(indices.length * 0.22 / 3) * 3);
 const [simplified, error] = MeshoptSimplifier.simplify(
  indices,
  positions,
  3,
  Math.min(indices.length, target),
  0.002,
 );
 const [remap, vertexCount] = MeshoptSimplifier.compactMesh(simplified);
 const compactPositions = new Float32Array(vertexCount * 3);
 for (let oldIndex = 0; oldIndex < remap.length; oldIndex += 1) {
  const newIndex = remap[oldIndex];
  if (newIndex !== 0xffffffff) {
   compactPositions.set(
    positions.subarray(oldIndex * 3, oldIndex * 3 + 3),
    newIndex * 3,
   );
  }
 }
 return {positions: compactPositions, indices: simplified, error};
}

function calculateNormals(positions, indices) {
 const sums = new Float64Array(positions.length);
 for (let offset = 0; offset < indices.length; offset += 3) {
  const first = indices[offset] * 3;
  const second = indices[offset + 1] * 3;
  const third = indices[offset + 2] * 3;
  const abx = positions[second] - positions[first];
  const aby = positions[second + 1] - positions[first + 1];
  const abz = positions[second + 2] - positions[first + 2];
  const acx = positions[third] - positions[first];
  const acy = positions[third + 1] - positions[first + 1];
  const acz = positions[third + 2] - positions[first + 2];
  const normal = [
   aby * acz - abz * acy,
   abz * acx - abx * acz,
   abx * acy - aby * acx,
  ];
  for (const vertex of [first, second, third]) {
   sums[vertex] += normal[0];
   sums[vertex + 1] += normal[1];
   sums[vertex + 2] += normal[2];
  }
 }
 const normals = new Int16Array(positions.length);
 for (let offset = 0; offset < sums.length; offset += 3) {
  const length = Math.hypot(sums[offset], sums[offset + 1], sums[offset + 2]) || 1;
  normals[offset] = Math.round(sums[offset] / length * 32767);
  normals[offset + 1] = Math.round(sums[offset + 1] / length * 32767);
  normals[offset + 2] = Math.round(sums[offset + 2] / length * 32767);
 }
 return normals;
}

function calculateBounds(positions) {
 const minimum = [Infinity, Infinity, Infinity];
 const maximum = [-Infinity, -Infinity, -Infinity];
 for (let offset = 0; offset < positions.length; offset += 3) {
  for (let axis = 0; axis < 3; axis += 1) {
   minimum[axis] = Math.min(minimum[axis], positions[offset + axis]);
   maximum[axis] = Math.max(maximum[axis], positions[offset + axis]);
  }
 }
 return [minimum, maximum];
}

function appendAligned(segments, state, typedArray) {
 const padding = (4 - state.bytes % 4) % 4;
 if (padding) {
  segments.push(Buffer.alloc(padding));
  state.bytes += padding;
 }
 const offset = state.bytes;
 const data = Buffer.from(
  typedArray.buffer,
  typedArray.byteOffset,
  typedArray.byteLength,
 );
 segments.push(data);
 state.bytes += data.length;
 return offset;
}

function run() {
 const manifest = JSON.parse(fs.readFileSync(atlasPath, 'utf8'));
 const existingPartIds = new Set(manifest.parts.map(part => part.id));
 const existingConceptIds = new Set(manifest.concepts.map(concept => concept.id));
 const duplicatePart = additions.find(addition => existingPartIds.has(addition.partId));
 const duplicateConcept = concepts.find(concept => existingConceptIds.has(concept.id));
 if (duplicatePart || duplicateConcept) {
  throw new Error(
   'Atlas already contains the historical muscle augmentation; restore the base atlas before rebuilding.',
  );
 }

 const chunkIndex = manifest.chunks.length;
 const chunkName = `body-${chunkIndex}.bin`;
 const chunkPath = path.join(modelDirectory, chunkName);
 if (fs.existsSync(chunkPath) || fs.existsSync(`${chunkPath}.gz`)) {
  throw new Error(`Refusing to overwrite existing chunk ${chunkName}`);
 }

 const segments = [];
 const state = {bytes: 0};
 let sourceTriangles = 0;
 let optimizedTriangles = 0;
 let maximumError = 0;
 const parts = [];
 for (const addition of additions) {
  const filename = path.join(sourceDirectory, `${addition.sourceId}.obj`);
  const source = parseObj(filename);
  sourceTriangles += source.indices.length / 3;
  const optimized = compactMesh(source.positions, source.indices);
  const normals = calculateNormals(optimized.positions, optimized.indices);
  maximumError = Math.max(maximumError, optimized.error);
  optimizedTriangles += optimized.indices.length / 3;
  const positionsOffset = appendAligned(segments, state, optimized.positions);
  const normalsOffset = appendAligned(segments, state, normals);
  const indicesOffset = appendAligned(segments, state, optimized.indices);
  parts.push({
   id: addition.partId,
   name: addition.name,
   conceptId: addition.conceptId,
   system: 'muscular',
   chunk: chunkIndex,
   positions: positionsOffset,
   normals: normalsOffset,
   indices: indicesOffset,
   vertexCount: optimized.positions.length / 3,
   indexCount: optimized.indices.length,
   bounds: calculateBounds(optimized.positions),
  });
 }

 const chunk = Buffer.concat(segments);
 const compressed = zlib.gzipSync(chunk, {level: 9, mtime: 0});
 fs.writeFileSync(chunkPath, chunk);
 fs.writeFileSync(`${chunkPath}.gz`, compressed);
 manifest.parts.push(...parts);
 manifest.concepts.push(...concepts);
 manifest.chunks.push({
  url: `/models/${chunkName}`,
  bytes: chunk.length,
  gzip: `/models/${chunkName}.gz`,
  gzipBytes: compressed.length,
 });
 manifest.sourceTriangles = (manifest.sourceTriangles ?? manifest.triangles) + sourceTriangles;
 manifest.triangles += optimizedTriangles;
 if (manifest.optimized) {
  manifest.optimized.preservedMeshes = manifest.parts.length;
 }
 manifest.historicalMuscleAddition = {
  source: 'BodyParts3D 3.0 obj_99',
  license: 'CC BY-SA 2.1 Japan',
  registration: '/assets/anatomy/bodyparts3d-3.0/registered/registration.json',
  parts: parts.map(part => part.id),
 };
 fs.writeFileSync(atlasPath, JSON.stringify(manifest));
 console.log(JSON.stringify({
  parts: parts.length,
  sourceTriangles,
  optimizedTriangles,
  bytes: chunk.length,
  gzipBytes: compressed.length,
  maximumError,
 }, null, 2));
}

try {
 run();
} catch (error) {
 console.error(`Unable to augment atlas: ${error instanceof Error ? error.message : error}`);
 process.exitCode = 1;
}
