import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { EmployesPage } from './pages/EmployesPage';
import { FournisseursPage } from './pages/FournisseursPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ProduitsPage } from './pages/ProduitsPage';
import { AchatsPage } from './pages/AchatsPage';
import { VentesPage } from './pages/VentesPage';
import { PointDeCaissePage } from './pages/PointDeCaissePage';
import { PaiementsPage } from './pages/PaiementsPage';
import { StocksPage } from './pages/StocksPage';
import { StatistiquesPage } from './pages/StatistiquesPage';

// Redirection intelligente racine selon rôle
const RootRedirect: React.FC = () => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'Vendeur') {
    return <Navigate to="/ventes" replace />;
  }

  if (role === 'Magasinier') {
    return <Navigate to="/stocks" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Page Publique : Connexion */}
            <Route path="/login" element={<LoginPage />} />

            {/* Redirection Racine */}
            <Route path="/" element={<RootRedirect />} />

            {/* Application Protégée sous Layout Back-Office */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute feature="dashboard">
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ventes"
                element={
                  <ProtectedRoute feature="ventes">
                    <VentesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/point-de-caisse"
                element={
                  <ProtectedRoute feature="point_de_caisse">
                    <PointDeCaissePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clients"
                element={
                  <ProtectedRoute feature="clients">
                    <ClientsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/paiements"
                element={
                  <ProtectedRoute feature="paiements">
                    <PaiementsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/produits"
                element={
                  <ProtectedRoute feature="produits">
                    <ProduitsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stocks"
                element={
                  <ProtectedRoute feature="stocks">
                    <StocksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/achats"
                element={
                  <ProtectedRoute feature="achats">
                    <AchatsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/categories"
                element={
                  <ProtectedRoute feature="categories">
                    <CategoriesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fournisseurs"
                element={
                  <ProtectedRoute feature="fournisseurs">
                    <FournisseursPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employes"
                element={
                  <ProtectedRoute feature="employes">
                    <EmployesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/statistiques"
                element={
                  <ProtectedRoute feature="statistiques">
                    <StatistiquesPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Route fallback inconnue */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
