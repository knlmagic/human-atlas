import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import type {Atlas} from './anatomy';
import {BASIC_MUSCLE_NAMES} from './basic-muscle-names';
import {
 CAMERA_VIEWS,
 cameraAim,
 STANDING_HEIGHT_MIN,
 TORSO_HEIGHT_MAX,
 figureSpan,
 framePadding,
 frameSpan,
 idsToFrame,
 lessonStaysOnCurrentFigure,
 minFrameDistance,
 shouldReframeArea,
 trainingPartIds,
 visibleIdsForStudio,
} from './studio';
import {
 INTRO_REGIONS,
 LESSONS,
 REGIONS,
 lessonsForRegion,
 partsForLesson,
 partsInRegion,
 partsInRegions,
 searchTraining,
} from './training';

const atlas = JSON.parse(readFileSync(new URL('../public/models/atlas.json', import.meta.url), 'utf8')) as Atlas;

describe('therapist outcome: know the human they will work on', () => {
 it('the live studio uses that whole-body policy instead of a torso-only intro', () => {
  const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
  expect(source).toContain('visibleIdsForStudio');
  expect(source).not.toMatch(/phone \? introIds/);
  expect(source).toContain('CAMERA_VIEWS');
  const scene = readFileSync(new URL('./scene.tsx', import.meta.url), 'utf8');
  expect(scene).toContain('idsToFrame');
  expect(scene).toContain('zoomToCursor');
  expect(scene).toContain('applyPinchFocus');
  const chips = readFileSync(new URL('./training-panel.tsx', import.meta.url), 'utf8');
  expect(chips).toContain('Whole body');
 });

 it('opens on a standing whole body, not a cropped neck-and-back torso', () => {
  const showing = visibleIdsForStudio(atlas, null);
  const whole = figureSpan(atlas, showing);
  const torso = figureSpan(atlas, partsInRegions(atlas, INTRO_REGIONS));
  expect(showing).toBeNull();
  expect(whole.height).toBeGreaterThan(STANDING_HEIGHT_MIN);
  expect(torso.height).toBeLessThan(TORSO_HEIGHT_MAX);
  expect(whole.height).toBeGreaterThan(torso.height * 1.6);
 });

 it('keeps feet and head in the default figure so Front is a person, not a ¾ torso', () => {
  const span = figureSpan(atlas, visibleIdsForStudio(atlas, null));
  expect(span.y0).toBeLessThan(0.08);
  expect(span.y1).toBeGreaterThan(1.5);
 });

 it('Front/Side/Back/¾ are orientations of the same person, not a “full body” shortcut', () => {
  const labels = CAMERA_VIEWS.map(view => view.label);
  expect(labels).toEqual(['Three-quarter view', 'Front view', 'Side view', 'Back view']);
  expect(CAMERA_VIEWS.some(view => /full/i.test(view.mark) || view.mark === 'F')).toBe(false);
  const [qx, , qz] = cameraAim('three-quarter');
  const [fx, , fz] = cameraAim('front');
  expect(Math.abs(fx)).toBeLessThan(0.05);
  expect(Math.abs(qx / qz)).toBeGreaterThan(0.7);
  const source = readFileSync(new URL('./scene.tsx', import.meta.url), 'utf8');
  expect(source).toMatch(/kind==='body'[\s\S]*fit\(/);
 });
});

describe('therapist outcome: find a body area without losing the atlas', () => {
 it('every massage area has muscles to learn', () => {
  for (const region of REGIONS) {
   const parts = partsInRegion(atlas, region.id);
   const lessons = lessonsForRegion(region.id);
   expect(parts.length, region.name).toBeGreaterThan(8);
   expect(lessons.length, region.name).toBeGreaterThan(0);
  }
 });

 it('choosing an area crops to that area; clearing it restores the whole person', () => {
  const legs = visibleIdsForStudio(atlas, 'legs');
  const whole = visibleIdsForStudio(atlas, null);
  expect(legs).not.toBeNull();
  expect(figureSpan(atlas, legs).y1).toBeLessThan(0.7);
  expect(whole).toBeNull();
  expect(figureSpan(atlas, whole).height).toBeGreaterThan(STANDING_HEIGHT_MIN);
 });

 it('neck sits above the legs so a full-body Front cannot be confused with a neck crop', () => {
  const neck = figureSpan(atlas, partsInRegion(atlas, 'neck'));
  const legs = figureSpan(atlas, partsInRegion(atlas, 'legs'));
  expect(neck.y0).toBeGreaterThan(legs.y1);
 });
});

describe('therapist outcome: tap a muscle and still see the body they will treat', () => {
 it('keeps the selected muscle highlighted in anatomical context', () => {
  const traps = partsForLesson(atlas, LESSONS.find(lesson => lesson.id === 'upper-traps')!);
  const body = trainingPartIds(atlas);
  const around = idsToFrame(atlas, {visibleIds: null});
  expect(around).toEqual(body);
  expect(figureSpan(atlas, around).height).toBeGreaterThan(figureSpan(atlas, traps).height * 2);
  const page = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
  expect(page).not.toContain('See it alone');
  expect(page).not.toContain('See around it');
  expect(page).not.toContain(' of ${lessonNav.total}');
 });

 it('a lesson on the current figure does not need to hide the rest of the body', () => {
  const traps = partsForLesson(atlas, LESSONS.find(lesson => lesson.id === 'upper-traps')!);
  expect(lessonStaysOnCurrentFigure(null, traps)).toBe(true);
  expect(lessonStaysOnCurrentFigure(partsInRegion(atlas, 'neck'), traps)).toBe(true);
  expect(lessonStaysOnCurrentFigure(partsInRegion(atlas, 'legs'), traps)).toBe(false);
 });

 it('zooms to the body area, not the one muscle, so neighbors stay tappable', () => {
  const lesson = LESSONS.find(item => item.id === 'upper-traps')!;
  const traps = partsForLesson(atlas, lesson);
  const area = partsInRegion(atlas, lesson.region);
  const framed = idsToFrame(atlas, {visibleIds: area});
  expect(framed).toEqual(area);
  expect(figureSpan(atlas, framed).height).toBeGreaterThan(figureSpan(atlas, traps).height);
  expect(figureSpan(atlas, framed).height).toBeLessThan(figureSpan(atlas, null).height * 0.7);
  expect(framePadding('region', true)).toBeLessThan(framePadding('body', true));
  expect(minFrameDistance('region', true)).toBeLessThan(minFrameDistance('body', true));
  expect(frameSpan({x: 0.45, y: 0.41, z: 0.23}, 0.46, 'region', true)).toBeLessThan(
   frameSpan({x: 0.45, y: 0.41, z: 0.23}, 0.46, 'body', true),
  );
  expect(shouldReframeArea(null, lesson.region)).toBe(true);
  expect(shouldReframeArea(lesson.region, lesson.region)).toBe(false);
 });
});

describe('therapist outcome: learn how to find the muscle and ease it', () => {
 it('every lesson teaches location and how to work it, in plain language', () => {
  for (const lesson of LESSONS) {
   expect(lesson.find.length, lesson.id).toBeGreaterThan(20);
   expect(lesson.work.length, lesson.id).toBeGreaterThan(20);
   expect(lesson.does.length, lesson.id).toBeGreaterThan(12);
   expect(lesson.find).not.toMatch(/origin|insertion|proximal|distal/i);
   expect(partsForLesson(atlas, lesson).length, `${lesson.id} must map to the 3D body`).toBeGreaterThan(0);
  }
 });

 it('covers the areas a masseuse actually works, from neck to feet', () => {
  const byRegion = Object.fromEntries(REGIONS.map(region => [region.id, lessonsForRegion(region.id).length]));
  expect(byRegion.neck).toBeGreaterThanOrEqual(3);
  expect(byRegion.shoulders).toBeGreaterThanOrEqual(3);
  expect(byRegion.back).toBeGreaterThanOrEqual(3);
  expect(byRegion.legs).toBeGreaterThanOrEqual(3);
 });

 it('search uses the names therapists say, not only Latin', () => {
  expect(searchTraining(atlas, 'traps').some(hit => /trap/i.test(hit.name))).toBe(true);
  expect(searchTraining(atlas, 'calf').some(hit => hit.elements.length > 0)).toBe(true);
  expect(searchTraining(atlas, 'neck').length).toBeGreaterThan(0);
 });
});

describe('therapist outcome: follow a guide without losing the body', () => {
 it('keeps the atlas mounted while guided panels replace secondary controls', () => {
  const page = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
  const styles = readFileSync(new URL('./globals.css', import.meta.url), 'utf8');
  expect(page).toContain('<AnatomyScene');
  expect(page).toContain("guideMode === 'routine'");
  expect(page).toContain("guideMode === 'discomfort'");
  expect(styles).toContain('.studio.is-guided .bottom-dock');
  expect(styles).not.toMatch(/\.studio\.is-guided\s+\.scene(?:\s|,|\{)[^}]*display\s*:\s*none/);
 });
});

describe('therapist outcome: learn proper and simple muscle names', () => {
 it('teaches the requested basic therapy vocabulary', () => {
  expect(BASIC_MUSCLE_NAMES.map(item => [item.properName, item.therapyName])).toEqual([
   ['Biceps brachii', 'Arm flexor'],
   ['Triceps brachii', 'Arm extender'],
   ['Deltoid', 'Shoulder cap'],
   ['Pectoralis major', 'Chest muscle'],
   ['Trapezius', 'Upper back and neck muscle'],
   ['Latissimus dorsi', 'Wing muscle'],
   ['Rectus abdominis', 'Six-pack muscle'],
   ['Gluteus maximus', 'Hip and buttock muscle'],
   ['Quadriceps', 'Front thigh muscle'],
   ['Hamstrings', 'Back thigh muscles'],
   ['Gastrocnemius', 'Calf muscle'],
  ]);
 });

 it('opens a real 3D lesson for every requested muscle name', () => {
  for (const name of BASIC_MUSCLE_NAMES) {
   const lesson = LESSONS.find(item => item.id === name.lessonId);
   expect(lesson, name.properName).toBeDefined();
   expect(partsForLesson(atlas, lesson!).length, name.properName).toBeGreaterThan(0);
  }
 });

 it('does not mark any requested muscle as unavailable', () => {
  const guide = readFileSync(new URL('./basic-muscle-guide.tsx', import.meta.url), 'utf8');
  expect(guide).not.toContain('Not shown in this 3D model');
  expect(BASIC_MUSCLE_NAMES.every(item => Boolean(item.lessonId))).toBe(true);
 });

 it('maps the restored bilateral meshes to correct FMA concepts and body regions', () => {
  const restored = [
   ['BP3D3-FMA13358', 'FMA13358', 'right', 'back'],
   ['BP3D3-FMA13359', 'FMA13359', 'left', 'back'],
   ['BP3D3-FMA13377', 'FMA13377', 'right', 'front'],
   ['BP3D3-FMA13378', 'FMA13378', 'left', 'front'],
  ] as const;
  for (const [id, conceptId, side, surface] of restored) {
   const part = atlas.parts.find(candidate => candidate.id === id);
   expect(part, id).toBeDefined();
   expect(part?.conceptId).toBe(conceptId);
   expect(part?.system).toBe('muscular');
   expect(part?.indexCount).toBeGreaterThan(288);
   const centerX = (part!.bounds[0][0] + part!.bounds[1][0]) / 2;
   expect(side === 'right' ? centerX < 0 : centerX > 0).toBe(true);
   expect(surface === 'back' ? part!.bounds[1][2] < 0.02 : part!.bounds[1][2] > 0.08).toBe(true);
  }
  expect(atlas.concepts.find(concept => concept.id === 'FMA13357')?.elements).toEqual([
   'BP3D3-FMA13358',
   'BP3D3-FMA13359',
  ]);
  expect(atlas.concepts.find(concept => concept.id === 'FMA9628')?.elements).toEqual([
   'BP3D3-FMA13377',
   'BP3D3-FMA13378',
  ]);
 });
});
