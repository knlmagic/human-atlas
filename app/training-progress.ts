export const TRAINING_PROGRESS_KEY = 'atlas-training-progress-v1';

export interface TrainingProgress {
 version: 1;
 routine: {
  stepIndex: number;
  completedStepIds: string[];
  completedAt?: string;
 };
 discomfortExercisesCompleted: number;
}

interface StorageLike {
 getItem(key: string): string | null;
 setItem(key: string, value: string): void;
}

export const EMPTY_TRAINING_PROGRESS: TrainingProgress = {
 version: 1,
 routine: {stepIndex: 0, completedStepIds: []},
 discomfortExercisesCompleted: 0,
};

function emptyProgress(): TrainingProgress {
 return {
  version: 1,
  routine: {stepIndex: 0, completedStepIds: []},
  discomfortExercisesCompleted: 0,
 };
}

function cleanProgress(value: unknown): TrainingProgress {
 if (!value || typeof value !== 'object') return emptyProgress();
 const raw = value as Partial<TrainingProgress>;
 if (raw.version !== 1) return emptyProgress();
 const stepIndex = Number.isInteger(raw.routine?.stepIndex) ? Math.max(0, raw.routine!.stepIndex) : 0;
 const completedStepIds = Array.isArray(raw.routine?.completedStepIds)
  ? raw.routine!.completedStepIds.filter((id): id is string => typeof id === 'string')
  : [];
 return {
  version: 1,
  routine: {
   stepIndex,
   completedStepIds: [...new Set(completedStepIds)],
   ...(typeof raw.routine?.completedAt === 'string' ? {completedAt: raw.routine.completedAt} : {}),
  },
  discomfortExercisesCompleted: Number.isInteger(raw.discomfortExercisesCompleted)
   ? Math.max(0, raw.discomfortExercisesCompleted!)
   : 0,
 };
}

function browserStorage() {
 try {
  return typeof window === 'undefined' ? undefined : window.localStorage;
 } catch (error) {
  console.warn('Training progress storage is unavailable.', error);
  return undefined;
 }
}

export function loadTrainingProgress(storage: StorageLike | undefined = browserStorage()) {
 if (!storage) return emptyProgress();
 try {
  const saved = storage.getItem(TRAINING_PROGRESS_KEY);
  return saved ? cleanProgress(JSON.parse(saved)) : emptyProgress();
 } catch (error) {
  console.warn('Could not read saved training progress.', error);
  return emptyProgress();
 }
}

export function saveTrainingProgress(progress: TrainingProgress, storage: StorageLike | undefined = browserStorage()) {
 if (!storage) return false;
 try {
  storage.setItem(TRAINING_PROGRESS_KEY, JSON.stringify(cleanProgress(progress)));
  return true;
 } catch (error) {
  console.warn('Could not save training progress.', error);
  return false;
 }
}
