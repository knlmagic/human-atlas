import {useState, type Dispatch, type SetStateAction} from 'react';
import type {Atlas, Concept, SceneState} from './anatomy';
import {LESSONS, partsForLesson, type Lesson, type RegionId} from './training';
import {BEGINNER_FULL_BODY_ROUTINE, clampRoutineStep} from './routine';
import {loadTrainingProgress, saveTrainingProgress, type TrainingProgress} from './training-progress';

export type GuideMode = 'explore' | 'menu' | 'routine' | 'discomfort';

interface GuideDependencies {
 atlas: Atlas | null;
 setRegion: Dispatch<SetStateAction<RegionId | null>>;
 setChosen: Dispatch<SetStateAction<Concept | null>>;
 setDetails: Dispatch<SetStateAction<boolean>>;
 setLessonOpen: Dispatch<SetStateAction<boolean>>;
 setPanel: Dispatch<SetStateAction<'layers' | 'search' | null>>;
 setSceneState: Dispatch<SetStateAction<SceneState>>;
}

export function useGuidedTraining({
 atlas,
 setRegion,
 setChosen,
 setDetails,
 setLessonOpen,
 setPanel,
 setSceneState,
}: GuideDependencies) {
 const [guideMode, setGuideMode] = useState<GuideMode>('explore');
 const [routineStepIndex, setRoutineStepIndex] = useState(0);
 const [trainingProgress, setTrainingProgress] = useState<TrainingProgress>(() => loadTrainingProgress());

 const storeProgress = (next: TrainingProgress) => {
  setTrainingProgress(next);
  saveTrainingProgress(next);
 };

 const focusRoutineStep = (index: number) => {
  const bounded = clampRoutineStep(BEGINNER_FULL_BODY_ROUTINE, index);
  const step = BEGINNER_FULL_BODY_ROUTINE.steps[bounded];
  const lessons = step.lessonIds
   .map(id => LESSONS.find(item => item.id === id))
   .filter((item): item is Lesson => Boolean(item));
  const selectedIds = atlas ? [...new Set(lessons.flatMap(item => partsForLesson(atlas, item)))] : [];
  setRoutineStepIndex(bounded);
  setRegion(step.region);
  setChosen(null);
  setDetails(false);
  setLessonOpen(false);
  setPanel(null);
  setSceneState(state => ({
   ...state,
   selected: selectedIds,
   isolate: false,
   ghost: selectedIds.length > 0,
   view: step.view,
   rotate: false,
   preserveView: false,
   frame: state.frame + 1,
  }));
 };

 const startRoutine = () => {
  const practisingAgain = Boolean(trainingProgress.routine.completedAt);
  const nextIndex = practisingAgain ? 0 : clampRoutineStep(BEGINNER_FULL_BODY_ROUTINE, trainingProgress.routine.stepIndex);
  if (practisingAgain) {
   storeProgress({...trainingProgress, routine: {stepIndex: 0, completedStepIds: []}});
  }
  setGuideMode('routine');
  focusRoutineStep(nextIndex);
 };

 const moveRoutine = (nextIndex: number, completeCurrent = false) => {
  const current = BEGINNER_FULL_BODY_ROUTINE.steps[routineStepIndex];
  const completedStepIds = completeCurrent
   ? [...new Set([...trainingProgress.routine.completedStepIds, current.id])]
   : trainingProgress.routine.completedStepIds;
  const finished = completeCurrent && routineStepIndex === BEGINNER_FULL_BODY_ROUTINE.steps.length - 1;
  storeProgress({
   ...trainingProgress,
   routine: {
    stepIndex: finished ? 0 : clampRoutineStep(BEGINNER_FULL_BODY_ROUTINE, nextIndex),
    completedStepIds,
    ...(finished ? {completedAt: new Date().toISOString()} : {}),
   },
  });
  if (finished) {
   setGuideMode('menu');
   setRegion(null);
   setSceneState(state => ({
    ...state,
    selected: [],
    ghost: false,
    isolate: false,
    view: 'three-quarter',
    preserveView: false,
    frame: state.frame + 1,
   }));
   return;
  }
  focusRoutineStep(nextIndex);
 };

 const completeDiscomfortExercise = () => {
  storeProgress({
   ...trainingProgress,
   discomfortExercisesCompleted: trainingProgress.discomfortExercisesCompleted + 1,
  });
 };

 const clearGuidedScene = () => {
  setRegion(null);
  setChosen(null);
  setDetails(false);
  setLessonOpen(false);
  setPanel(null);
  setSceneState(state => ({
   ...state,
   selected: [],
   ghost: false,
   isolate: false,
   view: 'three-quarter',
   rotate: false,
   preserveView: false,
   frame: state.frame + 1,
  }));
 };

 const startDiscomfort = () => {
  clearGuidedScene();
  setGuideMode('discomfort');
 };

 const leaveGuided = () => {
  clearGuidedScene();
  setGuideMode('explore');
 };

 return {
  guideMode,
  setGuideMode,
  routineStepIndex,
  trainingProgress,
  startRoutine,
  moveRoutine,
  completeDiscomfortExercise,
  startDiscomfort,
  leaveGuided,
 };
}
