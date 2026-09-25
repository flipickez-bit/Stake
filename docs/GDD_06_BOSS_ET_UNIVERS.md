# BAD BOSS — GDD partie 6 : le boss mascotte et son univers (étape 7)

> **BAD BOSS — WORKING TITLE — TRADEMARK/CLEARANCE REQUIRED**

> Objectif : qu'une capture d'écran d'une seconde suffise pour dire « c'est BAD BOSS ».
> Recette de reconnaissance : **rectangle violet + cravate jaune + la mèche + le mug à son effigie**.

---

## 7.0 Fiche d'identité

| | |
|---|---|
| **Nom** | **Barnaby « B.B. » Bottomline**. B.B. = **B**AD **B**OSS : le nom du jeu est caché dans ses initiales |
| **Titre** | *Regional Vice President of Everything* (plaque dorée sur son bureau) |
| **Âge** | Indéterminé, « l'âge d'un boss » |
| **Devise** | Aucune, il ne parle qu'en *Bossish* (§7.2) |
| **Aime** | lui-même, son mug, son portrait, son fauteuil, sa sonnette, qu'on l'appelle « sir » |
| **Déteste** | les vendredis, les augmentations, le rire des autres, les pigeons (sauf quand ils le servent) |

**Règles anti-ressemblance** (validation juridique recommandée) :
- aucune coiffure, silhouette, couleur de cheveux ou tic associé à une personnalité publique : pas de mèche blonde ou orange balayée, pas de moustache emblématique ;
- aucun trait ethnique caricaturé. Les traits sont exagérés **géométriquement** (rectangles, mâchoire carrée), pas « ethniquement » ;
- teinte de peau cartoon non réaliste et stable ;
- aucun logo, aucune marque, aucun nom d'entreprise réel dans son univers ;
- aucune référence à une série ou un film de bureau existant (pas de mug « World's Best Boss », pas de nom de personnage connu).

## 7.1 Silhouette et design

**Forme générale : « le frigo en costume ».**
- Torse : un **rectangle massif**, épaules carrées, 2,5 têtes de large.
- Jambes : **minuscules**, 0,8 tête.
- Tête : petite (1 unité), surmontée d'un **casque de cheveux noirs gominés**, une coque brillante et rigide qui ne bouge jamais.
- **La mèche** : **l'unique courbe** de tout le personnage, qui jaillit du casque.
- Hauteur totale : environ 4,5 têtes. Lisible à 48 px de haut.

**Langage des formes** :
- le boss est tout en rectangles : corporate, rigide, massif ;
- Wendell est tout en lignes fines : fragile ;
- COO est rond : chaos.

**Couleurs** (tokens proposés) :

| Élément | Couleur | Rôle |
|---|---|---|
| Costume croisé | violet profond `#5B2A86` | Masse principale, se détache du décor bleu-gris |
| Cravate (à clip) | jaune `#FFC400` | Accent de marque, lisible de loin |
| Boutons, montre, boutons de manchette « BB » | or `#E8B530` | Richesse, égo |
| Casque de cheveux | noir bleuté `#1B1F3B` | Contraste maximal avec la mèche |
| Peau | pêche cartoon `#F3B58E`, qui vire au rose, au rouge puis au violet avec la colère | La couleur **est** une expression |
| Dents | blanc parfait `#FFFFFF` | Sourire carnassier |

**Visage** :
- mâchoire carrée, grande bouche avec une rangée de dents parfaites, petits yeux vifs ;
- **LE MONOSOURCIL** : un seul sourcil épais qui se **scinde en deux** sous le choc. C'est un deuxième indicateur d'émotion, très lisible ;
- pas de lunettes (elles masqueraient les yeux).

**Accessoires fixes** : montre en or (« tick-tock »), chaussures miroir, boutons de manchette aux initiales « BB ». Jamais de symboles monétaires, car l'iconographie de l'argent est réservée aux gains.

### La mèche : l'indicateur d'émotion

| État | Forme de la mèche | Quand |
|---|---|---|
| Neutre | petite boucle souple | idle |
| Content de lui | boucle bien ronde et brillante | après une perte du joueur |
| Furieux | **droite comme un pic**, qui vibre | colère, entrée BOSS FIGHT |
| Touché | **ressort** qui oscille | SCRAPE, HIT |
| Sonné | **spirale** | T1+, dazed |
| Perplexe | point d'interrogation | ARC-05 (l'ignorant) |
| Amoureux (de lui-même) | cœur | devant son portrait ou son reflet |
| BOSS FIGHT | éclair électrique | pendant le combat |
| Vaincu | pend mollement | K.O. |

## 7.2 Personnalité et voix

- **Vaniteux** : il a son propre visage sur son mug et il est « employé du mois » depuis 12 mois.
- **Paresseux et radin** : il prend le snack gratuit, les canettes et les compliments.
- **Inconscient du danger** : il ne voit **jamais** le gadget arriver. C'est une règle du tronc commun : il est toujours occupé (téléphone, paperasse, café).
- **Lâche, mais se croit invincible** : quand il s'en sort, il s'attribue le mérite (« je l'avais prévu »).
- **N'apprend jamais** : il revient chaque manche, identique, avec un pansement.

**Voix : le *Bossish***. Un charabia grave et aboyé (« HRMF », « BLARB », « WAH-DUH »). Il ne prononce **jamais de vrais mots**, ce qui donne zéro coût de localisation dans 16 langues et aucune phrase mal comprise.
- **« HMPF »** : son signature, en fin de LE SIP.
- **Rire** : « HOH-HOH-HMPF ».
- **Bulles de pensée** : pictogrammes dessinés (montre, dossier, flamme, Z…), jamais d'emoji système, dont le rendu varie selon les appareils.

## 7.3 Planche d'expressions (12)

| # | Expression | Signes | Usage |
|---|---|---|---|
| 1 | SMUG | yeux mi-clos, sourire en coin, mèche ronde | victoire du boss, LE SIP |
| 2 | BORED | paupières tombantes, joue dans la main | idle, attente |
| 3 | ANNOYED | monosourcil froncé, peau rose | provocation, tick-tock |
| 4 | FURIOUS | peau rouge, mèche en pic, dents serrées | entrée BOSS FIGHT |
| 5 | SHOCKED | **sourcil scindé**, bouche en O | au moment de la menace ou de l'impact, **aussi bien dans les gains que dans les TEASE**. Jamais avant D1 : sinon, l'expression révélerait l'issue |
| 6 | DAZED | yeux en spirale, étoiles, mèche en spirale | T1+ |
| 7 | SCARED | dents qui claquent, sueur | ARC-02 (juste après s'être sauvé) |
| 8 | GLOATING | tête en arrière, grand rire | RE_BOSS_LAUGH |
| 9 | SLEEPY | bulle « Z », mèche qui monte et descend | idle sieste |
| 10 | FAKE-NICE | sourire trop large, yeux fermés | quand il donne du travail à Wendell |
| 11 | SULKING | lèvre inférieure en avant, bras croisés | SCRAPE |
| 12 | INVINCIBLE | torse bombé, bisou au biceps | ARC-09, RE_BOSS_FLEX |

## 7.4 Idles : drôle même quand il ne se passe rien

Les idles se jouent en état READY. Pool pondéré de séquences de 3 à 6 s, avec un anti-répétition (pas deux fois la même dans les 4 dernières). Les idles ne font partie d'aucune manche : ils ne sont ni repris ni rejoués, et peuvent utiliser un générateur aléatoire de session.
- **Règles** : l'idle ne passe jamais devant l'UI ni les cartes. Au tap sur FIRE, il est interrompu en 100 ms et le boss reprend sa pose d'occupation (téléphone ou paperasse) pour le tronc commun.

| Idle | Description | Poids |
|---|---|---|
| **Tick-tock** | Il tapote sa montre en or, « tick-tock ». C'est aussi la provocation par défaut | élevé |
| **Le Sip** | Il réajuste sa cravate, boit une gorgée petit doigt levé, « HMPF » | élevé |
| **La sonnette** | DING : Wendell accourt avec une pile de dossiers, se fait aboyer dessus en *Bossish*, repart en courant | élevé |
| **Le portrait** | Il admire son portrait « Employee of the Month », embrasse le bout de ses doigts ; la mèche forme un cœur | moyen |
| **Golf de bureau** | Il putte une balle dans un gobelet en papier, rate, fait comme si de rien n'était | moyen |
| **Sieste** | Il ronfle, et la mèche monte et descend au rythme du souffle | moyen |
| **Téléphone** | Il rit tout seul devant son téléphone | moyen |
| **Paperasse** | Il jette un dossier hors champ ; « aïe » de Wendell | moyen |
| **La porte** | Il pointe la porte, « OUT! » en *Bossish*, à un employé invisible | faible |
| **Le donut** | Il mange un donut, en fait tomber une miette et la chasse d'une pichenette sur la caméra | faible |
| **Le miroir** | Petit miroir de poche : il recoiffe la mèche, qui se redresse toute seule | faible |
| **Le discours** | Il répète un discours motivant… à la plante verte | rare |
| **Regard caméra** | Il remarque le joueur, le fixe deux secondes, puis reprend ses affaires (4e mur) | rare |

## 7.5 Provocations (avant le choix)

- **Déclenchement** : seulement après **6 s d'inactivité** en READY, au maximum 1 fois toutes les 20 s.
- **Ne dépendent jamais** des résultats, des séries, de la mise ou du solde. Pas de moquerie qui pousserait à « se refaire ».
- **Ne désignent jamais une carte** ni un Rage Level : aucune suggestion de choix.
- Durée : 1,5 s au maximum.

| Provocation | Description |
|---|---|
| « Viens » | Il fait signe du doigt, façon « approche » |
| Bâillement | Un bâillement énorme, mèche qui s'affaisse |
| Fausse peur | Il feint la terreur (mains sur les joues), puis éclate de rire |
| Talk to the hand | Il tend la paume vers la caméra sans regarder |
| Équilibriste | Il pose le mug en équilibre sur sa tête, sans renverser une goutte |
| Tick-tock | Il tapote sa montre en fixant la caméra |

## 7.6 Victoires du boss (le joueur perd)

Bibliothèque partagée `RE_BOSS_*` (GDD_04, §5.3.3). La réaction **emblématique** est découpée image par image :

**LE SIP** (700 ms, 300 ms en turbo)
| Temps | Geste |
|---|---|
| 0 ms | Coup sec sur la cravate pour la redresser |
| 150 ms | Il lève le mug, **petit doigt en l'air** |
| 350 ms | Gorgée (« *slurp* »), yeux mi-clos |
| 550 ms | **« HMPF »** : menton relevé, mèche qui fait « boing » en boucle ronde |
| 700 ms | Retour en idle |

Elle est reconnaissable en silhouette et doit devenir **le mème du jeu**.

## 7.7 Après une défaite : le retour et les blessures cosmétiques

**Le retour (600 à 900 ms, en READY)**. Il dépend de la sortie de la manche précédente :

| Sortie précédente | Retour |
|---|---|
| Au tapis dans le cadre (T1) | Il se relève derrière le bureau, s'époussette |
| Par la fenêtre | Il remonte par la fenêtre, aidé par la nacelle du laveur de vitres |
| Par le plafond | Une dalle s'ouvre, il retombe dans son fauteuil |
| Par le sol | DING de l'ascenseur, il en sort |
| Par la porte | Il rentre en claquant la porte |
| Espace ou super-gadget | Il retombe en parachute, ou revient en tenue absurde (homme préhistorique après TIME MACHINE) |

Si le joueur tire pendant le retour, le retour est coupé net : le rythme passe avant tout.

**Blessures cosmétiques** (jamais de chiffre, jamais de jauge) :

| Dernier résultat | Accessoire | Durée (manches) |
|---|---|---|
| SCRAPE | mèche en bataille | 1 |
| HIT | pansement sur le front | 2 |
| BIG | pansement + bras en écharpe | 3 |
| MEGA | minerve + casque de chantier | 4 |
| LEGENDARY | bandages de momie, mug scotché à la main | 5 |
| K.O. du BOSS FIGHT | couronne de bandages + **mug neuf avec autocollant « NEW »** | 5 |

Les blessures diminuent d'un niveau par manche, **quel que soit le résultat**. Elles sont purement cosmétiques, et les règles le disent : le boss n'est **jamais** « affaibli », et les manches sont indépendantes. Elles se lisent comme une **réaction**, pas comme une progression.

**Décision v3 (reprise et replay déterministes)** : les blessures n'existent **qu'en état READY**, entre deux manches. Au tap sur FIRE, un petit nuage « pouf » de 150 ms, **identique pour toutes les branches** et intégré à l'INTRO neutre, fait disparaître pansements et plâtres : le boss se remet au travail « comme neuf ». La présentation d'une manche ne dépend ainsi **que** des données de la manche, jamais de l'historique, et une reprise ou un replay donne exactement la même animation.

## 7.8 Le cast récurrent

| Personnage / objet | Design | Personnalité | Running gag | Animations |
|---|---|---|---|---|
| **Wendell**, le stagiaire | Tout en lignes fines, badge « INTERN » **trois fois trop grand** au bout d'un lacet, lunettes épaisses, pile de dossiers | Dévoué, maladroit, secrètement ravi quand le boss tombe | **Il prend ce que le boss esquive** (BACKFIRE). Il sauve le boss par accident. Il revient toujours avec un pansement | WEN_* (9 segments) |
| **COO**, le pigeon | Rond, gris-violet, **minuscule cravate jaune** (comme le boss), un œil plus gros que l'autre | Chef des opérations autoproclamé, **agent double** : il salue toujours le vainqueur | Il intervient dans ~10 % des branches. Il coupe les cordes et picore les interrupteurs | COO_* (8 segments) |
| **Le mug** | Blanc, imprimé du **visage souriant du boss** | Indestructible | Il retombe **toujours** debout et plein. Il ne se fêle **qu'au K.O.** du BOSS FIGHT. Il déclenche le BOSS FIGHT (lueur dorée) | BEAT_MUG_LAND, TW_MUG_BLOCK, BF_ENTRY_MUG |
| **Le bureau** | Acajou démesuré, plaque dorée, **sonnette de réception**, **bouton rouge YOU'RE FIRED**, pendule de Newton | Le trône | Détruit dans les MEGA, il revient **rafistolé au scotch** | état intact / scotché |
| **Le portrait** | Cadre doré « Employee of the Month », toujours le boss | — | Il tombe dans les destructions. Après un MEGA, c'est la photo de Wendell pendant une manche | 3 états |
| **La cravate à clip** | Jaune, identique dans son tiroir en 50 exemplaires | — | Elle se détache au pire moment et sauve le boss (TEASE) | TW_CLIP_TIE |
| **Les collègues** | 3 silhouettes derrière les vitres dépolies | Muets | Ils surgissent et applaudissent sur les BIG+ | RE_OFFICE_CHEER |
| **R-0B, le fantôme #404, le livreur** | Personnages propres à leur gadget | — | Peuvent devenir récurrents plus tard | — |

## 7.9 Bible des running gags (avec limites d'usage)

| # | Gag | Règle d'usage |
|---|---|---|
| 1 | Le mug indestructible | À chaque impact T1+. Se fêle **uniquement** au K.O. maximal |
| 2 | Wendell encaisse | ≤ 25 % des branches de perte d'un Rage Level (sinon, c'est cruel et répétitif) |
| 3 | COO agent double | ~10 % des branches. Salue toujours le gagnant |
| 4 | La cravate à clip | Dans les TEASE de 3 gadgets au maximum (Stapler, COO Airlines, + 1 futur) |
| 5 | Employee of the Month | La photo de Wendell pendant 1 manche après un MEGA |
| 6 | Le bouton YOU'RE FIRED | Réaction rare (Wendell passe par la trappe) |
| 7 | La sonnette DING | Idle + **son des gains** (1 ding pour un HIT, 2 pour un BIG, cascade pour un MEGA) |
| 8 | L'Executive Blend doré | Réservé au BOSS FIGHT |
| 9 | Il ne voit jamais venir le coup | Tronc commun de chaque gadget : il est occupé |
| 10 | Tick-tock | Idle et provocation par défaut |

## 7.10 Le joueur : représentation

| Option | Immersion | Coût | Risques | Verdict |
|---|---|---|---|---|
| Personnage visible (employé) | Moyenne : on regarde quelqu'un d'autre se venger | Élevé (un 2e rig complet) | Identification limitée (genre, âge, apparence) | Non |
| Employé personnalisable | Bonne | Très élevé (variantes, UI) | Complexité hors sujet pour un jeu de 3 s | Non |
| Totalement invisible | Faible : qui actionne le gadget ? | Nul | Perte d'agence | Non |
| **Mains seules, vue subjective** | **Forte** : « c'est MOI qui tire le levier » | **Faible** : une planche de 13 poses | Aucun. Neutre et universel | **RETENU** |

Détails : manches de chemise bleu clair, montre en plastique (en contraste avec la montre en or du boss), un post-it collé sur la main (« REVENGE »). Les mains apparaissent au moment de l'INTRO puis sortent du cadre. Elles reviennent dans les BACKFIRE : c'est **le joueur** qui se prend le cactus.

## 7.11 Éléments de marque

- **Logo** : « BAD BOSS » en capitales grasses et carrées (les lettres ont la forme du boss). Le second « B » porte **la mèche**, et un trait jaune en forme de cravate souligne le tout.
- **Key art** : GIGA-BOTTOMLINE, le mug-bouclier fissuré, la mèche électrique, et au premier plan les mains du joueur qui tiennent le levier « DO NOT PULL ».
- **Icône du jeu** : la tête du boss avec la mèche, sur fond jaune. Lisible à 64 px.
- **Le son de marque** : la sonnette de bureau « DING! » suivie du « HMPF ».

### Noms : 10 propositions

| Nom | Commentaire |
|---|---|
| **BAD BOSS** (recommandé) | Court, universel, lisible sur une vignette. Les initiales du boss (B.B.) le rendent canonique |
| BAD BOSS: Out of Office | Sous-titre possible pour la page du jeu |
| You're Fired! | Fort, mais inverse le point de vue (c'est le boss qui dit ça) |
| Bottomline | Jeu de mots corporate, moins immédiat |
| Boss Knockout | Clair, un peu générique |
| Overtime Revenge | Bon pour un bonus, trop long comme titre |
| Tick-Tock Boss | Mignon, s'appuie sur un gag secondaire |
| Monday Revenge | Relatable, mais daté |
| Rage Quit Inc. | Amusant, mais « rage quit » est connoté négativement dans le jeu vidéo |
| HR Complaint | Humour de niche |

**Vérification requise** (juridique, hors Stake Engine) : disponibilité de la marque et collisions avec des jeux existants du même nom, avant de figer le titre.
