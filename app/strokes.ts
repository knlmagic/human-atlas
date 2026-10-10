import type {Lesson, RegionId} from './training-data';

export type StrokeId = 'long' | 'knead' | 'circle' | 'forearm';

export interface Stroke {
 id: StrokeId;
 name: string;
 cue: string;
}

/** Classic spa contacts. Shown on the How to work card, not as a new menu. */
export const STROKES: Stroke[] = [
 {
  id: 'long',
  name: 'Long stroke',
  cue: 'Palm or whole hand, slow, toward the heart. Keep the pressure even.',
 },
 {
  id: 'knead',
  name: 'Knead',
  cue: 'Lift and roll the muscle with the palm and fingers. Do not pinch with the thumb tip.',
 },
 {
  id: 'circle',
  name: 'Circle',
  cue: 'Small slow circles with the pads of the fingers. Stay on muscle, not bone.',
 },
 {
  id: 'forearm',
  name: 'Forearm',
  cue: 'Use the forearm when the tissue is thick. Keep the wrist straight. Save your thumbs.',
 },
];

const STROKE_IDS = new Set<StrokeId>(STROKES.map(item => item.id));

const BY_LESSON: Partial<Record<string, StrokeId[]>> = {
 scm: ['long', 'circle'],
 scalenes: ['circle'],
 'thumb-muscles': ['circle', 'knead'],
 piriformis: ['circle'],
 'it-band': ['long', 'forearm'],
 'rectus-abdominis': ['circle', 'long'],
};

const BY_REGION: Record<RegionId, StrokeId[]> = {
 head: ['circle', 'long'],
 neck: ['long', 'knead', 'circle'],
 shoulders: ['knead', 'circle', 'long'],
 back: ['long', 'knead', 'forearm'],
 chest: ['long', 'circle'],
 abdomen: ['circle', 'long'],
 arms: ['long', 'knead', 'circle'],
 hips: ['forearm', 'knead', 'circle'],
 thighs: ['long', 'knead', 'forearm'],
 legs: ['long', 'knead', 'circle'],
 feet: ['long', 'knead', 'circle'],
};

function uniqueStrokes(ids: StrokeId[]) {
 const seen = new Set<StrokeId>();
 const next: StrokeId[] = [];
 for (const id of ids) {
  if (!STROKE_IDS.has(id) || seen.has(id)) continue;
  seen.add(id);
  next.push(id);
 }
 return next.length ? next : (['long'] as StrokeId[]);
}

export function strokeById(id: StrokeId) {
 return STROKES.find(item => item.id === id) ?? STROKES[0];
}

export function strokesForLesson(lesson: Lesson) {
 return uniqueStrokes(BY_LESSON[lesson.id] ?? BY_REGION[lesson.region]);
}
