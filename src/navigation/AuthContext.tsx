import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
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
  /**
   * Rebusca o próprio perfil no servidor.
   *
   * Exposto para o puxar-para-atualizar: o gesto significa "me dá o estado
   * atual", e o perfil da pessoa faz parte desse estado — é ele que decide
   * quais botões a tela mostra.
   */
  refreshUser: () => Promise<void>;
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

  /**
   * Restaura a sessão em DUAS etapas.
   *
   * ═══ POR QUE DUAS ═══
   * Antes era uma só: pegar o token e esperar o `/me`. Enquanto essa ida à
   * rede não voltava, `isLoading` segurava o app inteiro num spinner — e o
   * Perfil só aparecia depois. Toda abertura pagava uma viagem de rede para
   * mostrar dados que quase nunca mudaram desde a última vez.
   *
   *   1. LOCAL (instantâneo) — o perfil guardado no aparelho já libera a
   *      navegação. A pessoa vê o próprio nome e a própria foto de imediato.
   *   2. REDE (em segundo plano) — o `/me` confirma e corrige em silêncio.
   *      Se alguém promoveu a pessoa a Líder ontem, o app se ajusta sozinho.
   *
   * ═══ O QUE ACONTECE QUANDO A REDE FALHA ═══
   * Depende de QUEM falhou, e a diferença importa:
   *
   *   401 → o token não vale mais. O interceptor derruba a sessão, aqui e em
   *         qualquer outra chamada. Cache local não protege token vencido.
   *   rede caindo → mantém o que já está na tela. Derrubar alguém para o
   *         login porque o 4G oscilou no meio do culto seria trocar um
   *         problema pequeno por um grande.
   */
  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await authService.getStoredToken();
        if (!token) return;

        const guardado = await authService.getStoredUser();
        if (guardado) {
          setUser(guardado);
          // Libera a navegação já: daqui para a frente o `/me` corrige por
          // baixo, sem cobrir a tela.
          setIsLoading(false);
        }

        const me = await authService.getMe();
        setUser(me);
      } catch {
        // Sem cópia local não há o que mostrar: segue deslogado e o
        // `finally` libera a tela de login. Com cópia local, o que já está
        // na tela permanece.
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  /**
   * Reconsulta o próprio perfil no servidor.
   *
   * ═══ POR QUE ISTO PRECISOU EXISTIR ═══
   * O servidor já lê o perfil do banco, então promover ou rebaixar alguém vale
   * na hora — do lado do SERVIDOR. A interface, não: o `user` do app só era
   * buscado na abertura a frio, e os botões de liderança continuavam do jeito
   * antigo até a pessoa fechar e abrir o app.
   *
   * Isso produzia os dois erros opostos. Quem foi promovido não via o poder
   * que já tinha. Quem foi REBAIXADO continuava vendo botões que o servidor
   * agora recusa — pior dos dois, porque leva a pessoa a tocar e levar erro.
   *
   * ═══ CHAMADA DE DOIS LUGARES ═══
   * Do `AppState` (a pessoa volta ao app) e do puxar-para-atualizar. Ficou
   * numa função só porque a lógica de "só se houver token, e falha em
   * silêncio" tem que ser idêntica nos dois — divergir aqui significaria um
   * caminho derrubando a sessão e o outro não.
   *
   * ═══ FALHA É SILÊNCIO ═══
   * Sem rede, mantém o que já está na tela. Um 401 (conta apagada, token
   * revogado) é tratado pelo interceptor lá em cima, que derruba a sessão.
   */
  const refreshUser = useCallback(async () => {
    try {
      // Token primeiro: sem sessão não há o que reconsultar, e chamar `/me`
      // deslogado só produziria um 401 inútil na tela de login.
      const token = await authService.getStoredToken();
      if (!token) return;

      const me = await authService.getMe();
      setUser(me);
    } catch {
      // Rede oscilando não é motivo para mexer no que está na tela.
    }
  }, []);

  useEffect(() => {
    const inscricao = AppState.addEventListener(
      'change',
      (estado: AppStateStatus) => {
        if (estado === 'active') void refreshUser();
      },
    );

    return () => inscricao.remove();
  }, [refreshUser]);

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
      refreshUser,
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
    [user, isLoading, sessionExpired, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return context;
}
