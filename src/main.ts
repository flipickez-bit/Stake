// Pixi sans `new Function` : compatible avec une CSP stricte (préversions intégrées, casinos).
import 'pixi.js/unsafe-eval';
import { mount } from 'svelte';
import App from './app/App.svelte';
import './app/global.css';

const target = document.getElementById('app');
if (!target) throw new Error('#app introuvable');

// DEV : planches d'art (revue de cohérence, ART BIBLE §14). Import dynamique : absent du build de production.
const artSheet = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('artsheet') : null;

export default artSheet
  ? void import('./dev/artSheet').then((m) => {
    const q = new URLSearchParams(window.location.search);
    if (artSheet === 'concept') {
      const world = (q.get('world') ?? 'grumpy') as 'grumpy' | 'furious' | 'unhinged';
      return m.mountConcept(target, world, Number(q.get('w') ?? 1600), Number(q.get('h') ?? 900));
    }
    return artSheet === 'rig' ? m.mountRigSheet(target, Number(q.get('t') ?? 700), q.get('only')) : m.mountArtSheet(target, artSheet);
  })
  : mount(App, { target });
