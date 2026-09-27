<script lang="ts">
  import { POC_SESSION_ROUNDS } from '../../dev/pocPlaytest';

  let { onStart, onCancel }: { onStart: () => void; onCancel: () => void } = $props();
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="poc-intro-title" data-testid="poc-playtest-intro">
  <div class="panel">
    <h2 id="poc-intro-title">PLAYTEST · 3 PLANS</h2>
    <p class="tag">LOCAL DEV ONLY · argent fictif · prototype</p>
    <ul>
      <li>Deux sessions de {POC_SESSION_ROUNDS} manches, dans le niveau GRUMPY.</li>
      <li>Avant chaque tir, choisis un plan : <b>A</b>, <b>B</b> ou <b>C</b> (touche le gadget dans le bureau). Les trois ont exactement les mêmes chances.</li>
      <li>Les deux sessions diffèrent seulement par ce qui est proposé après la manche. L'ordre est tiré au hasard.</li>
      <li>Quelques questions après chaque session. Après la {POC_SESSION_ROUNDS}<sup>e</sup> manche, tu peux continuer à jouer si tu en as envie (facultatif).</li>
      <li>Les données restent dans ce navigateur. Tu choisis ensuite de les copier ou de les enregistrer.</li>
    </ul>
    <p class="small">Le solde fictif est remis à $1,000.00 au début de chaque session. B et C sont des prototypes visuels.</p>
    <div class="buttons">
      <button class="primary" onclick={onStart} data-testid="poc-playtest-go">Commencer</button>
      <button onclick={onCancel}>Annuler</button>
    </div>
  </div>
</div>

<style>
  .overlay { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; background: rgba(10, 12, 26, 0.8); padding: 16px; overflow-y: auto; }
  .panel { width: min(460px, 100%); background: #1f2447; border: 2px solid var(--bb-violet); border-radius: 16px; padding: 18px 20px; color: #fff; }
  h2 { margin: 0; letter-spacing: 3px; color: var(--bb-yellow); }
  .tag { margin: 4px 0 10px; font-size: 11px; font-weight: 800; color: #ff8a00; letter-spacing: 1px; }
  ul { margin: 0; padding-left: 18px; display: grid; gap: 6px; line-height: 1.4; font-size: 14px; }
  .small { font-size: 12px; opacity: 0.7; }
  .buttons { display: flex; gap: 8px; margin-top: 14px; }
  button { flex: 1; height: 44px; border-radius: 12px; border: 2px solid #3a4280; background: #2b3160; color: #fff; font-weight: 800; cursor: pointer; }
  .primary { background: var(--bb-yellow); color: var(--bb-ink); border-color: var(--bb-yellow); }
  button:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
</style>
