import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  feature?:
    | 'dashboard'
    | 'clients'
    | 'employes'
    | 'fournisseurs'
    | 'categories'
    | 'produits'
    | 'achats'
    | 'ventes'
    | 'paiements'
    | 'stocks'
    | 'statistiques';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, feature }) => {
  const { isAuthenticated, hasAccessTo, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (feature && !hasAccessTo(feature)) {
    return (
      <div className="min-h-[450px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-neutral-200/90 shadow-xs max-w-lg mx-auto my-12">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#E53935] mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-[#212121]">Accès Restreint</h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-sm">
          Votre profil actuel ({role}) ne dispose pas des privilèges nécessaires pour accéder à ce
          module selon les règles de sécurité PostgreSQL.
        </p>
        <Link
          to={role === 'Vendeur' ? '/ventes' : role === 'Magasinier' ? '/stocks' : '/dashboard'}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retourner à mon espace</span>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};
