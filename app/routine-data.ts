import type {View} from './anatomy';
import type {RegionId} from './training';

export type ClientPosition = 'standing' | 'face-down' | 'face-up';

export interface RoutineStep {
 id: string;
 title: string;
 region: RegionId | null;
 lessonIds: string[];
 view: View;
 minutes: number;
 position: ClientPosition;
 draping: string;
 pressure: string;
 cues: string[];
 caution?: string;
}

export interface Routine {
 id: 'beginner-full-body-60';
 title: string;
 minutes: 60;
 steps: RoutineStep[];
}

/**
 * A conservative relaxation sequence for supervised beginner practice.
 * Suggested times guide pacing; learners advance each card themselves.
 */
export const BEGINNER_FULL_BODY_ROUTINE: Routine = {
 id: 'beginner-full-body-60',
 title: '60-minute full-body massage',
 minutes: 60,
 steps: [
  {
   id: 'prepare',
   title: 'Prepare and ask',
   region: null,
   lessonIds: [],
   view: 'three-quarter',
   minutes: 5,
   position: 'standing',
   draping: 'Explain how the client will stay covered. Ask permission before they lie down.',
   pressure: 'Ask what pressure they prefer and agree on a simple stop signal.',
   cues: ['Wash and warm your hands.', 'Ask about injuries, illness, sensitive areas, and areas to avoid.', 'Help the client settle face-down.'],
   caution: 'Do not begin if the client is unwell, has a recent injury, or reports unexplained severe pain.',
  },
  {
   id: 'back',
   title: 'Warm the back',
   region: 'back',
   lessonIds: ['erectors', 'middle-traps', 'rhomboids'],
   view: 'back',
   minutes: 12,
   position: 'face-down',
   draping: 'Uncover only the back. Keep the hips and legs covered.',
   pressure: 'Begin light. Increase only after the tissue feels warm and the client agrees.',
   cues: ['Use broad strokes from the hips toward the shoulders.', 'Work on both sides of the spine, never on the spine bones.', 'Slow down around tight areas instead of pressing harder.'],
   caution: 'Do not press over the kidneys at the low back near the waist.',
  },
  {
   id: 'shoulders',
   title: 'Shoulders and shoulder blades',
   region: 'shoulders',
   lessonIds: ['deltoid', 'infraspinatus'],
   view: 'back',
   minutes: 7,
   position: 'face-down',
   draping: 'Keep the chest covered and expose only the shoulder being worked.',
   pressure: 'Use slow circles and comfortable squeezing. Support the arm before moving it.',
   cues: ['Trace the shoulder blade with a broad hand.', 'Work the back of the shoulder, then the shoulder cap.', 'Ask before changing the arm position.'],
   caution: 'Do not force a painful or stiff shoulder.',
  },
  {
   id: 'neck',
   title: 'Back of neck',
   region: 'neck',
   lessonIds: ['upper-traps', 'splenius'],
   view: 'back',
   minutes: 6,
   position: 'face-down',
   draping: 'Keep the upper back covered as much as practical.',
   pressure: 'Use light, even pressure and support the head.',
   cues: ['Work beside the neck bones, not on them.', 'Stroke toward the base of the skull.', 'Finish with gentle shoulder squeezes.'],
   caution: 'Do not press the front or side pulse of the neck.',
  },
  {
   id: 'hips',
   title: 'Covered hips',
   region: 'hips',
   lessonIds: ['glute-max', 'glute-med'],
   view: 'back',
   minutes: 5,
   position: 'face-down',
   draping: 'Keep the client covered and work through the towel or sheet.',
   pressure: 'Use the heel of the hand with slow, broad pressure.',
   cues: ['Ask permission before beginning.', 'Work from the side of the hip toward the upper thigh.', 'Keep away from the buttock fold.'],
   caution: 'Skip this area whenever the client is not fully comfortable.',
  },
  {
   id: 'back-thighs',
   title: 'Back of thighs',
   region: 'thighs',
   lessonIds: ['hamstrings'],
   view: 'back',
   minutes: 6,
   position: 'face-down',
   draping: 'Expose one leg at a time. Keep the inner thigh and other leg covered.',
   pressure: 'Use long, broad strokes; reduce pressure near the knee.',
   cues: ['Warm the whole back of the thigh.', 'Follow the muscle toward the knee.', 'Keep your pace slow and even.'],
   caution: 'Do not work high on the inner thigh.',
  },
  {
   id: 'calves-feet',
   title: 'Calves and feet',
   region: 'legs',
   lessonIds: ['gastroc', 'soleus'],
   view: 'back',
   minutes: 7,
   position: 'face-down',
   draping: 'Expose one lower leg and foot at a time.',
   pressure: 'Stroke from the heel toward the knee. Stay light behind the knee.',
   cues: ['Warm the calf before deeper work.', 'Use slower pressure through the broad calf muscle.', 'Finish with gentle foot and ankle movements.'],
   caution: 'Avoid swollen, hot, injured, or visibly varicose areas.',
  },
  {
   id: 'turn',
   title: 'Turn and re-drape',
   region: null,
   lessonIds: [],
   view: 'front',
   minutes: 2,
   position: 'face-up',
   draping: 'Hold the sheet securely and give the client privacy while they turn.',
   pressure: 'Pause and ask whether they are comfortable.',
   cues: ['Help the client turn face-up.', 'Place support under the knees if needed.', 'Check temperature, draping, and comfort.'],
  },
  {
   id: 'front-legs',
   title: 'Front of legs',
   region: 'thighs',
   lessonIds: ['quads'],
   view: 'front',
   minutes: 5,
   position: 'face-up',
   draping: 'Expose one leg at a time and keep the inner thigh covered.',
   pressure: 'Use broad strokes toward the hip and lighter work around the kneecap.',
   cues: ['Warm the front thigh and shin.', 'Work around, not on, the kneecap and shin bone.', 'Finish with light strokes toward the foot.'],
   caution: 'Do not include the inner thigh in this beginner routine.',
  },
  {
   id: 'arms-hands',
   title: 'Arms and hands',
   region: 'arms',
   lessonIds: ['biceps', 'wrist-flexors'],
   view: 'front',
   minutes: 3,
   position: 'face-up',
   draping: 'Keep the torso covered and support one arm at a time.',
   pressure: 'Use light-to-medium strokes and gentle hand circles.',
   cues: ['Support the wrist and elbow.', 'Stroke the upper arm and forearm.', 'Finish with the palm and fingers without pulling joints.'],
  },
  {
   id: 'close',
   title: 'Close the session',
   region: null,
   lessonIds: [],
   view: 'three-quarter',
   minutes: 2,
   position: 'face-up',
   draping: 'Cover the client fully before stepping away.',
   pressure: 'Finish with still, light contact and remove your hands slowly.',
   cues: ['Ask how the pressure felt.', 'Tell the client to sit up slowly.', 'Note any area they want avoided next time without making a diagnosis.'],
  },
 ],
};
