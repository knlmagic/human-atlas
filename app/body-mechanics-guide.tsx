import {useEffect, useState} from 'react';
import {ChevronLeft, ChevronRight, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {HAND_TIPS} from './body-mechanics';

interface Props {
 onTip: (index: number) => void;
 onExit: () => void;
}

export default function BodyMechanicsGuide({onTip, onExit}: Props) {
 const [index, setIndex] = useState(0);
 const tip = HAND_TIPS[index];
 const isLast = index === HAND_TIPS.length - 1;

 useEffect(() => {
  onTip(index);
 }, [index, onTip]);

 if (!tip) return null;

 return (
  <aside className="guided-panel glass" aria-label="Save your hands">
   <header className="guided-header">
    <div>
     <p className="guided-kicker">SAVE YOUR HANDS · {index + 1} OF {HAND_TIPS.length}</p>
     <h2>{tip.title}</h2>
    </div>
    <Button variant="ghost" className="icon-button" onClick={onExit} aria-label="Close save your hands"><X size={18} /></Button>
   </header>
   <div className="guided-progress" aria-label={`${index + 1} of ${HAND_TIPS.length} tips`}>
    <i style={{width: `${((index + 1) / HAND_TIPS.length) * 100}%`}} />
   </div>
   <div className="guided-scroll">
    <p className="guided-intro">{tip.body}</p>
    <dl className="guided-facts">
     <div><dt>Try this on your next client</dt><dd>{tip.tryNext}</dd></div>
    </dl>
    <p className="guided-note">Training only. This does not diagnose hand or wrist pain.</p>
   </div>
   <footer className="guided-actions">
    <Button variant="ghost" disabled={index === 0} onClick={() => setIndex(index - 1)}>
     <ChevronLeft size={16} />Back
    </Button>
    <Button className="primary-action" onClick={() => isLast ? onExit() : setIndex(index + 1)}>
     {isLast ? 'Done' : 'Next tip'}<ChevronRight size={16} />
    </Button>
   </footer>
  </aside>
 );
}
