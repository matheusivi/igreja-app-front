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
    /** Só para escrever "Filha" em vez de "Filho". Opcional: servidor antigo não manda. */
    sexo?: string | null;
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

/**
 * ═══ PAPÉIS NA FAMÍLIA ═══
 * A chave é neutra e a palavra exibida vem do sexo cadastrado. Guardar
 * "Filho" e "Filha" como valores diferentes dobraria a lista e deixaria o
 * dado errado no dia em que alguém escolhesse o item errado do seletor.
 *
 * `pai` e `mae` são a exceção: ficam explícitos em vez de derivados. É o
 * vínculo que sustenta saber quem responde por uma criança, e não pode
 * depender de um campo de cadastro preenchido pensando em outra coisa.
 */
export const PAPEIS_FAMILIA = [
  'pai',
  'mae',
  'conjuge',
  'filho',
  'irmao',
  'avo',
  'neto',
  'tio',
  'sobrinho',
  'outro',
] as const;

export type PapelFamilia = (typeof PAPEIS_FAMILIA)[number];

const ROTULOS: Record<PapelFamilia, { m: string; f: string }> = {
  pai: { m: 'Pai', f: 'Pai' },
  mae: { m: 'Mãe', f: 'Mãe' },
  conjuge: { m: 'Cônjuge', f: 'Cônjuge' },
  filho: { m: 'Filho', f: 'Filha' },
  irmao: { m: 'Irmão', f: 'Irmã' },
  avo: { m: 'Avô', f: 'Avó' },
  neto: { m: 'Neto', f: 'Neta' },
  tio: { m: 'Tio', f: 'Tia' },
  sobrinho: { m: 'Sobrinho', f: 'Sobrinha' },
  outro: { m: 'Outro', f: 'Outra' },
};

/**
 * O papel escrito com a palavra certa.
 *
 * Sem o sexo cadastrado cai no masculino — não por padrão ideológico, mas
 * porque é a forma não marcada do português e a única escolha possível sem
 * o dado. Em português a concordância errada salta aos olhos: "Filho: Maria"
 * é o tipo de detalhe que faz o sistema inteiro parecer descuidado.
 */
export function rotuloPapel(
  papel: string | null | undefined,
  sexo?: string | null,
): string | null {
  if (!papel) return null;
  const par = ROTULOS[papel as PapelFamilia];
  // Papel desconhecido (texto antigo que a migração não converteu) volta como
  // veio, em vez de sumir da tela sem explicação.
  if (!par) return papel;
  return sexo === 'Feminino' ? par.f : par.m;
}

/**
 * Quem abriu o grupo — pela coluna, não por uma string no campo de papel.
 *
 * Antes isto procurava `parentesco === 'Criador'`: o mesmo campo que o
 * usuário preenche guardava também um valor de sistema. Bastava alguém ser
 * convidado com o parentesco "Criador" para aparecer como dono do grupo.
 * `criadorUsuarioId` sempre existiu e é a resposta correta.
 */
export function getCriador(grupo: GrupoFamiliar): MembroFamilia['usuario'] | null {
  return (
    grupo.membros.find((m) => m.usuario.id === grupo.criadorUsuarioId)?.usuario ?? null
  );
}

export function getCriadorNome(grupo: GrupoFamiliar): string | null {
  return getCriador(grupo)?.nomeCompleto ?? null;
}

export function countMembrosAtivos(grupo: GrupoFamiliar): number {
  return grupo.membros.filter((m) => m.status === 'aceito').length;
}

export type PaginaFamilias = {
  data: GrupoFamiliar[];
  total: number;
  page: number;
  totalPages: number;
};

export const groupsService = {
  /**
   * Todas as famílias da igreja, com busca.
   *
   * O termo casa com o nome da FAMÍLIA ou com o nome de qualquer integrante —
   * é o que faz digitar "Maria" devolver a casa da Maria, mesmo que a família
   * se chame "Os Guerreiros".
   */
  /**
   * Uma página de famílias.
   *
   * Pedia 50 de uma vez e descartava `total` e `totalPages`. Passando de 50
   * famílias, as demais simplesmente não existiam para o app — não havia
   * rolagem nem botão que as alcançasse.
   */
  async listGroups(
    busca?: string,
    page = 1,
    limit = 15,
  ): Promise<PaginaFamilias> {
    const { data } = await api.get('/api/familias', {
      params: { ...(busca ? { busca } : {}), page, limit },
    });

    return {
      data: (data.data ?? []) as GrupoFamiliar[],
      total: data.total ?? 0,
      page: data.page ?? page,
      totalPages: data.totalPages ?? 1,
    };
  },

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
  /**
   * Define ou corrige o papel de um integrante.
   *
   * `null` limpa o papel. Sem essa distinção, corrigir um erro exigiria
   * remover a pessoa do grupo e convidá-la de novo — que era exatamente a
   * situação antes deste endpoint existir.
   */
  async updatePapel(
    grupoId: number,
    usuarioId: number,
    parentesco: PapelFamilia | null,
  ): Promise<void> {
    await api.patch(`/api/familias/${grupoId}/membros/${usuarioId}/papel`, {
      parentesco,
    });
  },

  async removeMember(grupoId: number, usuarioId: number): Promise<void> {
    await api.delete(`/api/familias/${grupoId}/membros/${usuarioId}`);
  },
};
