import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  configuracaoService,
  type ConfiguracaoIgreja,
} from '../../services/configuracao.service';

/**
 * A configuração da igreja — capa e versículo do topo da Home.
 *
 * ═══ `staleTime` LONGO ═══
 * Isto muda algumas vezes por ano, e é lido a cada abertura da Home. Buscar
 * do servidor toda vez seria uma requisição por visita para um dado que quase
 * nunca difere. Trinta minutos é o meio-termo: a igreja troca a capa e todo
 * mundo vê no mesmo dia, sem custo diário.
 *
 * Quem acabou de salvar não espera nada — a mutação escreve o resultado
 * direto no cache.
 */
export const configuracaoKeys = {
  atual: ['configuracao'] as const,
};

export function useConfiguracao() {
  return useQuery({
    queryKey: configuracaoKeys.atual,
    queryFn: () => configuracaoService.obter(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useSalvarConfiguracao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<ConfiguracaoIgreja>) =>
      configuracaoService.atualizar(payload),
    // `setQueryData` e não `invalidate`: o servidor já devolveu o estado
    // final. Invalidar pediria de novo a mesma coisa que acabou de chegar.
    onSuccess: (data) => queryClient.setQueryData(configuracaoKeys.atual, data),
  });
}
