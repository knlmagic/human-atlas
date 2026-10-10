import {X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {REGIONS, type Lesson, type RegionId} from './training';
import {PRACTICE_PATTERNS, type PracticePatternId} from './practice-patterns';

interface Props {
 region: RegionId | null;
 patternId?: PracticePatternId | null;
 lessons: Lesson[];
 selectedId?: string;
 onRegion: (id: RegionId | null) => void;
 onPattern?: (id: PracticePatternId | null) => void;
 onLesson: (lesson: Lesson) => void;
 onStartArea?: () => void;
 onClose: () => void;
 mobileOpen: boolean;
 phone: boolean;
}

export function AreaChips({
 region,
 patternId,
 onRegion,
 onPattern,
}: {
 region: RegionId | null;
 patternId?: PracticePatternId | null;
 onRegion: (id: RegionId | null) => void;
 onPattern?: (id: PracticePatternId | null) => void;
}) {
 return (
  <nav className="area-chips" aria-label="Body areas and common days">
   <Button variant="ghost" aria-pressed={!region && !patternId} onClick={() => { onPattern?.(null); onRegion(null); }}>Whole body</Button>
   {onPattern && PRACTICE_PATTERNS.map(item => (
    <Button
     key={item.id}
     variant="ghost"
     aria-pressed={patternId === item.id}
     onClick={() => onPattern(patternId === item.id ? null : item.id)}
    >
     {item.name}
    </Button>
   ))}
   {REGIONS.map(item => (
    <Button
     key={item.id}
     variant="ghost"
     aria-pressed={!patternId && region === item.id}
     onClick={() => { onPattern?.(null); onRegion(region === item.id ? null : item.id); }}
    >
     {item.name}
    </Button>
   ))}
  </nav>
 );
}

export default function TrainingPanel({
 region,
 patternId,
 lessons,
 selectedId,
 onRegion,
 onPattern,
 onLesson,
 onStartArea,
 onClose,
 mobileOpen,
 phone,
}: Props) {
 const active = REGIONS.find(item => item.id === region);
 const pattern = PRACTICE_PATTERNS.find(item => item.id === patternId);
 return (
  <section className={`layers-panel glass training-panel ${mobileOpen ? 'mobile-open' : ''}`} aria-label="Body areas">
   <div className="panel-heading">
    <span>Body areas</span>
    <Button variant="ghost" className="mobile-only icon-button" onClick={onClose} aria-label="Close body areas"><X size={18}/></Button>
   </div>
   <div className="region-grid">
    {!phone && <Button variant="ghost" aria-pressed={!region && !patternId} onClick={() => { onPattern?.(null); onRegion(null); }}>Whole body</Button>}
    {REGIONS.map(item => (
     <Button key={item.id} variant="ghost" aria-pressed={!patternId && region === item.id} onClick={() => { onPattern?.(null); onRegion(item.id); }}>{item.name}</Button>
    ))}
   </div>
   {onPattern && (
    <div className="pattern-grid" role="group" aria-label="Common days">
     <p className="pattern-label">Common days</p>
     {PRACTICE_PATTERNS.map(item => (
      <Button key={item.id} variant="ghost" aria-pressed={patternId === item.id} onClick={() => onPattern(item.id)}>{item.name}</Button>
     ))}
    </div>
   )}
   {pattern && <p className="region-hint">{pattern.hint}</p>}
   {active && !pattern && <p className="region-hint">{active.hint}</p>}
   {active?.caution && !pattern && <p className="region-caution"><strong>Be careful.</strong> {active.caution}</p>}
   <div className="lesson-list">
    {lessons.length === 0 && <p className="search-note">Pick a body area, or tap a muscle on the body.</p>}
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
