import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { planoLeituraService } from '../../services/planoLeitura.service';

export const planoLeituraKeys = {
  todos: ['plano-leitura'] as const,
  ano: (ano: number) => ['plano-leitura', ano] as const,
};

/**
 * Os dias que a pessoa já marcou, como `Set` para consulta imediata.
 *
 * ═══ POR QUE `Set` E NÃO ARRAY ═══
 * A tela pergunta "este dia está lido?" uma vez por linha, 31 vezes por mês,
 * a cada toque em qualquer dia. Com array isso é uma varredura por pergunta;
 * com `Set`, é direto. Numa lista pequena a diferença some, mas a conversão
 * custa uma linha e o código fica dizendo o que quer: pertencimento.
 *
 * ═══ `staleTime` DE 5 MINUTOS ═══
 * Só a própria pessoa muda isto, e as mutações já escrevem no cache. Buscar
 * de novo a cada visita seria uma requisição para confirmar o que o app
 * acabou de fazer.
 */
export function useProgressoLeitura(ano: number) {
  const query = useQuery({
    queryKey: planoLeituraKeys.ano(ano),
    queryFn: () => planoLeituraService.listarDoAno(ano),
    staleTime: 5 * 60 * 1000,
  });

  return {
    concluidos: new Set(query.data ?? []),
    carregando: query.isPending,
    erro: query.error,
  };
}

/**
 * Marca ou desmarca um dia, pintando a tela ANTES da resposta.
 *
 * ═══ POR QUE OTIMISTA AQUI ═══
 * Marcar a leitura é a ação mais repetida do app e a de menor consequência:
 * se falhar, o pior caso é um quadradinho que volta ao estado anterior.
 *
 * Esperar o servidor para pintar o visto criaria meio segundo de "não
 * aconteceu nada" no 4G da igreja — e nesse intervalo a pessoa toca de novo,
 * o que com uma rota que ALTERNA desfaria a marcação. É por isso que o
 * servidor recebe o resultado desejado (`PUT`/`DELETE`), não um alternador.
 *
 * ═══ AS QUATRO ETAPAS ═══
 * `onMutate` cancela buscas em voo (senão uma resposta antiga chega depois e
 * sobrescreve o otimismo), guarda o estado anterior e aplica a mudança.
 * `onError` devolve o estado guardado. `onSettled` confere com o servidor.
 */
export function useMarcarLeitura(ano: number) {
  const queryClient = useQueryClient();
  const chave = planoLeituraKeys.ano(ano);

  return useMutation({
    mutationFn: ({ dia, concluido }: { dia: string; concluido: boolean }) =>
      planoLeituraService.definir(dia, concluido),

    onMutate: async ({ dia, concluido }) => {
      await queryClient.cancelQueries({ queryKey: chave });
      const anterior = queryClient.getQueryData<string[]>(chave) ?? [];

      queryClient.setQueryData<string[]>(
        chave,
        concluido
          ? [...anterior.filter((d) => d !== dia), dia].sort()
          : anterior.filter((d) => d !== dia),
      );

      return { anterior };
    },

    onError: (_erro, _variaveis, contexto) => {
      if (contexto) queryClient.setQueryData(chave, contexto.anterior);
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: chave }),
  });
}
