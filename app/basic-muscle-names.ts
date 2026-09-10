export interface BasicMuscleName {
 properName: string;
 therapyName: string;
 lessonId: string;
}

/** Core names therapists should recognize in basic training. */
export const BASIC_MUSCLE_NAMES: BasicMuscleName[] = [
 {properName: 'Biceps brachii', therapyName: 'Arm flexor', lessonId: 'biceps'},
 {properName: 'Triceps brachii', therapyName: 'Arm extender', lessonId: 'triceps'},
 {properName: 'Deltoid', therapyName: 'Shoulder cap', lessonId: 'deltoid'},
 {properName: 'Pectoralis major', therapyName: 'Chest muscle', lessonId: 'pecs'},
 {properName: 'Trapezius', therapyName: 'Upper back and neck muscle', lessonId: 'upper-traps'},
 {properName: 'Latissimus dorsi', therapyName: 'Wing muscle', lessonId: 'lats'},
 {properName: 'Rectus abdominis', therapyName: 'Six-pack muscle', lessonId: 'rectus-abdominis'},
 {properName: 'Gluteus maximus', therapyName: 'Hip and buttock muscle', lessonId: 'glute-max'},
 {properName: 'Quadriceps', therapyName: 'Front thigh muscle', lessonId: 'quads'},
 {properName: 'Hamstrings', therapyName: 'Back thigh muscles', lessonId: 'hamstrings'},
 {properName: 'Gastrocnemius', therapyName: 'Calf muscle', lessonId: 'gastroc'},
];
