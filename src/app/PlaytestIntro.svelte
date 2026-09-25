<script lang="ts">
  import { PLAYTEST_TARGET } from '../dev/playtest';

  let { onStart, onCancel, onPreviewBossFight }: { onStart: () => void; onCancel: () => void; onPreviewBossFight: () => void } = $props();
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="pt-intro-title" data-testid="playtest-intro">
  <div class="panel">
    <h2 id="pt-intro-title">PLAYTEST {PLAYTEST_TARGET}</h2>
    <p class="tag">LOCAL DEV ONLY · argent fictif</p>
    <ul>
      <li>Joue {PLAYTEST_TARGET} manches comme tu le ferais normalement : choisis tes Rage Levels, ta mise, ta vitesse.</li>
      <li>Aucune question pendant la partie. 6 questions à la fin.</li>
      <li>Les données restent dans ce navigateur. Tu choisis ensuite de les copier ou de les enregistrer.</li>
    </ul>
    <p class="small">Le solde fictif est remis à $1,000.00 au départ.</p>
    <button class="preview" onclick={onPreviewBossFight} data-testid="bf-preview-intro">▶ PREVIEW BOSS FIGHT <small>(sans mise, hors données)</small></button>
    <div class="buttons">
      <button class="primary" onclick={onStart} data-testid="playtest-go">Commencer</button>
      <button onclick={onCancel}>Annuler</button>
    </div>
  </div>
</div>

<style>
  .overlay { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; background: rgba(10, 12, 26, 0.8); padding: 16px; }
  .panel { width: min(440px, 100%); background: #1f2447; border: 2px solid var(--bb-violet); border-radius: 16px; padding: 18px 20px; color: #fff; }
  h2 { margin: 0; letter-spacing: 3px; color: var(--bb-yellow); }
  .tag { margin: 4px 0 10px; font-size: 11px; font-weight: 800; color: #ff8a00; letter-spacing: 1px; }
  ul { margin: 0; padding-left: 18px; display: grid; gap: 6px; line-height: 1.4; font-size: 14px; }
  .small { font-size: 12px; opacity: 0.7; }
  .buttons { display: flex; gap: 8px; margin-top: 14px; }
  .preview { width: 100%; height: 40px; border-radius: 10px; border: 2px dashed var(--bb-yellow); background: transparent; color: var(--bb-yellow); font-weight: 800; cursor: pointer; }
  .preview small { font-weight: 600; opacity: 0.8; }
  button { flex: 1; height: 44px; border-radius: 12px; border: 2px solid #3a4280; background: #2b3160; color: #fff; font-weight: 800; cursor: pointer; }
  .primary { background: var(--bb-yellow); color: var(--bb-ink); border-color: var(--bb-yellow); }
  button:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
</style>
