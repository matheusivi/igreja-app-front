import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  contentService,
  type Conteudo,
  type CreateConteudoPayload,
} from '../../services/content.service';

type ListaParams = {
  tipo?: Conteudo['tipo'];
  limit?: number;
  orderBy?: 'recent' | 'oldest';
  incluirVencidos?: boolean;
};

/**
 * Chaves do cache de conteúdos (devocionais, estudos e avisos).
 *
 * A chave da lista carrega os filtros: a tela de Devocionais busca duas listas
 * ao mesmo tempo (Devocional e Estudo) e a Home busca os Avisos. Sem isso as
 * três dividiriam a mesma entrada e uma sobrescreveria a outra.
 */
export const conteudosKeys = {
  all: ['conteudos'] as const,
  listas: () => ['conteudos', 'lista'] as const,
  lista: ({
    tipo,
    limit = 20,
    orderBy = 'recent',
    incluirVencidos = false,
  }: ListaParams = {}) =>
    ['conteudos', 'lista', tipo ?? 'todos', limit, orderBy, incluirVencidos] as const,
  detalhe: (id: string | number) => ['conteudos', 'detalhe', String(id)] as const,
};

/**
 * Uma quantidade FIXA de conteúdos, sem rolagem.
 *
 * É o que a Home usa para pedir três avisos. Continua existindo ao lado do
 * hook infinito porque são necessidades diferentes: um bloco de destaque quer
 * três itens e pronto; uma tela de lista quer tudo, aos poucos.
 */
export function useConteudos(params: ListaParams = {}) {
  return useQuery({
    queryKey: conteudosKeys.lista(params),
    queryFn: () => contentService.list(params),
  });
}

/** Quantos itens por rolagem nas telas de lista. */
const POR_PAGINA = 15;

/**
 * A lista completa, 15 em 15.
 *
 * ═══ O QUE ESTAVA ERRADO ═══
 * A tela de Avisos pedia `limit: 50` e nenhuma página. Passando de 50 avisos,
 * os mais antigos não apareciam de jeito nenhum — e o servidor agora recusa
 * limites acima de 50, então nem aumentar o número resolveria.
 *
 * ═══ POR QUE A CHAVE PRECISA DIZER "INFINITA" ═══
 * `useQuery` e `useInfiniteQuery` guardam formatos DIFERENTES na mesma
 * estrutura: um array de itens contra um objeto de páginas. Dividindo a
 * chave, o primeiro a responder faria o outro quebrar ao ler o formato
 * errado — e o erro apareceria longe daqui.
 */
export function useConteudosInfinitos(params: ListaParams = {}) {
  const query = useInfiniteQuery({
    queryKey: [...conteudosKeys.lista(params), 'infinita'] as const,
    queryFn: ({ pageParam }) =>
      contentService.listPagina({ ...params, limit: POR_PAGINA, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (ultima) =>
      ultima.page < ultima.totalPages ? ultima.page + 1 : undefined,
  });

  const conteudos: Conteudo[] = query.data?.pages.flatMap((p) => p.data) ?? [];

  return {
    conteudos,
    total: query.data?.pages[0]?.total ?? 0,
    isPending: query.isPending,
    isFetching: query.isFetching,
    error: query.error,
    carregandoMais: query.isFetchingNextPage,
    temMais: query.hasNextPage,
    carregarMais: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
    },
    refetch: query.refetch,
  };
}

export function useConteudo(id: string | undefined) {
  return useQuery({
    queryKey: conteudosKeys.detalhe(id ?? ''),
    queryFn: () => contentService.get(id!),
    enabled: !!id,
  });
}

function useInvalidar() {
  const queryClient = useQueryClient();
  return (chaves: readonly unknown[][]) =>
    Promise.all(
      chaves.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );
}

/**
 * Criar conteúdo.
 *
 * Invalida o prefixo de todas as listas porque o item novo pode entrar em
 * qualquer uma — um Aviso aparece na Home, um Devocional na tela de
 * Devocionais — e a mutação não decide onde a pessoa está olhando.
 */
export function useCriarConteudo() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (payload: CreateConteudoPayload) => contentService.create(payload),
    onSuccess: () => invalidar([conteudosKeys.listas()]),
  });
}

/** Editar conteúdo: muda o detalhe e o card nas listas (título, capa). */
export function useAtualizarConteudo() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<CreateConteudoPayload>;
    }) => contentService.update(id, payload),
    onSuccess: (_data, { id }) =>
      invalidar([conteudosKeys.listas(), conteudosKeys.detalhe(id)]),
  });
}

/**
 * Excluir conteúdo. O detalhe é removido do cache em vez de invalidado —
 * recarregar buscaria algo que acabou de deixar de existir.
 */
export function useExcluirConteudo() {
  const queryClient = useQueryClient();
  const invalidar = useInvalidar();

  return useMutation({
    mutationFn: (id: number) => contentService.remove(id),
    onSuccess: async (_data, id) => {
      queryClient.removeQueries({ queryKey: conteudosKeys.detalhe(id) });
      await invalidar([conteudosKeys.listas()]);
    },
  });
}
