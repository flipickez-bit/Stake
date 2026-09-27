# BAD BOSS — SOUND BIBLE (v0)

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**

**Statut** : version 0, du 2026-09-27. Elle réunit trois sources :
- la philosophie du GDD (`docs/GDD_07_UI_CAMERA_SON.md` §8.3) ;
- les repères de synchronisation posés en Phase 0.6 (`PHASE_0_6.md`) ;
- les **règles du POC « 3 PLANS »** (§6).

**Sons actuels** : ce sont des sons **provisoires synthétisés** (`src/audio/AudioDirector.ts`, WebAudio). L'architecture n'est pas liée à ces sons : remplacer un son ne change ni un cue, ni une durée, ni une branche.

---

## 1. Philosophie (GDD_07 §8.3.1, inchangée)

1. **Le son, c'est le timing comique.** Chaque gag a une chute sonore (*boing*, *tink*, HMPF).
2. **Le silence est un effet.**
   - Un vide de 250 à 400 ms avant la résolution d'un rebondissement.
   - Un seul silence par manche.
   - Jamais dans une perte directe.
   - L'ambiance reste à 5 %.
3. **Identité** : la sonnette DING, le HMPF, LE SIP.
4. **Les pertes sonnent drôle, jamais punitif** : pas de buzzer d'échec, pas de son « négatif ».
5. **Les gains montent en couches, pas en volume** : nombre de DING = classe de gain.
6. **Lisible les yeux fermés** : on reconnaît la classe de résultat au son seul.

## 2. Mixage (GDD_07 §8.3.2)

**Bus** : MASTER → MUSIC / SFX (GADGET, IMPACT, FOLEY) / VOICE / AMBIENCE / UI / STINGERS.

**Priorités** : stingers > voix > impacts > gadget > ambiance.

**Cibles** :
- environ −16 LUFS intégrés ;
- crêtes ≤ −1 dBTP ;
- chaque « bass hit » doublé d'un « thump » médium audible sur un haut-parleur de téléphone.

**Anti-fatigue** : ±5 % de hauteur et des pools de 3 à 6 variantes. Le choix de la variante vient de la **graine du book**, jamais de `Math.random()`.

## 3. Inventaire des cues implémentés (`SoundId`)

| Famille | Cues | Règle |
|---|---|---|
| UI | `click` | Retour d'interface uniquement (FIRE, choix d'un plan) |
| Anticipation | `creak`, `stretch`, `fuse`, `pfft`, `clunk`, `elevator` | Tronc neutre : identiques pour toutes les issues |
| Mouvement | `whoosh`, `spin`, `twang`, `snap`, `screech`, `spray`, `fall` | Calés sur l'image (repères Phase 0.6) |
| Impact | `thud`, `crash`, `glass`, `bonk`, `clang`, `crack`, `debris`, `paper`, `clink`, `tink` | Au contact, jamais avant |
| Résultat | `ding` (1 à 3 selon la classe), `gold`, `cheer`, `wahwah`, `deflate` | **Réservés au résultat réellement joué** (§6) |
| Personnages | `hmpf`, `laugh`, `sip`, `coo`, `plop`, `boing` | LE SIP = running gag, jamais un signal de perte |
| BOSS FIGHT | `giantRoar`, `roar`, `gold`, `clang` | `gold` (carillon doré) réservé au BOSS FIGHT |

## 4. Stingers de résultat (GDD_07 §8.3.5)

| Classe | Normal | Turbo |
|---|---|---|
| MISS | HMPF + « wah-wah » (0,6 s). **Pas de buzzer** | HMPF seul |
| SCRAPE | « pfff » + petit clic. **Ni pièces ni sonnette** | clic |
| HIT | **1 DING** | 1 DING court |
| BIG | **2 DING** + cuivres | 2 DING |
| MEGA | cascade de DING + chœur | court |
| LEGENDARY | jingle complet | court |
| K.O. du BOSS FIGHT | *tink*… **CRACK** + ovation (seule utilisation du CRACK) | court |

Règle du GDD : aucun son de gain pour un montant inférieur à la mise (x0,5 en GRUMPY), pour éviter les « pertes déguisées en gains ».

**Écart actuel, non corrigé dans ce POC :** l'impact de la classe SCRAPE (tier `T05`, `src/content/library.ts`) joue encore 1 DING. C'est à corriger avec les sons définitifs, ou plus tôt si vous le décidez. Le changement est d'une ligne et ne touche ni les maths ni les branches.

## 5. Feuilles de cues des plans du POC (GRUMPY)

**A · SWIVEL SLINGSHOT** (Phase 0.6) : `click` (prise), `creak` et `stretch` (tension), `snap` et `twang` (départ), `whoosh`, puis impact et DING selon la classe.

**B · ESPRESSO BLASTER** (prototype) :
- tronc : `click` (levier), `creak`, `pfft` ×2 (pression qui monte) ; attente réseau : `pfft` toutes les 700 ms ;
- tir (commun à toutes les issues) : `pfft` grave + `snap` ;
- fins :
  - tasse attrapée : `plop` puis LE SIP (`sip`, `hmpf`) ;
  - panne : `deflate`, `plop`, `pfft`, `laugh` ;
  - plein visage : impact de la bibliothèque (DING selon la classe) ;
  - surpression : `screech`, `spray`, `whoosh`, fenêtre ;
  - BOSS FIGHT : `gold`.

**C · COPIER CATAPULT** (prototype) :
- tronc : `click` (bouton), `clunk`, `paper` ×2 ; attente réseau : `clunk` toutes les 650 ms ;
- lancer (commun à toutes les issues) : `snap`, `boing`, `whoosh` ;
- fins :
  - bourrage : `crash`, `deflate`, `laugh` ;
  - pluie de copies : `paper`, `sip`, `hmpf` ;
  - ramette : impact de la bibliothèque ;
  - avalanche : `snap` ×2, `paper`, impact ;
  - BOSS FIGHT : `tink`, `gold`.

## 6. Règles du POC « 3 PLANS » (décision du 2026-09-27)

| Situation | Son |
|---|---|
| Survol d'un plan (READY) | **Aucun.** Seulement une petite animation d'attente (élastique qui vibre, vapeur, feuille qui sort) |
| Choix d'un plan | `click` discret (retour d'interface), une seule fois ; rien si le plan était déjà choisi |
| Manche | Seulement les sons du **gadget joué** |
| Résultat | Stinger de la classe du résultat **payé**, comme dans le jeu normal |
| **REVEAL OTHER PLANS** (bouton, panneau) | **Aucun son.** Ni DING, ni célébration, ni son de déception, pour AUCUN des plans affichés (x0 comme x100) |
| REVEAL ALL (expérimental, DEV) | Même règle : silence |

Ces règles sont vérifiées automatiquement :
- test unitaire : le composant OTHER PLANS ne référence aucun son, et le gestionnaire d'ouverture n'appelle pas l'audio ;
- test e2e : zéro appel à `AudioDirector.play` à l'ouverture du panneau.

## 7. À faire (sons définitifs, hors POC)

- Remplacer les sons synthétisés par des sons produits, avec les **mêmes identifiants** ; pools de variantes choisies par la graine du book.
- Bus de mixage et niveaux (§2).
- Stingers complets par classe (§4) ; ambiance d'open-space en couches.
- Voix (Bossish, Wendell, COO) ; limite de 16 voix simultanées.
