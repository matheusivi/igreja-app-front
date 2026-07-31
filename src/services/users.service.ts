import { api } from './api';

export type PerfilUsuario = 'Membro' | 'Líder' | 'Pastor' | 'Administrador';

export type Aniversariante = {
  id: number;
  nomeCompleto: string;
  fotoUrl: string | null;
  /** Opcional por segurança: instalações antigas do backend podem não enviar. */
  perfil?: PerfilUsuario | string;
};

export type AniversarianteDia = {
  dia: number;
  aniversariantes: Aniversariante[];
};

export type UsuarioResumo = {
  id: number;
  nomeCompleto: string;
  fotoUrl: string | null;
  perfil: string;
};

export const usersService = {
  async fetchAniversariantes(mes?: number): Promise<AniversarianteDia[]> {
    const { data } = await api.get(
      '/api/usuarios/aniversariantes',
      mes ? { params: { mes } } : undefined,
    );
    // O controller responde { success, mes, data: [ {dia, aniversariantes} ] }
    // — o payload NÃO vem aninhado duas vezes. Estava lendo `data.data.data`,
    // que é sempre undefined, então a lista vinha vazia SEMPRE.
    return (data.data ?? []) as AniversarianteDia[];
  },

  async search(busca: string, page = 1, limit = 20): Promise<UsuarioResumo[]> {
    const { data } = await api.get('/api/usuarios', { params: { busca, page, limit } });
    return (data.data ?? []) as UsuarioResumo[];
  },
};
