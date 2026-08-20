import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useDebounce } from './useBuscaMembros';
import {
  groupsService,
  type PapelFamilia,
  type UpdateGrupoPayload,
} from '../../services/groups.service';

export const gruposKeys = {
  all: ['grupos'] as const,
  /**
   * Prefixo de "grupos de uma pessoa". Usado nas invalidações porque a
   * mutação nem sempre sabe de quem é a lista afetada — e, na prática, só a
   * do usuário logado está em cache.
   */
  doUsuarios: () => ['grupos', 'usuario'] as const,
  doUsuario: (usuarioId: number) => ['grupos', 'usuario', usuarioId] as const,
  detalhes: () => ['grupos', 'detalhe'] as const,
  detalhe: (id: string | number) => ['grupos', 'detalhe', String(id)] as const,
  convites: () => ['grupos', 'convites'] as const,
  /**
   * Prefixo da lista geral de famílias — TODOS os termos de busca de uma vez.
   *
   * ═══ POR QUE PRECISA SER UM PREFIXO ═══
   * Cada termo digitado vira uma entrada própria em cache: `['grupos',
   * 'lista', '']`, `['grupos', 'lista', 'silva']`, e assim por diante. Trocar
   * a foto de uma família suja todas elas ao mesmo tempo, e a mutação não tem
   * como saber quais o usuário visitou.
   *
   * Invalidar pelo prefixo resolve sem adivinhação: as entradas visíveis
   * recarregam na hora, as demais ficam marcadas e recarregam quando forem
   * abertas de novo.
   */
  listas: () => ['grupos', 'lista'] as const,
  /** Lista geral de famílias, por termo de busca ('' = todas). */
  lista: (busca: string) => ['grupos', 'lista', busca] as const,
};

export function useMeusGrupos(usuarioId: number | undefined) {
  return useQuery({
    queryKey: gruposKeys.doUsuario(usuarioId ?? 0),
    queryFn: () => groupsService.getUserGroups(usuarioId!),
    enabled: !!usuarioId,
  });
}

/**
 * Todas as famílias da igreja, com busca por nome de pessoa ou de família.
 *
 * O debounce e o mínimo de caracteres vêm de `useBuscaMembros` — mesma
 * mecânica, mesma espera. Duas buscas no app com tempos diferentes fariam a
 * mesma digitação parecer mais lenta numa tela que na outra.
 *
 * Diferença importante em relação à busca do Perfil: **sem termo, esta lista
 * a igreja inteira**. Na aba Grupos a lista de famílias é o conteúdo da tela,
 * não o resultado de uma pergunta — começar vazia deixaria a página em branco
 * de novo, que é o problema que ela veio resolver.
 */
/** Quantas famílias por rolagem. */
const POR_PAGINA = 15;

export function useFamilias(busca: string) {
  const termo = useDebounce(busca).trim();
  const habilitada = termo.length === 0 || termo.length >= 2;

  /**
   * ═══ 15 EM 15, EM VEZ DE 50 DE UMA VEZ ═══
   * Pedia `listGroups(termo, 1, 50)` — página fixa, cinquenta itens. Passando
   * de 50 famílias, as demais simplesmente não existiam para o app: não havia
   * rolagem nem botão que as alcançasse.
   *
   * E cada família traz os integrantes junto, então 50 de uma vez é uma
   * resposta grande no 4G — bem maior que 50 linhas de uma lista simples.
   */
  const query = useInfiniteQuery({
    queryKey: gruposKeys.lista(termo),
    queryFn: ({ pageParam }) =>
      groupsService.listGroups(termo || undefined, pageParam, POR_PAGINA),
    initialPageParam: 1,
    getNextPageParam: (ultima) =>
      ultima.page < ultima.totalPages ? ultima.page + 1 : undefined,
    enabled: habilitada,
    // Mantém a lista anterior enquanto a busca nova chega — sem isso a tela
    // pisca em branco a cada letra digitada.
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  return {
    familias: query.data?.pages.flatMap((p) => p.data) ?? [],
    /** O total no SERVIDOR, não o que já foi carregado. */
    total: query.data?.pages[0]?.total ?? 0,
    carregando: query.isPending && habilitada,
    buscando: habilitada && query.isFetching,
    erro: query.error,
    termoCurto: busca.trim().length > 0 && !habilitada,
    carregandoMais: query.isFetchingNextPage,
    temMais: query.hasNextPage,
    carregarMais: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
    },
  };
}

export function useGrupo(grupoId: string) {
  return useQuery({
    queryKey: gruposKeys.detalhe(grupoId),
    queryFn: () => groupsService.getGroupDetail(grupoId),
    enabled: !!grupoId,
  });
}

export function useConvitesPendentes() {
  return useQuery({
    queryKey: gruposKeys.convites(),
    queryFn: () => groupsService.listPendingInvites(),
  });
}

/**
 * Recarrega só as chaves informadas por cada mutação.
 *
 * ⚠️  A aba Grupos lê a lista da igreja inteira por `gruposKeys.listas()`, que
 * é uma chave SEPARADA de `doUsuarios()`. Toda mutação que muda o que o card
 * de família mostra — nome, foto, quem são os integrantes — precisa citar as
 * duas. Foi exatamente esse esquecimento que fez a foto removida continuar
 * aparecendo na aba ao voltar do detalhe.
 */
function useInvalidar() {
  const queryClient = useQueryClient();
  return (chaves: readonly unknown[][]) =>
    Promise.all(
      chaves.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );
}

/**
 * Responder a um convite.
 *
 * Aceitar faz o grupo aparecer na lista da pessoa; recusar só tira o convite.
 * O detalhe entra pelo prefixo porque a mutação recebe apenas o `membroId` —
 * ela não sabe de qual grupo é o convite.
 */
export function useResponderConvite() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ membroId, status }: { membroId: number; status: 'aceito' | 'recusado' }) =>
      groupsService.respondInvite(membroId, status),
    onSuccess: (_data, { status }) =>
      invalidar(
        status === 'aceito'
          ? [
              gruposKeys.convites(),
              gruposKeys.doUsuarios(),
              gruposKeys.detalhes(),
              // Entrou na família: o card dela na lista geral passa a contar
              // uma pessoa a mais.
              gruposKeys.listas(),
            ]
          : [gruposKeys.convites()],
      ),
  });
}

/** Criar grupo: a família nova entra na lista da pessoa e na lista da igreja. */
export function useCriarGrupo() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({
      nome,
      imagemUrl,
    }: {
      nome?: string | undefined;
      imagemUrl?: string | null | undefined;
    }) => groupsService.createGroup(nome, imagemUrl),
    onSuccess: () => invalidar([gruposKeys.doUsuarios(), gruposKeys.listas()]),
  });
}

/**
 * Atualiza nome ou foto do grupo.
 *
 * ═══ TRÊS CHAVES, NÃO DUAS ═══
 * A foto aparece em quatro lugares: no detalhe, no card do Perfil, na seção
 * "minha família" da aba Grupos e na LISTA de todas as famílias da mesma aba.
 * Os dois do meio saem de `doUsuarios`; o último tem chave própria.
 *
 * `listas` faltava, e o sintoma era exatamente este: remover a foto no
 * detalhe, voltar para a aba Grupos e ver a foto antiga ainda lá — parecia
 * que a ação não tinha sido aplicada, quando o servidor já tinha gravado.
 *
 * Para quem é da liderança o efeito é maior: ela edita famílias das quais não
 * faz parte, então `doUsuarios` não cobre NENHUMA delas — só `listas` cobre.
 */
export function useAtualizarGrupo() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ grupoId, payload }: { grupoId: number; payload: UpdateGrupoPayload }) =>
      groupsService.updateGroup(grupoId, payload),
    onSuccess: (_data, { grupoId }) =>
      invalidar([
        gruposKeys.detalhe(grupoId),
        gruposKeys.doUsuarios(),
        gruposKeys.listas(),
      ]),
  });
}

/**
 * Definir ou corrigir o papel de um integrante.
 *
 * Invalida o DETALHE e a lista do usuário: o papel aparece na tela da família
 * e a lista carrega os mesmos membros. Sem invalidar as duas, a pessoa
 * corrigiria "Filho" para "Pai" e veria o valor antigo ao voltar.
 */
export function useAtualizarPapel() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({
      grupoId,
      usuarioId,
      parentesco,
    }: {
      grupoId: number;
      usuarioId: number;
      parentesco: PapelFamilia | null;
    }) => groupsService.updatePapel(grupoId, usuarioId, parentesco),
    onSuccess: (_data, { grupoId }) =>
      invalidar([
        gruposKeys.detalhe(grupoId),
        gruposKeys.doUsuarios(),
        gruposKeys.listas(),
      ]),
  });
}

/**
 * Sair de um grupo familiar.
 *
 * A listagem só traz grupos onde o vínculo está "aceito", então recarregá-la
 * é o que faz o grupo sumir do Perfil e da aba Grupos.
 *
 * O detalhe é REMOVIDO em vez de invalidado: quem sai perde o acesso, e se
 * era o último membro o backend apaga o grupo. Recarregar daria 403 ou 404
 * na tela que está justamente saindo de cena.
 */
export function useSairDoGrupo() {
  const queryClient = useQueryClient();
  const invalidar = useInvalidar();

  return useMutation({
    mutationFn: ({ grupoId, usuarioId }: { grupoId: number; usuarioId: number }) =>
      groupsService.removeMember(grupoId, usuarioId),
    onSuccess: async (_data, { grupoId }) => {
      queryClient.removeQueries({ queryKey: gruposKeys.detalhe(grupoId) });
      // `listas` também: o card mostra a contagem de integrantes, e se era o
      // último a família deixa de existir — sem isto ela continuaria listada.
      await invalidar([gruposKeys.doUsuarios(), gruposKeys.listas()]);
    },
  });
}
