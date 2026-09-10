import {Activity, BookOpenText, ChevronRight, Route, X} from 'lucide-react';
import {Button} from '@/components/ui/button';

interface Props {
 routineStep: number;
 routineCompleted: boolean;
 exercisesCompleted: number;
 onRoutine: () => void;
 onDiscomfort: () => void;
 onNames: () => void;
 onExit: () => void;
}

export default function GuidedMenu({routineStep, routineCompleted, exercisesCompleted, onRoutine, onDiscomfort, onNames, onExit}: Props) {
 return (
  <aside className="guided-panel guided-menu glass" aria-label="Guided practice">
   <header className="guided-header">
    <div>
     <p className="guided-kicker">GUIDED PRACTICE</p>
     <h2>Learn with a clear next step</h2>
    </div>
    <Button variant="ghost" className="icon-button" onClick={onExit} aria-label="Close guided practice"><X size={18} /></Button>
   </header>
   <div className="guided-scroll guided-choices">
    <Button variant="ghost" onClick={onRoutine}>
     <Route size={20} />
     <span><strong>60-minute full-body routine</strong><small>{routineCompleted ? 'Completed · practise again' : routineStep ? `Resume at step ${routineStep + 1}` : 'One safe beginner sequence'}</small></span>
     <ChevronRight size={18} />
    </Button>
    <Button variant="ghost" onClick={onDiscomfort}>
     <Activity size={20} />
     <span><strong>Client discomfort</strong><small>Practise when to work, avoid, or refer{exercisesCompleted ? ` · ${exercisesCompleted} done` : ''}</small></span>
     <ChevronRight size={18} />
    </Button>
    <Button variant="ghost" onClick={onNames}>
     <BookOpenText size={20} />
     <span><strong>Basic muscle names</strong><small>Proper names and simple client-friendly names</small></span>
     <ChevronRight size={18} />
    </Button>
    <p className="guided-note">Training only. These guides do not diagnose pain or replace qualified instruction.</p>
   </div>
  </aside>
 );
}
