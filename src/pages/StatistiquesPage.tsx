import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { VueStatistiques } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Users,
  ShoppingBag,
  CreditCard,
  Download,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  DollarSign,
  Package,
  ShoppingCart
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { formatFCFA } from '../utils/format';
import { exporterStatistiquesExcel, exporterStatistiquesPDF } from '../utils/exportUtils';

export const StatistiquesPage: React.FC = () => {
  const [periode, setPeriode] = useState<'jour' | 'semaine' | 'mois' | 'annee'>('mois');
  const [stats, setStats] = useState<VueStatistiques | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getVueStatistiques(periode);
      setStats(data);
    } catch (err) {
      console.error('Erreur chargement statistiques', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [periode]);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <RefreshCw className="w-8 h-8 text-[#2E7D32] animate-spin mb-3" />
        <p className="text-sm font-medium">Calcul des rapports statistiques...</p>
      </div>
    );
  }

  const ca = stats?.chiffre_affaires;
  const topClients = stats?.top_clients || [];
  const topProduits = stats?.top_produits || [];
  const evolution = stats?.evolution_ventes || [];
  const categoriesData = stats?.ventes_par_categorie || [];

  // Calculs réels et dynamiques
  const caPeriode = periode === 'jour' ? Number(ca?.journalier || 0) : Number(ca?.mensuel || 0);
  const totalTransactions = evolution.reduce((acc, curr) => acc + Number(curr.nombre_ventes || 0), 0);
  const panierMoyenCalcule = totalTransactions > 0 ? Math.round(caPeriode / totalTransactions) : 0;

  return (
    <div className="space-y-6">
      {/* En-tête & Filtre de Période */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#2E7D32]" />
            Statistiques & Rapports Financiers
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Analyse des ventes, paniers moyens et répartition du chiffre d'affaires
          </p>
        </div>

        {/* Sélecteur de Période & Boutons Export */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              {(['jour', 'semaine', 'mois', 'annee'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriode(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                    periode === p
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {p === 'jour'
                    ? 'Aujourd\'hui'
                    : p === 'semaine'
                    ? 'Semaine'
                    : p === 'mois'
                    ? 'Ce mois'
                    : 'Année'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (stats) {
                  const pLabel =
                    periode === 'jour'
                      ? 'Aujourd\'hui'
                      : periode === 'semaine'
                      ? 'Cette Semaine'
                      : periode === 'mois'
                      ? 'Ce Mois'
                      : 'Cette Année';
                  exporterStatistiquesExcel(stats, pLabel);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              title="Exporter vers Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={() => {
                if (stats) {
                  const pLabel =
                    periode === 'jour'
                      ? 'Aujourd\'hui'
                      : periode === 'semaine'
                      ? 'Cette Semaine'
                      : periode === 'mois'
                      ? 'Ce Mois'
                      : 'Cette Année';
                  exporterStatistiquesPDF(stats, pLabel);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              title="Générer le rapport en PDF"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chiffre d'affaires */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Chiffre d'Affaires
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#2E7D32] flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatFCFA(caPeriode)}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              Sur la période sélectionnée
            </div>
          </div>
        </div>

        {/* Panier Moyen */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Panier Moyen
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatFCFA(panierMoyenCalcule)}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              Moyenne par ticket de caisse
            </div>
          </div>
        </div>

        {/* Volume de Transactions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Nombre de Ventes
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {totalTransactions}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              Tickets émis sur la période
            </div>
          </div>
        </div>

        {/* Clients Enregistrés */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Clients Enregistrés
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#FB8C00] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {stats?.total_clients_actifs || 0}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              Comptes clients fidélité
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques Principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Évolution des Ventes Courbe */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Courbe d'Activité et Chiffre d'Affaires
            </h3>
            <p className="text-xs text-slate-500">
              Évolution des encaissements sur la période
            </p>
          </div>

          <div className="h-72 w-full">
            {evolution.length > 0 && evolution.some(e => e.montant > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolution} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="periode" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    formatter={(val: number) => [formatFCFA(val), 'Chiffre d\'Affaires']}
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
                <p className="font-semibold text-slate-600">Aucune vente enregistrée</p>
                <p className="mt-1">Les courbes d'activité se dessineront au fur et à mesure des encaissements</p>
              </div>
            )}
          </div>
        </div>

        {/* Camembert Répartition Catégories */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-900">Répartition par Rayon</h3>
            <p className="text-xs text-slate-500">Part de chiffre d'affaires relative</p>
          </div>

          <div className="h-64 w-full">
            {categoriesData.length > 0 && categoriesData.some(c => c.montant > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoriesData}
                    dataKey="montant"
                    nameKey="categorie"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categoriesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.couleur || '#2E7D32'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [formatFCFA(val), 'CA']}
                    contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', fontSize: '12px', border: 'none' }}
                  />
                  <Legend
                    formatter={(val) => <span className="text-[10px] text-slate-700">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center p-6">
                <Package className="w-8 h-8 text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">Aucune répartition disponible</p>
                <p className="mt-1">Le graphique s'alimentera dès les premières ventes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tableaux de Synthèse */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Synthèse Top Produits */}
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
                  <th className="py-3 px-4 text-center">Unités Vendues</th>
                  <th className="py-3 px-4 text-right">CA Réalisé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProduits.length > 0 && topProduits.some(p => p.chiffre_affaires > 0) ? (
                  topProduits.map((p, idx) => (
                    <tr key={p.produit_id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-[#2E7D32]">#{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{p.nom}</div>
                        <div className="text-[10px] text-slate-400">{p.categorie}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {p.quantite_vendue}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatFCFA(p.chiffre_affaires)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Aucun article vendu sur cette période
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Synthèse Top Clients */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Meilleurs Acheteurs</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Rang</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4 text-center">Commandes</th>
                  <th className="py-3 px-4 text-right">Panier Cumulé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topClients.length > 0 && topClients.some(c => c.total_depense > 0) ? (
                  topClients.map((c, idx) => (
                    <tr key={c.client_id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-[#2E7D32]">#{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{c.nom_complet}</div>
                        <div className="text-[10px] text-slate-400">{c.code_client}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {c.nombre_achats}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatFCFA(c.total_depense)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Aucun historique de vente sur cette période
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
