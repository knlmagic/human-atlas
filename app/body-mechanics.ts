export interface HandTip {
 id: string;
 title: string;
 body: string;
 tryNext: string;
 lessonId: string;
}

/** Ninety-second self-care. Highlights a muscle they already know; no second 3D therapist. */
export const HAND_TIPS: HandTip[] = [
 {
  id: 'table',
  title: 'Set the table',
  body: 'Table at about your hip. Soft knees. Do not hunch over the client.',
  tryNext: 'Before the next guest, check the table height with your arms hanging.',
  lessonId: 'erectors',
 },
 {
  id: 'legs',
  title: 'Use your legs',
  body: 'Step into the stroke. Your body weight does the work. Your thumbs do not.',
  tryNext: 'On the next back, take a small lunge instead of pressing harder with the hands.',
  lessonId: 'quads',
 },
 {
  id: 'forearm',
  title: 'Switch to forearm',
  body: 'When the muscle is thick — back, hip, thigh — use the forearm. Keep the wrist straight.',
  tryNext: 'If your thumbs ache tonight, use the forearm on the next large muscle.',
  lessonId: 'lats',
 },
];
