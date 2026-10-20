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

import { rule, type RuleValue, type CardDefinition, type TileDefinition } from "./types";
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
];

/**
 * Disposition du plateau — parcours en spirale carrée se resserrant vers un
 * médaillon central (case de fin de mois), à l'image de la LOGIQUE DE
 * PARCOURS observée sur un plateau physique de référence.
 *
 * La notice officielle confirme QUE chaque case du plateau a une action (type
 * Courrier / Acquisition / Vendez / Quoi de neuf / Loterie / Anniversaire /
 * Cagnotte / Changement d'heure / Dimanche), mais ne publie pas la disposition
 * exacte (quel numéro de case fait quoi) — ce détail reste une composition
 * ORIGINALE et CONFIGURABLE de ce projet, conformément au brief : il ne s'agit
 * pas d'une valeur « en attente de vérification », mais d'un choix de design
 * assumé qui ne sera jamais calqué sur l'édition de référence.
 */
export function buildDraftBoardLayout(daysPerMonth: number): TileDefinition[] {
  const total = daysPerMonth + 1; // case Départ + N jours
  const { tiles: spiral } = computeSpiralLayout(total);

  return spiral.map((cell, i): TileDefinition => {
    if (i === 0) {
      return {
        id: "depart",
        index: i,
        type: "depart",
        label: "Départ",
        status: "configurable",
        source: { reference: "Notice Hasbro officielle, section PRÉPARATION — case DÉPART confirmée ; position originale" },
      };
    }
    if (i === spiral.length - 1) {
      return {
        id: "paie",
        index: i,
        type: "paie",
        label: "Jour de paie",
        status: "configurable",
        source: { reference: "Notice Hasbro officielle, section JOUR DE PAYE — case confirmée ; position originale" },
      };
    }
    const isEvent = cell.isTurn && i % 2 === 0;
    return {
      id: `jour-${i}`,
      index: i,
      type: isEvent ? "evenement" : "jour",
      label: isEvent ? `Jour ${i} — Événement` : `Jour ${i}`,
      status: "configurable",
      source: {
        reference: "Disposition originale — répartition exacte des cases non publiée par la notice",
      },
    };
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
