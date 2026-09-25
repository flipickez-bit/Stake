// Pixi sans `new Function` : compatible avec une CSP stricte (préversions intégrées, casinos).
import 'pixi.js/unsafe-eval';
import { mount } from 'svelte';
import App from './app/App.svelte';
import './app/global.css';

const target = document.getElementById('app');
if (!target) throw new Error('#app introuvable');

export default mount(App, { target });
