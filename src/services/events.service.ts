import { api } from './api';

export type EventoTipo = 'Culto' | 'Reunião' | 'Retiro' | 'Conferência' | 'Outro';

export type EventoItem = {
  id: number;
  titulo: string;
  tipo: EventoTipo;
  cor: string | null;
  dataInicio: string;
  dataFim: string | null;
  local: string | null;
  descricao: string | null;
  recorrencia: 'nenhuma' | 'semanal' | 'mensal';
  criadorId: number;
  /**
   * Marca o evento como destaque da Home (escolhido pela liderança).
   * Opcional porque o backend ainda pode não enviar o campo — enquanto não
   * enviar, a Home cai no comportamento automático (próximo evento da agenda).
   */
  destaqueHome?: boolean;
  /** Capa do evento no Cloudinary. Null quando a liderança não escolheu uma. */
  imagemUrl?: string | null;
};

export type EventoDia = {
  dia: number;
  eventos: EventoItem[];
};

export type EventosMes = {
  mes: number;
  ano: number;
  data: EventoDia[];
};

export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}

export function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/** Rótulo do card de destaque na Home, conforme o tipo do evento. */
export function labelForTipo(tipo: EventoTipo): string {
  switch (tipo) {
    case 'Culto':
      return 'Próximo culto';
    case 'Reunião':
      return 'Próxima reunião';
    case 'Retiro':
      return 'Próximo retiro';
    case 'Conferência':
      return 'Próxima conferência';
    default:
      return 'Próximo evento';
  }
}

/**
 * Acha o evento que vai no card de destaque da Home.
 *
 * Regras, nesta ordem:
 * 1. Se a liderança marcou algum evento futuro como `destaqueHome`, ele ganha
 *    (o mais próximo, caso haja mais de um marcado).
 * 2. Senão, o próximo evento da agenda, de qualquer tipo.
 *
 * Aceita vários meses porque olhar só o mês corrente falha no fim do mês:
 * dia 30, com culto marcado pro dia 2, retornaria "nada" — o bug antigo.
 * Também não confia na ordem que a API devolve: ordena por data.
 */
export function findNextEvento(meses: EventosMes[]): EventoItem | null {
  const now = Date.now();

  const futuros = meses
    .flatMap((mes) => (mes.data ?? []).flatMap(({ eventos }) => eventos ?? []))
    .filter((evento) => new Date(evento.dataInicio).getTime() > now)
    .sort(
      (a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime(),
    );

  return futuros.find((evento) => evento.destaqueHome) ?? futuros[0] ?? null;
}

export function calcCountdown(
  iso: string,
): { dias: string; horas: string; mins: string; segs: string } | null {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    dias: String(Math.floor(diff / 86400000)).padStart(2, '0'),
    horas: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0'),
    mins: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
    segs: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
  };
}

export type CreateEventoPayload = {
  titulo: string;
  dataInicio: string;
  tipo: EventoTipo;
  descricao?: string;
  local?: string;
  dataFim?: string;
  cor?: string;
  recorrencia: 'nenhuma' | 'semanal' | 'mensal';
  diaSemana?: number;
  diaDoMes?: number;
  dataFimRecorrencia?: string;
  destaqueHome?: boolean;
  /** `null` remove a capa; campo ausente mantém a atual. */
  imagemUrl?: string | null;
};

export type EventoDetalhe = EventoItem & {
  diaSemana: number | null;
  diaDoMes: number | null;
  dataFimRecorrencia: string | null;
  criador?: { id: number; nomeCompleto: string; perfil: string };
};

export const eventsService = {
  async fetchMes(mes: number, ano: number): Promise<EventosMes> {
    const { data } = await api.get('/api/eventos', { params: { mes, ano } });
    // Atenção: este endpoint NÃO aninha o payload em `data.data` como os outros.
    // O controller responde { success, mes, ano, data: [ {dia, eventos} ] },
    // ou seja, `data.data` já é a lista de dias — não o objeto EventosMes.
    return {
      mes: data.mes ?? mes,
      ano: data.ano ?? ano,
      data: data.data ?? [],
    };
  },

  /**
   * Busca o mês corrente e o seguinte — necessário para o card da Home não
   * ficar vazio no fim do mês. Se um dos dois falhar, devolve o que deu certo.
   */
  async fetchMesAtualEProximo(reference = new Date()): Promise<EventosMes[]> {
    const atual = { mes: reference.getMonth() + 1, ano: reference.getFullYear() };
    const proximoDate = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);
    const proximo = { mes: proximoDate.getMonth() + 1, ano: proximoDate.getFullYear() };

    const results = await Promise.allSettled([
      this.fetchMes(atual.mes, atual.ano),
      this.fetchMes(proximo.mes, proximo.ano),
    ]);

    return results
      .filter((r): r is PromiseFulfilledResult<EventosMes> => r.status === 'fulfilled')
      .map((r) => r.value);
  },

  async createEvento(payload: CreateEventoPayload): Promise<EventoItem> {
    const { data } = await api.post('/api/eventos', payload);
    return data.data as EventoItem;
  },

  async updateEvento(id: number, payload: Partial<CreateEventoPayload>): Promise<EventoItem> {
    const { data } = await api.put(`/api/eventos/${id}`, payload);
    return data.data as EventoItem;
  },

  async getEvento(id: string | number): Promise<EventoDetalhe> {
    const { data } = await api.get(`/api/eventos/${id}`);
    return data.data as EventoDetalhe;
  },

  async deleteEvento(id: number): Promise<void> {
    await api.delete(`/api/eventos/${id}`);
  },
};
