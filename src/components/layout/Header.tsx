import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCaisseStore } from '../../store/useCaisseStore';
import { UserRole } from '../../types';
import { Menu, LogOut, Shield, ChevronDown, Lock, Unlock, Clock } from 'lucide-react';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, title }) => {
  const { user, logout, switchRoleDemo } = useAuth();
  const { isOuverte, isVerrouillee, statutSession } = useCaisseStore();

  const roleColors: Record<UserRole, string> = {
    Administrateur: 'bg-purple-50 text-purple-700 border-purple-200',
    Directeur: 'bg-blue-50 text-blue-700 border-blue-200',
    Vendeur: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Magasinier: 'bg-amber-50 text-amber-800 border-amber-200'
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    switchRoleDemo(e.target.value as UserRole);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-neutral-200 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title && (
          <h1 className="text-lg sm:text-xl font-bold text-[#212121] tracking-tight">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Centre de Notifications */}
        <NotificationBell />

        {/* Badge d'état global du cycle de vie de la session de caisse */}
        <Link
          to="/point-de-caisse"
          title="Consulter le point de caisse journalier"
          className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all border ${
            isVerrouillee
              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              : statutSession === 'ouverte'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200'
          }`}
        >
          {isVerrouillee ? (
            <>
              <Lock className="w-3 h-3 text-rose-600" />
              <span>Caisse Verrouillée</span>
            </>
          ) : statutSession === 'ouverte' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Caisse Ouverte</span>
            </>
          ) : (
            <>
              <Clock className="w-3 h-3 text-neutral-400" />
              <span>Caisse Fermée</span>
            </>
          )}
        </Link>

        {/* Simulateur rapide de rôle pour la démo */}
        <div className="hidden sm:flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs">
          <Shield className="w-3.5 h-3.5 text-[#2E7D32]" />
          <span className="text-neutral-500 font-medium">Tester rôle :</span>
          <div className="relative inline-flex items-center">
            <select
              value={user?.role || 'Administrateur'}
              onChange={handleRoleChange}
              className="bg-transparent font-bold text-neutral-800 focus:outline-none cursor-pointer pr-4 appearance-none"
            >
              <option value="Administrateur">Administrateur (Tout)</option>
              <option value="Directeur">Directeur (Tableaux & Stats)</option>
              <option value="Vendeur">Vendeur (Caisse & Clients)</option>
              <option value="Magasinier">Magasinier (Stocks & Achats)</option>
            </select>
            <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-0 pointer-events-none" />
          </div>
        </div>

        {/* Profil de l'utilisateur connecté */}
        {user && (
          <div className="flex items-center gap-3 pl-2 sm:border-l sm:border-neutral-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#2E7D32]/10 border border-[#2E7D32]/30 flex items-center justify-center font-bold text-xs text-[#2E7D32]">
                {user.prenom[0]}
                {user.nom[0]}
              </div>

              <div className="hidden md:flex flex-col">
                <span className="text-xs font-bold text-neutral-900 leading-tight">
                  {user.prenom} {user.nom}
                </span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border self-start mt-0.5 ${
                    roleColors[user.role]
                  }`}
                >
                  {user.role}
                </span>
              </div>
            </div>

            {/* Bouton de déconnexion explicite */}
            <button
              onClick={logout}
              title="Se déconnecter et retourner à la page de connexion"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-neutral-600 hover:text-[#E53935] hover:bg-rose-50 border border-neutral-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-[#E53935]" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
