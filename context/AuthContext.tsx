import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';

interface AuthResponse {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<AuthResponse>;
  register: (email: string, pass: string, name: string) => Promise<AuthResponse>;
  resetPassword: (email: string) => Promise<AuthResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session?.user) {
        setUser({
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário',
        });
      }
      if (mounted) setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        setUser({
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário',
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string): Promise<AuthResponse> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass, // Do not trim passwords, spaces might be intentional
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: "Erro inesperado ao conectar." };
    }
  };

  const register = async (email: string, pass: string, name: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user && !data.session) {
        return { 
          success: true, 
          error: 'Cadastro realizado! Verifique seu email para confirmar a conta antes de logar.' 
        };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: "Erro inesperado ao registrar." };
    }
  };

  const resetPassword = async (email: string): Promise<AuthResponse> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin, // Returns user to app to set new password
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: "Erro ao solicitar recuperação de senha." };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};