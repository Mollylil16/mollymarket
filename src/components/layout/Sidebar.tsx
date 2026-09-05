import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../ui/Logo';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Truck,
  Tags,
  Package,
  ShoppingBag,
  ShoppingCart,
  Receipt,
  CreditCard,
  Boxes,
  BarChart3,
  X,
  ShieldCheck,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user, hasAccessTo, logout } = useAuth();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      feature: 'dashboard' as const
    },
    {
      to: '/ventes',
      label: 'Ventes Clients',
      icon: ShoppingCart,
      feature: 'ventes' as const,
      badge: 'Caisse'
    },
    {
      to: '/point-de-caisse',
      label: 'Point de Caisse',
      icon: Receipt,
      feature: 'point_de_caisse' as const,
      badge: 'Jour'
    },
    {
      to: '/clients',
      label: 'Clients',
      icon: Users,
      feature: 'clients' as const
    },
    {
      to: '/paiements',
      label: 'Paiements',
      icon: CreditCard,
      feature: 'paiements' as const
    },
    {
      to: '/produits',
      label: 'Produits',
      icon: Package,
      feature: 'produits' as const
    },
    {
      to: '/stocks',
      label: 'Stocks & Mouvements',
      icon: Boxes,
      feature: 'stocks' as const
    },
    {
      to: '/achats',
      label: 'Achats Fournisseurs',
      icon: ShoppingBag,
      feature: 'achats' as const
    },
    {
      to: '/categories',
      label: 'Catégories',
      icon: Tags,
      feature: 'categories' as const
    },
    {
      to: '/fournisseurs',
      label: 'Fournisseurs',
      icon: Truck,
      feature: 'fournisseurs' as const
    },
    {
      to: '/employes',
      label: 'Employés & Rôles',
      icon: UserCheck,
      feature: 'employes' as const
    },
    {
      to: '/statistiques',
      label: 'Statistiques & CA',
      icon: BarChart3,
      feature: 'statistiques' as const
    }
  ];

  // Filtre des menus selon les droits accordés au rôle
  const visibleItems = navItems.filter((item) => hasAccessTo(item.feature));

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-neutral-100 flex items-center justify-between">
          <Logo size="md" />
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Navigation ({user?.role})
          </div>

          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#2E7D32] text-white shadow-xs font-bold'
                      : 'text-neutral-700 hover:bg-neutral-100/80 hover:text-neutral-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-white' : 'text-neutral-500'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-emerald-50 text-[#2E7D32] border border-emerald-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>



        {/* Bouton de Déconnexion Session */}
        {user && (
          <div className="p-3 border-t border-neutral-200 bg-white">
            <button
              onClick={() => {
                logout();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-xl transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-[#E53935]" />
              <span>Changer d'utilisateur / Déconnexion</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
