import {describe, expect, it, vi} from 'vitest';
import {EMPTY_TRAINING_PROGRESS, TRAINING_PROGRESS_KEY, loadTrainingProgress, saveTrainingProgress} from './training-progress';

function memoryStorage(initial?: string) {
 const values = new Map<string, string>();
 if (initial !== undefined) values.set(TRAINING_PROGRESS_KEY, initial);
 return {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
 };
}

describe('local training progress', () => {
 it('round-trips progress without client answers', () => {
  const storage = memoryStorage();
  const progress = {
   version: 1 as const,
   routine: {stepIndex: 3, completedStepIds: ['prepare', 'back']},
   discomfortExercisesCompleted: 2,
  };
  expect(saveTrainingProgress(progress, storage)).toBe(true);
  expect(loadTrainingProgress(storage)).toEqual(progress);
  expect(storage.getItem(TRAINING_PROGRESS_KEY)).not.toMatch(/quality|symptom|region|client/i);
 });

 it('recovers safely from corrupt or obsolete data', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  expect(loadTrainingProgress(memoryStorage('{broken'))).toEqual(EMPTY_TRAINING_PROGRESS);
  expect(loadTrainingProgress(memoryStorage(JSON.stringify({version: 0})))).toEqual(EMPTY_TRAINING_PROGRESS);
  warn.mockRestore();
 });

 it('sanitizes invalid values and duplicate step ids', () => {
  const storage = memoryStorage(JSON.stringify({
   version: 1,
   routine: {stepIndex: -4, completedStepIds: ['back', 'back', 42]},
   discomfortExercisesCompleted: -2,
  }));
  expect(loadTrainingProgress(storage)).toEqual({
   version: 1,
   routine: {stepIndex: 0, completedStepIds: ['back']},
   discomfortExercisesCompleted: 0,
  });
 });
});
