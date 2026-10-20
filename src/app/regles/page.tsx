import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle2, Settings2 } from "lucide-react";
import { economyRules, sampleCards, RULESET_VERSION, isOfficialModeUnlocked } from "@/game/rules/edition-2024";
import type { RuleStatus } from "@/game/rules/types";

const STATUS_META: Record<RuleStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  confirmed: { label: "Confirmé", icon: CheckCircle2, className: "text-emerald-600 bg-emerald-600/10" },
  pending: { label: "Non vérifié", icon: AlertTriangle, className: "text-garnet-600 bg-garnet-600/10" },
  configurable: { label: "Configurable", icon: Settings2, className: "text-copper-600 bg-copper-600/10" },
  unimplemented: { label: "Non implémenté", icon: AlertTriangle, className: "text-navy-800/50 bg-navy-900/5" },
};

function StatusBadge({ status }: { status: RuleStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.className}`}>
      <Icon size={13} />
      {meta.label}
    </span>
  );
}

const economyEntries: Array<[string, { value: unknown; status: RuleStatus; source?: { reference: string; note?: string } }]> = [
  ["Capital de départ", economyRules.startingCash],
  ["Salaire (jour de paie)", economyRules.salary],
  ["Taux d'intérêt épargne", economyRules.savingsInterestRate],
  ["Taux d'intérêt dette", economyRules.debtInterestRate],
  ["Jours par mois", economyRules.daysPerMonth],
  ["Mois par partie", economyRules.monthsPerGame],
  ["Palier de prêt", economyRules.loanIncrement],
  ["Frais de retrait d'épargne", economyRules.savingsWithdrawalFee],
];

export default function ReglesPage() {
  const officialMode = isOfficialModeUnlocked();

  return (
    <main className="min-h-screen bg-ivory-100 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-navy-800/60 hover:text-navy-900 text-sm font-sans mb-6">
          <ArrowLeft size={16} /> Menu principal
        </Link>

        <h1 className="font-display text-4xl text-navy-900 mb-2">Règles du jeu</h1>
        <p className="font-sans text-navy-800/60 mb-6">
          Version de configuration : <code className="bg-navy-900/5 px-1.5 py-0.5 rounded">{RULESET_VERSION}</code>
        </p>

        <div
          className={`rounded-xl px-5 py-4 mb-8 border ${
            officialMode
              ? "bg-emerald-600/10 border-emerald-600/30 text-emerald-800"
              : "bg-garnet-600/10 border-garnet-600/30 text-garnet-700"
          }`}
        >
          <p className="font-semibold font-sans">
            {officialMode
              ? "Valeurs économiques confirmées contre la notice officielle Hasbro"
              : "Mode configuration — règles non officielles"}
          </p>
          <p className="text-sm mt-1 font-sans">
            {officialMode ? (
              <>
                Une notice officielle de « La Bonne Paye » (Hasbro, instructions.hasbro.com,
                réf. 000324470_INST_PaydayRC2_FAR) a été retrouvée et lue : capital de départ,
                salaire, taux de prêt, barème d&apos;épargne et nombre de jours en sont
                directement cités. ⚠️ Cette notice n&apos;est pas explicitement datée « édition
                2024 » — c&apos;est l&apos;instruction générique Hasbro, probablement identique
                mais pas garantie à 100 % pour la boîte 2024 précise. Le détail exact de chaque
                case du plateau et les textes des cartes restent une composition ORIGINALE de ce
                projet, pas une copie de la notice.
              </>
            ) : (
              <>
                Aucune notice de référence n&apos;a pu être vérifiée. Les valeurs ci-dessous sont
                des paramètres d&apos;amorçage — fournissez la notice pour les valider dans{" "}
                <code className="bg-navy-900/10 px-1 rounded">src/game/rules/edition-2024.ts</code>.
              </>
            )}
          </p>
        </div>

        <section className="mb-10">
          <h2 className="font-display text-2xl text-navy-900 mb-4">Économie</h2>
          <div className="surface-card rounded-xl divide-y divide-navy-900/10">
            {economyEntries.map(([label, rule]) => (
              <div key={label} className="flex items-center justify-between px-5 py-3.5 gap-4">
                <span className="font-sans text-navy-900">{label}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-ledger text-navy-800/80 tabular-nums">{String(rule.value)}</span>
                  <StatusBadge status={rule.status} />
                </div>
              </div>
            ))}
          </div>
          <p className="font-sans text-xs text-navy-800/45 mt-3">
            Détail et citations exactes dans{" "}
            <code className="bg-navy-900/5 px-1 rounded">economyRules</code> (fichier{" "}
            <code className="bg-navy-900/5 px-1 rounded">src/game/rules/edition-2024.ts</code>).
            Le palier de prêt et les frais de retrait d&apos;épargne sont confirmés mais pas
            encore câblés dans le moteur de jeu (aucun emprunt/retrait possible pour l&apos;instant).
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl text-navy-900 mb-4">Catégories de cartes</h2>
          <p className="font-sans text-sm text-navy-800/60 mb-4">
            Exemples structurels ORIGINAUX : titres, textes et montants propres à ce projet
            (la notice officielle ne publie pas le contenu carte-par-carte de ses 4 paquets —
            ACQUISITION, COURRIER, PRÊT, ÉVÈNEMENT — seulement leur mécanique générale). Chaque
            carte ci-dessous applique désormais une mécanique dont l&apos;existence dans le jeu
            réel est confirmée et citée dans{" "}
            <code className="bg-navy-900/10 px-1 rounded">sampleCards</code>.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {sampleCards.map((card) => (
              <div key={card.id} className="surface-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider text-copper-700/70 font-sans">{card.category}</span>
                  <StatusBadge status={card.status} />
                </div>
                <p className="font-display text-lg text-navy-900">{card.title}</p>
                <p className="font-sans text-sm text-navy-800/60 mt-1">{card.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl text-navy-900 mb-4">Ce qui reste à valider</h2>
          <p className="font-sans text-sm text-navy-800/60 mb-3">
            La notice officielle complète (texte intégral, pas seulement la page de
            présentation) a été lue en détail. Les points ci-dessous sont les seuls qui
            restent réellement ouverts :
          </p>
          <ul className="font-sans text-sm text-navy-800/70 list-disc list-inside space-y-1.5">
            <li>Mécaniques confirmées mais pas encore implémentées dans le moteur de jeu : emprunt/remboursement par paliers de 1 500 €, retrait d&apos;épargne (frais fixes de 150 €), case Loterie, Cagnotte (jackpot sur un 6), Changement d&apos;heure, cartes Assurance, vente aux enchères d&apos;ACQUISITION/ASSURANCE en cas de dette, et calcul du capital final (cash + épargne − prêts restants, le moins endetté l&apos;emportant en cas d&apos;endettement généralisé).</li>
            <li>Confirmer que cette notice générique correspond bien, sans écart, à la boîte « édition 2024 » (réf. F6424) et pas seulement à une réimpression antérieure (même référence fabricant 000324470, datée 2014).</li>
            <li>Le contenu carte-par-carte des 4 paquets réels (112 cartes au total) n&apos;est pas public — les cartes de ce projet resteront donc toujours des exemples originaux, jamais une recopie.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
