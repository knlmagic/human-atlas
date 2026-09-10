import type {Atlas, Concept, Part} from './anatomy';
import {LESSONS, REGIONS, type Lesson, type LessonMatch, type Region, type RegionId} from './training-data';

export {LESSONS, REGIONS, TRAINING_SYSTEMS} from './training-data';
export type {Lesson, Region, RegionId} from './training-data';
export type {LayerMode} from './anatomy';

export function isTrainingMuscle(part: Part) {
  return part.system === 'muscular' || part.system === 'connective';
}

export function isTrainingBone(part: Part) {
  return part.system === 'skeletal';
}

export function isTrainingPart(part: Part) {
  return isTrainingMuscle(part) || isTrainingBone(part);
}

export function sideOf(name: string): 'left'|'right'|null {
  if (/\bleft\b/i.test(name)) return 'left';
  if (/\bright\b/i.test(name)) return 'right';
  return null;
}

export function matchesLesson(name: string, rule: LessonMatch) {
  const text = name.toLowerCase();
  if (rule.exclude?.some(token => text.includes(token))) return false;
  if (rule.all?.length && !rule.all.every(token => text.includes(token))) return false;
  if (rule.any?.length && !rule.any.some(token => text.includes(token))) return false;
  return Boolean(rule.all?.length || rule.any?.length);
}

export function lessonForName(name: string) {
  let best: Lesson | undefined;
  let score = -1;
  const text = name.toLowerCase();
  for (const lesson of LESSONS) {
    if (!matchesLesson(name, lesson.match)) continue;
    const allScore = (lesson.match.all ?? []).reduce((sum, token) => sum + 20 + token.length, 0);
    const anyHits = (lesson.match.any ?? []).filter(token => text.includes(token));
    const anyScore = anyHits.reduce((sum, token) => sum + 2 + token.length, 0);
    const next = allScore + anyScore;
    if (next > score) {
      best = lesson;
      score = next;
    }
  }
  return best;
}

export function partsForLesson(atlas: Atlas, lesson: Lesson) {
  return atlas.parts.filter(part => isTrainingPart(part) && matchesLesson(part.name, lesson.match)).map(part => part.id);
}

export function lessonsForRegion(id: RegionId) {
  return LESSONS.filter(lesson => lesson.region === id);
}

function inRegionBox(part: Part, region: Region) {
  const min = part.bounds[0];
  const max = part.bounds[1];
  const x = Math.abs((min[0] + max[0]) / 2);
  const y = (min[1] + max[1]) / 2;
  const z = (min[2] + max[2]) / 2;
  const {bounds} = region;
  if (y < bounds.y0 || y > bounds.y1) return false;
  if (bounds.x0 != null && x < bounds.x0) return false;
  if (bounds.x1 != null && x > bounds.x1) return false;
  if (bounds.z0 != null && z < bounds.z0) return false;
  if (bounds.z1 != null && z > bounds.z1) return false;
  return true;
}

const SKIP_REGION = /eye|tongue|tooth|teeth|mandible|maxilla|nasal|hyoid|cricoid|arytenoid|vocal|cochlea|brain|ventricle|myocard/i;

export const INTRO_REGIONS: RegionId[] = ['neck', 'shoulders', 'back'];

export function partsInRegion(atlas: Atlas, id: RegionId) {
  const region = REGIONS.find(item => item.id === id);
  if (!region) return [];
  const ids: string[] = [];
  for (const part of atlas.parts) {
    if (!isTrainingPart(part) || SKIP_REGION.test(part.name)) continue;
    const extra = region.extra.some(token => part.name.toLowerCase().includes(token));
    if (inRegionBox(part, region) || extra) ids.push(part.id);
  }
  return ids;
}

export function partsInRegions(atlas: Atlas, ids: RegionId[]) {
  return [...new Set(ids.flatMap(id => partsInRegion(atlas, id)))];
}

function tidyFallback(name: string) {
  return name
    .replace(/^(left|right)\s+/i, '')
    .replace(/\b(left|right)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, letter => letter.toUpperCase());
}

export function displayName(name: string) {
  const lesson = lessonForName(name);
  const side = sideOf(name);
  const base = lesson?.title ?? tidyFallback(name);
  return side ? `${base} (${side})` : base;
}

export function chunksForParts(atlas: Atlas, ids: string[] | null) {
 if (!ids) return atlas.chunks.map((_, index) => index);
 return [...new Set(atlas.parts.filter(part => ids.includes(part.id)).map(part => part.chunk))];
}

export function lessonSequence(region: RegionId, id: string) {
 const list = lessonsForRegion(region);
 const index = list.findIndex(item => item.id === id);
 return {
  index,
  total: list.length,
  prev: index > 0 ? list[index - 1] : undefined,
  next: index >= 0 && index < list.length - 1 ? list[index + 1] : undefined,
 };
}

export function searchTraining(atlas: Atlas, query: string): Concept[] {
  const term = query.toLowerCase().trim();
  const seen = new Set<string>();
  const hits: Concept[] = [];
  const add = (item: Concept) => {
    if (seen.has(item.id) || item.elements.length === 0) return;
    seen.add(item.id);
    hits.push(item);
  };

  const lessons = term
    ? LESSONS.filter(lesson =>
        lesson.title.toLowerCase().includes(term)
        || lesson.also.toLowerCase().includes(term)
        || lesson.aliases.some(alias => alias.includes(term) || term.includes(alias))
        || lesson.id.includes(term))
    : LESSONS.filter(lesson => ['upper-traps','scm','deltoid','gastroc','glute-max','hamstrings'].includes(lesson.id));

  for (const lesson of lessons) {
    add({id: lesson.id, name: lesson.title, elements: partsForLesson(atlas, lesson)});
  }

  if (!term) return hits.slice(0, 8);

  for (const part of atlas.parts) {
    if (!isTrainingPart(part)) continue;
    const label = displayName(part.name);
    if (!part.name.toLowerCase().includes(term) && !label.toLowerCase().includes(term)) continue;
    const lesson = lessonForName(part.name);
    if (lesson) {
      add({id: lesson.id, name: lesson.title, elements: partsForLesson(atlas, lesson)});
    } else {
      add({id: part.conceptId, name: label, elements: [part.id]});
    }
    if (hits.length >= 40) break;
  }
  return hits;
}
