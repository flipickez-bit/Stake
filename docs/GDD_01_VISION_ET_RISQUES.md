# BAD BOSS — GDD partie 1 : vision et risques (étapes 1 et 2)

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**

> Nom de travail : **BAD BOSS**. Les propositions de nom viendront plus tard (voir `TODO.md`).
> Langue de travail : français. Interface du jeu : anglais par défaut, localisée (Stake Engine transmet `lang`).

---

## ÉTAPE 1 : le jeu en 5 lignes

1. BAD BOSS est un jeu instantané de 3 secondes où l'on se venge, façon cartoon slapstick, d'un patron fictif et insupportable.
2. À chaque manche, trois plans de vengeance sont proposés. Chacun correspond à un **vrai** niveau de risque (GRUMPY, FURIOUS, UNHINGED), et le gadget utilisé change à chaque manche.
3. Stake Engine tire le résultat **avant** l'animation. L'animation, modulaire et pleine de rebondissements, ne fait que le raconter.
4. Plus le boss est mis K.O. de façon spectaculaire, plus le gain est gros : **l'état final du boss EST le résultat**.
5. Environ une manche sur 150, le boss devient géant. C'est le BOSS FIGHT, une échelle de x5 à x5 000 où chaque coup réussi fait monter le gain.

---

## ÉTAPE 2 : pourquoi la boucle peut être amusante

| Levier | Pourquoi ça marche |
|---|---|
| **Fantasme universel** | Tout le monde a eu (ou imaginé) un mauvais chef. On ressent une catharsis immédiate, sans culpabilité : le boss est fictif, la violence est cartoon et il revient vivant à chaque manche. |
| **Boucle courte, lisible et narrée** | On retrouve la structure des meilleurs jeux instantanés (Plinko, Crash, Mines) : choix, anticipation, résolution en ~3 s. Mais chaque manche raconte une **mini-histoire**, ce que ces jeux n'ont pas. |
| **La perte est un contenu** | Le boss qui esquive, se moque, se fait rater par sa propre photocopieuse : perdre fait rire. C'est le principal levier de rétention d'un jeu à haute fréquence. |
| **Curiosité combinatoire** | Gadget × scénario × réaction du boss × événement rare : le joueur relance pour voir « ce qui va sortir ». |
| **Lecture instantanée** | La pose finale du boss (debout, renversé, éjecté, en orbite) indique le résultat avant même le chiffre. |
| **Agence réelle** | Le choix du plan change vraiment le profil de risque (voir partie 2). Le joueur n'est pas trompé par une illusion. |
| **Rareté visible** | Super-gadgets, BOSS FIGHT, paliers x1 000+ : ce sont des événements dont on se souvient et qu'on a envie de partager. |

## Les 5 plus gros risques, et comment les neutraliser

### Risque 1 : répétition à très haute fréquence
À ~3 s par manche, un joueur voit **800 à 1 200 manches par heure**. 150 animations fixes seront toutes vues en moins d'une heure, et les plus fréquentes (les pertes) des dizaines de fois.

**Réponse :**
- Des animations **modulaires recombinables** (segments SETUP / ACTION / TWIST / IMPACT / REACTION) plutôt que des clips monolithiques.
- Une **rareté pondérée des variantes**, pour que certaines variantes de perte restent rares et continuent de surprendre après 500 manches.
- Des **variations procédurales bon marché** : angle de caméra, props du bureau, collègues en arrière-plan, accessoires du boss (pansement, casque, cheveux roussis), réplique du boss.
- Les pertes, qui représentent 42 à 84 % des manches, sont **courtes et drôles**. Le budget de production va d'abord à elles, pas aux big wins que l'on voit rarement.
- Mode turbo et tap-to-skip pour les joueurs qui veulent seulement le rythme.

### Risque 2 : une agence illusoire, perçue comme un trucage
Si les trois méthodes sont de simples skins sur les mêmes maths, les joueurs le découvrent (forums, stats de session) et le « choix » devient une insulte. Et si les faux espoirs sont trop fréquents, le joueur se dit que le jeu le nargue.

**Réponse :**
- Les trois emplacements sont de **vrais profils mathématiques** : 3 bet modes Stake Engine, même RTP, volatilités différentes.
- Une **charte de présentation honnête** (partie 2, §3.6) plafonne les teases et interdit tout compteur ou chiffre avant la révélation. Elle interdit aussi tout comportement adaptatif selon l'historique du joueur.

### Risque 3 : conformité (Stake Engine et juridictions)
- **Stake Engine fonctionne avec des résultats pré-calculés** (books). La manche entière est connue au moment de `/play`, donc **aucune décision prise en cours de manche ne peut changer le gain**. Le cash-out imaginé pour le BOSS FIGHT est donc impossible sous cette forme (voir partie 2, §3.7).
- **Near-miss et « pertes déguisées en gains »** (un gain inférieur à la mise célébré comme une victoire) : ce sont des sujets sensibles pour les régulateurs. Nous l'encadrons explicitement.
- **Thème « violence au travail »** : c'est un risque d'image pour les opérateurs. La réponse : cartoon strict, aucune arme réelle (ni arme à feu, ni couteau, ni explosif réaliste), le vocabulaire « gadgets » ou « plans » dans l'interface plutôt qu'« armes », un boss sans ressemblance avec une personne réelle, et aucune souffrance montrée. Le boss est vexé, jamais blessé de façon crédible.

### Risque 4 : coût de production et performance mobile de la « 3D ragdoll »
Un ragdoll physique temps réel est **non déterministe** : il est difficile de garantir que le boss atterrit « dans le cadre » au bon moment. Il est aussi coûteux en CPU sur mobile et cher à produire en 3D (rig, skinning, 150 variations).

**Réponse :**
- Un **« ragdoll simulé »** : poses clés exagérées plus du mouvement secondaire procédural (squash & stretch, ressorts, tremblements). Le mouvement qui porte le résultat est toujours scripté.
- La physique réelle est réservée aux **débris cosmétiques** (feuilles, gobelets, confettis), sans effet sur la lisibilité.
- Le choix technique final se fait à l'étape 10. **Hypothèse de travail** : un rendu « 3D cartoon » obtenu en 2D/2.5D (personnages Spine ou sprites pré-rendus depuis la 3D). On garde le look 3D avec le coût et la performance de la 2D.

### Risque 5 : rythme contre lisibilité contre latence
Les twists, fake-outs et big wins doivent tenir en 2,5 à 5 s. La latence réseau de `/play` s'y ajoute, et en turbo (~1,2 s) le résultat doit rester lisible.

**Réponse :**
- Un **segment d'élan neutre** (0 à 600 ms, identique quel que soit le résultat) démarre au tap et masque la latence.
- Une **grammaire de résultat à 3 couches**, lisible en moins de 300 ms : pose du boss, couleur, puis multiplicateur.
- Des budgets de durée par catégorie de script (partie 2, §3.4) et le tap-to-skip.

### Risques secondaires (à surveiller)
- **Vitesse et jeu responsable** : ~1 000 manches par heure avec 3,5 % d'avantage maison, c'est ~35 mises perdues par heure en moyenne. Le turbo et l'autoplay accélèrent encore. Il faudra vérifier les exigences des juridictions (durée minimale de manche, autoplay). Le champ `jurisdiction` renvoyé par `/wallet/authenticate` doit être lu et respecté. Ses clés (`disabledTurbo`, `disabledAutoplay`, `minimumRoundDuration`…) ont été **vérifiées** dans le web-sdk officiel (voir `GDD_07`, §8.1.6). **INFORMATION STAKE ENGINE REQUISE** : leur sémantique exacte (unités, emplacements d'affichage).
- **Propriété intellectuelle** : le style doit être original (pas d'emprunt identifiable à des licences cartoon existantes).
