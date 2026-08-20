import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { usersService, type Aniversariante } from '../../services/users.service';

export type AniversarianteDoMes = Aniversariante & { dia: number };

/** Um DIA do mês com as pessoas que fazem aniversário nele. */
export type DiaAniversario = {
  dia: number;
  ehHoje: boolean;
  /** Quantos dias faltam. 0 quando é hoje. */
  emDias: number;
  pessoas: AniversarianteDoMes[];
};

export const aniversariantesKeys = {
  all: ['aniversariantes'] as const,
  mes: (mes: number) => ['aniversariantes', 'mes', mes] as const,
};

/**
 * Todos os aniversariantes do mês, achatados numa lista e ordenados:
 * quem faz aniversário hoje vem primeiro, o resto em ordem de dia.
 *
 * Lembrete: a API só devolve quem cadastrou a data de nascimento E deixou
 * `exibirAniversario` ligado — por isso a lista pode vir menor do que o
 * número de membros da igreja.
 */
export function useAniversariantesDoMes(mes: number, hoje: number) {
  return useQuery({
    queryKey: aniversariantesKeys.mes(mes),
    queryFn: async (): Promise<AniversarianteDoMes[]> => {
      const dias = await usersService.fetchAniversariantes(mes);
      return dias
        .flatMap(({ dia, aniversariantes }) => aniversariantes.map((a) => ({ ...a, dia })))
        .sort((a, b) => {
          if (a.dia === hoje && b.dia !== hoje) return -1;
          if (b.dia === hoje && a.dia !== hoje) return 1;
          return a.dia - b.dia;
        });
    },
    // Aniversário não muda de hora em hora: vale manter em cache por mais tempo.
    staleTime: 10 * 60_000,
  });
}

/** O que a seção de aniversários da Home precisa saber. */
export type Aniversarios = {
  /** Quem faz aniversário HOJE. Vazio na maioria dos dias — ver comentário. */
  hoje: AniversarianteDoMes[];
  /** Os próximos do mês, achatados e em ordem de dia. Sem hoje. */
  proximos: AniversarianteDoMes[];
};

/**
 * Aniversários de hoje e os próximos do mês, separados.
 *
 * ── Por que separado, e não tudo em cards ────────────────────────────
 * A conta que decidiu este desenho: com N membros e datas espalhadas pelo
 * ano, a chance de um dia qualquer ter alguém é `1 - (364/365)^N`.
 *
 *      100 membros → 24% dos dias    (23 de 30 dias VAZIOS)
 *      150 membros → 34% dos dias    (20 de 30 vazios)
 *      300 membros → 56% dos dias    (13 de 30 vazios)
 *
 * Ou seja: se a seção mostrasse SÓ o dia de hoje, ela ficaria vazia na maior
 * parte do mês, e a Home mudaria de altura de um dia para o outro — layout
 * que aparece e some sozinho faz o app parecer instável mesmo estando certo.
 *
 * Mas mostrar os próximos como CARDS também estava errado: eles competiam
 * com o card de hoje pelo mesmo peso visual. A saída é de tipo, não de
 * quantidade — hoje ganha card com foto, os próximos viram uma linha de
 * texto discreta. A seção nunca fica vazia enquanto houver aniversário no
 * mês, e o card com foto continua exclusividade do dia.
 *
 * Reaproveita o cache de `useAniversariantesDoMes`: nenhuma requisição a mais.
 */
export function useAniversarios(mes: number, hoje: number) {
  const consulta = useAniversariantesDoMes(mes, hoje);
  const lista = consulta.data;

  const aniversarios = useMemo<Aniversarios>(() => {
    if (!lista) return { hoje: [], proximos: [] };
    return {
      hoje: lista.filter((p) => p.dia === hoje),
      // `> hoje` exclui o passado e o próprio dia de uma vez.
      proximos: lista.filter((p) => p.dia > hoje).sort((a, b) => a.dia - b.dia),
    };
  }, [lista, hoje]);

  return { ...consulta, ...aniversarios };
}

/**
 * Só o que ainda VAI acontecer no mês, agrupado por dia.
 *
 * ── Por que dia que passou some ──────────────────────────────────────
 * Aniversário é informação com prazo. No dia 28, saber que alguém fez no dia
 * 3 não serve para nada: já passou, ninguém vai parabenizar com 25 dias de
 * atraso. Mostrar assim mesmo faz a seção encher de conteúdo morto e empurrar
 * o que importa para fora da tela — no fim do mês a pessoa rolaria 25 dias
 * vencidos para achar os 3 que faltam.
 *
 * ── Por que agrupar por dia ──────────────────────────────────────────
 * Aniversário é um evento do DIA, não da pessoa. Se três pessoas fazem no dia
 * 12, isso é UMA data com três nomes, não três cartões repetindo "12 de
 * agosto". Agrupar reduz o carrossel e conta a coisa certa.
 *
 * Reaproveita o cache de `useAniversariantesDoMes` — mesma query, nenhuma
 * requisição a mais. O agrupamento é `useMemo` puro em cima do resultado.
 */
export function useProximosAniversarios(mes: number, hoje: number) {
  const consulta = useAniversariantesDoMes(mes, hoje);
  const lista = consulta.data;

  const dias = useMemo<DiaAniversario[]>(() => {
    if (!lista) return [];

    const porDia = new Map<number, AniversarianteDoMes[]>();
    for (const pessoa of lista) {
      // `>= hoje` e não `> hoje`: hoje ainda não passou.
      if (pessoa.dia < hoje) continue;
      const atual = porDia.get(pessoa.dia);
      if (atual) atual.push(pessoa);
      else porDia.set(pessoa.dia, [pessoa]);
    }

    return [...porDia.entries()]
      .map(([dia, pessoas]) => ({
        dia,
        ehHoje: dia === hoje,
        emDias: dia - hoje,
        pessoas,
      }))
      // Hoje primeiro, depois em ordem crescente de dia. Como já filtramos o
      // passado, ordenar por `dia` sozinho já coloca hoje na frente — mas
      // deixo explícito para a regra não depender de um efeito colateral.
      .sort((a, b) => {
        if (a.ehHoje) return -1;
        if (b.ehHoje) return 1;
        return a.dia - b.dia;
      });
  }, [lista, hoje]);

  return { ...consulta, dias };
}
