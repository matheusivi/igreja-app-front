import { api } from './api';

/**
 * Denunciar e bloquear no mural de oração.
 *
 * As duas coisas existem porque o mural é texto de uma pessoa lido por todas
 * as outras, e isso exige das lojas quatro garantias: filtrar, denunciar,
 * bloquear e ter contato publicado.
 *
 * Mas o motivo real é mais simples. Quem se sentiu exposto precisa de saída
 * imediata — e "procure um líder no domingo" não é saída imediata.
 */

/** A mesma lista fechada do servidor. Divergir aqui gera 400 sem explicação. */
export const MOTIVOS_DENUNCIA = [
  'Conteúdo ofensivo ou agressivo',
  'Exposição de terceiros sem consentimento',
  'Conteúdo sexual ou impróprio',
  'Golpe, propaganda ou spam',
  'Discurso de ódio',
  'Outro',
] as const;

export type MotivoDenuncia = (typeof MOTIVOS_DENUNCIA)[number];

export type PessoaBloqueada = {
  id: number;
  nomeCompleto: string;
  fotoUrl: string | null;
  bloqueadoEm: string;
};

/**
 * Uma denúncia na fila da liderança.
 *
 * `conteudo` vem nulo quando o pedido já foi apagado — pelo autor ou por outro
 * líder que agiu antes. Não é erro: é o desfecho mais comum de uma denúncia
 * bem resolvida, e a tela usa isso para oferecer só o arquivamento.
 */
export type Denuncia = {
  id: number;
  tipo: string;
  alvoId: number;
  motivo: string;
  criadaEm: string;
  denunciante: { id: number; nomeCompleto: string };
  conteudo: {
    id: number;
    descricaoPedido: string;
    dataEnvio: string;
    autor: { id: number; nomeCompleto: string; perfil: string };
  } | null;
};

export const moderacaoService = {
  async denunciarPedido(alvoId: number, motivo: MotivoDenuncia): Promise<void> {
    await api.post('/api/moderacao/denuncias', {
      tipo: 'pedido_oracao',
      alvoId,
      motivo,
    });
  },

  async bloquear(usuarioId: number): Promise<void> {
    await api.post('/api/moderacao/bloqueios', { usuarioId });
  },

  async desbloquear(usuarioId: number): Promise<void> {
    await api.delete(`/api/moderacao/bloqueios/${usuarioId}`);
  },

  async listarBloqueados(): Promise<PessoaBloqueada[]> {
    const { data } = await api.get('/api/moderacao/bloqueios');
    return data.data ?? [];
  },

  /** Só liderança. O servidor recusa com 403 para os demais. */
  async listarDenuncias(): Promise<{ data: Denuncia[]; total: number }> {
    const { data } = await api.get('/api/moderacao/denuncias');
    return { data: data.data ?? [], total: data.total ?? 0 };
  },

  async resolverDenuncia(id: number): Promise<void> {
    await api.patch(`/api/moderacao/denuncias/${id}/resolver`);
  },
};
