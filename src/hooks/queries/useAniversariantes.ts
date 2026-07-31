import { useQuery } from '@tanstack/react-query';
import { usersService, type Aniversariante } from '../../services/users.service';

export type AniversarianteDoMes = Aniversariante & { dia: number };

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
