import type {RegionId} from './training';

export type DiscomfortQuality = 'tight' | 'dull' | 'sore' | 'sharp' | 'burning' | 'tingling' | 'numb' | 'swollen';
export type SafetyFlag = 'sudden-severe' | 'recent-injury' | 'weakness' | 'fever-unwell' | 'chest-breathing' | 'cannot-move' | 'varicose';

export interface DiscomfortAnswers {
 region: RegionId;
 qualities: DiscomfortQuality[];
 flags: SafetyFlag[];
}

export const QUALITY_OPTIONS: {id: DiscomfortQuality; label: string}[] = [
 {id: 'tight', label: 'Tight'},
 {id: 'dull', label: 'Dull ache'},
 {id: 'sore', label: 'Sore or tired'},
 {id: 'sharp', label: 'Sharp'},
 {id: 'burning', label: 'Burning'},
 {id: 'tingling', label: 'Tingling'},
 {id: 'numb', label: 'Numb'},
 {id: 'swollen', label: 'Swollen or hot'},
];

export const SAFETY_OPTIONS: {id: SafetyFlag; label: string}[] = [
 {id: 'sudden-severe', label: 'It began suddenly or feels severe'},
 {id: 'recent-injury', label: 'There was a recent injury, fall, or operation'},
 {id: 'weakness', label: 'There is weakness or loss of control'},
 {id: 'fever-unwell', label: 'The client has fever or feels unwell'},
 {id: 'chest-breathing', label: 'There is chest pain or trouble breathing'},
 {id: 'cannot-move', label: 'The nearby joint cannot move normally'},
 {id: 'varicose', label: 'There are raised or painful varicose veins here'},
];

export const SAFE_LESSON_BY_REGION: Record<RegionId, string> = {
 neck: 'upper-traps',
 shoulders: 'infraspinatus',
 back: 'erectors',
 chest: 'pecs',
 arms: 'wrist-flexors',
 hips: 'glute-med',
 thighs: 'quads',
 legs: 'gastroc',
};
