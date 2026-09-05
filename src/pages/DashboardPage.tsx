import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/api';
import { VueStatistiques } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Users,
  Package,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Store,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { formatFCFA } from '../utils/format';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<VueStatistiques | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'jour' | 'semaine' | 'mois'>('mois');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getVueStatistiques(selectedPeriod);
      setStats(data);
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedPeriod]);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <RefreshCw className="w-8 h-8 text-[#2E7D32] animate-spin mb-3" />
        <p className="text-sm font-medium">Chargement du tableau de bord...</p>
      </div>
    );
  }

  const ca = stats?.chiffre_affaires;
  const topClients = stats?.top_clients || [];
  const topProduits = stats?.top_produits || [];
  const ruptures = stats?.produits_en_rupture || [];
  const evolution = stats?.evolution_ventes || [];
  const ventesCategories = stats?.ventes_par_categorie || [];

  return (
    <div className="space-y-6">
      {/* En-tête principal épuré */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-[#2E7D32]" />
            Tableau de bord de l'activité
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Suivi des ventes, encaissements et disponibilité des stocks en magasin
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100/80 px-3 py-2 rounded-xl border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>

          <button
            onClick={fetchStats}
            className="p-2 text-slate-600 hover:text-[#2E7D32] hover:bg-emerald-50 rounded-xl border border-slate-200 transition cursor-pointer"
            title="Actualiser les données"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#2E7D32]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cartes Métriques Principales (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chiffre d'Affaires du Jour */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              CA du Jour
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatFCFA(ca?.journalier || 0)}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{stats?.total_ventes_du_jour || 0} vente(s) aujourd'hui</span>
            </div>
          </div>
        </div>

        {/* Chiffre d'Affaires Mensuel */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              CA du Mois
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatFCFA(ca?.mensuel || 0)}
            </div>
            <div className="text-xs text-slate-500 mt-1.5 font-medium">
              Cumul mensuel du supermarché
            </div>
          </div>
        </div>

        {/* Clients Enregistrés */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Clients Enregistrés
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {stats?.total_clients_actifs || 0}
            </div>
            <div className="text-xs text-slate-500 mt-1.5 font-medium">
              Comptes clients actifs
            </div>
          </div>
        </div>

        {/* Articles Référencés & Alertes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Catalogue Produits
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {stats?.total_produits_actifs || 0}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs">
              {ruptures.length > 0 ? (
                <span className="text-amber-600 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {ruptures.length} alerte(s) de réappro
                </span>
              ) : (
                <span className="text-emerald-600 font-semibold">
                  Stocks approvisionnés
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Raccourci Caisse & Actions Rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/ventes"
          className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 hover:border-emerald-300 hover:bg-emerald-100/60 transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2E7D32] text-white flex items-center justify-center shadow-xs">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-[#2E7D32] transition">
                Accéder à la Caisse (POS)
              </div>
              <div className="text-[11px] text-slate-500">Scanner des articles et encaisser</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/stocks"
          className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 hover:border-amber-300 hover:bg-amber-100/60 transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition">
                Gestion des Stocks
              </div>
              <div className="text-[11px] text-slate-500">Mouvements, inventaire et réceptions</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/achats"
          className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 hover:border-blue-300 hover:bg-blue-100/60 transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition">
                Commandes Fournisseurs
              </div>
              <div className="text-[11px] text-slate-500">Bons d'achat et approvisionnements</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Graphiques Principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Évolution des ventes */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Évolution des Ventes</h3>
              <p className="text-xs text-slate-500">Historique des encaissements sur la période</p>
            </div>
            
            {/* Filtre de période */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setSelectedPeriod('jour')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  selectedPeriod === 'jour'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Jour
              </button>
              <button
                onClick={() => setSelectedPeriod('semaine')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  selectedPeriod === 'semaine'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semaine
              </button>
              <button
                onClick={() => setSelectedPeriod('mois')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  selectedPeriod === 'mois'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Mois
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            {evolution.length > 0 && evolution.some(e => e.montant > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolution} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="periode" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    formatter={(val: number) => [formatFCFA(val), 'Chiffre d\'affaires']}
                    contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', fontSize: '12px', border: 'none' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="montant"
                    stroke="#2E7D32"
                    strokeWidth={3}
                    dot={{ fill: '#2E7D32', r: 4 }}
                    activeDot={{ r: 6, fill: '#4ADE80' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center p-6">
                <ShoppingCart className="w-8 h-8 text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">Aucune vente enregistrée sur cette période</p>
                <p className="mt-1">Passez en caisse pour enregistrer votre première vente en direct</p>
              </div>
            )}
          </div>
        </div>

        {/* Ventes par Catégorie */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Ventes par Rayon</h3>
            <p className="text-xs text-slate-500">Répartition par catégorie de produit</p>
          </div>

          <div className="h-64 w-full">
            {ventesCategories.length > 0 && ventesCategories.some(c => c.montant > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ventesCategories}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis
                    type="category"
                    dataKey="categorie"
                    tick={{ fontSize: 10, fill: '#334155' }}
                    width={90}
                  />
                  <Tooltip
                    formatter={(val: number) => [formatFCFA(val), 'Montant']}
                    contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', fontSize: '12px', border: 'none' }}
                  />
                  <Bar dataKey="montant" radius={[0, 6, 6, 0]}>
                    {ventesCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.couleur || '#2E7D32'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center p-6">
                <Package className="w-8 h-8 text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">Aucune donnée par rayon</p>
                <p className="mt-1">Les statistiques s'afficheront dès vos premiers encaissements</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alertes de Stock si applicable */}
      {ruptures.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-xs p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500" />
              <h3 className="text-sm font-bold text-amber-900">
                Articles à réapprovisionner ({ruptures.length})
              </h3>
            </div>
            <Link
              to="/stocks"
              className="text-xs text-amber-700 hover:text-amber-900 font-semibold hover:underline"
            >
              Gérer les stocks &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {ruptures.map((prod) => (
              <div
                key={prod.id}
                className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">{prod.nom}</div>
                  <div className="text-[11px] text-slate-500">
                    Rayon : {prod.categorie_nom} • Seuil : {prod.seuil_alerte} {prod.unite_mesure}
                  </div>
                </div>
                <StatusBadge label="Alerte" tone="amber" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classements : Top Clients & Top Produits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Clients les plus actifs</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Rang</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4 text-center">Achats</th>
                  <th className="py-3 px-4 text-right">Total Dépensé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topClients.length > 0 && topClients.some(c => c.total_depense > 0) ? (
                  topClients.slice(0, 5).map((cli, index) => (
                    <tr key={cli.client_id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-[#2E7D32]">#{index + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{cli.nom_complet}</div>
                        <div className="text-[10px] text-slate-400">{cli.code_client}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-medium">{cli.nombre_achats}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatFCFA(cli.total_depense)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Aucun historique de vente pour le moment
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Produits */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Articles les plus vendus</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Rang</th>
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4 text-center">Quantité</th>
                  <th className="py-3 px-4 text-right">Total CA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProduits.length > 0 && topProduits.some(p => p.chiffre_affaires > 0) ? (
                  topProduits.slice(0, 5).map((p, index) => (
                    <tr key={p.produit_id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-[#2E7D32]">#{index + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{p.nom}</div>
                        <div className="text-[10px] text-slate-400">{p.categorie}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-medium">{p.quantite_vendue}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatFCFA(p.chiffre_affaires)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Aucun article vendu pour le moment
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
