import {useState} from 'react';
import type {Lesson} from './training';
import {COACH} from './training-coach';
import {strokeById, strokesForLesson, type StrokeId} from './strokes';
import {Button} from '@/components/ui/button';

export default function TrainingCard({lesson, fallback, compact = false}: {lesson?: Lesson; fallback: string; compact?: boolean}) {
 if (!lesson) {
  return <p className="structure-description">{fallback}</p>;
 }
 const coach = COACH[lesson.id];
 if (compact) {
  return (
   <div className="training-card is-compact">
    <p className="lesson-kicker">{lesson.also}</p>
    <p className="structure-description">{lesson.does}</p>
   </div>
  );
 }
 return <FullTrainingCard lesson={lesson} coach={coach} />;
}

function FullTrainingCard({lesson, coach}: {lesson: Lesson; coach?: {why: string; say: string}}) {
 const options = strokesForLesson(lesson);
 const [strokeId, setStrokeId] = useState<StrokeId>(options[0]);
 const stroke = strokeById(strokeId);
 return (
  <div className="training-card">
   <p className="lesson-kicker">{lesson.also}</p>
   <p className="structure-description">{lesson.does}</p>
   <dl className="training-facts">
    {coach && <div><dt>Why they feel it</dt><dd>{coach.why}</dd></div>}
    <div><dt>Starts from</dt><dd>{lesson.from}</dd></div>
    <div><dt>Goes to</dt><dd>{lesson.to}</dd></div>
    <div><dt>How to find it</dt><dd>{lesson.find}</dd></div>
    <div>
     <dt>How to work</dt>
     <dd>
      {lesson.work}
      <div className="stroke-row" role="group" aria-label="Strokes for this muscle">
       {options.map(id => {
        const item = strokeById(id);
        return (
         <Button key={id} variant="ghost" aria-pressed={strokeId === id} onClick={() => setStrokeId(id)}>
          {item.name}
         </Button>
        );
       })}
      </div>
      <p className="stroke-cue">{stroke.cue}</p>
     </dd>
    </div>
    {coach && <div><dt>What to tell them</dt><dd>{coach.say}</dd></div>}
   </dl>
   {lesson.careful && <p className="region-caution"><strong>Be careful.</strong> {lesson.careful}</p>}
  </div>
 );
}
