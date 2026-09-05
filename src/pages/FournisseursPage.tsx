import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { Fournisseur } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { FormField } from '../components/ui/FormField';
import { useToast } from '../context/ToastContext';
import { Truck, Plus, Edit2, Phone, Mail, MapPin, Building2 } from 'lucide-react';

export const FournisseursPage: React.FC = () => {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Fournisseur | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nom_entreprise: '',
    contact_nom: '',
    telephone: '',
    email: '',
    adresse: '',
    ville: ''
  });

  const { toastSuccess, toastError } = useToast();

  const loadFournisseurs = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getVueFournisseurs();
      setFournisseurs(data);
    } catch (err: any) {
      toastError(err.message || 'Erreur lors du chargement des fournisseurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFournisseurs();
  }, []);

  const openAddModal = () => {
    setEditing(null);
    setFormData({
      nom_entreprise: '',
      contact_nom: '',
      telephone: '',
      email: '',
      adresse: '',
      ville: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (f: Fournisseur) => {
    setEditing(f);
    setFormData({
      nom_entreprise: f.nom_entreprise,
      contact_nom: f.contact_nom,
      telephone: f.telephone,
      email: f.email,
      adresse: f.adresse,
      ville: f.ville
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom_entreprise.trim() || !formData.telephone.trim()) {
      toastError('Veuillez renseigner le nom de l\'entreprise et un téléphone.');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await apiClient.modifierFournisseur(editing.id, formData);
        toastSuccess('Fournisseur mis à jour', 'CALL sp_modifier_fournisseur');
      } else {
        await apiClient.ajouterFournisseur(formData);
        toastSuccess('Fournisseur ajouté au répertoire', 'CALL sp_ajouter_fournisseur');
      }
      setModalOpen(false);
      loadFournisseurs();
    } catch (err: any) {
      toastError(err.message || 'Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Fournisseur>[] = [
    {
      key: 'code_fournisseur',
      header: 'Code FRS',
      width: '120px',
      accessor: (f) => <span className="font-mono font-bold text-neutral-800">{f.code_fournisseur}</span>
    },
    {
      key: 'nom_entreprise',
      header: 'Entreprise & Contact',
      accessor: (f) => (
        <div>
          <div className="font-bold text-neutral-900 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#2E7D32]" />
            {f.nom_entreprise}
          </div>
          <div className="text-[11px] text-neutral-500">Contact : {f.contact_nom}</div>
        </div>
      )
    },
    {
      key: 'contact',
      header: 'Coordonnées',
      accessor: (f) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-600">
            <Phone className="w-3.5 h-3.5 text-neutral-400" />
            <span>{f.telephone}</span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-500">
            <Mail className="w-3.5 h-3.5 text-neutral-400" />
            <span>{f.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'localisation',
      header: 'Localisation',
      accessor: (f) => (
        <div className="flex items-center gap-1.5 text-neutral-600 text-xs">
          <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span>
            {f.ville} {f.adresse ? `(${f.adresse})` : ''}
          </span>
        </div>
      )
    },
    {
      key: 'actif',
      header: 'Statut',
      align: 'center',
      width: '100px',
      accessor: (f) => (
        <StatusBadge label={f.actif ? 'Partenaire Actif' : 'Inactif'} tone={f.actif ? 'green' : 'neutral'} />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      align: 'right',
      width: '80px',
      accessor: (f) => (
        <button
          onClick={() => openEditModal(f)}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-[#2E7D32] hover:bg-emerald-50 transition-colors"
          title="Modifier le fournisseur"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#212121]">Fournisseurs & Grossistes</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Répertoire des partenaires d'approvisionnement du supermarché
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un fournisseur</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={fournisseurs}
        isLoading={loading}
        searchPlaceholder="Rechercher par raison sociale, ville, contact..."
        searchKeys={['nom_entreprise', 'contact_nom', 'ville', 'telephone', 'email']}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
        subtitle="CALL sp_ajouter_fournisseur / CALL sp_modifier_fournisseur"
        footer={
          <>
            <button
              type="button"
              disabled={saving}
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="fournisseur-form"
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#1B5E20] rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : editing ? 'Enregistrer' : 'Créer'}
            </button>
          </>
        }
      >
        <form id="fournisseur-form" onSubmit={handleSubmit} className="space-y-4">
          <FormField
            id="frs-nom"
            label="Raison Sociale / Nom Entreprise"
            required
            placeholder="Ex: Laiterie des Vallées"
            value={formData.nom_entreprise}
            onChange={(e) => setFormData({ ...formData, nom_entreprise: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="frs-contact"
              label="Nom du Contact Commercial"
              placeholder="Ex: Martine Duval"
              value={formData.contact_nom}
              onChange={(e) => setFormData({ ...formData, contact_nom: e.target.value })}
            />
            <FormField
              id="frs-tel"
              label="Téléphone Professionnel"
              type="tel"
              required
              placeholder="02 99 77 12 34"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="frs-email"
              label="Email Commandes"
              type="email"
              placeholder="commandes@fournisseur.fr"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <FormField
              id="frs-ville"
              label="Ville"
              placeholder="Rennes"
              value={formData.ville}
              onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
            />
          </div>

          <FormField
            id="frs-adresse"
            label="Adresse de l'entrepôt"
            type="textarea"
            rows={2}
            placeholder="4 Route du Bocage"
            value={formData.adresse}
            onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
};
