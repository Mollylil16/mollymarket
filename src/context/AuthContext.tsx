import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { apiClient } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, mdp: string) => Promise<void>;
  switchRoleDemo: (role: UserRole) => void;
  logout: () => void;
  hasAccessTo: (feature: AppFeature) => boolean;
}

export type AppFeature =
  | 'dashboard'
  | 'clients'
  | 'employes'
  | 'fournisseurs'
  | 'categories'
  | 'produits'
  | 'achats'
  | 'ventes'
  | 'point_de_caisse'
  | 'paiements'
  | 'stocks'
  | 'statistiques';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Matrice des autorisations selon le cahier des charges
const ROLE_PERMISSIONS: Record<UserRole, AppFeature[]> = {
  Administrateur: [
    'dashboard',
    'clients',
    'employes',
    'fournisseurs',
    'categories',
    'produits',
    'achats',
    'ventes',
    'point_de_caisse',
    'paiements',
    'stocks',
    'statistiques'
  ],
  Directeur: [
    'dashboard',
    'statistiques',
    'point_de_caisse',
    'achats',
    'paiements',
    'stocks',
    'produits',
    'categories',
    'fournisseurs',
    'clients',
    'ventes',
    'employes'
  ],
  Vendeur: [
    'clients',
    'ventes',
    'point_de_caisse',
    'paiements'
  ],
  Magasinier: [
    'produits',
    'categories',
    'fournisseurs',
    'achats',
    'stocks'
  ]
};

const DEFAULT_DEMO_USERS: Record<UserRole, User> = {
  Administrateur: {
    id: 1,
    nom: 'Kouamé',
    prenom: 'Brunell',
    email: 'admin@mollymarket.ci',
    role: 'Administrateur',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    dernierAcces: 'Aujourd\'hui 15:42'
  },
  Directeur: {
    id: 2,
    nom: 'Touré',
    prenom: 'Eden',
    email: 'directeur@mollymarket.ci',
    role: 'Directeur',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    dernierAcces: 'Aujourd\'hui 14:15'
  },
  Vendeur: {
    id: 3,
    nom: 'Koffi',
    prenom: 'Noam',
    email: 'vendeur@mollymarket.ci',
    role: 'Vendeur',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    dernierAcces: 'Aujourd\'hui 16:30'
  },
  Magasinier: {
    id: 4,
    nom: 'Bakayoko',
    prenom: 'Ayo',
    email: 'magasinier@mollymarket.ci',
    role: 'Magasinier',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    dernierAcces: 'Aujourd\'hui 11:20'
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Par défaut, l'utilisateur n'est pas connecté pour arriver directement sur la page de connexion
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('molly_market_session_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('molly_market_session_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('molly_market_session_user');
    }
  }, [user]);

  const login = async (email: string, mdp: string) => {
    setIsLoading(true);
    try {
      const loggedUser = await apiClient.login(email, mdp);
      setUser(loggedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRoleDemo = (role: UserRole) => {
    const demoUser = DEFAULT_DEMO_USERS[role];
    setUser(demoUser);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('molly_market_session_user');
  };

  const hasAccessTo = (feature: AppFeature): boolean => {
    if (!user) return false;
    const allowed = ROLE_PERMISSIONS[user.role] || [];
    return allowed.includes(feature);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        isLoading,
        login,
        switchRoleDemo,
        logout,
        hasAccessTo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
