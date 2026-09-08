import {flushSync} from 'react-dom';
import {registerAtlasTools} from './agent-tools';
import {useEffect, useMemo, useRef, useState} from 'react';
import {useIsMobile} from '@/hooks/use-mobile';
import {Activity, ArrowUpRight, ChevronLeft, ChevronRight, Focus, Info, Layers3, Pause, RotateCcw, RotateCw, Search, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Sheet, SheetContent, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import {Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty} from '@/components/ui/combobox';
import AnatomyScene from './scene';
import TrainingPanel from './training-panel';
import TrainingCard from './training-card';
import InstallCoach from './install-coach';
import {DEFAULT_VISIBLE, type Atlas, type Concept, type LayerMode, type SceneState, type View} from './anatomy';
import {
 LESSONS,
 REGIONS,
 displayName,
 lessonForName,
 lessonSequence,
 lessonsForRegion,
 partsForLesson,
 partsInRegion,
 searchTraining,
 type Lesson,
 type RegionId,
} from './training';

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
 const [about, setAbout] = useState(false);
 const [query, setQuery] = useState('');
 const [chosen, setChosen] = useState<Concept | null>(null);
 const [region, setRegion] = useState<RegionId | null>(null);
 const [started, setStarted] = useState(false);
 const [boot, setBoot] = useState(false);
 const isMobile = useIsMobile();
 const phone = boot && isMobile;
 const waiting = phone && !started;

 useEffect(() => {
  const abort = new AbortController();
  setProgress(0);
  setError('');
  setAtlas(null);
  setChosen(null);
  setDetails(false);
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
  if (isMobile) setPanel('layers');
 }, [isMobile]);

 useEffect(() => {
  const key = (e: KeyboardEvent) => {
   if (e.key === '/' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
    e.preventDefault();
    setPanel('search');
    setDetails(false);
   }
  };
  window.addEventListener('keydown', key);
  return () => window.removeEventListener('keydown', key);
 }, []);

 const parts = useMemo(() => new Map(atlas?.parts.map(p => [p.id, p])), [atlas]);
 const selectedParts = state.selected.map(id => parts.get(id)).filter(p => !!p);
 const selected = selectedParts[0];
 const lesson = chosen ? LESSONS.find(item => item.id === chosen.id) ?? lessonForName(chosen.name) : undefined;
 const activeRegion = REGIONS.find(item => item.id === region);
 const lessons = region ? lessonsForRegion(region) : [];
 const results = useMemo(() => (atlas ? searchTraining(atlas, query) : []), [atlas, query]);

 const chooseLesson = (next: Lesson, ids?: string[]) => {
  if (!atlas) return;
  const elements = ids?.length ? ids : partsForLesson(atlas, next);
  if (!elements.length) return;
  setStarted(true);
  setRegion(next.region);
  setChosen({id: next.id, name: next.title, elements});
  setState(s => ({
   ...s,
   selected: elements,
   isolate: false,
   ghost: true,
   rotate: false,
   visibleIds: partsInRegion(atlas, next.region),
   preserveView: true,
   frame: s.frame + 1,
  }));
  setDetails(true);
  setPanel(null);
 };

 const choose = (c: Concept) => {
  const next = LESSONS.find(item => item.id === c.id) ?? lessonForName(c.name);
  if (next && atlas) {
   chooseLesson(next, c.elements.length ? c.elements : undefined);
   return;
  }
  setChosen({...c, name: displayName(c.name)});
  setState(s => ({...s, selected: c.elements, isolate: false, ghost: true, rotate: false, preserveView: true, frame: s.frame + 1}));
  setDetails(true);
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
  setChosen({id: part.conceptId, name: displayName(part.name), elements: [id]});
  setState(s => ({...s, selected: [id], isolate: false, ghost: true, rotate: false, preserveView: true, frame: s.frame + 1}));
  setDetails(true);
  setPanel(null);
 };

 const pickRegion = (id: RegionId | null) => {
  if (phone && !id) {
   setStarted(false);
   setRegion(null);
   setChosen(null);
   setDetails(false);
   setState(s => ({...s, selected: [], isolate: false, ghost: false, visibleIds: null, rotate: false}));
   setPanel('layers');
   return;
  }
  const next = REGIONS.find(item => item.id === id);
  setStarted(true);
  setRegion(id);
  setChosen(null);
  setDetails(false);
  setError('');
  if (!showScene) setProgress(0);
  setState(s => ({
   ...s,
   selected: [],
   isolate: false,
   ghost: false,
   visibleIds: id && atlas ? partsInRegion(atlas, id) : null,
   view: next?.view ?? 'three-quarter',
   rotate: false,
   preserveView: false,
   frame: s.frame + 1,
  }));
 };

 const reset = () => {
  setRegion(null);
  setStarted(!phone);
  setState(s => ({...initial, visible: DEFAULT_VISIBLE, reset: s.reset + 1, frame: s.frame + 1}));
  setChosen(null);
  setDetails(false);
  setPanel(phone ? 'layers' : null);
 };

 const setLayer = (layer: LayerMode) => setState(s => ({...s, layer, isolate: layer === 'muscle' ? s.isolate : false}));
 const openPanel = (next: 'layers' | 'search') => {
  setDetails(false);
  setPanel(p => (p === next ? null : next));
 };

 const lessonNav = lesson && region ? lessonSequence(region, lesson.id) : undefined;
 const showScene = Boolean(atlas && boot && !waiting);
 const caption = !showScene
  ? 'Pick a body area'
  : state.isolate
    ? (chosen?.name ?? 'One muscle')
    : region
      ? activeRegion?.name ?? 'Body area'
      : 'Adult male · massage practice';

 const fallbackText = selected
  ? `${displayName(selected.name)} is part of the ${selected.system} layer. Pick a listed muscle to get a short training note.`
  : 'Tap a muscle to learn how to find it and how to work it.';

 return (
  <main className={`studio ${waiting ? 'is-waiting' : ''}`}>
   {showScene && atlas && (
    <AnatomyScene
     atlas={atlas}
     state={{...state, inspectorOpen: details && selectedParts.length > 0}}
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
    <div className="identity-meta">{showScene ? 'Tap a muscle to learn it' : 'Pick a body area to load the body'}</div>
   </header>
   <nav className="top-actions" aria-label="Practice panels">
    <Button variant="ghost" className={panel === 'search' ? 'active' : ''} onClick={() => openPanel('search')} aria-label="Find a muscle">
     <Search size={18} /><span>Find a muscle</span><kbd>/</kbd>
    </Button>
    <Button variant="ghost" className="icon-button" aria-label="About this atlas" onClick={() => { setDetails(false); setPanel(null); setAbout(true); }}>
     <Info size={18} />
    </Button>
   </nav>
   <TrainingPanel
    region={region}
    lessons={lessons}
    selectedId={lesson?.id}
    onRegion={pickRegion}
    onLesson={item => chooseLesson(item)}
    onStartArea={lessons[0] ? () => chooseLesson(lessons[0]) : undefined}
    onClose={() => setPanel(null)}
    mobileOpen={panel === 'layers'}
    waiting={waiting}
    phone={phone}
   />
   {panel === 'search' && (
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
    {(['three-quarter', 'front', 'side', 'back'] as View[]).map((v, i) => (
     <Button
      variant="ghost"
      key={v}
      className={state.view === v ? 'active' : ''}
      aria-pressed={state.view === v}
      onClick={() => setState(s => ({...s, view: v, rotate: false, preserveView: false, frame: s.frame + 1}))}
      title={`${v} view`}
      aria-label={`${v} view`}
     >
      <span>{['¾', 'F', 'S', 'B'][i]}</span>
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
   <div className="bottom-dock glass">
    <Button variant="ghost" className="mobile-only dock-layers" onClick={() => openPanel('layers')} aria-label="Open body areas">
     <Layers3 size={20} /><span>Areas</span>
    </Button>
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
   <footer className="studio-footer">
    <span>Drag to turn <b>·</b> Pinch to zoom <b>·</b> Tap a muscle</span>
    <Button variant="ghost" onClick={() => { setDetails(false); setPanel(null); setAbout(true); }}>
     Source & credits <ArrowUpRight size={12} />
    </Button>
   </footer>
   {showScene && progress < 100 && !error && (
    <div className="loading glass" role="status">
     <Activity size={18} />
     <div>
      <strong>{region ? `Loading ${activeRegion?.name.toLowerCase() ?? 'this area'}` : 'Preparing the body'}</strong>
      <span>{progress}% · Only this area downloads first. Wi‑Fi is best.</span>
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
   <Sheet open={details && selectedParts.length > 0} modal={false} disablePointerDismissal onOpenChange={setDetails}>
    <SheetContent initialFocus={detailTitle} className={`detail-sheet glass ${state.isolate ? 'is-isolated' : ''}`} showCloseButton={true}>
     <div className="detail-header">
      <div className="detail-accent" style={{background: '#a85b50'}} />
      <div className="eyebrow">{activeRegion?.name ?? lesson?.region ?? 'Muscle'}{lessonNav && lessonNav.index >= 0 ? ` · ${lessonNav.index + 1} of ${lessonNav.total}` : ''}</div>
      <SheetTitle ref={detailTitle} tabIndex={-1} className="structure-title">{chosen?.name}</SheetTitle>
     </div>
     <div className="detail-scroll" key={`${chosen?.id}-${state.isolate}`}>
      <SheetDescription className="sr-only">{lesson?.does ?? chosen?.name}</SheetDescription>
      <TrainingCard lesson={lesson} fallback={fallbackText} />
     </div>
     <div className="detail-actions">
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
      <Button variant="ghost" className="secondary-action" onClick={() => { setState(s => ({...s, selected: [], isolate: false, ghost: false})); setDetails(false); }}>
       Clear
      </Button>
     </div>
    </SheetContent>
   </Sheet>
   <Sheet open={about} onOpenChange={setAbout}>
    <SheetContent className="about-sheet glass">
     <div className="eyebrow">FOR MASSAGE PRACTICE</div>
     <SheetTitle className="structure-title">Learn the muscles you work.</SheetTitle>
     <SheetDescription>A simple 3D body for masseuses. Pick a body area, tap a muscle, and read how to find it.</SheetDescription>
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
   <InstallCoach ready={boot && !waiting && progress >= 100} />
  </main>
 );
}
