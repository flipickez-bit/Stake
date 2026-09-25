# TODO — BAD BOSS

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**

## P0 : décisions et informations externes
- [ ] **Feu vert CODE du MVP** (architecture et roadmap à valider).
- [ ] Obtenir de Stake Engine (liste complète : `docs/STAKE_ENGINE_FAITS_VERIFIES.md` §11) :
  - [ ] sémantique de `autoEndRoundDisabled` / `auto_close_disabled=True` sur des modes de base (manches à gain nul comprises) ;
  - [ ] statut officiel du paquet npm `stake-engine`, et une version à erreurs structurées ;
  - [ ] format de `round.state`, de `round.payoutMultiplier` et du corps d'erreur RGS ;
  - [ ] contrat du replay (`/bet/replay/...`, paramètres d'URL, `event`) ;
  - [ ] `minimumRoundDuration` (unité, point de départ, portée) et `disabledSlamstop` (portée) ;
  - [ ] contrat de `/bet/event` (aucune dépendance BAD BOSS en attendant) et `meta` ;
  - [ ] plage de RTP, acceptation de 3 modes à coût 1,0, volume de books attendu ;
  - [ ] limites d'upload front (taille, polices, CSP), guidelines de contenu.
- [ ] Commercial : **licence Spine Editor**. Juridique : **clearance du nom BAD BOSS** et règles anti-ressemblance du boss.
- [ ] Décision **D-GADGET** (identité du gadget reconstructible depuis la manche) avant le 4e gadget. Recommandation : option A (tirage par la graine du book), `TECH_ARCHITECTURE.md` §2.5.

## P1 : MVP (après le feu vert, voir `MVP_ROADMAP.md`)
- [ ] Phase 0 : scaffold, CI, MockRgs, fixtures, GameFlow minimal, squelette du DEV PANEL, **lien de préversion**.
- [ ] Phase 1 : GameFlow complet (I1 à I8), UI, FeatureGate, READY_GATE, vitesse et skip, reprise et replay (présentation de débogage).
- [ ] Phase 2 (parallèle) : jeu `bad_boss` dans le **math-sdk officiel**, books avec événements de présentation et graines, simulation à grande échelle, `rgs_verification.py`, comparaison statistique, upload ACP.
- [ ] Phase 3 : `StakeRgsAdapter` (client `stake-engine` + observateur d'erreurs + délais + réinstanciation), staging Stake, mapping des erreurs.
- [ ] Phase 4 : séquenceur, scène 2.5D, Rig, bibliothèques partagées, 32 branches MVP, DEV PANEL complet, `check:content`, **porte G2 (test de fun)**.
- [ ] Phase 5 : audio et VFX. Phase 6 : BOSS FIGHT. Phase 7 : optimisation mobile. Phase 8 : QA. Phase 9 : RC.

## P2 : maths
- [ ] Après les tests joueurs : réévaluer le hit rate d'UNHINGED (variante `unhinged_x12` prête, désactivée) et la fréquence du BOSS FIGHT.
- [ ] Porter `config/rage_levels.json` dans le jeu math-sdk (source de vérité partagée Python et TS).

## P3 : après le MVP
- [ ] Assets définitifs du périmètre MVP (après G2).
- [ ] Les 12 gadgets restants : lot A (LOW), lot B (MEDIUM), lot C (HIGH), `GDD_04` §5.9.
- [ ] Autres super-gadgets, bonus additionnels (annexe du GDD_05), choix cosmétique d'attaque en BOSS FIGHT (à tester).
- [ ] Bonus buy (seulement si `disabledBuyFeature` est faux et si c'est validé).
- [ ] Branding final (après clearance).
