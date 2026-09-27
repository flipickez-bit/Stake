/**
 * Textes des cartes du COLLECTION BOOK (une carte = une branche d'animation, même identifiant).
 * Données de contenu uniquement : aucune logique, aucun lien avec la sélection des branches.
 *
 * Règles (vérifiées en CI, tests/unit/collection.test.ts) :
 *  - chaque branche publiée a sa carte ; un identifiant n'est jamais renommé ni réutilisé ;
 *  - noms uniques ;
 *  - l'indice d'une carte MANQUANTE ne décrit que son DÉBUT VISIBLE (le setup, `BranchDef.path[0]`) :
 *    l'audit de variété garantit que chaque setup mène à des pertes ET à des gains, donc l'indice
 *    n'apprend rien de plus que les premières secondes de n'importe quelle manche (ni issue, ni rareté).
 */
export interface CardText {
  /** Nom de la carte (identité BAD BOSS). */
  name: string;
  /** Petite description humoristique, montrée une fois la carte découverte. */
  blurb: string;
}

/** Indice des cartes manquantes, par gadget puis par setup visible. */
export const SETUP_HINTS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'swivel-slingshot': { LAUNCH: 'Launch day…', SPIN: 'Round and round…', BACKFIRE: 'Wrong way…', ELEVATOR: 'Going up?' },
  'trapdoor-express': { HOVER: 'Mind the gap…', DROP: 'Going down…', JAM: 'Stuck…' },
  'office-rocket': { IGNITE: 'Scenic route…', STALL: 'Pfft…', UP: 'Something involving the ceiling…' },
  'espresso-blaster': { SHOT: 'One shot, going up…', JAM: 'The lever is stuck…', RICOCHET: 'Off the ceiling fan…', FOAM: 'Too much milk…' },
  'copier-catapult': { LAUNCH: 'Paper airborne…', BLIZZARD: 'Copies. So many copies…', JAM: 'Paper jam…' },
  'cabinet-domino': { CHAIN: 'Clonk, clonk, clonk…', STALL: 'It leans… and holds?', DRAWERS: 'Drawers everywhere…' },
  'cooler-bowling': { STRAIGHT: 'Straight down the lane…', HOOK: 'A little spin on it…', BURST: 'The cap pops…' },
  'ceiling-safe': { DROP: 'The rope frays…', SWING: 'Round and round it goes…', LOWER: 'Slowly, gently…' },
  'hvac-hurricane': { GUST: 'Full blast…', TORNADO: 'The air starts to twist…', SUCK: 'Reverse gear…' },
};

export const CARD_TEXTS: Readonly<Record<string, CardText>> = {
  // ---------------------------------------------------------------- SWIVEL SLINGSHOT (GRUMPY)
  'SLG-A1': { name: 'BOING-BACK', blurb: 'The elastic had other plans. So did his dignity.' },
  'SLG-A2': { name: 'HUMAN AIRBAG', blurb: "Wendell broke B.B.'s fall. Nobody broke Wendell's." },
  'SLG-A3': { name: 'LAP OF HONOUR', blurb: 'A full lap of the office. COO applauds. B.B. bows.' },
  'SLG-A4': { name: 'FILED UNDER B', blurb: 'Straight into the filing cabinet. Alphabetically.' },
  'SLG-A5': { name: 'WINDOW SEAT', blurb: 'B.B. finally gets a view. From the outside.' },
  'SLG-A6': { name: 'SKID MARKS', blurb: 'He digs his heels into the carpet. The fight is on.' },
  'SLG-B1': { name: 'SPIN CYCLE', blurb: 'Round and round, then a flex. Unbothered.' },
  'SLG-B2': { name: 'HUMAN DRILL', blurb: 'Up through the ceiling fan. The fan had a bad day too.' },
  'SLG-B3': { name: 'FOAM PARTY', blurb: 'The fire extinguisher joined in. Nobody won.' },
  'SLG-C1': { name: 'BACKFIRE', blurb: 'B.B. was fine. The computer was not.' },
  'SLG-C2': { name: 'BOOMERANG', blurb: 'The chair came back while he was checking his empty mug.' },
  'SLG-C3': { name: 'EMPTY MUG', blurb: 'No coffee left. No window left either.' },
  'SLG-C4': { name: 'THE SIP', blurb: 'Untouched. Unimpressed. Sip.' },
  'SLG-D1': { name: 'DING!', blurb: 'Silence. Ding. The doors open. Not a scratch.' },
  'SLG-D2': { name: 'GOING DOWN', blurb: 'Ding. The doors open on a very different B.B.' },
  'SLG-D3': { name: 'PAPERWORK AVALANCHE', blurb: 'Ding. Every form in the building. And a pigeon.' },
  'SLG-D4': { name: 'GOLDEN DOORS', blurb: 'The elevator glows. He steps out, ready to fight.' },

  // ---------------------------------------------------------------- TRAPDOOR EXPRESS (FURIOUS)
  'TRP-A1': { name: 'TIPTOE', blurb: 'He looked down, then decided not to fall.' },
  'TRP-A2': { name: 'AU REVOIR', blurb: 'Down he goes. Wendell waves.' },
  'TRP-A3': { name: 'TWELVE FLOORS', blurb: 'A long way down. A very long way.' },
  'TRP-A4': { name: 'TRAMPOLINE', blurb: 'Straight down, straight back up, straight back to his coffee.' },
  'TRP-A5': { name: 'PIGEON EXPRESS', blurb: 'COO caught him mid-air. Nobody asked COO.' },
  'TRP-A6': { name: 'RISE OF THE BOSS', blurb: 'He climbs back out. Glowing. Furious.' },
  'TRP-B1': { name: 'HANG IN THERE', blurb: 'Saved by his tie. And by Wendell, unfortunately.' },
  'TRP-B2': { name: 'TIE BREAKER', blurb: 'The tie held. Until it did not.' },
  'TRP-B3': { name: 'SELF-MADE MAN', blurb: 'He climbed out by himself. Ting. Back to work.' },
  'TRP-B4': { name: 'SERVICE ELEVATOR', blurb: 'He fell into the elevator. It politely brought him back.' },
  'TRP-B5': { name: 'OUT OF ORDER', blurb: 'The elevator arrives. So do the pieces.' },
  'TRP-B6': { name: 'PAPER TRAIL', blurb: 'Every form he ever lost, all at once.' },
  'TRP-B7': { name: 'EXECUTIVE LIFT', blurb: 'Gold doors. Bad news.' },
  'TRP-C1': { name: 'LAST CALL', blurb: 'The mug was empty. So was the floor under him.' },
  'TRP-C2': { name: 'WRONG BUTTON', blurb: 'B.B. pressed the button. Wendell fell. B.B. floated, somehow.' },
  'TRP-C3': { name: 'JAMMED', blurb: 'The trapdoor refused. B.B. sipped.' },

  // ---------------------------------------------------------------- OFFICE ROCKET (UNHINGED)
  'RKT-A1': { name: 'JOYRIDE', blurb: 'A scenic tour of the office. Perfect landing. Sip.' },
  'RKT-A2': { name: 'ZIGZAG', blurb: 'Left, right, left, filing cabinet.' },
  'RKT-A3': { name: 'LAUNCH WINDOW', blurb: 'Zig, zag, and out of the window.' },
  'RKT-A4': { name: 'HOVER MODE', blurb: 'The rocket hovers. So does trouble.' },
  'RKT-B1': { name: 'DAMP SQUIB', blurb: "Pfft. That's it. That's the rocket." },
  'RKT-B2': { name: 'SECOND WIND', blurb: 'It stalled. It restarted. It found the ceiling.' },
  'RKT-B3': { name: 'WENDELL CEILING', blurb: 'The smoke clears. B.B. is fine. Wendell lives on the ceiling now.' },
  'RKT-B4': { name: 'HEAD IN THE CLOUDS', blurb: 'The smoke clears. B.B. is in the ceiling.' },
  'RKT-B5': { name: 'CRATER', blurb: 'Where there was an office, there is now a hole.' },
  'RKT-B6': { name: 'GOLDEN SMOKE', blurb: 'The smoke turns gold. The boss turns furious.' },
  'RKT-B7': { name: 'SOLO FLIGHT', blurb: 'The rocket left. B.B. stayed, with his coffee.' },
  'RKT-B8': { name: 'ROCKET REBOUND', blurb: 'COO turned the rocket around. Straight back to B.B.' },
  'RKT-B9': { name: 'FIRE DRILL', blurb: 'Smoke, panic, foam. He sips through all of it.' },
  'RKT-C1': { name: 'FREE HAIRCUT', blurb: 'The fan trimmed his hair. He looks better, honestly.' },
  'RKT-C2': { name: 'STRAIGHT UP', blurb: 'No detour. Ceiling.' },
  'RKT-C3': { name: 'ROUND TRIP', blurb: 'Through the roof. Back by elevator. Bing.' },
  'RKT-C4': { name: 'HARD LANDING', blurb: 'Through the roof, down the shaft, out of the elevator. In pieces.' },
  'RKT-C5': { name: 'SKY MAIL', blurb: 'He brought the whole mailroom back with him.' },

  // ---------------------------------------------------------------- ESPRESSO BLASTER (GRUMPY)
  'ESP-S1': { name: 'CATCH OF THE DAY', blurb: 'He caught it without looking. Then he drank it.' },
  'ESP-S2': { name: 'FACE FULL OF ROAST', blurb: 'Black, strong, right between the eyebrows.' },
  'ESP-S3': { name: 'OVERPRESSURE', blurb: 'The needle broke the dial. The jet broke the window.' },
  'ESP-S4': { name: 'LATTE ART', blurb: 'The cup landed in his mug. Perfectly. COO applauded him.' },
  'ESP-S5': { name: 'GOLDEN SHOT', blurb: 'He caught the cup. It turned gold. So did his mood.' },
  'ESP-D1': { name: 'DOUBLE FISTED', blurb: 'Two cups, two hands, zero shame.' },
  'ESP-D2': { name: 'THE SECOND SHOT', blurb: 'He caught the first one. He was very proud of that.' },
  'ESP-J1': { name: 'OUT OF STEAM', blurb: 'Drip. Fizz. Laughter.' },
  'ESP-J2': { name: 'GEYSER', blurb: 'The boiler blew. He went up with the coffee.' },
  'ESP-J3': { name: 'ON THE HOUSE', blurb: 'The machine served him a small one. He accepted.' },
  'ESP-J4': { name: 'POINT BLANK', blurb: 'Never look down the barrel of an espresso machine.' },
  'ESP-J5': { name: 'GOLDEN ROAST', blurb: 'The steam turned gold. The boss turned giant.' },
  'ESP-R1': { name: 'FAN DELIVERY', blurb: 'The ceiling fan served his coffee. He tipped nobody.' },
  'ESP-R2': { name: 'HEADS UP', blurb: 'The fan let go. His head was right there.' },
  'ESP-R3': { name: 'WENDELL GETS COFFEE', blurb: 'Wendell finally got a coffee. All of it.' },
  'ESP-R4': { name: 'FOLDER ASSIST', blurb: "Wendell ducked. His folders didn't." },
  'ESP-F1': { name: 'FOAM MOUSTACHE', blurb: 'Buried in milk foam. Still unimpressed.' },
  'ESP-F2': { name: 'SLIP AND SLIDE', blurb: 'Foam on the floor, boss on the foam, cabinet on the boss.' },

  // ---------------------------------------------------------------- COPIER CATAPULT (GRUMPY)
  'COP-L1': { name: 'RETURN TO SENDER', blurb: 'The ream came straight back. Paper jam. He laughed.' },
  'COP-L2': { name: 'CONFETTI MEMO', blurb: 'Five hundred copies rained down. He kept sipping.' },
  'COP-L3': { name: 'LIGHT READING', blurb: 'He caught the ream, read one page, crumpled it.' },
  'COP-L4': { name: 'REAM TEAM', blurb: 'Five hundred sheets, one forehead.' },
  'COP-L5': { name: 'PAPER AVALANCHE', blurb: 'The copier went berserk. Three reams, one boss.' },
  'COP-L6': { name: 'GOLDEN COPY', blurb: 'The ream hit his mug. The mug turned gold.' },
  'COP-L7': { name: 'SQUADRON', blurb: 'The ream turned into paper planes. They saluted him.' },
  'COP-C1': { name: 'NEST MATERIAL', blurb: 'COO took the ream. For personal reasons.' },
  'COP-C2': { name: 'AIR DROP', blurb: 'COO let go at exactly the right moment.' },
  'COP-B1': { name: 'THE FAN', blurb: 'He fanned himself with the copies. Refreshing.' },
  'COP-B2': { name: 'BURIED IN WORK', blurb: 'A mountain of copies, with a ream on top.' },
  'COP-B3': { name: 'PAPER TORNADO', blurb: 'The copies picked him up and took him outside.' },
  'COP-J1': { name: 'ONE PAGE', blurb: 'The copier burped out a single sheet. That was it.' },
  'COP-J2': { name: 'THE WHOLE TRAY', blurb: 'The jam cleared all at once. In his direction.' },
  'COP-J3': { name: 'GOLD FORMAT', blurb: 'One golden sheet floated out. Trouble followed.' },
  'COP-W1': { name: 'IT SUPPORT', blurb: 'Wendell kicked the copier. The copier kicked back.' },
  'COP-W2': { name: 'PERCUSSIVE MAINTENANCE', blurb: 'One kick from Wendell. One ream to the boss.' },

  // ---------------------------------------------------------------- CABINET DOMINO (FURIOUS)
  'DOM-C1': { name: 'RETURN SERVE', blurb: 'He pushed the last cabinet back. The whole row followed.' },
  'DOM-C2': { name: 'FILED FLAT', blurb: 'Clonk, clonk, clonk, boss.' },
  'DOM-C3': { name: 'EXPRESS DELIVERY', blurb: 'The cabinet sent him straight into the elevator.' },
  'DOM-C4': { name: 'GENTLE BREEZE', blurb: 'The cabinet leaned on him. He blew on it. It stood up.' },
  'DOM-C5': { name: 'REWIND', blurb: 'He snapped his fingers. The cabinets stood back up.' },
  'DOM-C6': { name: 'GOLDEN FOLDER', blurb: 'A golden folder slid out. He was not pleased.' },
  'DOM-S1': { name: 'STANDING ORDER', blurb: 'The second cabinet held. So did his smirk.' },
  'DOM-S2': { name: 'DELAYED FILING', blurb: 'A creak. A pause. Then everything fell.' },
  'DOM-W1': { name: 'WENDELL UNDERNEATH', blurb: 'Wrong place, wrong time, wrong cabinet.' },
  'DOM-W2': { name: 'DUCK AND COVER', blurb: 'Wendell ducked. The cabinet did not stop.' },
  'DOM-D1': { name: 'FOOTREST', blurb: 'The drawer stopped at his toes. He put his feet up.' },
  'DOM-D2': { name: 'TRIP HAZARD', blurb: 'One drawer, two shins, zero grace.' },
  'DOM-D3': { name: 'WRONG LEVER', blurb: 'The drawer hit the trapdoor lever. Twelve floors.' },
  'DOM-D4': { name: 'DRAWER SURFING', blurb: 'He rode the drawer around the office. Perfect landing.' },
  'DOM-D5': { name: 'GOLDEN DRAWER', blurb: 'The drawer held something golden. And furious.' },

  // ---------------------------------------------------------------- WATER COOLER BOWLING (FURIOUS)
  'BWL-S1': { name: 'HURDLE', blurb: 'He hopped over it. The filing cabinet did not.' },
  'BWL-S2': { name: 'STRAIGHT FROM THE BOTTLE', blurb: 'He stopped the jug with his foot and drank from it.' },
  'BWL-S3': { name: 'STRIKE', blurb: 'Right in the shins. Full rotation.' },
  'BWL-S4': { name: 'ELEVATOR STRIKE', blurb: 'Strike. Spin. Elevator. Doors close.' },
  'BWL-S5': { name: 'GOLDEN WATER', blurb: 'The water glowed. He drank it anyway.' },
  'BWL-S6': { name: 'RETURN TO PLAYER', blurb: 'He rolled it back. At the camera.' },
  'BWL-P1': { name: 'REVERSE GEAR', blurb: 'The jug changed its mind and went home.' },
  'BWL-P2': { name: 'LAST ROLL', blurb: 'It stopped. He looked. It rolled.' },
  'BWL-H1': { name: 'GUTTER BALL', blurb: 'Too much spin. It rang the desk bell instead.' },
  'BWL-H2': { name: 'SPIN DOCTOR', blurb: 'The hook came back around. So did he.' },
  'BWL-W1': { name: 'WENDELL PIN', blurb: 'Wendell went down like a bowling pin. Folders everywhere.' },
  'BWL-W2': { name: 'HIGH JUMP', blurb: 'Wendell jumped. The boss did not.' },
  'BWL-B1': { name: 'WATERING DAY', blurb: 'The plant got a drink. It looks happier than anyone.' },
  'BWL-B2': { name: 'THE WAVE', blurb: 'One jug of water, one boss, one open window.' },
  'BWL-B3': { name: 'GOLDEN RAIN', blurb: 'It burst at the ceiling. It rained gold.' },
  'BWL-B4': { name: 'COLD SHOWER', blurb: 'Straight to the face. Refreshing, probably.' },

  // ---------------------------------------------------------------- CEILING SAFE (UNHINGED)
  'SAFE-D1': { name: 'HEAVY NEWS', blurb: 'The rope snapped. The safe found his head.' },
  'SAFE-D2': { name: 'HEEL KICK', blurb: 'One push of his heel, one hole in the floor.' },
  'SAFE-D3': { name: 'BUNGEE SAFE', blurb: 'The rope stretched. The safe bounced. He sipped.' },
  'SAFE-D4': { name: 'GROUND FLOOR', blurb: 'The safe took him down. All the way down.' },
  'SAFE-D5': { name: 'GOLDEN SAFE', blurb: 'The door popped open. Gold light. Bad sign.' },
  'SAFE-S1': { name: 'SAFE TRAVELS', blurb: 'The safe left through the window. He waved.' },
  'SAFE-S2': { name: 'CLOSE SHAVE', blurb: 'The swinging safe clipped him on the way back.' },
  'SAFE-S3': { name: 'IGNITION', blurb: 'The safe hit his rocket chair. The rocket had opinions.' },
  'SAFE-C1': { name: 'PARALLEL PARKING', blurb: 'COO parked the safe on the desk. Flawlessly.' },
  'SAFE-C2': { name: 'PIGEON KICK', blurb: 'COO kicked the safe. COO is not neutral.' },
  'SAFE-L1': { name: 'SAFE COFFEE', blurb: 'Inside the safe: a steaming coffee. He took it.' },
  'SAFE-L2': { name: 'SPRING LOADED', blurb: 'Inside the safe: a boxing glove on a spring.' },
  'SAFE-L3': { name: 'DOOR SLAM', blurb: 'He leaned in. The door opened. Fast.' },
  'SAFE-L4': { name: 'NESTED SAFES', blurb: 'A safe in a safe in a safe. And a desk bell.' },
  'SAFE-L5': { name: 'TREASURE', blurb: 'The safe opened. Something golden stared back.' },

  // ---------------------------------------------------------------- HVAC HURRICANE (UNHINGED)
  'HVAC-G1': { name: 'HOLD THE LINE', blurb: 'Full blast. He held on. Then he fixed his tie.' },
  'HVAC-G2': { name: 'DESK JOB', blurb: 'The wind pushed him straight into his own desk.' },
  'HVAC-G3': { name: 'AIR MAIL', blurb: 'Airborne across the office, express to the elevator.' },
  'HVAC-W1': { name: 'GONE WITH THE WIND', blurb: 'Wendell took the elevator. The wind pressed the button.' },
  'HVAC-W2': { name: 'SAILING', blurb: 'Wendell became a sailboat. B.B. became the harbour.' },
  'HVAC-T1': { name: 'STORM DETOUR', blurb: 'The tornado went around him and left him some paperwork.' },
  'HVAC-T2': { name: 'SPIN CYCLE XL', blurb: 'Washed, spun, dropped.' },
  'HVAC-T3': { name: 'UPPER MANAGEMENT', blurb: 'The tornado promoted him. Through the ceiling.' },
  'HVAC-T4': { name: 'GOLDEN STORM', blurb: 'The tornado glowed gold and handed back his mug.' },
  'HVAC-O1': { name: 'EVERYTHING IN ITS PLACE', blurb: 'The monitor and the plant landed exactly where they were.' },
  'HVAC-O2': { name: 'OFFICE ORBIT', blurb: 'The monitor, then the plant. In that order.' },
  'HVAC-S1': { name: 'MUG RETRIEVAL', blurb: 'The vent took his mug. He took it back.' },
  'HVAC-S2': { name: 'FACE THE VENT', blurb: 'Pulled across the room, face first into the grille.' },
  'HVAC-S3': { name: 'PIGEON EXHAUST', blurb: 'COO went into the vent. COO came back grey.' },
  'HVAC-S4': { name: 'GOLDEN BREATH', blurb: 'The vent coughed up something golden.' },
};
