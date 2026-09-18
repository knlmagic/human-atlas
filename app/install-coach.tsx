import {useEffect, useState} from 'react';
import {Share, Smartphone, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {trackPwaInstalled} from './usage-analytics';

const DISMISS_KEY = 'atlas-install-dismissed';

export default function InstallCoach({ready = true}: {ready?: boolean}) {
 const [show, setShow] = useState(false);
 const [ios, setIos] = useState(false);
 const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);

 useEffect(() => {
  if (!ready) {
   setShow(false);
   return;
  }
  if (localStorage.getItem(DISMISS_KEY)) return;
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  if (window.navigator.standalone) return;
  const apple = /iphone|ipad|ipod/i.test(navigator.userAgent);
  setIos(apple);
  const onPrompt = (event: Event) => {
   event.preventDefault();
   setPromptEvent(event as InstallPromptEvent);
  };
  window.addEventListener('beforeinstallprompt', onPrompt);
  setShow(true);
  return () => window.removeEventListener('beforeinstallprompt', onPrompt);
 }, [ready]);

 const dismiss = () => {
  localStorage.setItem(DISMISS_KEY, '1');
  setShow(false);
 };

 const install = async () => {
  if (!promptEvent) return;
  try {
   await promptEvent.prompt();
   const choice = promptEvent.userChoice ? await promptEvent.userChoice : undefined;
   if (choice?.outcome === 'accepted') trackPwaInstalled();
  } catch (error) {
   console.warn('Home screen install was not completed.', error);
  }
  dismiss();
 };

 if (!show) return null;

 return (
  <aside className="install-coach glass" role="note">
   <Smartphone size={18} />
   <div>
    <strong>Keep this on your phone</strong>
    {ios
     ? <span>Tap the Share button, then <b>Add to Home Screen</b>. Open it from your home screen like an app. First load is best on Wi‑Fi.</span>
     : promptEvent
       ? <span>Add it to your home screen. After that, it opens like an app, even with weak data.</span>
       : <span>In Chrome, open the menu and tap <b>Add to Home screen</b>. First load is best on Wi‑Fi.</span>}
    <div className="install-actions">
     {promptEvent && !ios && <Button className="primary-action" onClick={install}><Share size={16}/>Add to phone</Button>}
     <Button variant="ghost" className="secondary-action" onClick={dismiss}>Not now</Button>
    </div>
   </div>
   <Button variant="ghost" className="icon-button" onClick={dismiss} aria-label="Dismiss"><X size={16}/></Button>
  </aside>
 );
}

interface InstallPromptEvent extends Event {
 prompt: () => Promise<unknown>;
 userChoice?: Promise<{outcome: 'accepted' | 'dismissed'}>;
}

declare global {
 interface Navigator {
  standalone?: boolean;
 }
}
