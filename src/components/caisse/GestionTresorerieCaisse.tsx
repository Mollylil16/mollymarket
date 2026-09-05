import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { MouvementCaisse, TypeMouvementCaisse, SensMouvementCaisse } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatFCFA } from '../../utils/format';
import { Modal } from '../ui/Modal';
import { FormField } from '../ui/FormField';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  MinusCircle,
  Plus,
  PlusCircle,
  Receipt,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-react';

export const GestionTresorerieCaisse: React.FC = () => {
  const { user } = useAuth();
  const { toastSuccess, toastError, toastWarning } = useToast();

  const [mouvements, setMouvements] = useState<MouvementCaisse[]>([]);
  const [soldeInfo, setSoldeInfo] = useState<{
    soldeActuel: number;
    totalEntrees: number;
    totalSorties: number;
    fondInitial: number;
    totalVentesEspeces: number;
    totalEntreesManuelles: number;
  }>({
    soldeActuel: 50000,
    totalEntrees: 0,
    totalSorties: 0,
    fondInitial: 50000,
    totalVentesEspeces: 0,
    totalEntreesManuelles: 0
  });

  const [loading, setLoading] = useState(true);
  const [filtreType, setFiltreType] = useState<string>('tous');
  const [recherche, setRecherche] = useState<string>('');

  // Modals
  const [modalMouvementOpen, setModalMouvementOpen] = useState(false);
  const [mouvementSens, setMouvementSens] = useState<SensMouvementCaisse>('entree');
  const [typeMouvement, setTypeMouvement] = useState<TypeMouvementCaisse>('apport_fond');
  const [montant, setMontant] = useState<number>(10000);
  const [motif, setMotif] = useState<string>('');
  const [justificatif, setJustificatif] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mouvs, solde] = await Promise.all([
        apiClient.getMouvementsCaisse(),
        apiClient.getSoldeCaisseActuel()
      ]);
      setMouvements(mouvs);
      setSoldeInfo(solde);
    } catch (err: any) {
      toastError(err.message || 'Erreur chargement trésorerie');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNouveauMouvement = (sens: SensMouvementCaisse) => {
    setMouvementSens(sens);
    setTypeMouvement(sens === 'entree' ? 'apport_fond' : 'depense_especes');
    setMontant(sens === 'entree' ? 50000 : 5000);
    setMotif('');
    setJustificatif('');
    setModalMouvementOpen(true);
  };

  const handleSubmitMouvement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (montant <= 0) {
      toastWarning('Veuillez saisir un montant positif supérieur à 0.');
      return;
    }
    if (!motif.trim()) {
      toastWarning('Le motif de l\'opération est requis.');
      return;
    }

    if (mouvementSens === 'sortie' && montant > soldeInfo.soldeActuel) {
      if (!window.confirm(`Attention : Le solde disponible (${formatFCFA(soldeInfo.soldeActuel)}) est inférieur au montant demandé (${formatFCFA(montant)}). Confirmer quand même le décaissement ?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      await apiClient.ajouterMouvementCaisse({
        sens: mouvementSens,
        type: typeMouvement,
        montant,
        motif: motif.trim(),
        justificatif: justificatif.trim() || undefined,
        effectue_par_nom: user ? `${user.prenom} ${user.nom} (${user.role})` : 'Eden Touré (Directeur)'
      });

      toastSuccess(
        `${mouvementSens === 'entree' ? 'Entrée de fond' : 'Sortie de caisse'} enregistrée avec succès`,
        `${formatFCFA(montant)} • Nouveau solde : ${formatFCFA(
          mouvementSens === 'entree' ? soldeInfo.soldeActuel + montant : soldeInfo.soldeActuel - montant
        )}`
      );

      setModalMouvementOpen(false);
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Erreur lors de l\'enregistrement du mouvement');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMouvements = mouvements.filter((m) => {
    if (filtreType !== 'tous' && m.sens !== filtreType) return false;
    if (recherche.trim()) {
      const q = recherche.toLowerCase();
      return (
        m.motif.toLowerCase().includes(q) ||
        m.effectue_par_nom.toLowerCase().includes(q) ||
        (m.justificatif && m.justificatif.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const exporterJournalExcel = () => {
    if (mouvements.length === 0) {
      toastWarning('Aucun mouvement à exporter dans le journal.');
      return;
    }

    const headers = ['Date & Heure', 'Type Mouvement', 'Sens', 'Montant (FCFA)', 'Solde Après (FCFA)', 'Motif', 'Justificatif', 'Ordonnateur'];
    const csvRows = [headers.join(';')];
    
    mouvements.forEach((m) => {
      csvRows.push([
        `"${m.date_mouvement}"`,
        `"${m.type}"`,
        `"${m.sens}"`,
        m.montant,
        m.solde_apres,
        `"${(m.motif || '').replace(/"/g, '""')}"`,
        `"${(m.justificatif || '').replace(/"/g, '""')}"`,
        `"${(m.effectue_par_nom || '').replace(/"/g, '""')}"`
      ].join(';'));
    });

    const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Journal_Tresorerie_Caisse_MollyMarket_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toastSuccess('Journal des flux de trésorerie exporté (CSV / Excel)');
  };

  return (
    <div className="space-y-6">
      {/* 3 Cartes de KPI Trésorerie */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Solde Net Disponible */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Solde de Caisse Actuel
            </div>
            <div className="text-2xl font-black text-[#2E7D32] font-mono mt-1">
              {formatFCFA(soldeInfo.soldeActuel)}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Fond initial ({formatFCFA(soldeInfo.fondInitial)}) + Recettes nettes
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Total Entrées de Fonds */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Total Entrées & Recettes
            </div>
            <div className="text-2xl font-black text-blue-700 font-mono mt-1">
              {formatFCFA(soldeInfo.totalEntrees)}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Ventes espèces ({formatFCFA(soldeInfo.totalVentesEspeces || 0)}) + Apports
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Sorties de Caisse */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Total Décaissements
            </div>
            <div className="text-2xl font-black text-amber-700 font-mono mt-1">
              {formatFCFA(soldeInfo.totalSorties)}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Achats fournisseurs, frais et sorties espèces
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Barre d'Actions de Direction & Filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => openNouveauMouvement('entree')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-xs transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nouvelle Entrée de Fond</span>
          </button>

          <button
            onClick={() => openNouveauMouvement('sortie')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all"
          >
            <MinusCircle className="w-4 h-4" />
            <span>Sortie de Caisse (Dépense / Banque)</span>
          </button>

          <button
            onClick={exporterJournalExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Exporter Journal CSV</span>
          </button>
        </div>

        {/* Filtres & Recherche */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher motif, auteur..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#2E7D32] w-48"
            />
          </div>

          <select
            value={filtreType}
            onChange={(e) => setFiltreType(e.target.value)}
            className="text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-[#2E7D32]"
          >
            <option value="tous">Tous les flux</option>
            <option value="entree">Entrées uniquement</option>
            <option value="sortie">Sorties uniquement</option>
          </select>
        </div>
      </div>

      {/* Tableau du Journal de Caisse */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#2E7D32]" />
            <h3 className="font-bold text-sm text-neutral-900">
              Grand Livre des Mouvements de Caisse ({filteredMouvements.length})
            </h3>
          </div>
          <span className="text-[11px] text-neutral-400">
            Contrôle d'accès & validation : Direction Générale
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Date & Heure</th>
                <th className="py-2.5 px-3">Nature du Mouvement</th>
                <th className="py-2.5 px-3">Motif & Justificatif</th>
                <th className="py-2.5 px-3 text-right">Montant</th>
                <th className="py-2.5 px-3 text-right">Solde Caisse</th>
                <th className="py-2.5 px-3">Ordonnateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredMouvements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-400 text-xs">
                    Aucun mouvement de caisse enregistré.
                  </td>
                </tr>
              ) : (
                filteredMouvements.map((m) => {
                  const isEntree = m.sens === 'entree';

                  const typeLabelMap: Record<string, string> = {
                    apport_fond: 'Apport de fond',
                    entree_exceptionnelle: 'Entrée exceptionnelle',
                    retrait_banque: 'Versement / Retrait banque',
                    depense_especes: 'Dépense magasin en espèces',
                    paiement_fournisseur: 'Paiement fournisseur',
                    ajustement_fond: 'Ajustement de fond'
                  };

                  return (
                    <tr key={m.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono text-[11px] text-neutral-600">
                        {m.date_mouvement}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isEntree
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isEntree ? (
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-amber-600" />
                          )}
                          <span>{typeLabelMap[m.type] || m.type}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-neutral-900">{m.motif}</div>
                        {m.justificatif && (
                          <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                            <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-[10px]">
                              Réf : {m.justificatif}
                            </span>
                          </div>
                        )}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono font-bold text-sm ${
                          isEntree ? 'text-[#2E7D32]' : 'text-amber-700'
                        }`}
                      >
                        {isEntree ? `+${formatFCFA(m.montant)}` : `-${formatFCFA(m.montant)}`}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-neutral-800">
                        {formatFCFA(m.solde_apres)}
                      </td>
                      <td className="py-3 px-3 text-neutral-600 text-[11px]">
                        {m.effectue_par_nom}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nouveau Mouvement de Caisse (Entrée ou Sortie) */}
      <Modal
        isOpen={modalMouvementOpen}
        onClose={() => !submitting && setModalMouvementOpen(false)}
        title={mouvementSens === 'entree' ? 'Enregistrer une Entrée de Fond' : 'Enregistrer une Sortie de Caisse'}
        subtitle={
          mouvementSens === 'entree'
            ? 'Alimentation du fond de roulement, apport de liquidités ou encaissement exceptionnel'
            : 'Dépenses magasins courantes, règlement fournisseur ou versement bancaire'
        }
        size="md"
        footer={
          <>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setModalMouvementOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="mouvement-caisse-form"
              disabled={submitting}
              className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5 ${
                mouvementSens === 'entree'
                  ? 'bg-[#2E7D32] hover:bg-[#1B5E20]'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? 'Validation...' : 'Valider l\'opération financière'}</span>
            </button>
          </>
        }
      >
        <form id="mouvement-caisse-form" onSubmit={handleSubmitMouvement} className="space-y-4 text-xs">
          <FormField
            id="type-mouvement"
            label="Type d'Opération"
            type="select"
            required
            value={typeMouvement}
            onChange={(e) => setTypeMouvement(e.target.value as TypeMouvementCaisse)}
            options={
              mouvementSens === 'entree'
                ? [
                    { value: 'apport_fond', label: 'Apport de fond de roulement' },
                    { value: 'entree_exceptionnelle', label: 'Entrée exceptionnelle / Régularisation' }
                  ]
                : [
                    { value: 'depense_especes', label: 'Dépense magasin en espèces (Fournitures, courses)' },
                    { value: 'retrait_banque', label: 'Versement des recettes à la banque' },
                    { value: 'paiement_fournisseur', label: 'Paiement fournisseur comptant' },
                    { value: 'ajustement_fond', label: 'Ajustement exceptionnel de fond' }
                  ]
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              id="montant-mouvement"
              label="Montant (FCFA)"
              type="number"
              required
              min={100}
              step={100}
              value={montant}
              onChange={(e) => setMontant(Number(e.target.value))}
            />

            <FormField
              id="justificatif-ref"
              label="N° Pièce Justificative (Optionnel)"
              type="text"
              placeholder="Ex: FACT-045, RECU-22"
              value={justificatif}
              onChange={(e) => setJustificatif(e.target.value)}
            />
          </div>

          <FormField
            id="motif-mouvement"
            label="Motif Détaillé de l'Opération"
            type="text"
            required
            placeholder="Ex: Achat produits d'entretien et rouleaux thermiques tickets caisse"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
          />

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-600 text-[11px] space-y-1">
            <div className="font-semibold text-neutral-800">Contrôle de Direction :</div>
            <div>• Enregistré sous l'identité de : {user ? `${user.prenom} ${user.nom} (${user.role})` : 'Directeur'}</div>
            <div>• Le solde de caisse sera mis à jour en temps réel immédiatement après confirmation.</div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
