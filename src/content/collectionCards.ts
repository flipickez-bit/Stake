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
  'TRP-B3': { name: 'SELF-MADE MAN', blurb: 'He climbed out by himself. Ding. Back to work.' },
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
  'RKT-C3': { name: 'ROUND TRIP', blurb: 'Through the roof. Back by elevator. Ding.' },
  'RKT-C4': { name: 'HARD LANDING', blurb: 'Through the roof, down the shaft, out of the elevator. In pieces.' },
  'RKT-C5': { name: 'SKY MAIL', blurb: 'He brought the whole mailroom back with him.' },
};
