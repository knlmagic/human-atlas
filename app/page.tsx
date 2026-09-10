import {flushSync} from 'react-dom';
import {registerAtlasTools} from './agent-tools';
import {useEffect, useMemo, useRef, useState} from 'react';
import {useIsMobile} from '@/hooks/use-mobile';
import {Activity, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Focus, GraduationCap, Info, Pause, RotateCcw, RotateCw, Search, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Sheet, SheetContent, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import {Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty} from '@/components/ui/combobox';
import AnatomyScene from './scene';
import TrainingPanel, {AreaChips} from './training-panel';
import TrainingCard from './training-card';
import InstallCoach from './install-coach';
import GuidedMenu from './guided-menu';
import RoutineGuide from './routine-guide';
import DiscomfortGuide from './discomfort-guide';
import {DEFAULT_VISIBLE, type Atlas, type Concept, type LayerMode, type SceneState} from './anatomy';
import {
 LESSONS,
 REGIONS,
 displayName,
 lessonForName,
 lessonSequence,
 lessonsForRegion,
 partsForLesson,
 searchTraining,
 type Lesson,
 type RegionId,
} from './training';
import {CAMERA_VIEWS, regionForPart, shouldReframeArea, visibleIdsForStudio} from './studio';
import {BEGINNER_FULL_BODY_ROUTINE} from './routine';
import {useGuidedTraining} from './use-guided-training';

const initial: SceneState = {
 explode: 0,
 visible: DEFAULT_VISIBLE,
 selected: [],
 isolate: false,
 ghost: false,
 visibleIds: null,
 layer: 'muscle',
 view: 'three-quarter',
 rotate: false,
 reset: 0,
 frame: 0,
};

export default function Home() {
 const detailTitle = useRef<HTMLHeadingElement>(null);
 const [atlas, setAtlas] = useState<Atlas | null>(null);
 const [state, setState] = useState(initial);
 const [progress, setProgress] = useState(0);
 const [error, setError] = useState('');
 const [panel, setPanel] = useState<'layers' | 'search' | null>(null);
 const [details, setDetails] = useState(false);
 const [lessonOpen, setLessonOpen] = useState(false);
 const [about, setAbout] = useState(false);
 const [query, setQuery] = useState('');
 const [chosen, setChosen] = useState<Concept | null>(null);
 const [region, setRegion] = useState<RegionId | null>(null);
 const [boot, setBoot] = useState(false);
 const {
  guideMode,
  setGuideMode,
  routineStepIndex,
  trainingProgress,
  startRoutine,
  moveRoutine,
  completeDiscomfortExercise,
  startDiscomfort,
  leaveGuided,
 } = useGuidedTraining({
  atlas,
  setRegion,
  setChosen,
  setDetails,
  setLessonOpen,
  setPanel,
  setSceneState: setState,
 });
 const isMobile = useIsMobile();
 const phone = boot && isMobile;

 useEffect(() => {
  const abort = new AbortController();
  setProgress(0);
  setError('');
  setAtlas(null);
  setChosen(null);
  setDetails(false);
  setLessonOpen(false);
  setState({...initial, visible: DEFAULT_VISIBLE});
  fetch('/models/atlas.json', {signal: abort.signal})
   .then(r => {
    if (!r.ok) throw new Error('The anatomy catalogue could not be loaded.');
    return r.json();
   })
   .then(data => setAtlas(data as Atlas))
   .catch(e => {
    if (e.name !== 'AbortError') setError(e.message);
   });
  return () => abort.abort();
 }, []);

 useEffect(() => {
  setBoot(true);
 }, []);

 useEffect(() => {
  const key = (e: KeyboardEvent) => {
   if (e.key === '/' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
    e.preventDefault();
    setGuideMode('explore');
    setPanel('search');
    setDetails(false);
    setLessonOpen(false);
   }
  };
  window.addEventListener('keydown', key);
  return () => window.removeEventListener('keydown', key);
 }, []);

 const parts = useMemo(() => new Map(atlas?.parts.map(p => [p.id, p])), [atlas]);
 const visibleIds = visibleIdsForStudio(atlas, region);
 const selectedParts = state.selected.map(id => parts.get(id)).filter(p => !!p);
 const selected = selectedParts[0];
 const lesson = chosen ? LESSONS.find(item => item.id === chosen.id) ?? lessonForName(chosen.name) : undefined;
 const activeRegion = REGIONS.find(item => item.id === region) ?? (lesson ? REGIONS.find(item => item.id === lesson.region) : undefined);
 const lessons = region ? lessonsForRegion(region) : [];
 const results = useMemo(() => (atlas ? searchTraining(atlas, query) : []), [atlas, query]);
 const studying = details && selectedParts.length > 0;
 const showScene = Boolean(atlas && boot);

 const chooseLesson = (next: Lesson, ids?: string[]) => {
  if (!atlas) return;
  const elements = ids?.length ? ids : partsForLesson(atlas, next);
  if (!elements.length) return;
  const reframe = shouldReframeArea(region, next.region);
  setRegion(next.region);
  setChosen({id: next.id, name: next.title, elements});
  setState(s => ({
   ...s,
   selected: elements,
   isolate: false,
   ghost: true,
   rotate: false,
   preserveView: !reframe,
   frame: reframe ? s.frame + 1 : s.frame,
  }));
  setDetails(true);
  setLessonOpen(false);
  setPanel(null);
 };

 const choose = (c: Concept) => {
  const next = LESSONS.find(item => item.id === c.id) ?? lessonForName(c.name);
  if (next && atlas) {
   chooseLesson(next, c.elements.length ? c.elements : undefined);
   return;
  }
  const area = atlas && c.elements[0] ? regionForPart(atlas, c.elements[0]) : null;
  const reframe = shouldReframeArea(region, area);
  if (area) setRegion(area);
  setChosen({...c, name: displayName(c.name)});
  setState(s => ({...s, selected: c.elements, isolate: false, ghost: true, rotate: false, preserveView: !reframe, frame: reframe ? s.frame + 1 : s.frame}));
  setDetails(true);
  setLessonOpen(false);
  setPanel(null);
 };

 useEffect(() => {
  if (!atlas) return;
  return registerAtlasTools(atlas, c => flushSync(() => choose(c)));
 }, [atlas]);

 const choosePart = (id: string) => {
  const part = parts.get(id);
  if (!part) return;
  const next = lessonForName(part.name);
  if (next) {
   chooseLesson(next, [id]);
   return;
  }
  const area = regionForPart(atlas!, id);
  const reframe = shouldReframeArea(region, area);
  if (area) setRegion(area);
  setChosen({id: part.conceptId, name: displayName(part.name), elements: [id]});
  setState(s => ({...s, selected: [id], isolate: false, ghost: true, rotate: false, preserveView: !reframe, frame: reframe ? s.frame + 1 : s.frame}));
  setDetails(true);
  setLessonOpen(false);
  setPanel(null);
 };

 const pickRegion = (id: RegionId | null) => {
  const next = REGIONS.find(item => item.id === id);
  const keep = showScene;
  setRegion(id);
  setChosen(null);
  setDetails(false);
  setLessonOpen(false);
  setError('');
  setState(s => ({
   ...s,
   selected: [],
   isolate: false,
   ghost: false,
    view: keep ? s.view : (next?.view ?? 'three-quarter'),
   rotate: false,
   preserveView: keep,
   frame: s.frame + 1,
  }));
 };

 const reset = () => {
  setRegion(null);
  setState(s => ({
   ...initial,
   visible: DEFAULT_VISIBLE,
    view: 'three-quarter',
   reset: s.reset + 1,
   frame: s.frame + 1,
  }));
  setChosen(null);
  setDetails(false);
  setLessonOpen(false);
  setPanel(null);
 };

 const setLayer = (layer: LayerMode) => setState(s => ({...s, layer, isolate: layer === 'muscle' ? s.isolate : false}));
 const openPanel = (next: 'layers' | 'search') => {
  setGuideMode('explore');
  setDetails(false);
  setLessonOpen(false);
  setPanel(p => (p === next ? null : next));
 };

 const closeLesson = () => {
  setState(s => ({...s, selected: [], isolate: false, ghost: false}));
  setDetails(false);
  setLessonOpen(false);
 };

 const lessonNav = lesson ? lessonSequence(lesson.region, lesson.id) : undefined;
 const caption = state.isolate
  ? (chosen?.name ?? 'One muscle')
  : region
    ? activeRegion?.name ?? 'Body area'
    : 'Adult male · massage practice';

 const fallbackText = selected
  ? `${displayName(selected.name)} is part of the ${selected.system} layer. Pick a listed muscle to get a short training note.`
  : 'Tap a muscle to learn how to find it and how to work it.';

 const lessonBody = (
  <>
   <div className="detail-header">
    <div className="detail-accent" style={{background: '#a85b50'}} />
    <div className="eyebrow">{activeRegion?.name ?? lesson?.region ?? 'Muscle'}{lessonNav && lessonNav.index >= 0 ? ` · ${lessonNav.index + 1} of ${lessonNav.total}` : ''}</div>
    {phone
     ? <h2 ref={detailTitle} tabIndex={-1} className="structure-title">{chosen?.name}</h2>
     : <SheetTitle ref={detailTitle} tabIndex={-1} className="structure-title">{chosen?.name}</SheetTitle>}
   </div>
   <div className="detail-scroll" key={`${chosen?.id}-${state.isolate}-${lessonOpen}`}>
    {phone
     ? <p className="sr-only">{lesson?.does ?? chosen?.name}</p>
     : <SheetDescription className="sr-only">{lesson?.does ?? chosen?.name}</SheetDescription>}
    <TrainingCard lesson={lesson} fallback={fallbackText} compact={phone && !lessonOpen} />
   </div>
   <div className="detail-actions">
    {phone && !lessonOpen && (
     <>
      <Button variant="ghost" className="secondary-action lesson-expand" onClick={() => setLessonOpen(true)}>
       Read how to find and work it<ChevronUp size={16} />
      </Button>
      {lessonNav?.next && (
       <Button variant="ghost" className="secondary-action" onClick={() => chooseLesson(lessonNav.next!)}>
        Next · {lessonNav.next.title}<ChevronRight size={14} />
       </Button>
      )}
     </>
    )}
    {(!phone || lessonOpen) && (
     <>
      <Button className={`primary-action ${state.isolate ? 'active' : ''}`} onClick={() => setState(s => ({...s, isolate: !s.isolate, ghost: s.isolate, explode: 0}))}>
       <Focus size={18} />{state.isolate ? 'See around it' : 'See it alone'}<ChevronRight size={16} />
      </Button>
      {lessonNav?.next && (
       <Button variant="ghost" className="secondary-action" onClick={() => chooseLesson(lessonNav.next!)}>
        Next muscle · {lessonNav.next.title}<ChevronRight size={14} />
       </Button>
      )}
      {lessonNav?.prev && (
       <Button variant="ghost" className="secondary-action" onClick={() => chooseLesson(lessonNav.prev!)}>
        <ChevronLeft size={14} />{lessonNav.prev.title}
       </Button>
      )}
      {!phone && (
       <Button variant="ghost" className="secondary-action" onClick={closeLesson}>
        Clear
       </Button>
      )}
     </>
    )}
   </div>
  </>
 );

 return (
  <main className={`studio ${studying ? 'is-studying' : ''} ${guideMode !== 'explore' ? 'is-guided' : ''} ${phone ? 'is-phone' : ''}`}>
   {showScene && atlas && (
    <AnatomyScene
     atlas={atlas}
     state={{...state, visibleIds, inspectorOpen: studying}}
     onSelect={choosePart}
     onProgress={n => {
      setProgress(n);
      if (n === 100) setError('');
     }}
     onError={setError}
    />
   )}
   <div className="vignette" />
   <header className="identity">
    <div className="eyebrow"><span className="status-dot" /> MASSAGE PRACTICE</div>
    <h1>Human Atlas<Badge variant="outline" className="edition">3D</Badge></h1>
    <div className="identity-meta">{guideMode !== 'explore' ? 'Follow the guide while the body stays visible.' : studying ? 'Turn the body. The muscle stays highlighted.' : 'Tap a muscle to learn it'}</div>
   </header>
   <nav className="top-actions" aria-label="Practice panels">
    <Button variant="ghost" className={guideMode !== 'explore' ? 'active' : ''} onClick={() => guideMode === 'explore' ? setGuideMode('menu') : leaveGuided()} aria-label="Guided practice">
     <GraduationCap size={18} /><span>Guided practice</span>
    </Button>
    <Button variant="ghost" className={panel === 'search' ? 'active' : ''} onClick={() => openPanel('search')} aria-label="Find a muscle">
     <Search size={18} /><span>Find a muscle</span><kbd>/</kbd>
    </Button>
    <Button variant="ghost" className="icon-button" aria-label="About this atlas" onClick={() => { setDetails(false); setLessonOpen(false); setPanel(null); setAbout(true); }}>
     <Info size={18} />
    </Button>
   </nav>
   {guideMode === 'explore' && <TrainingPanel
    region={region}
    lessons={lessons}
    selectedId={lesson?.id}
    onRegion={pickRegion}
    onLesson={item => chooseLesson(item)}
    onStartArea={lessons[0] ? () => chooseLesson(lessons[0]) : undefined}
    onClose={() => setPanel(null)}
    mobileOpen={panel === 'layers'}
    phone={phone}
   />}
   {guideMode === 'explore' && panel === 'search' && (
    <section className="search-panel glass" aria-label="Find a muscle">
     <div className="panel-heading">
      <span>Find a muscle</span>
      <Button variant="ghost" className="icon-button" onClick={() => setPanel(null)} aria-label="Close search"><X size={18} /></Button>
     </div>
     <Combobox<Concept>
      items={results}
      value={null}
      onValueChange={value => { if (value) choose(value); }}
      inputValue={query}
      onInputValueChange={setQuery}
      itemToStringLabel={c => c.name}
      filter={null}
      open
      onOpenChange={open => { if (!open) setPanel(null); }}
     >
      <ComboboxInput autoFocus placeholder="Traps, neck, calf…" aria-label="Search muscles used in massage" showTrigger={false} />
      <ComboboxContent className="anatomy-search-results">
       <ComboboxEmpty>No muscle matches that name.</ComboboxEmpty>
       <ComboboxList>
        {(c: Concept) => (
         <ComboboxItem key={c.id} value={c}>
          <span className="search-result-name">{c.name}</span>
          <span className="small-number">{c.elements.length === 1 ? '1 piece' : `${c.elements.length} pieces`}</span>
         </ComboboxItem>
        )}
       </ComboboxList>
      </ComboboxContent>
     </Combobox>
     <p className="search-note">{query ? 'Try a simple name, like traps or calf.' : 'Search the muscles you work in a massage.'}</p>
    </section>
   )}
   <nav className="view-controls glass" aria-label="Camera controls">
    {CAMERA_VIEWS.map(view => (
     <Button
      variant="ghost"
      key={view.id}
      className={state.view === view.id ? 'active' : ''}
      aria-pressed={state.view === view.id}
      onClick={() => setState(s => ({...s, view: view.id, rotate: false, preserveView: false, frame: s.frame + 1}))}
      title={view.label}
      aria-label={view.label}
     >
      <span>{view.mark}</span>
     </Button>
    ))}
    <i />
    <Button variant="ghost" aria-label={state.rotate ? 'Pause rotation' : 'Rotate body'} title="Auto rotate" className={state.rotate ? 'active' : ''} onClick={() => setState(s => ({...s, rotate: !s.rotate}))}>
     {state.rotate ? <Pause size={17} /> : <RotateCw size={18} />}
    </Button>
    <Button variant="ghost" aria-label="Reset view and layers" title="Reset" onClick={reset}><RotateCcw size={17} /></Button>
   </nav>
   <div className="scene-caption">
    <span className="caption-line" />
    <span>{caption}</span>
    <span className="caption-line" />
   </div>
   {phone && !studying && guideMode === 'explore' && <AreaChips region={region} onRegion={pickRegion} />}
   <div className="bottom-dock glass">
    <div className="explode-control">
     <div className="explode-label"><label>What to see</label></div>
     <div className="layer-presets peel-presets">
      <Button variant="ghost" aria-pressed={state.layer === 'muscle'} onClick={() => setLayer('muscle')}>Muscles</Button>
      <Button variant="ghost" aria-pressed={state.layer === 'under'} onClick={() => setLayer('under')}>See under</Button>
      <Button variant="ghost" aria-pressed={state.layer === 'bone'} onClick={() => setLayer('bone')}>Bones</Button>
     </div>
    </div>
    <Button variant="ghost" className="dock-reset" onClick={reset} aria-label="Reset practice view">
     <RotateCcw size={18} /><span>Reset</span>
    </Button>
   </div>
   {guideMode === 'menu' && (
    <GuidedMenu
     routineStep={trainingProgress.routine.stepIndex}
     routineCompleted={Boolean(trainingProgress.routine.completedAt)}
     exercisesCompleted={trainingProgress.discomfortExercisesCompleted}
     onRoutine={startRoutine}
     onDiscomfort={startDiscomfort}
     onExit={leaveGuided}
    />
   )}
   {guideMode === 'routine' && (
    <RoutineGuide
     routine={BEGINNER_FULL_BODY_ROUTINE}
     stepIndex={routineStepIndex}
     completedStepIds={trainingProgress.routine.completedStepIds}
     onStep={moveRoutine}
     onExit={() => setGuideMode('menu')}
    />
   )}
   {guideMode === 'discomfort' && (
    <DiscomfortGuide
     region={region}
     onRegion={pickRegion}
     onComplete={completeDiscomfortExercise}
     onTechnique={item => { setGuideMode('explore'); chooseLesson(item); }}
     onExit={() => setGuideMode('menu')}
    />
   )}
   <footer className="studio-footer">
    <span>Drag to turn <b>·</b> Pinch to zoom <b>·</b> Tap a muscle</span>
    <Button variant="ghost" onClick={() => { setDetails(false); setLessonOpen(false); setPanel(null); setAbout(true); }}>
     Source & credits <ArrowUpRight size={12} />
    </Button>
   </footer>
   {showScene && progress < 100 && !error && (
    <div className="loading glass" role="status">
     <Activity size={18} />
     <div>
      <strong>{region ? `Loading ${activeRegion?.name.toLowerCase() ?? 'this area'}` : 'Loading the body'}</strong>
      <span>{progress}% · Wi‑Fi is best the first time.</span>
      <div className="loading-track"><i style={{width: `${progress}%`}} /></div>
     </div>
    </div>
   )}
   {error && (
    <div className="loading glass error" role="alert">
     <p>{error}</p>
     <Button variant="ghost" onClick={() => location.reload()}>Reload viewer</Button>
    </div>
   )}
   {studying && phone && (
    <aside className={`lesson-dock glass ${lessonOpen ? 'is-open' : 'is-peek'}`} aria-label={`${chosen?.name ?? 'Muscle'} lesson`}>
     <Button variant="ghost" className="lesson-toggle" onClick={() => setLessonOpen(open => !open)} aria-expanded={lessonOpen} aria-label={lessonOpen ? 'Show more of the body' : 'Read the lesson'}>
      {lessonOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
     </Button>
     <Button variant="ghost" className="icon-button lesson-close" onClick={closeLesson} aria-label="Close lesson"><X size={18} /></Button>
     {lessonBody}
    </aside>
   )}
   <Sheet open={studying && !phone} modal={false} disablePointerDismissal onOpenChange={open => { setDetails(open); if (!open) setLessonOpen(false); }}>
    <SheetContent initialFocus={detailTitle} className={`detail-sheet glass ${state.isolate ? 'is-isolated' : ''}`} showCloseButton={true}>
     {lessonBody}
    </SheetContent>
   </Sheet>
   <Sheet open={about} onOpenChange={setAbout}>
    <SheetContent className="about-sheet glass">
     <div className="eyebrow">FOR MASSAGE PRACTICE</div>
     <SheetTitle className="structure-title">Learn the muscles you work.</SheetTitle>
     <SheetDescription>A simple 3D body for masseuses. Turn the body, tap a muscle, and read how to find it.</SheetDescription>
     <div className="about-copy">
      <p>This is a practice tool, not a medical or diagnostic tool. Use light pressure when you are unsure. Always ask the client before you work a private or sensitive area.</p>
      <h3>Put it on your phone</h3>
      <p><strong>iPhone:</strong> tap Share, then Add to Home Screen. Open it from the home screen like an app.</p>
      <p><strong>Android:</strong> in Chrome, tap the menu, then Add to Home screen.</p>
      <p>Load it once on Wi‑Fi. After that, the body areas you have opened can work with weak data.</p>
      <p>The body is an adult male reference. Some muscles used in massage, such as the large back muscle (latissimus) and the deep waist muscle, are not in this model.</p>
      <h3>Source</h3>
      <p>BodyParts3D, © The Database Center for Life Science, licensed under CC Attribution 4.0 International.</p>
      <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" target="_blank" rel="noreferrer">Dataset license <ArrowUpRight size={14} /></a>
      <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html" target="_blank" rel="noreferrer">Original geometry & metadata <ArrowUpRight size={14} /></a>
     </div>
    </SheetContent>
   </Sheet>
   <InstallCoach ready={boot && progress >= 100 && !studying && guideMode === 'explore'} />
  </main>
 );
}
