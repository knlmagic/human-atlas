import {LESSONS, type Lesson} from './training-data';

export type PracticePatternId = 'scooter' | 'laptop' | 'standing';

export interface PracticePattern {
 id: PracticePatternId;
 name: string;
 hint: string;
 lessonIds: string[];
}

/**
 * Short Next-muscle paths for bodies Indian therapists actually see.
 * Still training — never a diagnosis of the person on the table.
 */
export const PRACTICE_PATTERNS: PracticePattern[] = [
 {
  id: 'scooter',
  name: 'Scooter',
  hint: 'Neck and shoulders after a two-wheeler commute.',
  lessonIds: ['upper-traps', 'levator', 'splenius', 'scm'],
 },
 {
  id: 'laptop',
  name: 'Laptop',
  hint: 'Upper back and chest after desk or phone work.',
  lessonIds: ['middle-traps', 'rhomboids', 'pecs', 'deltoid'],
 },
 {
  id: 'standing',
  name: 'Standing',
  hint: 'Calves, back, and thighs after a long shift on the feet.',
  lessonIds: ['gastroc', 'soleus', 'erectors', 'quads'],
 },
];

export function patternById(id: string | null | undefined) {
 return PRACTICE_PATTERNS.find(item => item.id === id);
}

export function lessonsForPattern(pattern: PracticePattern): Lesson[] {
 return pattern.lessonIds
  .map(id => LESSONS.find(item => item.id === id))
  .filter((item): item is Lesson => Boolean(item));
}
