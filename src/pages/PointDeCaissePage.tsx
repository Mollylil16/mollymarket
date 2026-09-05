import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { PointDeCaisse, ModePaiement, LigneBilletagePointCaisse } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCaisseStore } from '../store/useCaisseStore';
import { formatFCFA } from '../utils/format';
import {
  exporterPointCaissePDF,
  exporterPointCaisseExcel,
  exporterHistoriquePointsCaisseExcel
} from '../utils/exportUtils';
import {
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  FileText,
  FileSpreadsheet,
  AlertTriangle,
  Send,
  Calendar,
  DollarSign,
  UserCheck,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  Eye,
  XCircle,
  History,
  TrendingUp,
  Receipt,
  Wallet,
  Banknote,
  CreditCard
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { GestionTresorerieCaisse } from '../components/caisse/GestionTresorerieCaisse';

export const PointDeCaissePage: React.FC = () => {
  const { user } = useAuth();
  const { toastSuccess, toastError, toastWarning } = useToast();

  const formatDateJournee = (d: any) => {
    if (!d) return '';
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return String(d);
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const [tabPrincipal, setTabPrincipal] = useState<'session' | 'tresorerie' | 'historique'>('session');

  const {
    sessionActive,
    isVerrouillee: caisseVerrouillee,
    statutSession,
    isOuverte,
    historique,
    isLoading: storeLoading,
    chargerEtatCaisse,
    ouvrirSession,
    soumettreAuDirecteur,
    validerParDirecteur,
    rejeterParDirecteur,
    deverrouillerUrgence
  } = useCaisseStore();

  const activeSession = sessionActive;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Saisie du comptage physique
  type ComptageMode = 'especes' | 'wave' | 'orange_money' | 'mtn_money' | 'carte_bancaire' | 'cheque';

  const [comptages, setComptages] = useState<Record<ComptageMode, number>>({
    especes: 0,
    wave: 0,
    orange_money: 0,
    mtn_money: 0,
    carte_bancaire: 0,
    cheque: 0
  });

  const [observations, setObservations] = useState('');

  // Modals
  const [modalDetailsPoint, setModalDetailsPoint] = useState<PointDeCaisse | null>(null);
  const [modalRejetOpen, setModalRejetOpen] = useState(false);
  const [rejetMotif, setRejetMotif] = useState('');
  const [modalNouvelleSessionOpen, setModalNouvelleSessionOpen] = useState(false);
  const [nouveauFondCaisse, setNouveauFondCaisse] = useState(50000);

  const isDirecteur = user?.role === 'Directeur' || user?.role === 'Administrateur';
  const isVendeur = user?.role === 'Vendeur' || user?.role === 'Administrateur';

  const loadData = async () => {
    setLoading(true);
    try {
      await chargerEtatCaisse(user?.id || 3, user ? `${user.prenom} ${user.nom}` : 'Noam Koffi');
    } catch (err: any) {
      toastError(err.message || 'Erreur lors du chargement du point de caisse');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Synchroniser les champs de comptage dès que sessionActive change
  useEffect(() => {
    if (sessionActive) {
      setComptages({
        especes: sessionActive.repartition.especes?.montant_compte ?? sessionActive.repartition.especes?.montant_theorique ?? 0,
        wave: sessionActive.repartition.wave?.montant_compte ?? sessionActive.repartition.wave?.montant_theorique ?? 0,
        orange_money: sessionActive.repartition.orange_money?.montant_compte ?? sessionActive.repartition.orange_money?.montant_theorique ?? 0,
        mtn_money: sessionActive.repartition.mtn_money?.montant_compte ?? sessionActive.repartition.mtn_money?.montant_theorique ?? 0,
        carte_bancaire: sessionActive.repartition.carte_bancaire?.montant_compte ?? sessionActive.repartition.carte_bancaire?.montant_theorique ?? 0,
        cheque: sessionActive.repartition.cheque?.montant_compte ?? sessionActive.repartition.cheque?.montant_theorique ?? 0
      });
      setObservations(sessionActive.observations || '');
    }
  }, [sessionActive]);

  // Calcul dynamique des écarts
  const getEcart = (mode: ComptageMode) => {
    if (!sessionActive) return 0;
    const th = sessionActive.repartition[mode]?.montant_theorique || 0;
    const c = comptages[mode] || 0;
    return c - th;
  };

  const totalCompte =
    (Object.values(comptages) as number[]).reduce((a: number, b: number) => a + (Number(b) || 0), 0);
  const totalTheorique = sessionActive ? Number(sessionActive.total_theorique || (Number(sessionActive.fond_caisse_initial || 0) + Number(sessionActive.total_ventes || 0))) : 0;
  const ecartGlobal = sessionActive ? totalCompte - totalTheorique : 0;

  // Soumission au Directeur avec VERROUILLAGE AUTOMATIQUE via Zustand
  const handleSoumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionActive) return;

    setSubmitting(true);
    try {
      await soumettreAuDirecteur({
        comptages,
        observations,
        vendeurNom: user ? `${user.prenom} ${user.nom}` : 'Noam Koffi'
      });

      toastSuccess(
        'Point de caisse soumis avec succès au Directeur Eden ! La caisse est désormais automatiquement verrouillée jusqu\'à demain.',
        'Session Clôturée & Verrouillée'
      );
    } catch (err: any) {
      toastError(err.message || 'Erreur lors de la soumission du point de caisse');
    } finally {
      setSubmitting(false);
    }
  };

  // Validation par le Directeur
  const handleValiderParDirecteur = async () => {
    if (!sessionActive) return;
    setSubmitting(true);
    try {
      await validerParDirecteur(
        user ? `${user.prenom} ${user.nom} (${user.role})` : 'Eden Touré (Directeur)'
      );
      toastSuccess('Le point de caisse a été validé et archivé avec succès.', 'Validation Directeur');
    } catch (err: any) {
      toastError(err.message || 'Erreur validation');
    } finally {
      setSubmitting(false);
    }
  };

  // Rejet par le Directeur (déverrouille automatiquement la caisse)
  const handleRejeterParDirecteur = async () => {
    if (!sessionActive) return;
    if (!rejetMotif.trim()) {
      toastWarning('Veuillez indiquer le motif du rejet ou la demande de correction.');
      return;
    }

    setSubmitting(true);
    try {
      await rejeterParDirecteur(
        rejetMotif,
        user ? `${user.prenom} ${user.nom} (${user.role})` : 'Eden Touré (Directeur)'
      );
      setModalRejetOpen(false);
      setRejetMotif('');
      toastSuccess('Point de caisse retourné au vendeur pour régularisation. Caisse automatiquement déverrouillée.', 'Notification Envoyée');
    } catch (err: any) {
      toastError(err.message || 'Erreur rejet');
    } finally {
      setSubmitting(false);
    }
  };

  // Ouverture d'une nouvelle session de caisse via Zustand
  const handleOuvrirNouvelleSession = async () => {
    setSubmitting(true);
    try {
      const session = await ouvrirSession(
        nouveauFondCaisse,
        user?.id || 3,
        user ? `${user.prenom} ${user.nom}` : 'Noam Koffi'
      );
      setModalNouvelleSessionOpen(false);
      toastSuccess(
        `Nouvelle session de caisse ouverte pour le ${session.date_journee} (Fond initial : ${formatFCFA(nouveauFondCaisse)})`,
        'Caisse Ouverte & Déverrouillée'
      );
    } catch (err: any) {
      toastError(err.message || 'Erreur ouverture session');
    } finally {
      setSubmitting(false);
    }
  };

  // Déverrouillage d'urgence
  const handleDeverrouillerUrgence = async () => {
    await deverrouillerUrgence();
    toastWarning('La caisse a été déverrouillée manuellement par l\'administration.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 text-[#2E7D32] animate-spin" />
          <span className="text-xs font-semibold text-neutral-500">Chargement des données de caisse...</span>
        </div>
      </div>
    );
  }

  const modesConfig: {
    key: ComptageMode;
    label: string;
    logo?: string;
    iconType?: string;
    description: string;
  }[] = [
    { key: 'especes', label: 'Espèces (Billets & Pièces)', iconType: 'especes', description: 'Monnaie physique comptée dans le tiroir-caisse' },
    { key: 'wave', label: 'Wave Mobile Money', logo: '/images/wave_logo.png', description: 'Solde relevé sur l\'application Wave Marchand' },
    { key: 'orange_money', label: 'Orange Money CI', logo: '/images/orange.png', description: 'Relevé terminal Orange Money Kiosque' },
    { key: 'mtn_money', label: 'MTN Mobile Money', iconType: 'mtn', description: 'Relevé téléphone marchand MTN MoMo' },
    { key: 'carte_bancaire', label: 'Carte Bancaire (TPE)', iconType: 'carte', description: 'Ticket télécollecte total TPE de la journée' },
    { key: 'cheque', label: 'Chèques Encaissés', iconType: 'cheque', description: 'Total des chèques certifiés reçus en caisse' }
  ];

  return (
    <div className="space-y-6">
      {/* Header avec Statut Global */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#212121]">Point de Caisse Journalier</h2>
            {caisseVerrouillee ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                <Lock className="w-3 h-3 text-rose-600" />
                Caisse Verrouillée
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Unlock className="w-3 h-3 text-emerald-600" />
                Caisse Ouverte
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Clôture journalière, calcul des écarts théoriques vs comptés, et validation hiérarchique par le Directeur
          </p>
        </div>

        {/* Boutons d'actions principaux */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeSession && (
            <>
              <button
                onClick={() => exporterPointCaisseExcel(activeSession)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-700 text-xs font-semibold hover:bg-neutral-50 transition-colors shadow-2xs"
                title="Exporter ce point de caisse au format Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={() => exporterPointCaissePDF(activeSession)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-700 text-xs font-semibold hover:bg-neutral-50 transition-colors shadow-2xs"
                title="Générer la fiche officielle en PDF"
              >
                <FileText className="w-4 h-4 text-rose-600" />
                <span>Export PDF</span>
              </button>
            </>
          )}

          {isDirecteur && caisseVerrouillee && (
            <button
              onClick={() => setModalNouvelleSessionOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-xs transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Ouvrir la caisse du lendemain</span>
            </button>
          )}

          {isDirecteur && caisseVerrouillee && (
            <button
              onClick={handleDeverrouillerUrgence}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium transition-colors"
              title="Déverrouiller sans créer de nouvelle session"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Déverrouillage forcé</span>
            </button>
          )}
        </div>
      </div>

      {/* Barre d'onglets principale : Point de Caisse / Trésorerie Flux / Historique */}
      <div className="flex items-center gap-2 p-1.5 bg-neutral-100/90 rounded-2xl w-fit border border-neutral-200">
        <button
          onClick={() => setTabPrincipal('session')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tabPrincipal === 'session'
              ? 'bg-white text-[#2E7D32] shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Point de Caisse Journalier</span>
        </button>

        <button
          onClick={() => setTabPrincipal('tresorerie')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tabPrincipal === 'tresorerie'
              ? 'bg-white text-[#2E7D32] shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Trésorerie & Gestion des Fonds (Directeur)</span>
        </button>

        <button
          onClick={() => setTabPrincipal('historique')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tabPrincipal === 'historique'
              ? 'bg-white text-[#2E7D32] shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historique des Sessions Clôturées</span>
        </button>
      </div>

      {/* VUE 1 : SESSION DU JOUR & BILLETAGE */}
      {tabPrincipal === 'session' && (
        <div className="space-y-6">
          {/* Bannière d'état de la Caisse */}
          {caisseVerrouillee ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 flex-1">
                <div className="font-bold text-rose-950 text-sm">
                  Session de caisse soumise et verrouillée jusqu'au lendemain
                </div>
                <p className="mt-1">
                  Le caissier <strong>{activeSession?.vendeur_nom}</strong> a finalisé et soumis le point de caisse du{' '}
                  <strong>{formatDateJournee(activeSession?.date_journee)}</strong> le <strong>{activeSession?.soumis_le}</strong>.
                  Conformément aux règles de gestion de Molly Market, les nouveaux encaissements sont bloqués jusqu'à ce que le Directeur Eden valide ou ouvre la session du jour suivant.
                </p>
                {activeSession?.statut === 'soumise_directeur' && (
                  <div className="mt-2 inline-flex items-center gap-1.5 font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    En attente d'approbation par le Directeur Eden
                  </div>
                )}
                {activeSession?.statut === 'validee_directeur' && (
                  <div className="mt-2 inline-flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Validé par le Directeur Eden le {activeSession.date_validation}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-950 flex-1">
                <div className="font-bold text-sm">Session de caisse active & réconciliation en direct</div>
                <p className="mt-0.5 text-neutral-600">
                  Session <strong>{activeSession?.numero_session}</strong> ouverte à {activeSession?.heure_ouverture}. Les ventes enregistrées mettent à jour instantanément les montants théoriques.
                </p>
              </div>
            </div>
          )}

      {/* Cartes KPI Synthèse */}
      {activeSession && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-white border border-neutral-200 rounded-xl shadow-2xs">
            <div className="text-[11px] font-medium text-neutral-400">Fond de Caisse Initial</div>
            <div className="text-lg font-black text-neutral-900 mt-1">
              {formatFCFA(activeSession.fond_caisse_initial)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Dépôt initial du matin</div>
          </div>

          <div className="p-3.5 bg-white border border-neutral-200 rounded-xl shadow-2xs">
            <div className="text-[11px] font-medium text-neutral-400">Total Ventes Réalisées</div>
            <div className="text-lg font-black text-[#2E7D32] mt-1">
              {formatFCFA(activeSession.total_ventes)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5">
              {activeSession.nombre_tickets} ticket(s) encaissé(s)
            </div>
          </div>

          <div className="p-3.5 bg-white border border-neutral-200 rounded-xl shadow-2xs">
            <div className="text-[11px] font-medium text-neutral-400">Total Théorique Attendu</div>
            <div className="text-lg font-black text-neutral-900 mt-1">
              {formatFCFA(activeSession.total_theorique)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Fond initial + Ventes</div>
          </div>

          <div
            className={`p-3.5 rounded-xl border shadow-2xs ${
              ecartGlobal === 0
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                : ecartGlobal < 0
                ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                : 'bg-blue-50/60 border-blue-200 text-blue-900'
            }`}
          >
            <div className="text-[11px] font-bold opacity-80">Écart Global Constaté</div>
            <div className="text-lg font-black mt-1">
              {ecartGlobal > 0 ? `+${formatFCFA(ecartGlobal)}` : formatFCFA(ecartGlobal)}
            </div>
            <div className="text-[10px] font-semibold mt-0.5">
              {ecartGlobal === 0
                ? 'Billetage parfait (0 FCFA)'
                : ecartGlobal < 0
                ? 'Déficit de caisse'
                : 'Excédent constaté'}
            </div>
          </div>
        </div>
      )}

      {/* Formulaire de Pointage / Réconciliation */}
      {activeSession && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-neutral-200 gap-2">
            <div>
              <h3 className="font-bold text-sm text-neutral-900">
                Billetage & Rapprochement par Catégorie de Paiement
              </h3>
              <p className="text-xs text-neutral-500">
                Comparez le montant calculé par le système avec la monnaie et les reçus réels en caisse
              </p>
            </div>

            <div className="text-xs text-neutral-500 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>Journée du {formatDateJournee(activeSession.date_journee)}</span>
              <span>• Caissier : <strong>{activeSession.vendeur_nom}</strong></span>
            </div>
          </div>

          <form onSubmit={handleSoumettre} className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Catégorie de Règlement</th>
                    <th className="py-2.5 px-3 text-right">Montant Théorique (Système)</th>
                    <th className="py-2.5 px-3 text-right">Montant Compté / Constaté</th>
                    <th className="py-2.5 px-3 text-right">Écart</th>
                    <th className="py-2.5 px-3 text-center">Conformité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {modesConfig.map((item) => {
                    const th = activeSession.repartition[item.key]?.montant_theorique || 0;
                    const ecart = getEcart(item.key);
                    const isLocked = caisseVerrouillee && activeSession.statut !== 'rejetee_directeur';

                    return (
                      <tr key={item.key} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            {item.logo ? (
                              <img src={item.logo} alt={item.label} className="w-5 h-5 object-contain rounded-xs shrink-0" />
                            ) : item.iconType === 'especes' ? (
                              <Banknote className="w-5 h-5 text-emerald-600 shrink-0" />
                            ) : item.iconType === 'carte' ? (
                              <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
                            ) : item.iconType === 'mtn' ? (
                              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 font-bold text-[9px] flex items-center justify-center shrink-0">M</span>
                            ) : (
                              <CreditCard className="w-5 h-5 text-slate-500 shrink-0" />
                            )}
                            <div>
                              <div className="font-bold text-neutral-900">{item.label}</div>
                              <div className="text-[10px] text-neutral-400">{item.description}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-neutral-700">
                          {formatFCFA(th)}
                        </td>

                        <td className="py-3 px-3 text-right">
                          {isLocked ? (
                            <span className="font-mono font-black text-neutral-900">
                              {formatFCFA(comptages[item.key])}
                            </span>
                          ) : (
                            <div className="inline-flex items-center gap-1 justify-end">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                disabled={isLocked}
                                value={comptages[item.key]}
                                onChange={(e) =>
                                  setComptages({
                                    ...comptages,
                                    [item.key]: Math.max(0, parseInt(e.target.value, 10) || 0)
                                  })
                                }
                                className="w-36 text-right px-2.5 py-1 bg-white border border-neutral-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-[#2E7D32]"
                              />
                              <span className="text-neutral-400 font-bold">F</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold">
                          <span
                            className={
                              ecart === 0
                                ? 'text-emerald-700'
                                : ecart < 0
                                ? 'text-rose-600'
                                : 'text-blue-700'
                            }
                          >
                            {ecart > 0 ? `+${formatFCFA(ecart)}` : formatFCFA(ecart)}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          {ecart === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Conforme
                            </span>
                          ) : ecart < 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Déficit
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              Excédent
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-neutral-200 bg-neutral-50/80 font-bold">
                    <td className="py-3 px-3 text-neutral-900">
                      TOTAL CAISSE (Fond initial inclus)
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-neutral-900">
                      {formatFCFA(activeSession.total_theorique)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-[#2E7D32]">
                      {formatFCFA(totalCompte)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black">
                      <span
                        className={
                          ecartGlobal === 0
                            ? 'text-emerald-700'
                            : ecartGlobal < 0
                            ? 'text-rose-600'
                            : 'text-blue-700'
                        }
                      >
                        {ecartGlobal > 0 ? `+${formatFCFA(ecartGlobal)}` : formatFCFA(ecartGlobal)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <StatusBadge
                        label={ecartGlobal === 0 ? 'Conforme' : `${formatFCFA(ecartGlobal)}`}
                        tone={ecartGlobal === 0 ? 'green' : ecartGlobal < 0 ? 'red' : 'blue'}
                      />
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Observations du caissier */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Observations & Justifications du Caissier (Optionnel)
              </label>
              <textarea
                rows={2}
                disabled={caisseVerrouillee && activeSession.statut !== 'rejetee_directeur'}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Ex: Billetage conforme. Justification d'écart éventuel, pièces abîmées..."
                className="w-full p-2.5 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-[#2E7D32] disabled:bg-neutral-100 disabled:text-neutral-500"
              />
            </div>

            {/* Actions de soumission / validation */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-neutral-200 gap-3">
              <div className="text-xs text-neutral-500">
                {activeSession.soumis_le && (
                  <span>
                    Soumis par <strong>{activeSession.vendeur_nom}</strong> le {activeSession.soumis_le}
                  </span>
                )}
                {activeSession.valide_par_nom && (
                  <span className="block text-emerald-700 font-bold">
                    ✓ {activeSession.valide_par_nom} ({activeSession.date_validation})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Action Vendeur : Soumettre */}
                {(!caisseVerrouillee || activeSession.statut === 'rejetee_directeur') && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Verrouillage...' : 'Clôturer & Soumettre au Directeur Eden'}</span>
                  </button>
                )}

                {/* Actions Directeur : Valider ou Rejeter */}
                {isDirecteur && activeSession.statut === 'soumise_directeur' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setModalRejetOpen(true)}
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Demander correction (Rejeter)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleValiderParDirecteur}
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Valider & Approuver le Point (Eden)</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        </div>
      )}
      </div>
      )}

      {/* VUE 2 : GESTION DE TRÉSORERIE & FLUX DE FONDS (DIRECTEUR) */}
      {tabPrincipal === 'tresorerie' && <GestionTresorerieCaisse />}

      {/* VUE 3 : HISTORIQUE DES POINTS DE CAISSE PRÉCÉDENTS */}
      {tabPrincipal === 'historique' && (
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#2E7D32]" />
            <h3 className="font-bold text-sm text-neutral-900">Historique des Sessions & Points de Caisse</h3>
          </div>

          <button
            onClick={() => exporterHistoriquePointsCaisseExcel(historique)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Télécharger l'historique complet (Excel)</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Session</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Caissier</th>
                <th className="py-2.5 px-3 text-center">Tickets</th>
                <th className="py-2.5 px-3 text-right">Ventes (FCFA)</th>
                <th className="py-2.5 px-3 text-right">Total Compté</th>
                <th className="py-2.5 px-3 text-right">Écart</th>
                <th className="py-2.5 px-3 text-center">Statut</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {historique.map((pt) => {
                const badgeProps: { [k: string]: { label: string; tone: 'green' | 'orange' | 'red' | 'blue' } } = {
                  ouverte: { label: 'En cours', tone: 'blue' },
                  soumise_directeur: { label: 'En attente Directeur', tone: 'orange' },
                  validee_directeur: { label: 'Validé Eden', tone: 'green' },
                  rejetee_directeur: { label: 'Rejeté / À corriger', tone: 'red' }
                };

                const currentBadge = badgeProps[pt.statut] || { label: pt.statut, tone: 'blue' };

                return (
                  <tr key={pt.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-neutral-900">
                      {pt.numero_session}
                    </td>
                    <td className="py-3 px-3 text-neutral-600">{formatDateJournee(pt.date_journee)}</td>
                    <td className="py-3 px-3 font-medium text-neutral-800">{pt.vendeur_nom}</td>
                    <td className="py-3 px-3 text-center font-bold">{pt.nombre_tickets}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#2E7D32]">
                      {formatFCFA(pt.total_ventes)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900">
                      {formatFCFA(pt.total_compte)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span
                        className={
                          pt.ecart_total === 0
                            ? 'text-emerald-700'
                            : pt.ecart_total < 0
                            ? 'text-rose-600'
                            : 'text-blue-700'
                        }
                      >
                        {pt.ecart_total > 0 ? `+${formatFCFA(pt.ecart_total)}` : formatFCFA(pt.ecart_total)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <StatusBadge label={currentBadge.label} tone={currentBadge.tone} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setModalDetailsPoint(pt)}
                          className="p-1.5 rounded-lg text-neutral-600 hover:bg-neutral-200 transition-colors"
                          title="Consulter le détail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => exporterPointCaissePDF(pt)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Télécharger PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => exporterPointCaisseExcel(pt)}
                          className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Télécharger Excel"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Modal Détails d'un point archivé */}
      {modalDetailsPoint && (
        <Modal
          isOpen={!!modalDetailsPoint}
          onClose={() => setModalDetailsPoint(null)}
          title={`Point de Caisse #${modalDetailsPoint.numero_session}`}
          subtitle={`Journée du ${formatDateJournee(modalDetailsPoint.date_journee)} • Caissier : ${modalDetailsPoint.vendeur_nom}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exporterPointCaissePDF(modalDetailsPoint)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => exporterPointCaisseExcel(modalDetailsPoint)}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
              </div>
              <button
                onClick={() => setModalDetailsPoint(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
              >
                Fermer
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-xl">
              <div>
                <span className="text-neutral-400 block text-[11px]">Fond de caisse initial</span>
                <span className="font-bold text-neutral-900">{formatFCFA(modalDetailsPoint.fond_caisse_initial)}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px]">Total des ventes</span>
                <span className="font-bold text-[#2E7D32]">{formatFCFA(modalDetailsPoint.total_ventes)} ({modalDetailsPoint.nombre_tickets} tickets)</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px]">Statut session</span>
                <span className="font-bold text-neutral-900">{modalDetailsPoint.statut.toUpperCase()}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px]">Validation hiérarchique</span>
                <span className="font-bold text-neutral-900">{modalDetailsPoint.valide_par_nom || 'Non visé'}</span>
              </div>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                  <th className="py-2">Mode</th>
                  <th className="py-2 text-right">Théorique</th>
                  <th className="py-2 text-right">Compté</th>
                  <th className="py-2 text-right">Écart</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(Object.values(modalDetailsPoint.repartition) as LigneBilletagePointCaisse[]).map((r, i) => (
                  <tr key={i}>
                    <td className="py-2 font-medium text-neutral-900">{r.libelle}</td>
                    <td className="py-2 text-right font-mono">{formatFCFA(r.montant_theorique)}</td>
                    <td className="py-2 text-right font-mono font-bold">{formatFCFA(r.montant_compte)}</td>
                    <td className="py-2 text-right font-mono font-bold">
                      <span className={r.ecart === 0 ? 'text-emerald-700' : r.ecart < 0 ? 'text-rose-600' : 'text-blue-700'}>
                        {r.ecart > 0 ? `+${formatFCFA(r.ecart)}` : formatFCFA(r.ecart)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {modalDetailsPoint.observations && (
              <div className="p-3 bg-neutral-100 rounded-xl text-neutral-700">
                <span className="font-bold block mb-0.5">Observations :</span>
                <div>{modalDetailsPoint.observations}</div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal Rejet Directeur */}
      <Modal
        isOpen={modalRejetOpen}
        onClose={() => setModalRejetOpen(false)}
        title="Demande de correction du point de caisse"
        subtitle="Cette action déverrouillera la caisse et permettra au caissier de rectifier le comptage"
        footer={
          <>
            <button
              onClick={() => setModalRejetOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={handleRejeterParDirecteur}
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
            >
              {submitting ? 'Envoi...' : 'Confirmer le rejet'}
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <label className="block font-bold text-neutral-800">
            Motif ou instructions pour le caissier Noam :
          </label>
          <textarea
            rows={3}
            value={rejetMotif}
            onChange={(e) => setRejetMotif(e.target.value)}
            placeholder="Ex: Écart de 5 000 FCFA sur les espèces non justifié. Veuillez recompter le fond de caisse."
            className="w-full p-2.5 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:border-rose-500"
          />
        </div>
      </Modal>

      {/* Modal Nouvelle Session de Caisse */}
      <Modal
        isOpen={modalNouvelleSessionOpen}
        onClose={() => setModalNouvelleSessionOpen(false)}
        title="Ouvrir une nouvelle session de caisse pour le lendemain"
        subtitle="Cette action déverrouillera la caisse et initialisera un nouveau journal de vente"
        footer={
          <>
            <button
              onClick={() => setModalNouvelleSessionOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={handleOuvrirNouvelleSession}
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#1B5E20] rounded-lg shadow-xs"
            >
              {submitting ? 'Ouverture...' : 'Confirmer l\'ouverture'}
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-neutral-600">
            En validant l'ouverture, la caisse sera immédiatement active pour enregistrer de nouvelles ventes. Le point de caisse d'aujourd'hui reste archivé et consultable.
          </p>
          <div>
            <label className="block font-bold text-neutral-800 mb-1">
              Fond de caisse initial pour la nouvelle journée (FCFA) :
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={nouveauFondCaisse}
              onChange={(e) => setNouveauFondCaisse(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full p-2.5 border border-neutral-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#2E7D32]"
            />
            <span className="text-[11px] text-neutral-400 mt-1 block">
              Montant recommandé : 50 000 FCFA
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
};
