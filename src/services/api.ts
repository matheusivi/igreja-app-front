import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Handler chamado quando o token expira (401 vindo de uma rota autenticada).
 * O AuthContext registra o seu no boot, para derrubar a sessão e mandar o
 * usuário de volta ao login com aviso — sem isso o app continuaria "logado"
 * com um token morto, falhando silenciosamente até o usuário reiniciar.
 */
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

// Rotas onde 401 significa "credencial errada", não "sessão expirada".
// Sem isso, errar a senha no login dispararia o aviso de sessão expirada.
const AUTH_ROUTES = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const url = error.config?.url ?? '';
    const isAuthRoute = AUTH_ROUTES.some((route) => url.includes(route));

    if (error.response?.status === 401 && !isAuthRoute) {
      await AsyncStorage.removeItem('auth_token');
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/**
 * Traduz um erro de requisição em texto para o usuário.
 *
 * A distinção entre "o servidor respondeu com erro" e "a requisição nem chegou
 * ao servidor" é essencial. Sem ela, uma falha de rede caía no `fallback` da
 * tela que fez a chamada — e no Login o fallback é "E-mail ou senha
 * incorretos". Ou seja: backend desligado, IP errado no `config.ts` ou celular
 * em outra rede apareciam como credencial inválida, a mensagem mais enganosa
 * possível, porque manda a pessoa conferir justamente o que está certo.
 */
export function extractErrorMessage(
  error: unknown,
  fallback = 'Algo deu errado. Tente novamente.',
): string {
  if (!axios.isAxiosError(error)) return fallback;

  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return `O servidor demorou demais para responder (${API_BASE_URL}). Verifique se ele está rodando.`;
    }
    return `Não foi possível falar com o servidor (${API_BASE_URL}). Confira se o backend está rodando e se o celular está na mesma rede Wi-Fi do computador.`;
  }

  const data = error.response.data;

  // O backend responde erro de validação como
  // `{ message: "Dados inválidos", errors: [{ field, message }] }`.
  // Mostrar só o `message` deixava a pessoa (e quem depura) sem a menor ideia
  // de QUAL campo reprovou — que é justamente a única informação útil ali.
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors
      .map((e: { field?: string; message?: string }) => e.message ?? e.field)
      .filter(Boolean)
      .join('\n');
  }

  return data?.message ?? fallback;
}
