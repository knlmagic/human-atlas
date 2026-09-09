import type {Lesson} from './training';
import {COACH} from './training-coach';

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
 return (
  <div className="training-card">
   <p className="lesson-kicker">{lesson.also}</p>
   <p className="structure-description">{lesson.does}</p>
   <dl className="training-facts">
    {coach && <div><dt>Why they feel it</dt><dd>{coach.why}</dd></div>}
    <div><dt>Starts from</dt><dd>{lesson.from}</dd></div>
    <div><dt>Goes to</dt><dd>{lesson.to}</dd></div>
    <div><dt>How to find it</dt><dd>{lesson.find}</dd></div>
    <div><dt>How to work</dt><dd>{lesson.work}</dd></div>
    {coach && <div><dt>What to tell them</dt><dd>{coach.say}</dd></div>}
   </dl>
   {lesson.careful && <p className="region-caution"><strong>Be careful.</strong> {lesson.careful}</p>}
  </div>
 );
}
