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
 * Tudo aninhado sob `['eventos']` de propósito: invalidar essa raiz atualiza
 * de uma vez a lista do mês, o card da Home e qualquer tela futura que use
 * eventos — sem precisar lembrar de cada uma.
 */
export const eventosKeys = {
  all: ['eventos'] as const,
  mes: (mes: number, ano: number) => ['eventos', 'mes', mes, ano] as const,
  proximo: () => ['eventos', 'proximo'] as const,
  detalhe: (id: string | number) => ['eventos', 'detalhe', String(id)] as const,
};

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

export function useCreateEvento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEventoPayload) => eventsService.createEvento(payload),
    onSuccess: () => {
      // Uma linha: lista do mês e card da Home se atualizam sozinhos.
      // refetchType 'all' força a rebuscar também as telas que estão montadas
      // mas fora de foco (a Home vive numa aba, atrás da tela de eventos).
      queryClient.invalidateQueries({ queryKey: eventosKeys.all, refetchType: 'all' });
    },
  });
}

export function useUpdateEvento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateEventoPayload> }) =>
      eventsService.updateEvento(id, payload),
    onSuccess: () => {
      // refetchType 'all' força a rebuscar também as telas que estão montadas
      // mas fora de foco (a Home vive numa aba, atrás da tela de eventos).
      queryClient.invalidateQueries({ queryKey: eventosKeys.all, refetchType: 'all' });
    },
  });
}

export function useDeleteEvento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eventsService.deleteEvento(id),
    onSuccess: () => {
      // refetchType 'all' força a rebuscar também as telas que estão montadas
      // mas fora de foco (a Home vive numa aba, atrás da tela de eventos).
      queryClient.invalidateQueries({ queryKey: eventosKeys.all, refetchType: 'all' });
    },
  });
}
