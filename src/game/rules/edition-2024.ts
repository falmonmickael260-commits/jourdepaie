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
    reference: "Notice Hasbro officielle, cartes ÉVÈNEMENT « Changement d'heure » + section ÉPARGNE",
    note:
      "La notice mentionne explicitement une « case 23 » (date limite pour épargner dans " +
      "le mois) et une « case 31 » (effet de la carte Changement d'heure : retour à " +
      "DÉPART → direction case 31 + 1500€), ce qui confirme un parcours d'au moins 31 " +
      "jours numérotés avant la case JOUR DE PAYE.",
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
 * Catégories de cartes prévues par le cahier des charges. Les paquets réels
 * (quantités, textes, effets précis) restent à constituer après vérification.
 * Les cartes ci-dessous sont des exemples structurels ORIGINAUX, en nombre
 * volontairement réduit, pour valider le moteur — pas un paquet final.
 */
export const sampleCards: CardDefinition[] = [
  {
    id: "evt-001",
    category: "evenement",
    title: "Fuite au plafond",
    description:
      "Une petite réparation imprévue s'impose chez vous ce mois-ci.",
    effect: { type: "payment", amount: 80 },
    status: "pending",
    source: { reference: "carte d'exemple — à valider contre la notice" },
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
    status: "pending",
    source: { reference: "carte d'exemple — à valider contre la notice" },
  },
  {
    id: "not-001",
    category: "notification",
    title: "Prime exceptionnelle",
    description: "Votre entreprise reverse une prime à l'ensemble du personnel.",
    effect: { type: "gain", amount: 150 },
    status: "pending",
    source: { reference: "carte d'exemple — à valider contre la notice" },
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
 * PARCOURS observée sur un plateau physique de référence. L'habillage
 * (catégories exactes, textes, densité d'événements) reste ORIGINAL et
 * CONFIGURABLE tant que la disposition officielle complète n'est pas vérifiée
 * contre une notice. Ne jamais présenter ce détail comme la disposition
 * exacte de l'édition de référence.
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
        status: "pending",
        source: { reference: "non vérifié — notice requise" },
      };
    }
    if (i === spiral.length - 1) {
      return {
        id: "paie",
        index: i,
        type: "paie",
        label: "Jour de paie",
        status: "pending",
        source: { reference: "non vérifié — notice requise" },
      };
    }
    const isEvent = cell.isTurn && i % 2 === 0;
    return {
      id: `jour-${i}`,
      index: i,
      type: isEvent ? "evenement" : "jour",
      label: isEvent ? `Jour ${i} — Événement` : `Jour ${i}`,
      status: "pending",
      source: { reference: "non vérifié — notice requise" },
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
