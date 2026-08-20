import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../navigation/AuthContext';
import { leituraService } from '../../services/leitura.service';

export const leiturasKeys = {
  all: ['leituras'] as const,
  doUsuario: (usuarioId: number) => ['leituras', usuarioId] as const,
};

/**
 * Conteúdos já marcados como lidos pelo usuário logado.
 *
 * Passa pelo TanStack Query mesmo sendo armazenamento local: é o que faz o
 * check aparecer na lista no mesmo instante em que a pessoa marca no detalhe,
 * sem precisar de contexto próprio nem de recarregar a tela.
 *
 * A chave inclui o id do usuário para que trocar de conta no mesmo aparelho
 * troque também as marcações — sem isso, um veria as leituras do outro.
 */
export function useLeituras(): Set<number> {
  const { user } = useAuth();

  const { data = [] } = useQuery({
    queryKey: leiturasKeys.doUsuario(user?.id ?? 0),
    queryFn: () => leituraService.listar(user!.id),
    enabled: !!user,
    // Leitura de disco é instantânea e nunca fica velha por conta própria —
    // só muda quando a própria pessoa marca.
    staleTime: Infinity,
  });

  return new Set(data);
}

export function useAlternarLeitura() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (conteudoId: number) =>
      leituraService.alternar(user!.id, conteudoId),
    // Grava direto no cache com o resultado, em vez de invalidar e reler o
    // disco: a resposta já é a lista nova.
    onSuccess: (lista) =>
      queryClient.setQueryData(leiturasKeys.doUsuario(user!.id), lista),
  });
}
