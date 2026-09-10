import {ChevronRight, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {LESSONS, type Lesson} from './training';
import {BASIC_MUSCLE_NAMES} from './basic-muscle-names';

interface Props {
 onLesson: (lesson: Lesson) => void;
 onExit: () => void;
}

const LESSON_BY_ID = new Map(LESSONS.map(lesson => [lesson.id, lesson]));

export default function BasicMuscleGuide({onLesson, onExit}: Props) {
 return (
  <aside className="guided-panel basic-names-panel glass" aria-label="Basic muscle names">
   <header className="guided-header">
    <div>
     <p className="guided-kicker">BASIC THERAPY NAMES</p>
     <h2>Learn the proper muscle names</h2>
    </div>
    <Button variant="ghost" className="icon-button" onClick={onExit} aria-label="Close basic muscle names"><X size={18} /></Button>
   </header>
   <p className="guided-intro">Say the proper name first. The simple name helps clients understand where you mean.</p>
   <div className="guided-scroll basic-name-list" role="list">
    {BASIC_MUSCLE_NAMES.map(item => {
     const lesson = LESSON_BY_ID.get(item.lessonId);
     if (!lesson) {
      console.error(`Basic muscle lesson is missing: ${item.lessonId}`);
      return null;
     }
     return (
      <Button key={item.properName} variant="ghost" role="listitem" onClick={() => onLesson(lesson)}>
       <span><strong>{item.properName}</strong><small>{item.therapyName}</small></span>
       <ChevronRight size={16} />
      </Button>
     );
    })}
   </div>
  </aside>
 );
}
