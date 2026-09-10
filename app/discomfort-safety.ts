import {LESSONS} from './training';
import {SAFE_LESSON_BY_REGION, type DiscomfortAnswers} from './discomfort-data';

export type DiscomfortOutcome = 'technique' | 'avoid' | 'refer';

export interface DiscomfortResult {
 outcome: DiscomfortOutcome;
 title: string;
 message: string;
 reasons: string[];
 lessonId?: string;
 technique?: string;
 pressure?: string;
 minutes?: number;
 reassess?: string;
}

const REFER_FLAGS = new Set(['sudden-severe', 'recent-injury', 'weakness', 'fever-unwell', 'chest-breathing']);
const NERVE_QUALITIES = new Set(['tingling', 'numb']);
const UNCERTAIN_QUALITIES = new Set(['sharp', 'burning', 'swollen']);
const SAFE_QUALITIES = new Set(['tight', 'dull', 'sore']);

/**
 * Educational safety gate. Warning signs always win and intentionally return
 * no massage technique, regardless of the selected body area.
 */
export function evaluateDiscomfort(answers: DiscomfortAnswers): DiscomfortResult {
 const referFlags = answers.flags.filter(flag => REFER_FLAGS.has(flag));
 const nerveSigns = answers.qualities.filter(quality => NERVE_QUALITIES.has(quality));
 if (referFlags.length || (nerveSigns.length && answers.flags.includes('cannot-move'))) {
  return {
   outcome: 'refer',
   title: 'Stop and refer',
   message: 'Do not massage this area. Explain that these signs need assessment by an appropriate health professional.',
   reasons: [...referFlags, ...nerveSigns],
  };
 }

 const uncertain = answers.qualities.filter(quality => UNCERTAIN_QUALITIES.has(quality));
 const avoidFlags = answers.flags.filter(flag => flag === 'cannot-move' || flag === 'varicose');
 const safeQualities = answers.qualities.filter(quality => SAFE_QUALITIES.has(quality));
 if (!safeQualities.length || nerveSigns.length || uncertain.length || avoidFlags.length) {
  return {
   outcome: 'avoid',
   title: 'Avoid this area',
   message: 'Do not try to release the painful area. Work elsewhere only if the client is comfortable, and suggest assessment if it persists.',
   reasons: [...nerveSigns, ...uncertain, ...avoidFlags],
  };
 }

 const lessonId = SAFE_LESSON_BY_REGION[answers.region];
 const lesson = LESSONS.find(item => item.id === lessonId);
 return {
  outcome: 'technique',
  title: 'Gentle work may be appropriate',
  message: 'The answers fit ordinary muscular tightness or soreness. Begin gently and keep checking how it feels.',
  reasons: answers.qualities,
  lessonId,
  technique: lesson?.work ?? 'Use slow, broad strokes over the muscle.',
  pressure: answers.region === 'neck' || answers.region === 'chest' ? 'Light only' : 'Light to medium',
  minutes: 3,
  reassess: 'Stop after a few minutes and ask whether it feels easier, the same, or worse. Stop if it becomes sharper or travels.',
 };
}
