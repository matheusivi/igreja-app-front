import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../navigation/AuthContext';
import {
  reacaoOracaoService,
  type MapaReacoes,
  type TipoReacao,
} from '../../services/reacaoOracao.service';

export const reacoesOracaoKeys = {
  all: ['reacoes-oracao'] as const,
  doUsuario: (usuarioId: number) => ['reacoes-oracao', usuarioId] as const,
};

/**
 * Mesmo desenho do `useLeituras`: o armazenamento é local, mas passa pelo
 * TanStack Query. É isso que faz o botão mudar de estado na hora, sem contexto
 * próprio e sem recarregar a tela.
 */
export function useReacoesOracao(): MapaReacoes {
  const { user } = useAuth();

  const { data = {} } = useQuery({
    queryKey: reacoesOracaoKeys.doUsuario(user?.id ?? 0),
    queryFn: () => reacaoOracaoService.listar(user!.id),
    enabled: !!user,
    // Leitura de disco é instantânea e só muda quando a própria pessoa toca.
    staleTime: Infinity,
  });

  return data;
}

export function useAlternarReacao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ pedidoId, tipo }: { pedidoId: number; tipo: TipoReacao }) =>
      reacaoOracaoService.alternar(user!.id, pedidoId, tipo),
    // Grava o resultado direto no cache em vez de invalidar e reler o disco:
    // a resposta já é o mapa novo.
    onSuccess: (mapa) =>
      queryClient.setQueryData(reacoesOracaoKeys.doUsuario(user!.id), mapa),
  });
}
