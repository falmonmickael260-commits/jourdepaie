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

const economyEntries: Array<[string, { value: unknown; status: RuleStatus }]> = [
  ["Capital de départ", economyRules.startingCash],
  ["Salaire (jour de paie)", economyRules.salary],
  ["Taux d'intérêt épargne", economyRules.savingsInterestRate],
  ["Taux d'intérêt dette", economyRules.debtInterestRate],
  ["Jours par mois", economyRules.daysPerMonth],
  ["Mois par partie", economyRules.monthsPerGame],
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
              ? "Mode officiel déverrouillé — toutes les règles critiques sont confirmées."
              : "Mode configuration — règles non officielles"}
          </p>
          {!officialMode && (
            <p className="text-sm mt-1 font-sans">
              Aucune notice de l&apos;édition française en euros 2024 de référence n&apos;a pu être vérifiée.
              Les valeurs ci-dessous sont des paramètres d&apos;amorçage pour tester le moteur de jeu —
              elles ne doivent jamais être prises pour des règles officielles. Fournissez la notice
              (PDF ou photos) pour les valider une à une dans{" "}
              <code className="bg-navy-900/10 px-1 rounded">src/game/rules/edition-2024.ts</code>.
            </p>
          )}
        </div>

        <section className="mb-10">
          <h2 className="font-display text-2xl text-navy-900 mb-4">Économie</h2>
          <div className="surface-card rounded-xl divide-y divide-navy-900/10">
            {economyEntries.map(([label, rule]) => (
              <div key={label} className="flex items-center justify-between px-5 py-3.5">
                <span className="font-sans text-navy-900">{label}</span>
                <div className="flex items-center gap-3">
                  <span className="font-ledger text-navy-800/80 tabular-nums">{String(rule.value)}</span>
                  <StatusBadge status={rule.status} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl text-navy-900 mb-4">Catégories de cartes</h2>
          <p className="font-sans text-sm text-navy-800/60 mb-4">
            Exemples structurels pour valider le moteur — textes et effets originaux, en nombre
            volontairement réduit tant que les paquets réels ne sont pas constitués.
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
          <ul className="font-sans text-sm text-navy-800/70 list-disc list-inside space-y-1.5">
            <li>
              Capital de départ : sources tierces en désaccord (1 500 € contre 650 € selon le site
              consulté) — probablement deux éditions différentes, à trancher avec la vraie notice.
            </li>
            <li>Salaire, barème d&apos;épargne et taux de prêt : trouvés sur des sites de règles non officiels, jamais sur la notice elle-même.</li>
            <li>
              Un descriptif produit mentionne un plateau proposant « le choix entre deux activités
              par jour » — mécanique non comprise ni implémentée ici, faute de détail.
            </li>
            <li>Paquets de cartes complets (quantités, effets, déclencheurs) par catégorie.</li>
            <li>Ordre exact des opérations de fin de mois et méthode de classement final.</li>
            <li>Règles de remboursement de prêt et de calcul des enchères.</li>
          </ul>
          <p className="font-sans text-xs text-navy-800/45 mt-4">
            Les pistes ci-dessus viennent de recherches sur des sites de règles tiers (non
            officiels) — voir les références détaillées dans{" "}
            <code className="bg-navy-900/5 px-1 rounded">src/game/rules/edition-2024.ts</code>.
            Rien ici ne remplace la notice imprimée de l&apos;édition 2024.
          </p>
        </section>
      </div>
    </main>
  );
}
