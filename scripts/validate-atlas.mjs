import fs from 'node:fs';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import {ANATOMY_SYSTEM_CORRECTIONS} from './anatomy-system-corrections.mjs';

const filename=process.argv[2]??'atlas.json';
const base=new URL('../public/models/',import.meta.url),atlas=JSON.parse(fs.readFileSync(new URL(filename,base)));
const basePartCount=2234,baseConceptCount=3432;
const historicalParts=new Map([
 ['BP3D3-FMA13358',{name:'Right latissimus dorsi',conceptId:'FMA13358',side:'right',region:'back'}],
 ['BP3D3-FMA13359',{name:'Left latissimus dorsi',conceptId:'FMA13359',side:'left',region:'back'}],
 ['BP3D3-FMA13377',{name:'Right rectus abdominis',conceptId:'FMA13377',side:'right',region:'front'}],
 ['BP3D3-FMA13378',{name:'Left rectus abdominis',conceptId:'FMA13378',side:'left',region:'front'}],
]);
const historicalConcepts=['FMA13357','FMA13358','FMA13359','FMA9628','FMA13377','FMA13378'];
assert.equal(atlas.parts.length,basePartCount+historicalParts.size);
assert.equal(atlas.concepts.length,baseConceptCount+historicalConcepts.length);
const ids=new Set(atlas.parts.map(p=>p.id));assert.equal(ids.size,atlas.parts.length);
const files=atlas.chunks.map(c=>{
 const b=fs.readFileSync(new URL(c.url.split('/').pop(),base));assert.equal(b.length,c.bytes);
 if(c.gzip){
  const compressed=fs.readFileSync(new URL(c.gzip.split('/').pop(),base));
  assert.equal(compressed.length,c.gzipBytes);
  assert.deepEqual(zlib.gunzipSync(compressed),b,`${c.gzip}: gzip differs from raw chunk`);
 }
 return b;
});
let tris=0;
for(const p of atlas.parts){
 assert.ok(p.name.trim()&&p.name!=='-'&&!p.name.includes('Bounds('));
 assert.ok(p.conceptId!=='-');assert.ok(p.system);
 const b=files[p.chunk];
 assert.ok(p.positions+p.vertexCount*12<=b.length,`${p.id}: positions exceed chunk`);
 assert.ok(p.normals+p.vertexCount*6<=b.length,`${p.id}: normals exceed chunk`);
 assert.ok(p.indices+p.indexCount*4<=b.length,`${p.id}: indices exceed chunk`);
 const pos=new Float32Array(b.buffer,b.byteOffset+p.positions,p.vertexCount*3);
 const indices=new Uint32Array(b.buffer,b.byteOffset+p.indices,p.indexCount);
 assert.ok(indices.length>=3);
 for(const i of indices)assert.ok(i<p.vertexCount,`${p.id}: invalid vertex`);
 for(const value of pos)assert.ok(Number.isFinite(value),`${p.id}: non-finite position`);
 tris+=p.indexCount/3;
}
for(const c of atlas.concepts){
 assert.ok(c.elements.length);
 for(const id of c.elements)assert.ok(ids.has(id),`${c.id}: missing ${id}`);
}
assert.equal(tris,atlas.triangles);
const concepts=new Map(atlas.concepts.map(concept=>[concept.id,concept]));
for(const conceptId of historicalConcepts)assert.ok(concepts.has(conceptId),`missing ${conceptId}`);
for(const [partId,correction] of ANATOMY_SYSTEM_CORRECTIONS){
 const part=atlas.parts.find(candidate=>candidate.id===partId);
 assert.ok(part,`missing corrected system part ${partId}`);
 assert.equal(part.name,correction.name,`${partId}: unexpected anatomy`);
 assert.equal(part.system,correction.system,`${partId}: incorrect display system`);
}
for(const [partId,expected] of historicalParts){
 const part=atlas.parts.find(candidate=>candidate.id===partId);
 assert.ok(part,`missing ${partId}`);
 assert.equal(part.name,expected.name);assert.equal(part.conceptId,expected.conceptId);
 assert.equal(part.system,'muscular');assert.ok(part.indexCount>=288);
 const centerX=(part.bounds[0][0]+part.bounds[1][0])/2;
 assert.ok(expected.side==='right'?centerX<0:centerX>0,`${partId}: wrong body side`);
 if(expected.region==='back')assert.ok(part.bounds[1][2]<0.02,`${partId}: not on back`);
 else assert.ok(part.bounds[1][2]>0.08,`${partId}: not on front`);
}
const pairBounds=(rightId,leftId)=>{
 const right=atlas.parts.find(part=>part.id===rightId).bounds;
 const left=atlas.parts.find(part=>part.id===leftId).bounds;
 const rightWidth=right[1][0]-right[0][0],leftWidth=left[1][0]-left[0][0];
 const rightHeight=right[1][1]-right[0][1],leftHeight=left[1][1]-left[0][1];
 assert.ok(Math.abs(rightWidth-leftWidth)<0.015,`${rightId}: bilateral width mismatch`);
 assert.ok(Math.abs(rightHeight-leftHeight)<0.015,`${rightId}: bilateral height mismatch`);
};
pairBounds('BP3D3-FMA13358','BP3D3-FMA13359');
pairBounds('BP3D3-FMA13377','BP3D3-FMA13378');
assert.deepEqual(
 atlas.historicalMuscleAddition?.parts,
 [...historicalParts.keys()],
 'historical muscle provenance is incomplete',
);
console.log(`Verified ${ids.size} individually indexed meshes, ${atlas.concepts.length} complete concept mappings, ${tris.toLocaleString()} triangles, and every binary buffer.`);
