import React, { createContext, useContext, useState, useEffect } from 'react';
import { config } from '../../infrastructure/config/environment';
import { supabase } from '../../infrastructure/api/supabase';
import { getPermissionsForRole, type Permission } from '../services/rbac';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'agent';
  permissions: Permission[];
  isActive: boolean;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  configError: boolean;
  profileMissing: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const isSupabaseConfigured = (): boolean =>
  Boolean(config.supabase.url && config.supabase.anonKey);

async function fetchUserProfile(userId: string): Promise<AuthUser | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('users')
    .select('id, name, email, role, is_active')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  const role = data.role as 'admin' | 'supervisor' | 'agent';
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role,
    permissions: getPermissionsForRole(role),
    isActive: data.is_active,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading]         = useState(true);
  const [configError]                  = useState(!isSupabaseConfigured());
  const [profileMissing, setProfileMissing] = useState(false);
  const [authError, setAuthError]     = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const resolveSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const session = data.session;
        if (!session) {
          if (!cancelled) setLoading(false);
          return;
        }

        const profile = await fetchUserProfile(session.user.id);
        if (cancelled) return;

        if (!profile) {
          setProfileMissing(true);
        } else if (!profile.isActive) {
          setAuthError('Tu cuenta está desactivada. Contacta al administrador.');
        } else {
          setCurrentUser(profile);
        }
      } catch (err) {
        if (!cancelled) {
          setAuthError(err instanceof Error ? err.message : 'Error de autenticación');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    resolveSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (!session) {
        setCurrentUser(null);
        setProfileMissing(false);
        setAuthError(null);
        return;
      }
      fetchUserProfile(session.user.id).then((profile) => {
        if (cancelled) return;
        if (!profile) {
          setCurrentUser(null);
          setProfileMissing(true);
        } else if (!profile.isActive) {
          setCurrentUser(null);
          setAuthError('Tu cuenta está desactivada.');
        } else {
          setProfileMissing(false);
          setAuthError(null);
          setCurrentUser(profile);
        }
      }).catch((err) => {
        if (!cancelled) setAuthError(err instanceof Error ? err.message : 'Error al cargar perfil');
      });
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    if (!isSupabaseConfigured()) throw new Error('Supabase no está configurado');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    // onAuthStateChange will fire and set currentUser
  };

  const logout = async (): Promise<void> => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut().catch(() => { /* ignore */ });
    }
    setCurrentUser(null);
    setProfileMissing(false);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        loading,
        configError,
        profileMissing,
        authError,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
