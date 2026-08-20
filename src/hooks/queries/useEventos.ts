import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  eventsService,
  findNextEvento,
  type CreateEventoPayload,
  type EventosMes,
} from '../../services/events.service';

/**
 * Chaves de cache dos eventos.
 *
 * `meses()` é o prefixo de todos os meses. Ele existe porque não dá para
 * mirar um mês só: evento recorrente aparece em vários, e mudar a data move
 * o evento de um mês para outro — invalidar só a data nova deixaria um
 * fantasma no mês antigo.
 */
export const eventosKeys = {
  all: ['eventos'] as const,
  meses: () => ['eventos', 'mes'] as const,
  mes: (mes: number, ano: number) => ['eventos', 'mes', mes, ano] as const,
  proximo: () => ['eventos', 'proximo'] as const,
  detalhe: (id: string | number) => ['eventos', 'detalhe', String(id)] as const,
};

/**
 * Recarrega os meses e o card da Home.
 *
 * Sem `refetchType: 'all'` de propósito. Cada mês visitado vira uma entrada
 * separada no cache, e com 'all' criar um evento dispararia refetch de todos
 * os meses já abertos — um custo que cresce conforme a pessoa navega. No
 * padrão, só o que está montado recarrega na hora; os demais ficam marcados
 * como velhos e se atualizam ao serem abertos.
 */
function invalidarAgenda(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: eventosKeys.meses() }),
    queryClient.invalidateQueries({ queryKey: eventosKeys.proximo() }),
  ]);
}

/** Eventos de um mês específico (tela de Eventos). */
export function useEventosMes(mes: number, ano: number) {
  return useQuery({
    queryKey: eventosKeys.mes(mes, ano),
    queryFn: () => eventsService.fetchMes(mes, ano),
    // Mantém o mês anterior na tela enquanto o novo carrega, em vez de
    // piscar uma tela vazia ao trocar de mês.
    placeholderData: (previous) => previous,
  });
}

/** Próximo evento da agenda (card de destaque da Home). */
export function useProximoEvento() {
  return useQuery({
    queryKey: eventosKeys.proximo(),
    queryFn: async () => {
      const meses: EventosMes[] = await eventsService.fetchMesAtualEProximo(new Date());
      return findNextEvento(meses);
    },
  });
}

/** Detalhe de um evento. */
export function useEvento(id: string) {
  return useQuery({
    queryKey: eventosKeys.detalhe(id),
    queryFn: () => eventsService.getEvento(id),
    enabled: !!id,
  });
}

/** Criar evento: aparece na agenda e pode virar o próximo da Home. */
export function useCreateEvento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEventoPayload) => eventsService.createEvento(payload),
    onSuccess: () => invalidarAgenda(queryClient),
  });
}

/**
 * Editar evento. Além da agenda, o detalhe daquele evento muda — é a tela de
 * onde a edição costuma partir.
 */
export function useUpdateEvento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateEventoPayload> }) =>
      eventsService.updateEvento(id, payload),
    onSuccess: (_data, { id }) =>
      Promise.all([
        invalidarAgenda(queryClient),
        queryClient.invalidateQueries({ queryKey: eventosKeys.detalhe(id) }),
      ]),
  });
}

/**
 * Excluir evento. O detalhe é REMOVIDO do cache, não invalidado: buscar de
 * novo um evento que acabou de deixar de existir seria um GET certo a 404.
 */
export function useDeleteEvento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eventsService.deleteEvento(id),
    onSuccess: async (_data, id) => {
      queryClient.removeQueries({ queryKey: eventosKeys.detalhe(id) });
      await invalidarAgenda(queryClient);
    },
  });
}
