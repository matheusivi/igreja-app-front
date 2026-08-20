import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { prayerService, type PedidoOracao } from '../../services/prayer.service';

/** Quantos pedidos por rolagem. */
const POR_PAGINA = 15;

export const oracaoKeys = {
  all: ['pedidos-oracao'] as const,
  /**
   * A chave carrega o FILTRO, não a página.
   *
   * Com rolagem infinita, todas as páginas de um mesmo filtro vivem sob a
   * mesma chave — é o `useInfiniteQuery` que as empilha. Guardar a página na
   * chave, como era antes, criaria uma entrada de cache por página e a lista
   * nunca se juntaria.
   *
   * "Geral" e "Meus pedidos" são consultas DIFERENTES ao servidor, então
   * precisam de chaves diferentes; senão trocar de aba mostraria a lista da
   * outra até a resposta chegar.
   */
  lista: (apenasMeus: boolean) =>
    ['pedidos-oracao', 'lista', apenasMeus ? 'meus' : 'geral'] as const,
};

/**
 * O mural, 15 em 15.
 *
 * ═══ O QUE ESTAVA ERRADO ═══
 * O app pedia a página 1 e NUNCA a 2. Passando de 20 pedidos, os mais antigos
 * não apareciam de jeito nenhum — não era lentidão, era conteúdo inacessível,
 * e ninguém percebia porque a igreja ainda é pequena.
 *
 * ═══ POR QUE "MEUS PEDIDOS" VAI AO SERVIDOR ═══
 * Antes a tela filtrava na memória, sobre o que tinha sido carregado. Com
 * paginação isso quebra: a primeira página traz os 15 mais recentes de TODO
 * MUNDO, então quem tem pedidos antigos veria a própria aba vazia.
 *
 * Já a divisão "recentes / anteriores" continua na tela — ali a paginação
 * resolve sozinha, porque a lista vem ordenada do mais novo para o mais
 * velho: as primeiras páginas são recentes, as seguintes são anteriores.
 */
export function usePedidosOracao(apenasMeus = false) {
  const query = useInfiniteQuery({
    queryKey: oracaoKeys.lista(apenasMeus),
    queryFn: ({ pageParam }) =>
      prayerService.list(pageParam, apenasMeus, POR_PAGINA),
    initialPageParam: 1,
    // `undefined` é o sinal de fim. Sem ele a lista pediria a página 4 de 3
    // para sempre, uma requisição por rolagem.
    getNextPageParam: (ultima) =>
      ultima.page < ultima.totalPages ? ultima.page + 1 : undefined,
  });

  const pedidos: PedidoOracao[] = query.data?.pages.flatMap((p) => p.data) ?? [];

  return {
    pedidos,
    /** O total REAL no servidor, não o que já foi carregado. */
    total: query.data?.pages[0]?.total ?? 0,
    isPending: query.isPending,
    isFetching: query.isFetching,
    error: query.error,
    carregandoMais: query.isFetchingNextPage,
    temMais: query.hasNextPage,
    carregarMais: () => {
      // A guarda importa: o evento de fim de lista dispara várias vezes
      // durante a mesma rolagem, e sem isso viriam três páginas de uma vez.
      if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
    },
    refetch: query.refetch,
  };
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
