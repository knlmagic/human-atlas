import {describe, expect, it} from 'vitest';
import {LESSONS, REGIONS, type RegionId} from './training';
import {QUALITY_OPTIONS, SAFETY_OPTIONS, type DiscomfortAnswers} from './discomfort-data';
import {evaluateDiscomfort} from './discomfort-safety';

const answers = (overrides: Partial<DiscomfortAnswers> = {}): DiscomfortAnswers => ({
 region: 'back',
 qualities: ['tight'],
 flags: [],
 ...overrides,
});

describe('discomfort training safety gate', () => {
 it.each(['sudden-severe', 'recent-injury', 'weakness', 'fever-unwell', 'chest-breathing'] as const)(
  'shows no technique for warning sign %s',
  flag => {
   const result = evaluateDiscomfort(answers({flags: [flag]}));
   expect(result.outcome).toBe('refer');
   expect(result.lessonId).toBeUndefined();
   expect(result.technique).toBeUndefined();
  },
 );

 it.each(['sharp', 'burning', 'tingling', 'numb', 'swollen'] as const)(
  'does not treat uncertain sensation %s as an ordinary knot',
  quality => {
   const result = evaluateDiscomfort(answers({qualities: [quality]}));
   expect(result.outcome).toBe('avoid');
   expect(result.technique).toBeUndefined();
  },
 );

 it('lets a warning sign override an otherwise safe answer', () => {
  const result = evaluateDiscomfort(answers({qualities: ['tight', 'sore'], flags: ['recent-injury']}));
  expect(result.outcome).toBe('refer');
  expect(result.lessonId).toBeUndefined();
 });

 it('never recommends a technique without an ordinary muscular sensation', () => {
  const result = evaluateDiscomfort(answers({qualities: []}));
  expect(result.outcome).toBe('avoid');
  expect(result.technique).toBeUndefined();
 });

 it.each(REGIONS.map(region => region.id))('maps safe %s discomfort to existing training', (region: RegionId) => {
  const result = evaluateDiscomfort(answers({region}));
  expect(result.outcome).toBe('technique');
  expect(LESSONS.some(lesson => lesson.id === result.lessonId)).toBe(true);
  expect(result.technique?.length).toBeGreaterThan(20);
  expect(result.reassess).toMatch(/stop/i);
 });

 it('keeps the structured form complete and controlled', () => {
  expect(QUALITY_OPTIONS.length).toBeGreaterThanOrEqual(8);
  expect(SAFETY_OPTIONS.length).toBeGreaterThanOrEqual(6);
  expect(QUALITY_OPTIONS.some(option => option.id === 'sharp')).toBe(true);
  expect(SAFETY_OPTIONS.some(option => option.id === 'chest-breathing')).toBe(true);
 });
});
