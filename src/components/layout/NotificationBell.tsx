import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCaisseStore } from '../../store/useCaisseStore';
import { apiClient } from '../../services/api';
import { formatFCFA } from '../../utils/format';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ShoppingBag,
  Package,
  ExternalLink,
  Check,
  X
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  type: 'caisse' | 'achat' | 'stock';
  title: string;
  description: string;
  link: string;
  actionText: string;
  date: string;
  priority: 'high' | 'medium' | 'info';
}

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const { sessionActive, statutSession } = useCaisseStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDirectorOrAdmin = user?.role === 'Directeur' || user?.role === 'Administrateur';

  // Charger les notifications en temps réel
  const loadNotifications = async () => {
    setLoading(true);
    const items: NotificationItem[] = [];
    const nowStr = 'À l\'instant';

    try {
      // 1. Point de Caisse en attente de validation par le Directeur
      if (sessionActive && statutSession === 'en_attente_validation') {
        items.push({
          id: `caisse-${sessionActive.id}`,
          type: 'caisse',
          title: 'Point de Caisse en attente de validation',
          description: `Clôture soumise par le caissier ${sessionActive.vendeur_nom} (${formatFCFA(sessionActive.total_compte || sessionActive.total_ventes)}).`,
          link: '/point-de-caisse',
          actionText: 'Vérifier & Valider',
          date: nowStr,
          priority: 'high'
        });
      }

      // 2. Factures Fournisseurs en attente de règlement par la Direction
      if (isDirectorOrAdmin) {
        try {
          const achats = await apiClient.getVueAchats();
          const facturesEnAttente = achats.filter((a) => a.statut === 'en_attente_paiement_directeur');
          if (facturesEnAttente.length > 0) {
            const total = facturesEnAttente.reduce((s, a) => s + Number(a.montant_total || 0), 0);
            items.push({
              id: 'achats-pending',
              type: 'achat',
              title: `${facturesEnAttente.length} Facture(s) Fournisseur(s) à régler`,
              description: `Total de ${formatFCFA(total)} en attente d'ordonnancement bancaire / caisse.`,
              link: '/achats',
              actionText: 'Régler les factures',
              date: nowStr,
              priority: 'high'
            });
          }
        } catch (e) {
          // Ignorer silencieusement si l'API n'est pas dispo
        }
      }

      // 3. Alertes Ruptures & Stocks Critiques
      try {
        const stocks = await apiClient.getVueStock();
        const alertesStock = stocks.filter((p) => p.stock_actuel <= p.seuil_alerte);
        if (alertesStock.length > 0) {
          const ruptures = alertesStock.filter((p) => p.stock_actuel === 0);
          items.push({
            id: 'stocks-alert',
            type: 'stock',
            title: `${alertesStock.length} Alerte(s) de Stock en Rayon`,
            description: `${ruptures.length} produit(s) en rupture totale et ${alertesStock.length - ruptures.length} sous le seuil d'alerte.`,
            link: '/stocks',
            actionText: 'Voir les alertes',
            date: nowStr,
            priority: ruptures.length > 0 ? 'high' : 'medium'
          });
        }
      } catch (e) {
        // Ignorer
      }

      setNotifications(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 20000); // Rafraîchir toutes les 20s
    return () => clearInterval(interval);
  }, [sessionActive, statutSession, user?.role]);

  // Fermer le dropdown en cliquant dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const count = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton Cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl border transition-all ${
          isOpen
            ? 'bg-emerald-50 border-emerald-300 text-[#2E7D32]'
            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
        }`}
        title="Centre de notifications et alertes en direct"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#E53935] text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-xs animate-pulse">
            {count}
          </span>
        )}
      </button>

      {/* Dropdown Flottant */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-neutral-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-neutral-900">Centre de Notifications</span>
              {count > 0 ? (
                <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                  {count} en attente
                </span>
              ) : (
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  À jour
                </span>
              )}
            </div>

            <button
              onClick={() => loadNotifications()}
              className="text-[11px] font-semibold text-[#2E7D32] hover:underline"
            >
              Actualiser
            </button>
          </div>

          {/* Liste des notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-neutral-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-neutral-700">Aucune notification en attente</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Toutes les opérations sont à jour.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isCaisse = notif.type === 'caisse';
                const isAchat = notif.type === 'achat';

                return (
                  <div
                    key={notif.id}
                    className="p-3.5 hover:bg-neutral-50/80 transition-colors flex items-start gap-3 text-xs"
                  >
                    <div
                      className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center mt-0.5 ${
                        isCaisse
                          ? 'bg-purple-100 text-purple-700'
                          : isAchat
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isCaisse ? (
                        <Receipt className="w-4 h-4" />
                      ) : isAchat ? (
                        <ShoppingBag className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-neutral-900 truncate text-[11px]">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-neutral-400 shrink-0">{notif.date}</span>
                      </div>
                      <p className="text-neutral-500 text-[11px] leading-relaxed line-clamp-2">
                        {notif.description}
                      </p>

                      <div className="mt-2 flex items-center justify-between">
                        <Link
                          to={notif.link}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2E7D32] hover:underline"
                        >
                          <span>{notif.actionText}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-neutral-50 border-t border-neutral-100 text-center">
            <span className="text-[10px] text-neutral-400 font-medium">
              Système de surveillance temps réel Molly Market
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
