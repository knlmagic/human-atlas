import {useState} from 'react';
import {ChevronLeft, ChevronRight, RotateCcw, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {LESSONS, REGIONS, type Lesson, type RegionId} from './training';
import {QUALITY_OPTIONS, SAFETY_OPTIONS, type DiscomfortQuality, type SafetyFlag} from './discomfort-data';
import {evaluateDiscomfort, type DiscomfortResult} from './discomfort-safety';

interface Props {
 region: RegionId | null;
 onRegion: (region: RegionId) => void;
 onTechnique: (lesson: Lesson) => void;
 onComplete: () => void;
 onExit: () => void;
}

export default function DiscomfortGuide({region, onRegion, onTechnique, onComplete, onExit}: Props) {
 const [step, setStep] = useState(0);
 const [qualities, setQualities] = useState<DiscomfortQuality[]>([]);
 const [flags, setFlags] = useState<SafetyFlag[]>([]);
 const [result, setResult] = useState<DiscomfortResult | null>(null);

 const toggle = <T,>(items: T[], item: T, update: (next: T[]) => void) => {
  update(items.includes(item) ? items.filter(value => value !== item) : [...items, item]);
 };
 const restart = () => {
  setStep(0);
  setQualities([]);
  setFlags([]);
  setResult(null);
 };
 const finishScreen = () => {
  if (!region || !qualities.length) return;
  setResult(evaluateDiscomfort({region, qualities, flags}));
  setStep(3);
  onComplete();
 };
 const safeLesson = result?.lessonId ? LESSONS.find(lesson => lesson.id === result.lessonId) : undefined;

 return (
  <aside className="guided-panel discomfort-panel glass" aria-label="Client discomfort training">
   <header className="guided-header">
    <div>
     <p className="guided-kicker">TRAINING ONLY · NOT A DIAGNOSIS</p>
     <h2>{step === 0 ? 'Where is the discomfort?' : step === 1 ? 'How does it feel?' : step === 2 ? 'Check before massage' : result?.title}</h2>
    </div>
    <Button variant="ghost" className="icon-button" onClick={onExit} aria-label="Exit discomfort training"><X size={18} /></Button>
   </header>
   <div className="guided-progress"><i style={{width: `${(step + 1) / 4 * 100}%`}} /></div>
   <div className="guided-scroll">
    {step === 0 && (
     <>
      <p className="guided-intro">Choose what the practice client points to. This exercise teaches a safe response, not a diagnosis.</p>
      <div className="guided-options region-options">
       {REGIONS.map(item => <Button key={item.id} variant="ghost" aria-pressed={region === item.id} onClick={() => onRegion(item.id)}>{item.name}</Button>)}
      </div>
     </>
    )}
    {step === 1 && (
     <>
      <p className="guided-intro">Choose every word the practice client uses.</p>
      <div className="guided-options">
       {QUALITY_OPTIONS.map(item => <Button key={item.id} variant="ghost" aria-pressed={qualities.includes(item.id)} onClick={() => toggle(qualities, item.id, setQualities)}>{item.label}</Button>)}
      </div>
     </>
    )}
    {step === 2 && (
     <>
      <p className="guided-intro">Select anything else the practice client reports. Leave all clear if none apply.</p>
      <div className="safety-options">
       {SAFETY_OPTIONS.map(item => (
        <Button key={item.id} variant="ghost" aria-pressed={flags.includes(item.id)} onClick={() => toggle(flags, item.id, setFlags)}>
         <span>{item.label}</span>
        </Button>
       ))}
      </div>
     </>
    )}
    {step === 3 && result && (
     <div className={`discomfort-result is-${result.outcome}`} role="status">
      <p>{result.message}</p>
      {result.outcome === 'technique' && (
       <>
        <dl className="guided-facts">
         <div><dt>Try</dt><dd>{result.technique}</dd></div>
         <div><dt>Pressure and time</dt><dd>{result.pressure} · about {result.minutes} minutes</dd></div>
         <div><dt>Reassess</dt><dd>{result.reassess}</dd></div>
        </dl>
        {safeLesson && <Button className="primary-action" onClick={() => onTechnique(safeLesson)}>Show this technique on the body<ChevronRight size={16} /></Button>}
       </>
      )}
      {result.outcome !== 'technique' && <p className="region-caution"><strong>No technique is shown.</strong> Warning or uncertain signs should not be treated as a muscle knot.</p>}
     </div>
    )}
   </div>
   <footer className="guided-actions">
    {step > 0 && step < 3 && <Button variant="ghost" onClick={() => setStep(step - 1)}><ChevronLeft size={16} />Back</Button>}
    {step < 2 && <Button className="primary-action" disabled={(step === 0 && !region) || (step === 1 && !qualities.length)} onClick={() => setStep(step + 1)}>Continue<ChevronRight size={16} /></Button>}
    {step === 2 && <Button className="primary-action" onClick={finishScreen}>See safe response<ChevronRight size={16} /></Button>}
    {step === 3 && <Button variant="ghost" onClick={restart}><RotateCcw size={16} />Try another case</Button>}
   </footer>
  </aside>
 );
}
