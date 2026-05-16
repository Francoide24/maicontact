import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../../infrastructure/api/supabase';
import { getPermissionsForRole, type Permission } from '../services/rbac';

type UserRole = 'admin' | 'supervisor' | 'agent';

type UserProfileRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
};

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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

async function fetchUserProfile(userId: string): Promise<AuthUser | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, is_active')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as UserProfileRow;
  const role = row.role;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role,
    permissions: getPermissionsForRole(role),
    isActive: Boolean(row.is_active),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(!isSupabaseConfigured);
  const [profileMissing, setProfileMissing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      setConfigError(true);
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
          setCurrentUser(null);
          setProfileMissing(true);
        } else if (!profile.isActive) {
          setCurrentUser(null);
          setAuthError('Tu cuenta está desactivada. Contacta al administrador.');
        } else {
          setProfileMissing(false);
          setAuthError(null);
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

      fetchUserProfile(session.user.id)
        .then((profile) => {
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
        })
        .catch((err) => {
          if (!cancelled) setAuthError(err instanceof Error ? err.message : 'Error al cargar perfil');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setConfigError(true);
      throw new Error('Supabase no está configurado');
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const logout = async (): Promise<void> => {
    const supabase = getSupabaseClient();
    if (supabase) {
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
