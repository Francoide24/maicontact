import React, { createContext, useContext, useState, useEffect } from 'react';
import { demoLogin, getDemoUserById, type DemoUser } from '../../infrastructure/auth/demoAuth';
import { loadSession, saveSession, clearSession } from '../../services/persistence';

interface AuthContextType {
  currentUser: DemoUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = loadSession();
    if (session) {
      const user = getDemoUserById(session.userId);
      if (user?.isActive) setCurrentUser(user);
      else clearSession();
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const user = demoLogin(email, password);
    saveSession({ userId: user.id, email: user.email, loginAt: new Date().toISOString() });
    setCurrentUser(user);
  };

  const logout = (): void => {
    clearSession();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, isAuthenticated: !!currentUser, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
