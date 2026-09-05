import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { Client } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { FormField } from '../components/ui/FormField';
import { useToast } from '../context/ToastContext';
import { formatFCFA } from '../utils/format';
import { UserPlus, Edit2, UserX, UserCheck, Phone, Mail, MapPin } from 'lucide-react';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    adresse: ''
  });

  const { toastSuccess, toastError } = useToast();

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getVueClients();
      setClients(data);
    } catch (err: any) {
      toastError(err.message || 'Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const openAddModal = () => {
    setEditingClient(null);
    setFormData({ nom: '', prenom: '', telephone: '', email: '', adresse: '' });
    setModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      nom: client.nom,
      prenom: client.prenom,
      telephone: client.telephone,
      email: client.email,
      adresse: client.adresse
    });
    setModalOpen(true);
  };

  const handleToggleStatus = async (client: Client) => {
    const newStatus = !client.actif;
    try {
      await apiClient.desactiverClient(client.id, newStatus);
      toastSuccess(
        newStatus ? 'Client réactivé avec succès' : 'Client désactivé',
        'CALL sp_desactiver_client'
      );
      loadClients();
    } catch (err: any) {
      toastError(err.message || 'Erreur lors du changement de statut');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom.trim() || !formData.prenom.trim() || !formData.telephone.trim()) {
      toastError('Veuillez remplir les champs obligatoires (Nom, Prénom, Téléphone).');
      return;
    }

    setSaving(true);
    try {
      if (editingClient) {
        // CALL sp_modifier_client
        await apiClient.modifierClient(editingClient.id, formData);
        toastSuccess('Fiche client mise à jour', 'CALL sp_modifier_client');
      } else {
        // CALL sp_ajouter_client
        await apiClient.ajouterClient(formData);
        toastSuccess('Nouveau client enregistré', 'CALL sp_ajouter_client');
      }
      setModalOpen(false);
      loadClients();
    } catch (err: any) {
      toastError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Client>[] = [
    {
      key: 'code_client',
      header: 'Code Client',
      width: '120px',
      accessor: (c) => <span className="font-mono font-bold text-neutral-800">{c.code_client}</span>
    },
    {
      key: 'nom',
      header: 'Client',
      accessor: (c) => (
        <div>
          <div className="font-bold text-neutral-900">
            {c.prenom} {c.nom}
          </div>
          <div className="text-[11px] text-neutral-400">Inscrit le {c.date_creation}</div>
        </div>
      )
    },
    {
      key: 'contact',
      header: 'Contact',
      accessor: (c) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-neutral-600 text-xs">
            <Phone className="w-3.5 h-3.5 text-neutral-400" />
            <span>{c.telephone}</span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-500 text-xs">
            <Mail className="w-3.5 h-3.5 text-neutral-400" />
            <span>{c.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'adresse',
      header: 'Adresse',
      accessor: (c) => (
        <div className="flex items-center gap-1.5 text-neutral-600 max-w-xs truncate">
          <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className="truncate">{c.adresse}</span>
        </div>
      )
    },
    {
      key: 'total_achats',
      header: 'Cumul Achats',
      align: 'right',
      accessor: (c) => (
        <span className="font-bold text-[#2E7D32]">
          {formatFCFA(c.total_achats || 0)}
        </span>
      )
    },
    {
      key: 'actif',
      header: 'Statut',
      align: 'center',
      width: '100px',
      accessor: (c) => (
        <StatusBadge
          label={c.actif ? 'Actif' : 'Désactivé'}
          tone={c.actif ? 'green' : 'red'}
        />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      align: 'right',
      width: '110px',
      accessor: (c) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openEditModal(c)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-[#2E7D32] hover:bg-emerald-50 transition-colors"
            title="Modifier le client"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(c)}
            className={`p-1.5 rounded-lg transition-colors ${
              c.actif
                ? 'text-neutral-400 hover:text-[#E53935] hover:bg-rose-50'
                : 'text-neutral-400 hover:text-[#2E7D32] hover:bg-emerald-50'
            }`}
            title={c.actif ? 'Désactiver le compte client' : 'Réactiver le client'}
          >
            {c.actif ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#212121]">Fichier Clients & Fidélité</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Gestion des coordonnées, statuts d'adhésion et consultation des cumuls d'achats
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-xs transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Ajouter un client</span>
        </button>
      </div>

      {/* Tableau des clients */}
      <DataTable
        columns={columns}
        data={clients}
        isLoading={loading}
        searchPlaceholder="Rechercher par nom, prénom, email, téléphone..."
        searchKeys={['nom', 'prenom', 'telephone', 'email', 'code_client']}
        emptyMessage="Aucun client enregistré"
      />

      {/* Modal Ajout / Modification */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editingClient ? 'Modifier la fiche client' : 'Ajouter un nouveau client'}
        subtitle={
          editingClient
            ? `Modification des coordonnées du client ${editingClient.code_client}`
            : 'Enregistrement d\'un nouveau compte client et programme fidélité'
        }
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
              form="client-form"
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#1B5E20] rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : editingClient ? 'Enregistrer les modifications' : 'Créer le client'}
            </button>
          </>
        }
      >
        <form id="client-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="client-nom"
              label="Nom de famille"
              required
              placeholder="Ex: Moreau"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            />

            <FormField
              id="client-prenom"
              label="Prénom"
              required
              placeholder="Ex: Sophie"
              value={formData.prenom}
              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="client-telephone"
              label="Numéro de Téléphone"
              type="tel"
              required
              placeholder="06 12 34 56 78"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            />

            <FormField
              id="client-email"
              label="Adresse Email"
              type="email"
              placeholder="sophie.moreau@email.fr"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <FormField
            id="client-adresse"
            label="Adresse Postale"
            type="textarea"
            rows={2}
            placeholder="14 Rue de la Paix, 75002 Paris"
            value={formData.adresse}
            onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
};
