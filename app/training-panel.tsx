import {X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {REGIONS, type Lesson, type RegionId} from './training';

interface Props {
 region: RegionId | null;
 lessons: Lesson[];
 selectedId?: string;
 onRegion: (id: RegionId | null) => void;
 onLesson: (lesson: Lesson) => void;
 onStartArea?: () => void;
 onClose: () => void;
 mobileOpen: boolean;
 waiting: boolean;
 phone: boolean;
}

export default function TrainingPanel({region, lessons, selectedId, onRegion, onLesson, onStartArea, onClose, mobileOpen, waiting, phone}: Props) {
 const active = REGIONS.find(item => item.id === region);
 return (
  <section className={`layers-panel glass training-panel ${mobileOpen ? 'mobile-open' : ''} ${waiting ? 'is-waiting' : ''}`} aria-label="Body areas">
   <div className="panel-heading">
    <span>{waiting ? 'Start with one area' : 'Body areas'}</span>
    {!waiting && <Button variant="ghost" className="mobile-only icon-button" onClick={onClose} aria-label="Close body areas"><X size={18}/></Button>}
   </div>
   {waiting && <p className="region-hint">Only that part of the body downloads. Wi‑Fi is best the first time.</p>}
   <div className="region-grid">
    {!phone && <Button variant="ghost" aria-pressed={!region} onClick={() => onRegion(null)}>Whole body</Button>}
    {REGIONS.map(item => (
     <Button key={item.id} variant="ghost" aria-pressed={region === item.id} onClick={() => onRegion(item.id)}>{item.name}</Button>
    ))}
   </div>
   {active && <p className="region-hint">{active.hint}</p>}
   {active?.caution && <p className="region-caution"><strong>Be careful.</strong> {active.caution}</p>}
   <div className="lesson-list">
    {lessons.length === 0 && <p className="search-note">{waiting ? 'Pick Neck, Shoulders, or Back to begin.' : 'Pick a body area, or tap a muscle on the body.'}</p>}
    {lessons.length > 0 && onStartArea && !selectedId && (
     <Button className="primary-action start-area" onClick={onStartArea}>Learn the first muscle</Button>
    )}
    {lessons.map(lesson => (
     <Button key={lesson.id} variant="ghost" className={`lesson-row ${selectedId === lesson.id ? 'active' : ''}`} onClick={() => onLesson(lesson)}>
      <span className="lesson-title">{lesson.title}</span>
      <span className="lesson-also">{lesson.also}</span>
     </Button>
    ))}
   </div>
  </section>
 );
}
