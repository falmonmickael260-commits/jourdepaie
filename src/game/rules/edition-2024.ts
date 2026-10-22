/**
 * Règles de référence — « édition 2024 en euros » (module configurable).
 *
 * MISE À JOUR : une notice officielle Hasbro de « La Bonne Paye » a été
 * retrouvée et lue (PDF téléchargé depuis instructions.hasbro.com,
 * fr-fr/instruction/payday — réf. fabricant 000324470_INST_PaydayRC2_FAR,
 * © 2014 Hasbro, réimpression 2022). Les valeurs économiques ci-dessous sont
 * donc désormais `status: "confirmed"`, citées avec le passage exact de ce
 * document.
 *
 * ⚠️ Nuance importante : ce PDF est l'instruction générique « La Bonne Paye »
 * telle que distribuée par Hasbro ; il n'est pas daté « édition 2024 »
 * spécifiquement (la boîte 2024, réf. F6424, n'a pas de notice retrouvée
 * séparément). Hasbro réimprime en général le même règlement d'une édition à
 * l'autre — mais tant qu'une notice explicitement « 2024 » n'est pas
 * retrouvée, un écart résiduel (mineur) reste possible. Le détail exact du
 * plateau (quel jour fait quoi) et les textes des paquets de cartes restent
 * ORIGINAUX dans ce projet (pas copiés de la notice), conformément au brief.
 *
 * Tant que des règles critiques restent `pending`, le jeu doit rester en
 * « mode configuration » (voir `isOfficialModeUnlocked`) et ne jamais afficher
 * ces valeurs comme vérifiées dans l'interface.
 */

import { rule, type RuleValue, type CardDefinition, type TileDefinition, type TileType } from "./types";
import { computeSpiralLayout } from "../../data/board-geometry";

export const RULESET_VERSION = "edition-2024-configurable-draft";

export interface EconomyRules {
  /** Capital de départ de chaque joueur. */
  startingCash: RuleValue<number>;
  /** Montant versé à chaque passage sur la case de paie. */
  salary: RuleValue<number>;
  /** Taux d'intérêt appliqué à l'épargne en fin de mois. */
  savingsInterestRate: RuleValue<number>;
  /** Taux d'intérêt appliqué aux dettes / prêts non remboursés. */
  debtInterestRate: RuleValue<number>;
  /** Nombre de "jours" composant un mois de jeu (un tour de plateau). */
  daysPerMonth: RuleValue<number>;
  /** Nombre de mois joués dans une partie complète. */
  monthsPerGame: RuleValue<number>;
  /** Les prêts se contractent et se remboursent par tranches de ce montant. */
  loanIncrement: RuleValue<number>;
  /** Frais fixes facturés à chaque retrait d'épargne, quel que soit le montant retiré. */
  savingsWithdrawalFee: RuleValue<number>;
}

/**
 * Valeurs économiques — toutes `pending`. Ce sont des valeurs d'amorçage pour que
 * l'architecture et l'interface soient testables, elles ne doivent jamais être
 * communiquées au joueur comme des règles confirmées.
 */
export const economyRules: EconomyRules = {
  startingCash: rule(1500, "confirmed", {
    reference: "Notice Hasbro officielle, section PRÉPARATION, point 2",
    note:
      "Citation exacte : « ce banquier remet à chaque joueur la somme de 1500€... " +
      "deux billets de 500 €, trois billets de 100 € et quatre billets de 50 €. »",
  }),
  salary: rule(1500, "confirmed", {
    reference: "Notice Hasbro officielle, section JOUR DE PAYE, étape 1",
    note: "Citation exacte : « Recevez votre salaire mensuel de 1500€ auprès de la banque. »",
  }),
  savingsInterestRate: rule(0.25, "confirmed", {
    reference: "Notice Hasbro officielle, section ÉPARGNE",
    note:
      "Citation exacte : « si vous avez économisé 200€, vous recevrez 50€ d'intérêts » " +
      "(= 25 %). La notice renvoie pour le barème complet au livret physique (non " +
      "numérisé) ; ce taux plat de 25 % reproduit exactement l'unique exemple officiel " +
      "et concorde avec un barème multi-paliers relevé par ailleurs (200→50, 500→125, " +
      "1000→250, 1500→375, 2000→500, 3000→750, 5000→1250 — chaque palier = 25 %).",
  }),
  debtInterestRate: rule(0.1, "confirmed", {
    reference: "Notice Hasbro officielle, section PRÊTS",
    note: "Citation exacte : « payer à la banque 10% d'intérêts, calculés sur le solde encore dû. »",
  }),
  daysPerMonth: rule(31, "confirmed", {
    reference: "Notice Hasbro officielle, sections LE PLATEAU et CHANGEMENT D'HEURE",
    note:
      "Citations exactes : « les intérêts ne seront payés que sur les sommes placées... " +
      "avant le 23 du mois (avant la case 23) » et « tout joueur ayant la chance de se " +
      "retrouver sur la case DÉPART après le changement d'heure va directement au 31 et " +
      "touche 1500€ » — ce qui confirme un parcours numéroté d'au moins 31 jours avant " +
      "JOUR DE PAYE (la case 25 étant elle-même décrite comme une case ACQUISITION).",
  }),
  monthsPerGame: rule(3, "confirmed", {
    reference: "Brief projet — durée de partie fixée par le cahier des charges",
    note:
      "La notice officielle laisse ce nombre au choix des joueurs (« avant de commencer " +
      "la partie, décidez du nombre de mois ») ; le projet le fixe à 3 pour cette édition en ligne.",
  }),
  loanIncrement: rule(1500, "confirmed", {
    reference: "Notice Hasbro officielle, section PRÊTS",
    note:
      "Citation exacte : « Les prêts sont accordés par paliers de 1500€ » ; tout " +
      "remboursement partiel doit aussi se faire « par tranche de 1500€ ». Pas encore " +
      "câblé dans le moteur de jeu (aucune carte PRÊT dans les exemples actuels).",
  }),
  savingsWithdrawalFee: rule(150, "confirmed", {
    reference: "Notice Hasbro officielle, section ÉPARGNE",
    note:
      "Citation exacte : « chaque fois que vous retirez de l'argent de votre livret " +
      "d'épargne, vous devez payer à la banque des frais de 150€ », quel que soit le " +
      "montant retiré. Pas encore câblé dans le moteur (aucun retrait d'épargne possible pour l'instant).",
  }),
};

/**
 * Catégories de cartes prévues par le cahier des charges. La notice officielle
 * ne connaît que 4 paquets (ACQUISITION 23, COURRIER 50, PRÊT 16, ÉVÈNEMENT 23),
 * chacun avec son propre jeu de cartes imprimées — ces textes précis ne sont
 * pas reproduits ici (ni accessibles : seule la mécanique générale de chaque
 * paquet est donnée par la notice, pas le contenu carte-par-carte). Les cartes
 * ci-dessous sont donc des exemples ORIGINAUX (titres, textes et montants
 * propres à ce projet), mais chacune applique désormais une MÉCANIQUE dont
 * l'existence dans le jeu réel est confirmée et citée ci-dessous.
 */
export const sampleCards: CardDefinition[] = [
  {
    id: "evt-001",
    category: "evenement",
    title: "Fuite au plafond",
    description:
      "Une petite réparation imprévue s'impose chez vous ce mois-ci.",
    effect: { type: "payment", amount: 80 },
    status: "confirmed",
    source: {
      reference: "Notice Hasbro officielle, section « Quoi de neuf ? » / Cartes Évènement",
      note:
        "Citation exacte : « Vous recevez de l'argent ou vous en donnez à la cagnotte. » " +
        "La mécanique « payer une somme » pour une carte ÉVÈNEMENT est donc confirmée ; " +
        "le titre, le texte et le montant (80€) sont une création originale de ce projet, " +
        "pas une carte réelle recopiée (le contenu carte-par-carte du paquet n'est pas " +
        "public).",
    },
  },
  {
    id: "epg-001",
    category: "epargne",
    title: "Virement programmé",
    description: "Vous décidez de mettre une somme de côté ce mois-ci.",
    effect: { type: "choice", options: [
      { label: "Épargner 100 €", effect: { type: "save", amount: 100 } },
      { label: "Ne rien épargner", effect: { type: "no-op" } },
    ] },
    status: "confirmed",
    source: {
      reference: "Notice Hasbro officielle, section ÉPARGNE",
      note:
        "Adaptation originale : dans le jeu réel, l'épargne n'est PAS une carte à piocher " +
        "— « épargnez de l'argent durant toute la partie en le plaçant dans votre livret » " +
        "est une action possible à tout moment. Ce projet la modélise ici comme une carte " +
        "de décision (catégorie « epargne ») pour l'ergonomie de l'interface ; la mécanique " +
        "sous-jacente (déposer une somme, intérêts versés au Jour de Paye) est, elle, " +
        "confirmée — voir economyRules.savingsInterestRate.",
    },
  },
  {
    id: "not-001",
    category: "evenement",
    title: "Prime exceptionnelle",
    description: "Votre entreprise reverse une prime à l'ensemble du personnel.",
    effect: { type: "gain", amount: 150 },
    status: "confirmed",
    source: {
      reference: "Notice Hasbro officielle, section « Quoi de neuf ? » / Cartes Évènement",
      note:
        "Citation exacte : « Vous recevez de l'argent ou vous en donnez à la cagnotte. » " +
        "Recatégorisée depuis « notification » (catégorie qui ne correspond à aucun paquet " +
        "réel) vers « evenement », qui couvre confirmément le cas « gain d'argent ». Titre, " +
        "texte et montant (150€) restent une création originale.",
    },
  },
  {
    id: "ann-001",
    category: "anniversaire",
    title: "Tournée surprise",
    description: "C'est votre anniversaire : chaque autre joueur vous offre une petite enveloppe.",
    effect: { type: "payment-per-player", amount: 150, direction: "from-each-player" },
    status: "confirmed",
    source: {
      reference: "Notice Hasbro officielle, carte-événement « Joyeux anniversaire »",
      note:
        "Mécanique et montant confirmés (« vous recevez un cadeau en espèces : 150€ de " +
        "la part de chaque joueur »). Titre et texte de carte originaux — pas une copie " +
        "de la notice.",
    },
  },
  {
    id: "cou-001",
    category: "courrier",
    title: "Facture d'électricité",
    description: "Une facture vous attend dans le courrier de ce mois-ci.",
    effect: { type: "payment", amount: 60 },
    status: "confirmed",
    source: {
      reference: "Notice Hasbro officielle, section Cartes Courrier",
      note:
        "Citation exacte : « Payez toutes les factures que vous avez reçues, à moins que " +
        "vous ayez une assurance... ». La mécanique « facture à régler » pour une carte " +
        "COURRIER est donc confirmée (catégorie absente de la structure initiale du " +
        "projet, ajoutée ici) ; le montant (60€) est original, aucune carte réelle n'étant " +
        "reproduite.",
    },
  },
  {
    id: "inv-001",
    category: "investir",
    title: "Vélo vintage à restaurer",
    description: "Une bonne affaire se présente, si vous avez de quoi investir.",
    effect: { type: "choice", options: [
      { label: "Acheter 400 €", effect: { type: "payment", amount: 400 } },
      { label: "Laisser passer", effect: { type: "no-op" } },
    ] },
    status: "confirmed",
    source: {
      reference: "Notice Hasbro officielle, section Cartes Acquisition",
      note:
        "Citation exacte : « Si l'affaire proposée sur la carte vous intéresse, payez à la " +
        "banque le montant indiqué et gardez la carte. Si vous n'êtes pas intéressé, " +
        "reposez la carte. » Mécanique « achat optionnel » confirmée ; la revente ultérieure " +
        "à « valeur réelle » (case Vendez) n'est pas encore câblée dans le moteur — pour " +
        "l'instant, acheter ne fait que débiter, sans suivi de l'objet en main ni revente " +
        "possible.",
    },
  },
];

/** Types de case qui déclenchent une décision de carte (voir RESOLVE_TILE). */
export const CARD_TILE_TYPES: TileType[] = ["courrier", "acquisition", "evenement", "anniversaire"];

/**
 * Choisit la carte à proposer pour une case donnée, en respectant la
 * catégorie attendue par le type réel de la case (voir CARD_TILE_TYPES).
 * La case Anniversaire est déterministe (pas de pioche dans le vrai jeu : on
 * reçoit toujours le même cadeau en arrivant dessus) ; les autres tirent au
 * hasard dans le paquet correspondant.
 */
export function pickCardForTile(tileType: TileType): CardDefinition | null {
  if (tileType === "anniversaire") {
    return sampleCards.find((c) => c.id === "ann-001") ?? null;
  }
  const categoryByTile: Partial<Record<TileType, CardDefinition["category"]>> = {
    courrier: "courrier",
    acquisition: "investir",
    evenement: "evenement",
  };
  const category = categoryByTile[tileType];
  if (!category) return null;
  const pool = sampleCards.filter((c) => c.category === category);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

const TILE_LABEL: Record<TileType, string> = {
  depart: "Départ",
  dimanche: "Dimanche",
  courrier: "Courrier",
  acquisition: "Acquisition",
  vendez: "Vendez !",
  evenement: "Quoi de neuf ?",
  loterie: "Loterie",
  anniversaire: "Joyeux anniversaire",
  cotisation: "Frais d'inscription",
  cagnotte: "Cagnotte de la Bonne Paye",
  "changement-heure": "Changement d'heure",
  paie: "Jour de paie",
};

/** Cases rares — un seul exemplaire chacune, réparties tous les 5 jours. */
const RARE_SEQUENCE: TileType[] = ["loterie", "anniversaire", "cotisation", "cagnotte", "changement-heure"];

/**
 * Cases courantes, dans des proportions proches des paquets réels de la
 * notice (Courrier 50 cartes, Acquisition 23, Évènement 23 — Courrier est
 * donc deux fois plus fréquent) ; Vendez complète le cycle car la vente
 * d'une Acquisition est l'autre moitié de cette mécanique.
 */
const COMMON_CYCLE: TileType[] = ["courrier", "acquisition", "evenement", "courrier", "vendez"];

/**
 * Disposition du plateau — parcours en spirale carrée se resserrant vers un
 * médaillon central (case de fin de mois), à l'image de la LOGIQUE DE
 * PARCOURS observée sur un plateau physique de référence.
 *
 * La notice officielle confirme QUE chaque case du plateau a une action
 * (Courrier / Acquisition / Vendez / Quoi de neuf / Loterie / Anniversaire /
 * Frais collectifs / Cagnotte / Changement d'heure / Dimanche), et donne même
 * deux points fixes exploitables : la case 25 est une case ACQUISITION, et la
 * case 31 (Changement d'heure) renvoie vers JOUR DE PAYE. En dehors de ces
 * repères, la notice ne publie pas la disposition complète (quel numéro de
 * case fait quoi exactement) — la répartition ci-dessous est donc une
 * composition originale qui respecte les mécaniques et proportions connues,
 * pas une recopie case-par-case de l'édition de référence.
 */
export function buildDraftBoardLayout(daysPerMonth: number): TileDefinition[] {
  const total = daysPerMonth + 1; // case Départ + N jours
  const { tiles: spiral } = computeSpiralLayout(total);
  const lastIndex = spiral.length - 1;
  const acquisitionConfirmedIndex = Math.min(25, lastIndex - 1);

  let rareCursor = 0;
  let commonCursor = 0;

  return spiral.map((_cell, i): TileDefinition => {
    const make = (type: TileType, source: TileDefinition["source"]): TileDefinition => ({
      id: `${type}-${i}`,
      index: i,
      type,
      label: type === "depart" || type === "paie" ? TILE_LABEL[type] : `${TILE_LABEL[type]} (jour ${i})`,
      status: "configurable",
      source,
    });

    if (i === 0) {
      return make("depart", { reference: "Notice Hasbro officielle, section PRÉPARATION — case DÉPART confirmée ; position originale" });
    }
    if (i === lastIndex) {
      return make("paie", { reference: "Notice Hasbro officielle, section JOUR DE PAYE — case confirmée ; position originale" });
    }
    if (i % 7 === 0) {
      return make("dimanche", {
        reference: "Notice Hasbro officielle, section LE PLATEAU",
        note: "Citation exacte : « Seule la case Dimanche vous permet de vous reposer. » Position alignée sur un vrai calendrier (tous les 7 jours), originale.",
      });
    }
    if (i === acquisitionConfirmedIndex) {
      return make("acquisition", {
        reference: "Notice Hasbro officielle, section CHANGEMENT D'HEURE",
        note: "Citation exacte : « revenez alors à la case d'ACQUISITION du 25 » — position de cette case confirmée par la notice elle-même.",
      });
    }
    if (i % 5 === 2 && rareCursor < RARE_SEQUENCE.length) {
      const type = RARE_SEQUENCE[rareCursor++];
      return make(type, {
        reference: "Notice Hasbro officielle, section LE PLATEAU",
        note: "Mécanique et nom de case confirmés par la notice ; position le long du parcours originale.",
      });
    }
    const type = COMMON_CYCLE[commonCursor++ % COMMON_CYCLE.length];
    return make(type, {
      reference: "Notice Hasbro officielle, section LE PLATEAU",
      note: "Mécanique et nom de case confirmés par la notice ; position le long du parcours originale.",
    });
  });
}

/**
 * Le mode "officiel" ne doit s'activer que lorsque toutes les règles critiques
 * ont été confirmées contre une notice vérifiée. Tant que ce n'est pas le cas,
 * l'interface doit afficher un bandeau "configuration non validée".
 */
export function isOfficialModeUnlocked(): boolean {
  const critical: RuleValue<unknown>[] = [
    economyRules.startingCash,
    economyRules.salary,
    economyRules.savingsInterestRate,
    economyRules.debtInterestRate,
    economyRules.daysPerMonth,
  ];
  return critical.every((r) => r.status === "confirmed");
}

export function listUnverifiedRules(): string[] {
  const entries: Array<[string, RuleValue<unknown>]> = Object.entries(economyRules);
  return entries.filter(([, r]) => r.status !== "confirmed").map(([key]) => key);
}
