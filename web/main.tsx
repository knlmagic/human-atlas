import {createRoot} from 'react-dom/client';
import Home from '../app/page';
import '../app/globals.css';
createRoot(document.getElementById('root')!).render(<Home/>);
if ('serviceWorker' in navigator) {
 const hadControllerAtLoad = Boolean(navigator.serviceWorker.controller);
 let reloadingForUpdate = false;
 navigator.serviceWorker.addEventListener('controllerchange', () => {
  if (!hadControllerAtLoad || reloadingForUpdate) return;
  reloadingForUpdate = true;
  window.location.reload();
 });
 window.addEventListener('load', () => {
  navigator.serviceWorker.register('/sw.js').catch(error => {
   console.warn('Offline installation is unavailable.', error);
  });
 });
}
