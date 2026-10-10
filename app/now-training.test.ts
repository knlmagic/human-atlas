import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import type {Atlas} from './anatomy';
import {HAND_TIPS} from './body-mechanics';
import {lessonsForPattern, PRACTICE_PATTERNS} from './practice-patterns';
import {STROKES, strokesForLesson} from './strokes';
import {
 LESSONS,
 REGIONS,
 lessonsForRegion,
 partsForLesson,
 partsInRegion,
 pathSequence,
} from './training';
import {figureSpan, visibleIdsForStudio} from './studio';
import {COACH} from './training-coach';

const atlas = JSON.parse(readFileSync(new URL('../public/models/atlas.json', import.meta.url), 'utf8')) as Atlas;
const page = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const card = readFileSync(new URL('./training-card.tsx', import.meta.url), 'utf8');
const panel = readFileSync(new URL('./training-panel.tsx', import.meta.url), 'utf8');
const menu = readFileSync(new URL('./guided-menu.tsx', import.meta.url), 'utf8');
const handsGuide = readFileSync(new URL('./body-mechanics-guide.tsx', import.meta.url), 'utf8');

describe('now wave: strokes live on the How to work card', () => {
 it('gives every lesson a named contact without a new Strokes menu', () => {
  for (const lesson of LESSONS) {
   const ids = strokesForLesson(lesson);
   expect(ids.length, lesson.id).toBeGreaterThan(0);
   expect(ids.every(id => STROKES.some(stroke => stroke.id === id))).toBe(true);
  }
  expect(card).toContain('stroke-row');
  expect(card).toContain('How to work');
  expect(page).not.toMatch(/Learn Strokes|Stroke library/);
 });

 it('keeps forearm off bony head and foot lessons', () => {
  for (const lesson of LESSONS.filter(item => item.region === 'head' || item.region === 'feet')) {
   expect(strokesForLesson(lesson), lesson.id).not.toContain('forearm');
  }
 });

 it('uses simple contact words, not exam Latin', () => {
  for (const stroke of STROKES) {
   expect(stroke.cue).not.toMatch(/effleurage|petrissage|tapotement|friction/i);
   expect(stroke.cue.length).toBeGreaterThan(20);
  }
 });
});

describe('now wave: save your hands from guided practice', () => {
 it('offers three short tips that stay training, not diagnosis', () => {
  expect(HAND_TIPS).toHaveLength(3);
  expect(HAND_TIPS.reduce((sum, tip) => sum + tip.body.split(/\s+/).length, 0)).toBeLessThan(80);
  for (const tip of HAND_TIPS) {
   expect(tip.tryNext.toLowerCase()).toContain('next');
   expect(`${tip.title} ${tip.body} ${tip.tryNext}`).not.toMatch(/diagnos|injury|rsi|carpal/i);
   const lesson = LESSONS.find(item => item.id === tip.lessonId);
   expect(lesson, tip.id).toBeDefined();
   expect(partsForLesson(atlas, lesson!).length, tip.lessonId).toBeGreaterThan(0);
  }
 });

 it('is reached from the guided menu they already open, with the body still visible', () => {
  expect(menu).toContain('Save your hands');
  expect(menu).not.toContain('Learn Strokes');
  expect(page).toContain("guideMode === 'hands'");
  expect(page).toContain('<AnatomyScene');
  expect(handsGuide).toContain('Try this on your next client');
  expect(handsGuide).toContain('does not diagnose');
 });
});

describe('now wave: scooter, laptop, and standing start a Next-muscle path', () => {
 it('maps each common day to real 3D lessons they can tap Next through', () => {
  for (const pattern of PRACTICE_PATTERNS) {
   const lessons = lessonsForPattern(pattern);
   expect(lessons.map(item => item.id)).toEqual(pattern.lessonIds);
   expect(lessons.length).toBeGreaterThanOrEqual(4);
   for (const lesson of lessons) {
    expect(partsForLesson(atlas, lesson).length, `${pattern.id}:${lesson.id}`).toBeGreaterThan(0);
   }
   const last = lessons[lessons.length - 1];
   const nav = pathSequence(pattern.lessonIds, lessons[0].id);
   expect(nav.next?.id).toBe(pattern.lessonIds[1]);
   expect(pathSequence(pattern.lessonIds, last.id).next).toBeUndefined();
  }
 });

 it('puts those days on the same chips as body areas, not a new home screen', () => {
  expect(PRACTICE_PATTERNS.map(item => item.name)).toEqual(['Scooter', 'Laptop', 'Standing']);
  expect(panel).toContain('PRACTICE_PATTERNS');
  expect(panel).toContain('{item.name}');
  expect(panel).toContain('Common days');
  expect(page).toContain('onPattern={startPattern}');
  expect(page).not.toMatch(/top-actions[\s\S]*Scooter/);
 });

 it('does not claim the pattern is a diagnosis', () => {
  for (const pattern of PRACTICE_PATTERNS) {
   expect(pattern.hint).not.toMatch(/diagnos|disease|syndrome/i);
  }
 });
});

describe('now wave: head and feet are real areas; face is omitted without meshes', () => {
 it('does not invent a Face area when the 3D body has no face muscles', () => {
  const faceMuscles = /frontalis|masseter|temporalis|orbicularis oris|buccinator/;
  expect(REGIONS.map(region => region.id as string)).not.toContain('face');
  expect(atlas.parts.filter(part => part.system === 'muscular' && faceMuscles.test(part.name))).toHaveLength(0);
 });

 it('lights head and foot muscles on the existing area list', () => {
  expect(REGIONS.map(region => region.id)).toEqual(expect.arrayContaining(['head', 'feet']));
  expect(partsInRegion(atlas, 'head').length).toBeGreaterThan(8);
  expect(partsInRegion(atlas, 'feet').length).toBeGreaterThan(8);
  for (const id of ['head', 'feet'] as const) {
   for (const lesson of lessonsForRegion(id)) {
    expect(partsForLesson(atlas, lesson).length, lesson.id).toBeGreaterThan(0);
    expect(COACH[lesson.id], lesson.id).toBeDefined();
    expect(lesson.careful?.length ?? 0, lesson.id).toBeGreaterThan(12);
   }
  }
 });

 it('crops feet to the foot, not the calf, and keeps the head above the neck crop', () => {
  const feet = visibleIdsForStudio(atlas, 'feet');
  const legs = visibleIdsForStudio(atlas, 'legs');
  const head = figureSpan(atlas, partsInRegion(atlas, 'head'));
  const neck = figureSpan(atlas, partsInRegion(atlas, 'neck'));
  const footIds = new Set(lessonsForRegion('feet').flatMap(lesson => partsForLesson(atlas, lesson)));
  const legIds = new Set(lessonsForRegion('legs').flatMap(lesson => partsForLesson(atlas, lesson)));
  expect(figureSpan(atlas, feet).y1).toBeLessThan(0.12);
  expect(figureSpan(atlas, legs).y1).toBeLessThan(0.7);
  expect([...footIds].some(id => legIds.has(id))).toBe(false);
  expect(head.y0).toBeGreaterThan(neck.y0 - 0.02);
 });
});
