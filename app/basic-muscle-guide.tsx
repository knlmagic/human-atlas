import {ChevronRight, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {LESSONS, type Lesson} from './training';
import {BASIC_MUSCLE_NAMES} from './basic-muscle-names';

interface Props {
 onLesson: (lesson: Lesson) => void;
 onExit: () => void;
}

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
     const lesson = item.lessonId ? LESSONS.find(candidate => candidate.id === item.lessonId) : undefined;
     const content = (
      <>
       <span><strong>{item.properName}</strong><small>{item.therapyName}</small></span>
       {lesson ? <ChevronRight size={16} /> : <small className="model-note">Not shown in this 3D model</small>}
      </>
     );
     return lesson
      ? <Button key={item.properName} variant="ghost" role="listitem" onClick={() => onLesson(lesson)}>{content}</Button>
      : <div className="basic-name-row" role="listitem" aria-label={`${item.properName}, ${item.therapyName}, not shown in this 3D model`} key={item.properName}>{content}</div>;
    })}
   </div>
  </aside>
 );
}
