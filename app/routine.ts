import {LESSONS, REGIONS} from './training';
import {BEGINNER_FULL_BODY_ROUTINE, type Routine, type RoutineStep} from './routine-data';

export {BEGINNER_FULL_BODY_ROUTINE};
export type {Routine, RoutineStep};

export function routineMinutes(routine: Routine) {
 return routine.steps.reduce((total, step) => total + step.minutes, 0);
}

export function routinePercent(routine: Routine, completedStepIds: string[]) {
 if (!routine.steps.length) return 0;
 const completed = new Set(completedStepIds);
 return Math.round(routine.steps.filter(step => completed.has(step.id)).length / routine.steps.length * 100);
}

export function clampRoutineStep(routine: Routine, index: number) {
 return Math.max(0, Math.min(index, routine.steps.length - 1));
}

/** Validate content references before they can become broken UI or camera states. */
export function validateRoutine(routine: Routine) {
 const errors: string[] = [];
 const regionIds = new Set(REGIONS.map(region => region.id));
 const lessonIds = new Set(LESSONS.map(lesson => lesson.id));
 if (routineMinutes(routine) !== routine.minutes) {
  errors.push(`Routine minutes total ${routineMinutes(routine)}, expected ${routine.minutes}.`);
 }
 for (const step of routine.steps) {
  if (step.region && !regionIds.has(step.region)) errors.push(`${step.id} has an unknown region.`);
  for (const lessonId of step.lessonIds) {
   if (!lessonIds.has(lessonId)) errors.push(`${step.id} has unknown lesson ${lessonId}.`);
  }
 }
 return errors;
}
