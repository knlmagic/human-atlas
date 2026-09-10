import {ChevronLeft, ChevronRight, Clock3, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import type {Routine} from './routine';

interface Props {
 routine: Routine;
 stepIndex: number;
 completedStepIds: string[];
 onStep: (index: number, completeCurrent?: boolean) => void;
 onExit: () => void;
}

export default function RoutineGuide({routine, stepIndex, completedStepIds, onStep, onExit}: Props) {
 const step = routine.steps[stepIndex];
 const isLast = stepIndex === routine.steps.length - 1;
 const completed = new Set(completedStepIds);
 const done = routine.steps.filter(item => completed.has(item.id)).length;

 return (
  <aside className="guided-panel glass" aria-label={`${routine.title} guide`}>
   <header className="guided-header">
    <div>
     <p className="guided-kicker">GUIDED ROUTINE · {stepIndex + 1} OF {routine.steps.length}</p>
     <h2>{step.title}</h2>
    </div>
    <Button variant="ghost" className="icon-button" onClick={onExit} aria-label="Exit guided routine"><X size={18} /></Button>
   </header>
   <div className="guided-progress" aria-label={`${done} of ${routine.steps.length} steps completed`}>
    <i style={{width: `${done / routine.steps.length * 100}%`}} />
   </div>
   <div className="guided-scroll">
    <div className="guided-meta">
     <span><Clock3 size={15} />About {step.minutes} min</span>
     <span>{step.position.replace('-', ' ')}</span>
    </div>
    <dl className="guided-facts">
     <div><dt>Keep covered</dt><dd>{step.draping}</dd></div>
     <div><dt>Pressure</dt><dd>{step.pressure}</dd></div>
    </dl>
    <ol className="guided-cues">
     {step.cues.map(cue => <li key={cue}>{cue}</li>)}
    </ol>
    {step.caution && <p className="region-caution"><strong>Be careful.</strong> {step.caution}</p>}
   </div>
   <footer className="guided-actions">
    <Button variant="ghost" disabled={stepIndex === 0} onClick={() => onStep(stepIndex - 1)}>
     <ChevronLeft size={16} />Back
    </Button>
    <Button className="primary-action" onClick={() => onStep(isLast ? 0 : stepIndex + 1, true)}>
     {isLast ? 'Finish routine' : 'Done · Next'}<ChevronRight size={16} />
    </Button>
   </footer>
  </aside>
 );
}
