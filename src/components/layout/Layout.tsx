import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../ui/ToastContainer';

export const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname: string): string => {
    if (pathname.includes('/dashboard')) return 'Tableau de Bord Supermarché';
    if (pathname.includes('/ventes')) return 'Caisse & Ventes Clients';
    if (pathname.includes('/clients')) return 'Fichier Clients';
    if (pathname.includes('/paiements')) return 'Journal des Paiements & Règlements';
    if (pathname.includes('/produits')) return 'Gestion du Catalogue Produits';
    if (pathname.includes('/stocks')) return 'Niveaux de Stocks & Mouvements';
    if (pathname.includes('/achats')) return 'Bons d\'Achats & Réceptions Fournisseurs';
    if (pathname.includes('/categories')) return 'Rayons & Catégories Produits';
    if (pathname.includes('/fournisseurs')) return 'Répertoire des Fournisseurs';
    if (pathname.includes('/employes')) return 'Personnel & Attribution des Rôles';
    if (pathname.includes('/statistiques')) return 'Statistiques Détaillées & Chiffre d\'Affaires';
    return 'Molly Market';
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col antialiased">
      <ToastContainer />
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <Header
          onOpenMobileMenu={() => setMobileOpen(true)}
          title={getPageTitle(location.pathname)}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
