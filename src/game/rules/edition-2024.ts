/**
 * Règles de référence — « édition 2024 en euros » (module configurable).
 *
 * ⚠️ AVERTISSEMENT IMPORTANT ⚠️
 * Aucune notice officielle n'a pu être vérifiée au moment de l'écriture de ce module.
 * Conformément à la consigne du projet, AUCUNE valeur ci-dessous n'est présentée comme
 * officielle tant qu'elle n'est pas marquée `status: "confirmed"` avec une `source`
 * documentaire précise (page / section de la notice).
 *
 * Tant que des règles critiques restent `pending`, le jeu doit rester en
 * « mode configuration » (voir `isOfficialModeUnlocked`) et ne jamais afficher
 * ces valeurs comme vérifiées dans l'interface.
 *
 * Pour passer ce module en mode officiel :
 *   1. Fournir la notice (PDF / photos) de l'édition française en euros 2024.
 *   2. Remplacer chaque `rule(value, "pending")` par `rule(value, "confirmed", { reference }) `.
 *   3. Documenter la référence exacte (page, paragraphe) dans `source.reference`.
 */

import { rule, type RuleValue, type CardDefinition, type TileDefinition } from "./types";
import { computeSpiralLayout } from "@/data/board-geometry";

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
}

/**
 * Valeurs économiques — toutes `pending`. Ce sont des valeurs d'amorçage pour que
 * l'architecture et l'interface soient testables, elles ne doivent jamais être
 * communiquées au joueur comme des règles confirmées.
 */
export const economyRules: EconomyRules = {
  startingCash: rule(1500, "pending", {
    reference: "sources tierces non officielles, non la notice elle-même (voir note)",
    note:
      "Deux montants circulent selon les sites de règles consultés : 1 500 € " +
      "(détaillé comme 2 billets de 500 €, 3 de 100 €, 4 de 50 € — regles-du-jeu.net) " +
      "contre 650 € ailleurs (lemagloisirs.fr), probablement une édition antérieure. " +
      "Retenu ici : 1 500 €, le plus précisément détaillé et le plus recoupé, mais " +
      "AUCUNE de ces sources n'est la notice officielle de l'édition 2024 — à confirmer.",
  }),
  salary: rule(1500, "pending", {
    reference: "sources tierces non officielles (voir note)",
    note: "« Recevez 1 500 € de la banque » au Jour de Paye, selon regles-du-jeu.net. Non confirmé contre la notice officielle.",
  }),
  savingsInterestRate: rule(0.25, "pending", {
    reference: "sources tierces non officielles (voir note)",
    note:
      "Un barème (200 €→50 €, 500 €→125 €, 1000 €→250 €, 1500 €→375 €, 2000 €→500 €, " +
      "3000 €→750 €, 5000 €→1250 €) est cité par regles-du-jeu.net ; chaque palier " +
      "correspond exactement à 25 %, d'où cette valeur. Barème à vérifier tel quel " +
      "contre la notice plutôt que ce seul taux.",
  }),
  debtInterestRate: rule(0.1, "pending", {
    reference: "sources tierces non officielles (voir note)",
    note: "« Versez 10 % d'intérêts sur le solde restant dû » selon regles-du-jeu.net. Non confirmé contre la notice officielle.",
  }),
  daysPerMonth: rule(31, "pending", {
    reference: "recoupé sur deux sources indépendantes (voir note)",
    note:
      "31 cases numérotées + 1 case Départ (32 cases au total) : confirmé à la fois par " +
      "comptage visuel sur photo d'un plateau physique de référence ET par lemagloisirs.fr " +
      "(« un plateau de jeu composé de 32 cases : 31 représentant les jours du mois plus " +
      "une case départ »). Concordance forte, mais toujours pas la notice elle-même.",
  }),
  monthsPerGame: rule(3, "confirmed", {
    reference: "Brief projet — durée de partie fixée par le cahier des charges",
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
