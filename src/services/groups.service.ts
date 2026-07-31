import { api } from './api';

export type MembroFamilia = {
  id: number; // id do membroFamilia — usado no PATCH /familias/convites/:membroId/responder
  parentesco: string | null;
  status: 'aceito' | 'pendente';
  usuario: {
    id: number;
    nomeCompleto: string;
    perfil: string;
    fotoUrl: string | null;
  };
  convidadoPor: { id: number; nomeCompleto: string };
};

export type GrupoFamiliar = {
  id: number;
  nome: string | null;
  imagemUrl: string | null;
  criadorUsuarioId: number;
  membros: MembroFamilia[];
};

export type UpdateGrupoPayload = {
  nome?: string;
  /** `null` remove a foto; campo ausente mantém a atual. */
  imagemUrl?: string | null;
};

export type ConvitePendente = {
  id: number; // membroId
  grupoId: number;
  nomeGrupo: string | null;
  parentesco: string | null;
  convidadoPor: { id: number; nomeCompleto: string };
};

export function getCriador(grupo: GrupoFamiliar): MembroFamilia['usuario'] | null {
  return grupo.membros.find((m) => m.parentesco === 'Criador')?.usuario ?? null;
}

export function getCriadorNome(grupo: GrupoFamiliar): string | null {
  return getCriador(grupo)?.nomeCompleto ?? null;
}

export function countMembrosAtivos(grupo: GrupoFamiliar): number {
  return grupo.membros.filter((m) => m.status === 'aceito').length;
}

export const groupsService = {
  async getUserGroups(usuarioId: number): Promise<GrupoFamiliar[]> {
    const { data } = await api.get(`/api/familias/usuario/${usuarioId}`);
    return (data.data ?? []) as GrupoFamiliar[];
  },

  async getGroupDetail(grupoId: string | number): Promise<GrupoFamiliar> {
    const { data } = await api.get(`/api/familias/${grupoId}`);
    return data.data as GrupoFamiliar;
  },

  async respondInvite(membroId: number, status: 'aceito' | 'recusado'): Promise<void> {
    await api.patch(`/api/familias/convites/${membroId}/responder`, { status });
  },

  async listPendingInvites(): Promise<ConvitePendente[]> {
    const { data } = await api.get('/api/familias/convites/pendentes');
    return (data.data ?? []) as ConvitePendente[];
  },

  async createGroup(nome?: string, imagemUrl?: string | null): Promise<GrupoFamiliar> {
    const { data } = await api.post('/api/familias', {
      ...(nome ? { nome } : {}),
      ...(imagemUrl ? { imagemUrl } : {}),
    });
    return data.data as GrupoFamiliar;
  },

  async updateGroup(grupoId: number, payload: UpdateGrupoPayload): Promise<GrupoFamiliar> {
    const { data } = await api.patch(`/api/familias/${grupoId}`, payload);
    return data.data as GrupoFamiliar;
  },

  async inviteMember(
    grupoId: number,
    usuarioId: number,
    parentesco?: string,
  ): Promise<void> {
    await api.post(`/api/familias/${grupoId}/convidar`, {
      usuarioId,
      ...(parentesco ? { parentesco } : {}),
    });
  },

  /**
   * Remove um membro do grupo — serve tanto para sair quanto para o criador
   * tirar alguém. A rota existia no backend mas nunca tinha sido ligada aqui,
   * então não havia nenhuma forma de sair de um grupo pelo app.
   */
  async removeMember(grupoId: number, usuarioId: number): Promise<void> {
    await api.delete(`/api/familias/${grupoId}/membros/${usuarioId}`);
  },
};
