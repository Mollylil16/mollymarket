import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { Employe, UserRole } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { FormField } from '../components/ui/FormField';
import { useToast } from '../context/ToastContext';
import { UserPlus, Edit2, Shield, Mail, Phone, Calendar } from 'lucide-react';

export const EmployesPage: React.FC = () => {
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmploye, setEditingEmploye] = useState<Employe | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    role: 'Vendeur' as UserRole,
    date_embauche: new Date().toISOString().split('T')[0]
  });

  const { toastSuccess, toastError } = useToast();

  const loadEmployes = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getVueEmployes();
      setEmployes(data);
    } catch (err: any) {
      toastError(err.message || 'Erreur lors du chargement des employés');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployes();
  }, []);

  const openAddModal = () => {
    setEditingEmploye(null);
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      role: 'Vendeur',
      date_embauche: new Date().toISOString().split('T')[0]
    });
    setModalOpen(true);
  };

  const openEditModal = (emp: Employe) => {
    setEditingEmploye(emp);
    setFormData({
      nom: emp.nom,
      prenom: emp.prenom,
      email: emp.email,
      telephone: emp.telephone,
      role: emp.role,
      date_embauche: emp.date_embauche
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom.trim() || !formData.prenom.trim() || !formData.email.trim()) {
      toastError('Veuillez remplir les informations obligatoires.');
      return;
    }

    setSaving(true);
    try {
      if (editingEmploye) {
        await apiClient.modifierEmploye(editingEmploye.id, formData);
        toastSuccess('Fiche employé modifiée', 'CALL sp_modifier_employe');
      } else {
        await apiClient.ajouterEmploye(formData);
        toastSuccess('Nouvel employé enregistré', 'CALL sp_ajouter_employe');
      }
      setModalOpen(false);
      loadEmployes();
    } catch (err: any) {
      toastError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const getRoleTone = (role: UserRole) => {
    switch (role) {
      case 'Administrateur':
        return 'blue';
      case 'Directeur':
        return 'neutral';
      case 'Vendeur':
        return 'green';
      case 'Magasinier':
        return 'orange';
      default:
        return 'neutral';
    }
  };

  const columns: Column<Employe>[] = [
    {
      key: 'matricule',
      header: 'Matricule',
      width: '110px',
      accessor: (e) => <span className="font-mono font-bold text-neutral-800">{e.matricule}</span>
    },
    {
      key: 'nom',
      header: 'Employé',
      accessor: (e) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-xs text-neutral-700">
            {e.prenom[0]}
            {e.nom[0]}
          </div>
          <div>
            <div className="font-bold text-neutral-900">
              {e.prenom} {e.nom}
            </div>
            <div className="text-[11px] text-neutral-400">Embauché le {e.date_embauche}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Rôle Assigné',
      width: '150px',
      accessor: (e) => <StatusBadge label={e.role} tone={getRoleTone(e.role)} />
    },
    {
      key: 'contact',
      header: 'Coordonnées',
      accessor: (e) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-600">
            <Mail className="w-3.5 h-3.5 text-neutral-400" />
            <span>{e.email}</span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-500">
            <Phone className="w-3.5 h-3.5 text-neutral-400" />
            <span>{e.telephone}</span>
          </div>
        </div>
      )
    },
    {
      key: 'actif',
      header: 'Statut',
      align: 'center',
      width: '100px',
      accessor: (e) => (
        <StatusBadge label={e.actif ? 'En poste' : 'Inactif'} tone={e.actif ? 'green' : 'neutral'} />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      align: 'right',
      width: '80px',
      accessor: (e) => (
        <button
          onClick={() => openEditModal(e)}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-[#2E7D32] hover:bg-emerald-50 transition-colors"
          title="Modifier le collaborateur"
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
          <h2 className="text-xl font-bold text-[#212121]">Gestion des Employés & Rôles</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Attribution des habilitations système (Admin, Directeur, Vendeur, Magasinier)
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-xs transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Ajouter un employé</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={employes}
        isLoading={loading}
        searchPlaceholder="Rechercher par nom, email, rôle..."
        searchKeys={['nom', 'prenom', 'email', 'matricule', 'role']}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editingEmploye ? 'Modifier le collaborateur' : 'Créer un compte employé'}
        subtitle="Mise à jour directe de la table PostgreSQL des utilisateurs et rôles"
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
              form="employe-form"
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#1B5E20] rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : editingEmploye ? 'Enregistrer' : 'Valider'}
            </button>
          </>
        }
      >
        <form id="employe-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="emp-nom"
              label="Nom"
              required
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            />
            <FormField
              id="emp-prenom"
              label="Prénom"
              required
              value={formData.prenom}
              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="emp-email"
              label="Email de connexion"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <FormField
              id="emp-tel"
              label="Téléphone"
              type="tel"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="emp-role"
              label="Rôle et Habilitation"
              type="select"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              options={[
                { value: 'Administrateur', label: 'Administrateur (Tout accès)' },
                { value: 'Directeur', label: 'Directeur (Tableaux de bord & Stats)' },
                { value: 'Vendeur', label: 'Vendeur (Caisse & Clients)' },
                { value: 'Magasinier', label: 'Magasinier (Stocks, Produits & Achats)' }
              ]}
            />
            <FormField
              id="emp-date"
              label="Date d'embauche"
              type="text"
              placeholder="AAAA-MM-JJ"
              value={formData.date_embauche}
              onChange={(e) => setFormData({ ...formData, date_embauche: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
