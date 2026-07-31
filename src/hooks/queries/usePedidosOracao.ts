import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { prayerService } from '../../services/prayer.service';

export const oracaoKeys = {
  all: ['pedidos-oracao'] as const,
  lista: (page: number) => ['pedidos-oracao', 'lista', page] as const,
};

export function usePedidosOracao(page = 1) {
  return useQuery({
    queryKey: oracaoKeys.lista(page),
    queryFn: () => prayerService.list(page),
  });
}

function useInvalidarPedidos() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: oracaoKeys.all, refetchType: 'all' });
}

export function useCriarPedido() {
  const invalidar = useInvalidarPedidos();
  return useMutation({
    mutationFn: (descricaoPedido: string) => prayerService.create(descricaoPedido),
    onSuccess: invalidar,
  });
}

export function useExcluirPedido() {
  const invalidar = useInvalidarPedidos();
  return useMutation({
    mutationFn: (id: number) => prayerService.delete(id),
    onSuccess: invalidar,
  });
}
