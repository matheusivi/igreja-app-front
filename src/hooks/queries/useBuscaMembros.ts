import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { usersService, type UsuarioResumo } from '../../services/users.service';

/**
 * Busca de membros da igreja, com a família de cada um.
 *
 * ═══ POR QUE NÃO ERA UM BOTÃO "BUSCAR" ═══
 * A tela de convite guardava resultado em `useState` e só disparava a
 * consulta quando a pessoa apertava um botão. Isso tem três problemas, e o
 * terceiro é o que mais dói:
 *
 * 1. Sem cache: voltar para a tela reconsultava tudo do zero.
 * 2. Sem estado compartilhado: dois lugares buscando a mesma coisa fariam
 *    duas requisições e poderiam mostrar respostas diferentes.
 * 3. **Buscar não é uma decisão.** Ninguém digita "Maria" e depois PENSA se
 *    quer buscar. O botão existia para economizar requisição, e cobrava esse
 *    preço em um toque a mais toda vez.
 *
 * ═══ O DEBOUNCE É O QUE SUBSTITUI O BOTÃO ═══
 * Sem ele, "Maria" dispararia cinco requisições — uma por letra — e as
 * respostas poderiam chegar fora de ordem, deixando na tela o resultado de
 * "Mar" depois do de "Maria". 350ms é a faixa em que a pausa entre teclas de
 * quem digita normalmente já acabou, mas a espera ainda não é percebida como
 * lentidão.
 *
 * O TanStack Query resolve o resto: cada termo é uma chave própria, respostas
 * antigas nunca sobrescrevem a atual, e voltar a um termo já buscado é
 * instantâneo.
 */

const ESPERA_MS = 350;

/** Abaixo disto a busca não roda: "a" traria a igreja inteira. */
const MINIMO_CARACTERES = 2;

export const membrosKeys = {
  todos: ['membros'] as const,
  busca: (termo: string) => [...membrosKeys.todos, 'busca', termo] as const,
  /**
   * Fica DEBAIXO de `todos` de propósito: promover ou rebaixar alguém invalida
   * o prefixo inteiro, e assim a lista de líderes se atualiza pela mesma
   * chamada que já atualiza as buscas. Uma chave irmã exigiria lembrar de
   * citar as duas — e é exatamente esse tipo de esquecimento que fez a foto
   * de família ficar velha na aba Grupos.
   */
  porPerfil: (perfil: string) => [...membrosKeys.todos, 'perfil', perfil] as const,
};

export function useDebounce<T>(valor: T, espera = ESPERA_MS): T {
  const [atrasado, setAtrasado] = useState(valor);

  useEffect(() => {
    const id = setTimeout(() => setAtrasado(valor), espera);
    // Cada tecla cancela o temporizador anterior. Sem esta limpeza, o
    // `setTimeout` de cada letra continuaria vivo e todos disparariam.
    return () => clearTimeout(id);
  }, [valor, espera]);

  return atrasado;
}

export function useBuscaMembros(termo: string) {
  const termoAtrasado = useDebounce(termo).trim();
  const habilitada = termoAtrasado.length >= MINIMO_CARACTERES;

  const query = useQuery({
    queryKey: membrosKeys.busca(termoAtrasado),
    queryFn: () => usersService.search(termoAtrasado),
    enabled: habilitada,
    // Mantém a lista anterior visível enquanto a nova chega. Sem isso a tela
    // pisca em branco a cada letra digitada, o que parece defeito.
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  return {
    resultados: (query.data ?? []) as UsuarioResumo[],
    /** `true` só quando existe consulta em voo — não quando está desabilitada. */
    buscando: habilitada && query.isFetching,
    erro: query.error,
    /**
     * A pessoa digitou algo curto demais. A tela precisa distinguir isto de
     * "não achei nada": são mensagens diferentes, e trocar uma pela outra
     * faz a pessoa concluir que a igreja não tem ninguém com aquele nome.
     */
    termoCurto: termo.trim().length > 0 && !habilitada,
    /** Já buscou e voltou vazio. */
    semResultado:
      habilitada && !query.isFetching && (query.data?.length ?? 0) === 0,
    minimoCaracteres: MINIMO_CARACTERES,
  };
}

/**
 * Quem é líder hoje.
 *
 * ═══ POR QUE UMA LISTA, E NÃO SÓ A BUSCA ═══
 * Com só a busca, promover alguém fazia a pessoa sumir da tela assim que o
 * campo era limpo. Não dava para responder "quem são os líderes?" nem para
 * achar alguém a rebaixar sem lembrar o nome — e lembrar o nome é justamente
 * o que falta quando se quer revisar uma lista.
 *
 * Sem paginação por decisão: são dezenas de pessoas, não centenas, e uma
 * rolagem infinita aqui seria interface para um problema que não existe.
 */
export function useLideres() {
  const query = useQuery({
    queryKey: membrosKeys.porPerfil('Líder'),
    queryFn: () => usersService.listarPorPerfil('Líder'),
    staleTime: 60_000,
  });

  return {
    lideres: (query.data ?? []) as UsuarioResumo[],
    carregando: query.isPending,
    erro: query.error,
  };
}

/**
 * Promover a líder e devolver a membro.
 *
 * ═══ POR QUE INVALIDA O PREFIXO INTEIRO ═══
 * Cada termo digitado tem chave própria. A pessoa promovida pode estar em
 * várias delas — buscou "ana", depois "silva", e a mesma Ana apareceu nas
 * duas. Invalidando só o termo em uso, voltar à busca anterior mostraria o
 * crachá antigo, e a tela pareceria ter desfeito a mudança.
 *
 * ═══ O CACHE DE 60s TAMBÉM MENTIRIA ═══
 * `useBuscaMembros` tem `staleTime` de um minuto. Sem invalidar, uma promoção
 * levaria até um minuto para aparecer — tempo suficiente para alguém tocar
 * duas vezes achando que não funcionou.
 */
export function useDefinirLideranca() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      usuarioId,
      perfil,
    }: {
      usuarioId: number;
      perfil: 'Membro' | 'Líder';
    }) => usersService.definirLideranca(usuarioId, perfil),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: membrosKeys.todos }),
  });
}
