import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Logo } from '../components/ui/Logo';
import { UserRole } from '../types';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Shield, 
  Crown, 
  Briefcase, 
  ShoppingCart, 
  Package,
  KeyRound
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@mollymarket.ci');
  const [password, setPassword] = useState('secret123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, switchRoleDemo } = useAuth();
  const { toastSuccess, toastError } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await login(email, password);
      toastSuccess('Connexion réussie', 'Bienvenue sur Molly Market');
      
      // Redirection selon le rôle
      if (email.includes('vendeur')) {
        navigate('/ventes');
      } else if (email.includes('magasinier')) {
        navigate('/stocks');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Identifiants incorrects.');
      toastError(err.message || 'Échec de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoRole = (role: UserRole, demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('secret123');
    switchRoleDemo(role);
    toastSuccess(`Session activée : ${role}`);
    if (role === 'Vendeur') navigate('/ventes');
    else if (role === 'Magasinier') navigate('/stocks');
    else navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Card Conteneur */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-200/80 p-8 sm:p-10 relative">
          {/* Ligne verte supérieure sobre */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#2E7D32] rounded-t-2xl" />

          {/* Logo Molly Market centré */}
          <div className="flex flex-col items-center text-center mb-7">
            <Logo size="lg" className="justify-center" />
            <p className="text-sm text-slate-500 mt-3 font-normal">
              Connectez-vous à votre espace de travail
            </p>
          </div>

          {/* Message d'erreur */}
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-600 flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Formulaire Login */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Adresse email
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@mollymarket.ci"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white hover:border-slate-400 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 outline-none transition text-slate-800"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Mot de passe
                </label>
                <span className="text-[11px] text-slate-400">
                  Démo : secret123
                </span>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white hover:border-slate-400 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 outline-none transition text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Connexion en cours...</span>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Raccourcis de rôles de test */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">
                Connexion rapide (comptes démo)
              </span>
              <Shield className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Administrateur */}
              <button
                type="button"
                onClick={() => handleQuickDemoRole('Administrateur', 'admin@mollymarket.ci')}
                className="p-3 text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/90 hover:border-slate-300 transition group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Crown className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-purple-700">
                    Brunell
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">Administrateur</div>
              </button>

              {/* Directeur */}
              <button
                type="button"
                onClick={() => handleQuickDemoRole('Directeur', 'directeur@mollymarket.ci')}
                className="p-3 text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/90 hover:border-slate-300 transition group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Briefcase className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-700">
                    Eden
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">Directeur</div>
              </button>

              {/* Vendeur */}
              <button
                type="button"
                onClick={() => handleQuickDemoRole('Vendeur', 'vendeur@mollymarket.ci')}
                className="p-3 text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/90 hover:border-slate-300 transition group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700">
                    Noam
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">Vendeur (Caisse)</div>
              </button>

              {/* Magasinier */}
              <button
                type="button"
                onClick={() => handleQuickDemoRole('Magasinier', 'magasinier@mollymarket.ci')}
                className="p-3 text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/90 hover:border-slate-300 transition group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Package className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-amber-700">
                    Ayo
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">Magasinier</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Sobre */}
        <p className="text-center text-xs text-slate-400 mt-6 font-normal">
          Molly Market • Plateforme de gestion commerciale
        </p>
      </div>
    </div>
  );
};
