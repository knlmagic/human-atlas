import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import type {Atlas} from './anatomy';
import {LESSONS, partsForLesson} from './training';
import {BEGINNER_FULL_BODY_ROUTINE, routineMinutes, routinePercent, validateRoutine} from './routine';

const atlas = JSON.parse(readFileSync(new URL('../public/models/atlas.json', import.meta.url), 'utf8')) as Atlas;

describe('guided beginner full-body routine', () => {
 it('is a complete 60-minute sequence with valid content references', () => {
  expect(routineMinutes(BEGINNER_FULL_BODY_ROUTINE)).toBe(60);
  expect(validateRoutine(BEGINNER_FULL_BODY_ROUTINE)).toEqual([]);
  expect(BEGINNER_FULL_BODY_ROUTINE.steps.length).toBeGreaterThanOrEqual(8);
 });

 it('shows real anatomy for every massage step', () => {
  for (const step of BEGINNER_FULL_BODY_ROUTINE.steps) {
   for (const lessonId of step.lessonIds) {
    const lesson = LESSONS.find(item => item.id === lessonId);
    expect(lesson, `${lessonId} must exist`).toBeDefined();
    expect(partsForLesson(atlas, lesson!).length, `${lessonId} must map to the body`).toBeGreaterThan(0);
   }
  }
 });

 it('keeps higher-risk work out of the beginner sequence', () => {
  const lessonIds = BEGINNER_FULL_BODY_ROUTINE.steps.flatMap(step => step.lessonIds);
  expect(lessonIds).not.toContain('scalenes');
  expect(lessonIds).not.toContain('inner-thigh');
  expect(BEGINNER_FULL_BODY_ROUTINE.steps.find(step => step.id === 'hips')?.draping).toMatch(/covered|towel/i);
 });

 it('measures manually completed steps', () => {
  const ids = BEGINNER_FULL_BODY_ROUTINE.steps.slice(0, 3).map(step => step.id);
  expect(routinePercent(BEGINNER_FULL_BODY_ROUTINE, [])).toBe(0);
  expect(routinePercent(BEGINNER_FULL_BODY_ROUTINE, ids)).toBe(27);
 });
});
