import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

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
  // null remove a foto de perfil (o backend apaga a imagem no Cloudinary).
  fotoUrl: string | null;
}>;

const TOKEN_KEY = 'auth_token';
// Só o e-mail — nunca a senha. Serve para pré-preencher o campo no próximo
// login ("Lembrar de mim"), não para manter a sessão (isso é papel do token).
const REMEMBERED_EMAIL_KEY = 'remembered_email';

export const authService = {
  async login(email: string, senha: string): Promise<User> {
    const { data } = await api.post('/api/auth/login', { email, senha });
    const { token, ...user } = data.data as { token: string } & User;
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return user;
  },

  async register(payload: RegisterPayload): Promise<void> {
    await api.post('/api/auth/register', payload);
  },

  async getMe(): Promise<User> {
    const { data } = await api.get('/api/auth/me');
    return data.data as User;
  },

  async updateMe(payload: UpdateMePayload): Promise<User> {
    const { data } = await api.patch('/api/auth/me', payload);
    return data.data as User;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } finally {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/api/auth/forgot-password', { email });
  },

  async resetPassword(token: string, novaSenha: string): Promise<void> {
    await api.post('/api/auth/reset-password', { token, novaSenha });
  },

  getStoredToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
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
