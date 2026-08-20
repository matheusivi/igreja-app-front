import { api } from './api';

/**
 * Formato REAL devolvido pelo backend.
 *
 * Antes este tipo inventava campos que não existem (`usuarioId`, `autorNome`,
 * `createdAt`). Como TypeScript não valida resposta de rede, tudo compilava —
 * mas em execução esses campos vinham `undefined`, e o resultado era: todo
 * mundo aparecendo como "Anônimo", tempo quebrado e o filtro "Meus pedidos"
 * sempre vazio.
 */
export type PedidoOracao = {
  id: number;
  descricaoPedido: string;
  dataEnvio: string;
  visibilidade: string;
  autor: {
    id: number;
    nomeCompleto: string;
    perfil: string;
    fotoUrl?: string | null;
  };
};

/** "há 5 min", "há 2 horas", "ontem", "há 3 dias". */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return '';

  const diff = Date.now() - time;
  if (diff < 60_000) return 'agora mesmo';

  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `há ${mins} ${mins === 1 ? 'minuto' : 'minutos'}`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;

  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/** Iniciais para o avatar: "João da Silva" → "JS". */
export function getIniciais(nome: string | null | undefined): string {
  const limpo = (nome ?? '').trim();
  if (!limpo) return '?';
  const partes = limpo.split(/\s+/).filter((p) => p.length > 2 || partesCurtasPermitidas(p));
  const base = partes.length > 0 ? partes : limpo.split(/\s+/);
  const iniciais = base.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '');
  return iniciais.join('') || '?';
}

// Ignora conectivos ("de", "da", "dos") na hora de montar as iniciais.
function partesCurtasPermitidas(parte: string): boolean {
  return !['de', 'da', 'do', 'das', 'dos', 'e'].includes(parte.toLowerCase());
}

export type PaginaPedidos = {
  data: PedidoOracao[];
  total: number;
  page: number;
  totalPages: number;
};

export const prayerService = {
  /**
   * Uma página do mural.
   *
   * ═══ POR QUE DEVOLVE A PÁGINA INTEIRA, E NÃO SÓ A LISTA ═══
   * Antes era `return data.data` — o `total` e o `totalPages` que o servidor
   * manda iam para o lixo. Sem eles a rolagem infinita não tem como saber
   * quando parar, e ficaria pedindo a página 4 de 3 para sempre.
   *
   * ═══ `apenasMeus` É BOOLEANO, NÃO UM ID ═══
   * Quem decide de quem são os pedidos é o servidor, pelo token. O app diz
   * apenas SE quer filtrar — mandar um id daqui deixaria qualquer pessoa
   * listar os pedidos de outra trocando um número.
   */
  async list(
    page = 1,
    apenasMeus = false,
    limit = 15,
  ): Promise<PaginaPedidos> {
    const { data } = await api.get('/api/pedido-oracao', {
      params: { page, limit, ...(apenasMeus ? { apenasMeus: 'true' } : {}) },
    });

    return {
      data: (data.data ?? []) as PedidoOracao[],
      total: data.total ?? 0,
      page: data.page ?? page,
      totalPages: data.totalPages ?? 1,
    };
  },

  async create(descricaoPedido: string): Promise<PedidoOracao> {
    const { data } = await api.post('/api/pedido-oracao', { descricaoPedido });
    return data.data as PedidoOracao;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/pedido-oracao/${id}`);
  },
};
