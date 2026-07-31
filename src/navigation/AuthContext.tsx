import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setUnauthorizedHandler } from '../services/api';
import { authService, type RegisterPayload, type UpdateMePayload, type User } from '../services/auth.service';

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  /** true quando a sessão caiu sozinha (token expirado), não por logout manual. */
  sessionExpired: boolean;
  clearSessionExpired: () => void;
  signIn: (email: string, senha: string) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  updateUser: (payload: UpdateMePayload) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Liga o interceptor de 401 ao estado de autenticação: token expirado
  // derruba a sessão na hora e leva o usuário de volta ao login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setSessionExpired(true);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await authService.getStoredToken();
        if (token) {
          const me = await authService.getMe();
          setUser(me);
        }
      } catch {
        // Token expirado ou inválido — continua deslogado
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: user !== null,
      isLoading,
      user,
      sessionExpired,
      clearSessionExpired: () => setSessionExpired(false),
      signIn: async (email, senha) => {
        const me = await authService.login(email, senha);
        setSessionExpired(false);
        setUser(me);
      },
      signUp: async (payload) => {
        await authService.register(payload);
        const me = await authService.login(payload.email, payload.senha);
        setSessionExpired(false);
        setUser(me);
      },
      updateUser: async (payload) => {
        const updated = await authService.updateMe(payload);
        setUser(updated);
      },
      signOut: async () => {
        await authService.logout();
        setSessionExpired(false);
        setUser(null);
      },
    }),
    [user, isLoading, sessionExpired],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return context;
}
