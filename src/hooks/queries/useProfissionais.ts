import { useInfiniteQuery } from '@tanstack/react-query';
import { usersService, type Profissional } from '../../services/users.service';
import { useDebounce } from './useBuscaMembros';

/**
 * O diretório profissional, em páginas que vão chegando conforme se rola.
 *
 * ═══ POR QUE ROLAGEM INFINITA, E NÃO "CARREGAR MAIS" ═══
 * Um botão no fim da lista exige uma decisão a cada 15 itens, e quem está
 * procurando um prestador não quer decidir — quer varrer. `useInfiniteQuery`
 * busca a próxima página quando o fim se aproxima, e a rolagem não para.
 *
 * ═══ PÁGINAS DE 15 ═══
 * Cada item traz foto. Numa igreja em 4G, uma página grande atrasa o primeiro
 * resultado — e o primeiro resultado é o que decide se a pessoa fica. Vale
 * mais chegar rápido e continuar chegando.
 *
 * ═══ O TERMO ENTRA NA CHAVE ═══
 * Trocar a busca reinicia a paginação sozinho, porque é outra chave de cache.
 * Se o termo ficasse fora, a página 2 de "pedreiro" seria emendada nos
 * resultados de "eletricista" — o clássico da lista que embaralha ao filtrar.
 */

const POR_PAGINA = 15;

export const profissionaisKeys = {
  todos: ['profissionais'] as const,
  busca: (termo: string) => [...profissionaisKeys.todos, termo] as const,
};

export function useProfissionais(busca: string) {
  const termo = useDebounce(busca).trim();
  // Diferente da busca de membros: sem termo, LISTA TUDO. Aqui a lista é o
  // conteúdo da tela — é uma vitrine, não o resultado de uma pergunta.
  const habilitada = termo.length === 0 || termo.length >= 2;

  const query = useInfiniteQuery({
    queryKey: profissionaisKeys.busca(termo),
    queryFn: ({ pageParam }) =>
      usersService.listarProfissionais(termo || undefined, pageParam, POR_PAGINA),
    initialPageParam: 1,
    getNextPageParam: (ultima) =>
      // `undefined` é o sinal de fim: sem isso a lista pediria a página 4 de 3
      // para sempre, uma requisição por rolagem até o fim do mundo.
      ultima.page < ultima.totalPages ? ultima.page + 1 : undefined,
    enabled: habilitada,
    staleTime: 60_000,
  });

  const profissionais: Profissional[] =
    query.data?.pages.flatMap((p) => p.data) ?? [];

  return {
    profissionais,
    total: query.data?.pages[0]?.total ?? 0,
    carregando: query.isPending && habilitada,
    carregandoMais: query.isFetchingNextPage,
    temMais: query.hasNextPage,
    carregarMais: () => {
      // A guarda importa: o evento de fim de lista dispara várias vezes
      // durante a mesma rolagem, e sem ela sairiam três requisições da mesma
      // página — o TanStack deduplica, mas a intenção fica ilegível no código.
      if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
    },
    erro: query.error,
    termoCurto: busca.trim().length > 0 && !habilitada,
  };
}
