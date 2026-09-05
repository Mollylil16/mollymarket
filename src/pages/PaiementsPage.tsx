import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { Paiement, ModePaiement, Vente } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { FormField } from '../components/ui/FormField';
import { useToast } from '../context/ToastContext';
import { formatFCFA } from '../utils/format';
import { exporterPaiementsExcel, exporterPaiementsPDF } from '../utils/exportUtils';
import {
  CreditCard,
  Plus,
  Banknote,
  Smartphone,
  FileSpreadsheet,
  FileText,
  Filter,
  ArrowUpRight,
  Receipt
} from 'lucide-react';

export const PaiementsPage: React.FC = () => {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filtreMode, setFiltreMode] = useState<string>('tous');

  const [formData, setFormData] = useState<{
    vente_id: number;
    montant: number;
    mode_paiement: ModePaiement;
  }>({
    vente_id: 1,
    montant: 5000,
    mode_paiement: 'wave'
  });

  const { toastSuccess, toastError } = useToast();

  const loadData = async (filter?: string) => {
    setLoading(true);
    try {
      const modeParam = filter && filter !== 'tous' ? (filter as ModePaiement) : undefined;
      const [paiementsData, ventesData] = await Promise.all([
        apiClient.getVuePaiements(modeParam),
        apiClient.getVueCommandes()
      ]);
      setPaiements(paiementsData);
      setVentes(ventesData);
      if (ventesData.length > 0) {
        setFormData((prev) => ({ ...prev, vente_id: ventesData[0].id }));
      }
    } catch (err: any) {
      toastError(err.message || 'Erreur lors du chargement des paiements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(filtreMode);
  }, [filtreMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.montant <= 0) {
      toastError('Le montant du paiement doit être supérieur à zéro.');
      return;
    }

    setSaving(true);
    try {
      await apiClient.enregistrerPaiement(formData);
      toastSuccess('Paiement comptabilisé', 'CALL sp_enregistrer_paiement');
      setModalOpen(false);
      loadData(filtreMode);
    } catch (err: any) {
      toastError(err.message || 'Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const getModeIcon = (mode: ModePaiement) => {
    switch (mode) {
      case 'carte_bancaire':
        return <CreditCard className="w-3.5 h-3.5 text-blue-600" />;
      case 'especes':
        return <Banknote className="w-3.5 h-3.5 text-emerald-600" />;
      case 'wave':
        return <img src="/images/wave_logo.png" alt="Wave" className="w-4 h-4 object-contain rounded-xs inline-block" />;
      case 'orange_money':
        return <img src="/images/orange.png" alt="Orange Money" className="w-4 h-4 object-contain rounded-xs inline-block" />;
      case 'mtn_money':
        return <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-900 font-bold text-[8px] inline-flex items-center justify-center">M</span>;
      case 'moov_money':
        return <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-[8px] inline-flex items-center justify-center">M</span>;
      case 'mobile_money':
        return <Smartphone className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <CreditCard className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  const getModeLabel = (mode: ModePaiement) => {
    switch (mode) {
      case 'wave':
        return 'Wave';
      case 'orange_money':
        return 'Orange Money';
      case 'mtn_money':
        return 'MTN Mobile Money';
      case 'moov_money':
        return 'Moov Money CI';
      case 'especes':
        return 'Espèces (Cash)';
      case 'carte_bancaire':
        return 'Carte Bancaire';
      case 'cheque':
        return 'Chèque';
      case 'mobile_money':
        return 'Mobile Money';
      case 'virement':
        return 'Virement Bancaire';
      default:
        return mode;
    }
  };

  const totalEncaisse = paiements.reduce((acc, p) => acc + p.montant, 0);
  const totalWave = paiements.filter((p) => p.mode_paiement === 'wave').reduce((acc, p) => acc + p.montant, 0);
  const totalOrange = paiements.filter((p) => p.mode_paiement === 'orange_money').reduce((acc, p) => acc + p.montant, 0);
  const totalEspeces = paiements.filter((p) => p.mode_paiement === 'especes').reduce((acc, p) => acc + p.montant, 0);
  const totalCarte = paiements.filter((p) => p.mode_paiement === 'carte_bancaire').reduce((acc, p) => acc + p.montant, 0);

  const filtreCategories = [
    { id: 'tous', label: 'Tous les règlements', icon: null },
    { id: 'wave', label: 'Wave', icon: '/images/wave_logo.png' },
    { id: 'orange_money', label: 'Orange Money', icon: '/images/orange.png' },
    { id: 'mtn_money', label: 'MTN Money', icon: null, badge: 'MTN' },
    { id: 'carte_bancaire', label: 'Carte Bancaire', icon: null, lucide: 'carte' },
    { id: 'especes', label: 'Espèces', icon: null, lucide: 'especes' },
    { id: 'cheque', label: 'Chèque', icon: null, lucide: 'cheque' }
  ];

  const columns: Column<Paiement>[] = [
    {
      key: 'reference_paiement',
      header: 'Réf. Paiement',
      width: '170px',
      accessor: (p) => <span className="font-mono font-bold text-neutral-900">{p.reference_paiement}</span>
    },
    {
      key: 'numero_ticket',
      header: 'Ticket de Caisse',
      width: '160px',
      accessor: (p) => (
        <span className="font-mono text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
          <Receipt className="w-3 h-3 text-neutral-500" />
          {p.numero_ticket}
        </span>
      )
    },
    {
      key: 'client',
      header: 'Client / Bénéficiaire',
      accessor: (p) => <span className="font-medium text-neutral-800">{p.client_nom}</span>
    },
    {
      key: 'mode_paiement',
      header: 'Catégorie de Règlement',
      width: '190px',
      accessor: (p) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
          {getModeIcon(p.mode_paiement)}
          <span>{getModeLabel(p.mode_paiement)}</span>
        </div>
      )
    },
    {
      key: 'date_paiement',
      header: 'Date & Heure',
      width: '140px',
      accessor: (p) => <span className="text-neutral-500 text-xs">{p.date_paiement}</span>
    },
    {
      key: 'montant',
      header: 'Montant Encaissé',
      align: 'right',
      width: '150px',
      accessor: (p) => <span className="font-bold text-[#2E7D32]">{formatFCFA(p.montant)}</span>
    },
    {
      key: 'statut',
      header: 'Statut',
      align: 'center',
      width: '110px',
      accessor: (p) => {
        const labels = { paye: 'Payé', partiel: 'Partiel', impaye: 'Impayé' };
        const tones: { [k: string]: 'green' | 'orange' | 'red' } = { paye: 'green', partiel: 'orange', impaye: 'red' };
        return <StatusBadge label={labels[p.statut]} tone={tones[p.statut]} />;
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#212121]">Suivi des Paiements & Règlements</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Suivi des encaissements sous chaque catégorie.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => exporterPaiementsExcel(paiements, filtreCategories.find(c => c.id === filtreMode)?.label)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-700 text-xs font-semibold hover:bg-neutral-50 transition-colors shadow-2xs">
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" /> <span>Export Excel</span>
          </button>
          <button onClick={() => exporterPaiementsPDF(paiements, filtreCategories.find(c => c.id === filtreMode)?.label)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-700 text-xs font-semibold hover:bg-neutral-50 transition-colors shadow-2xs">
            <FileText className="w-4 h-4 text-rose-600" /> <span>Export PDF</span>
          </button>
          <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-xs transition-all">
            <Plus className="w-4 h-4" /> <span>Nouveau règlement</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 bg-white border border-neutral-200 rounded-xl shadow-2xs">
          <div className="text-[11px] font-medium text-neutral-400">Total Encaissé</div>
          <div className="text-base font-black text-neutral-900 mt-1">{formatFCFA(totalEncaisse)}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">{paiements.length} transaction(s)</div>
        </div>
        <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl shadow-2xs">
          <div className="text-[11px] font-bold text-blue-700 flex items-center gap-1.5">
            <img src="/images/wave_logo.png" alt="Wave" className="w-4 h-4 object-contain rounded-xs shrink-0" />
            <span>Wave Mobile</span>
          </div>
          <div className="text-base font-black text-blue-950 mt-1">{formatFCFA(totalWave)}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">Mobile Money CI</div>
        </div>
        <div className="p-3.5 bg-orange-50/50 border border-orange-200 rounded-xl shadow-2xs">
          <div className="text-[11px] font-bold text-orange-700 flex items-center gap-1.5">
            <img src="/images/orange.png" alt="Orange Money" className="w-4 h-4 object-contain rounded-xs shrink-0" />
            <span>Orange Money</span>
          </div>
          <div className="text-base font-black text-orange-950 mt-1">{formatFCFA(totalOrange)}</div>
          <div className="text-[10px] text-orange-600 mt-0.5">Mobile Money CI</div>
        </div>
        <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5" /> <span>Espèces (Cash)</span>
          </div>
          <div className="text-base font-black text-emerald-950 mt-1">{formatFCFA(totalEspeces)}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Caisse comptant</div>
        </div>
        <div className="p-3.5 bg-purple-50/50 border border-purple-200 rounded-xl shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-purple-700 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" /> <span>Carte Bancaire</span>
          </div>
          <div className="text-base font-black text-purple-950 mt-1">{formatFCFA(totalCarte)}</div>
          <div className="text-[10px] text-purple-600 mt-0.5">TPE Bancaire</div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-neutral-200">
        <div className="flex items-center gap-1 text-xs font-bold text-neutral-500 pr-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtre :</span>
        </div>
        {filtreCategories.map((cat) => (
          <button key={cat.id} onClick={() => setFiltreMode(cat.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${filtreMode === cat.id ? 'bg-[#2E7D32] text-white shadow-xs' : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'}`}>
            {cat.icon ? <img src={cat.icon} alt={cat.label} className="w-4 h-4 object-contain rounded-xs shrink-0" /> : (cat as any).badge ? <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-900 font-bold text-[8px] flex items-center justify-center shrink-0">{(cat as any).badge}</span> : (cat as any).lucide === 'especes' ? <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : (cat as any).lucide === 'carte' ? <CreditCard className="w-3.5 h-3.5 text-blue-600 shrink-0" /> : (cat as any).lucide === 'cheque' ? <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" /> : null}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={paiements} isLoading={loading} searchPlaceholder="Rechercher..." searchKeys={['reference_paiement', 'numero_ticket', 'client_nom']} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Enregistrer un nouveau règlement" subtitle="Rapprochement d'une facture ou d'un encaissement client direct" footer={
        <div className="flex justify-end gap-3 w-full">
          <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl">Annuler</button>
          <button type="submit" form="form-paiement" disabled={saving} className="px-4 py-2 text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#1B5E20] rounded-xl shadow-xs disabled:opacity-50">{saving ? 'Enregistrement...' : 'Encaisser le règlement'}</button>
        </div>
      }>
        <form id="form-paiement" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="pay-ticket" label="Numéro de Ticket (Optionnel)" type="text" placeholder="Ex: TK-20260905-001" value={formData.numero_ticket || ''} onChange={(e) => setFormData({ ...formData, numero_ticket: e.target.value })} />
            <FormField id="pay-client" label="Nom du Client" type="text" required placeholder="Ex: Client Comptant" value={formData.client_nom} onChange={(e) => setFormData({ ...formData, client_nom: e.target.value })} />
            <FormField id="pay-montant" label="Montant Encaissé (FCFA)" type="number" required min="1" placeholder="Ex: 52200" value={formData.montant} onChange={(e) => setFormData({ ...formData, montant: Number(e.target.value) })} />
            <FormField id="pay-mode" label="Catégorie / Mode de Règlement" type="select" required value={formData.mode_paiement} onChange={(e) => setFormData({ ...formData, mode_paiement: e.target.value as ModePaiement })} options={[
              { value: 'wave', label: 'Wave Mobile Money' },
              { value: 'orange_money', label: 'Orange Money CI' },
              { value: 'mtn_money', label: 'MTN Mobile Money' },
              { value: 'moov_money', label: 'Moov Money CI' },
              { value: 'especes', label: 'Espèces (Cash FCFA)' },
              { value: 'carte_bancaire', label: 'Carte Bancaire (TPE)' },
              { value: 'cheque', label: 'Chèque' }
            ]} />
          </div>
        </form>
      </Modal>
    </div>
  );
};
