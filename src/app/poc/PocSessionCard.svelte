<script lang="ts">
  /** Fin des 30 manches d'une session : répondre maintenant, ou continuer à jouer (facultatif, compté à part). */
  import type { PocSession } from '../../dev/pocPlaytest';

  let { session, onAnswer }: { session: PocSession; onAnswer: () => void } = $props();
</script>

<div class="card" role="status" data-testid="poc-session-done">
  <b>SESSION {session.index}/2 TERMINÉE</b>
  <span>Tu peux continuer à jouer (facultatif){session.extraRounds > 0 ? ` · ${session.extraRounds} manche${session.extraRounds > 1 ? 's' : ''} en plus` : ''}.</span>
  <button onclick={onAnswer} data-testid="poc-answer">Répondre aux questions</button>
</div>

<style>
  .card { position: absolute; right: 10px; bottom: 10px; z-index: 4; display: flex; flex-direction: column; gap: 6px; max-width: min(260px, calc(100% - 20px)); padding: 10px 12px; border-radius: 12px; background: rgba(31, 36, 71, 0.95); border: 2px solid var(--bb-violet); color: #fff; font-size: 12px; }
  b { letter-spacing: 1px; color: var(--bb-yellow); }
  span { opacity: 0.85; line-height: 1.35; }
  button { height: 36px; border-radius: 10px; border: 0; background: var(--bb-yellow); color: var(--bb-ink); font-weight: 900; cursor: pointer; }
  button:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
  @media (orientation: portrait) and (max-aspect-ratio: 4/5) { .card { top: 10px; bottom: auto; } }
</style>
