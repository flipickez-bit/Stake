# TODO — BAD BOSS

## P0 : bloquant pour la suite
- [ ] Faire confirmer par Stake Engine (ou lire `stake-engine.com/docs` depuis un poste non restreint) :
  - [ ] la plage de RTP autorisée et la portée des « 3-star volatility limits » ;
  - [ ] l'acceptation de 3 modes à coût 1,0 comme niveaux de volatilité ;
  - [ ] les clés complètes de `jurisdiction` (turbo, autoplay, bonus buy, durée minimale de manche) ;
  - [ ] l'unité monétaire (6 décimales contre le commentaire « 1000 = $10.00 ») ;
  - [ ] les guidelines de contenu (violence cartoon) et d'approbation.
- [ ] Étape 5 : 15 gadgets (5 par niveau) + branches d'animation, mappés sur les classes MISS / SCRAPE / HIT / BIG / MEGA / LEGENDARY et les scripts CLEAN_MISS / BACKFIRE / TEASE / GRAZE / DIRECT / COMEBACK / CHAIN / SUPER.
- [ ] Étape 6 : BOSS FIGHT détaillé (entrées, attaques, coups bloqués, K.O., caméra, son).
- [ ] Étape 7 : boss mascotte (nom, silhouette, expressions, idles, provocations).
- [ ] Étape 8 : UI mobile et desktop, caméra, sound design (silence comme outil).

## P1 : avant le prototype
- [ ] Étape 9 : analyse Stake Engine complète (init, reprise, erreurs, déploiement).
- [ ] Étape 10 : choix de la stack (comparatif Phaser / PixiJS / Three.js / Babylon.js, 2D / 2.5D / 3D).
- [ ] Étape 11 : architecture du projet.
- [ ] Étape 12 : roadmap MVP (phases 0 à 9).
- [ ] Décider la représentation du joueur (invisible, mains, employé).
- [ ] Proposer 10 noms de jeu alternatifs.

## P2 : maths, phase 2
- [ ] Porter `math/model/bad_boss_math.py` dans un jeu du math-sdk officiel (`games/bad_boss/`), 3 `BetMode`.
- [ ] Générer les books (multiplicateur × script × variante) et répartir les poids entiers exacts.
- [ ] Passer `utils/rgs_verification.py` sur les 3 modes.
- [ ] Réévaluer après tests joueurs : fréquence du BOSS FIGHT (1/150), palier x10 000 éventuel pour UNHINGED, hit rate d'UNHINGED (15,6 %).

## P3 : plus tard
- [ ] Bonus buy (4e mode, ~100x), seulement si les juridictions l'autorisent.
- [ ] Autres bonus (SECRET WEAPON ROOM, MONDAY MADNESS, CEO FLOOR…) : toujours déclenchés **dans** la manche, jamais par jauge persistante.
- [ ] Environnements supplémentaires.
