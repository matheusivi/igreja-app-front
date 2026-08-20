import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { tokenSeguro } from './tokenSeguro';

export type User = {
  id: number;
  nomeCompleto: string;
  email: string;
  perfil: 'Membro' | 'Líder' | 'Pastor' | 'Administrador';
  sexo: 'Masculino' | 'Feminino';
  dataNascimento: string | null;
  exibirAniversario: boolean;
  estadoCivil: string | null;
  fotoUrl: string | null;
  profissao: string | null;
  /** Só dígitos, sem máscara. A tela formata. */
  telefone: string | null;
  especializacao: string | null;
  /** Opt-in do diretório "Trabalhos da comunidade". Nasce falso. */
  divulgarTrabalho: boolean;
  batizado: boolean;
};

export type RegisterPayload = {
  nomeCompleto: string;
  email: string;
  senha: string;
  sexo: 'Masculino' | 'Feminino';
  dataNascimento?: string;
  estadoCivil?: string;
  profissao?: string;
};

export type UpdateMePayload = Partial<{
  nomeCompleto: string;
  sexo: 'Masculino' | 'Feminino';
  dataNascimento: string; // YYYY-MM-DD
  estadoCivil: string;
  profissao: string;
  exibirAniversario: boolean;
  // null apaga o telefone. String vazia gravaria "" — um telefone que existe
  // e não serve para nada.
  telefone: string | null;
  especializacao: string;
  divulgarTrabalho: boolean;
  // null remove a foto de perfil (o backend apaga a imagem no Cloudinary).
  fotoUrl: string | null;
}>;

// Só o e-mail — nunca a senha. Serve para pré-preencher o campo no próximo
// login ("Lembrar de mim"), não para manter a sessão (isso é papel do token).
const REMEMBERED_EMAIL_KEY = 'remembered_email';
/**
 * O último perfil conhecido, guardado no aparelho.
 *
 * ═══ POR QUE GUARDAR ═══
 * Só o token era persistido. Toda abertura do app começava com `user = null`
 * e prendia a tela inteira num spinner até o `/me` responder — uma ida à rede
 * antes de qualquer pixel útil. Em 4G da igreja isso é um segundo ou dois de
 * tela vazia, todo dia, para mostrar dados que não mudaram desde ontem.
 *
 * Com a cópia local o app abre com o perfil na tela e confere com o servidor
 * por baixo. É o padrão "stale-while-revalidate": mostrar o conhecido agora,
 * corrigir em silêncio depois.
 *
 * ⚠️  NÃO é a fonte de verdade nem credencial. Quem autoriza é o token; isto
 * é só o retrato mais recente. Se o token não valer mais, a primeira chamada
 * devolve 401 e a sessão cai, com cópia local ou sem ela.
 *
 * ⚠️  Nada de senha aqui — o servidor nunca manda, e este objeto é
 * exatamente o que ele mandou.
 */
const USER_KEY = 'auth_user';

/** Grava o perfil sem deixar uma falha de disco derrubar a operação. */
async function guardarUsuario(user: User): Promise<User> {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Sem cache local o app volta a abrir mais devagar — e só isso.
  }
  return user;
}

export const authService = {
  async login(email: string, senha: string): Promise<User> {
    const { data } = await api.post('/api/auth/login', { email, senha });
    const { token, ...user } = data.data as { token: string } & User;
    await tokenSeguro.guardar(token);
    return guardarUsuario(user);
  },

  async register(payload: RegisterPayload): Promise<void> {
    await api.post('/api/auth/register', payload);
  },

  async getMe(): Promise<User> {
    const { data } = await api.get('/api/auth/me');
    return guardarUsuario(data.data as User);
  },

  async updateMe(payload: UpdateMePayload): Promise<User> {
    const { data } = await api.patch('/api/auth/me', payload);
    return guardarUsuario(data.data as User);
  },

  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } finally {
      // Token E perfil: deixar o perfil para trás faria o próximo login de
      // OUTRA pessoa no mesmo aparelho abrir com o nome e a foto de quem
      // saiu, até o `/me` responder. O token sai pelo cofre; o perfil, que
      // não é segredo, continua no armazenamento comum.
      await Promise.all([
        tokenSeguro.limpar(),
        AsyncStorage.removeItem(USER_KEY),
      ]);
    }
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/api/auth/forgot-password', { email });
  },

  async resetPassword(token: string, novaSenha: string): Promise<void> {
    await api.post('/api/auth/reset-password', { token, novaSenha });
  },

  /**
   * O token da sessão, vindo do cofre do sistema.
   *
   * Mora em `tokenSeguro` porque o `api.ts` também precisa dele para montar o
   * cabeçalho — e a chave escrita à mão em dois lugares foi o que quase fez
   * esta migração esquecer metade do app.
   */
  getStoredToken(): Promise<string | null> {
    return tokenSeguro.obter();
  },

  /** O perfil da última sessão, para a tela abrir preenchida. */
  async getStoredUser(): Promise<User | null> {
    try {
      const bruto = await AsyncStorage.getItem(USER_KEY);
      return bruto ? (JSON.parse(bruto) as User) : null;
    } catch {
      // JSON corrompido ou formato de uma versão antiga do app. Ignorar e
      // buscar do servidor é sempre seguro; propagar o erro derrubaria a
      // abertura do app por causa de um cache.
      return null;
    }
  },

  getRememberedEmail(): Promise<string | null> {
    return AsyncStorage.getItem(REMEMBERED_EMAIL_KEY);
  },

  async setRememberedEmail(email: string | null): Promise<void> {
    if (email) {
      await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    } else {
      await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
  },
};
