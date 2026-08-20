import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Tamanho do texto na tela de leitura.
 *
 * ═══ POR QUE ISTO EXISTE ═══
 * O devocional é o único texto LONGO do app, e a congregação tem idosos. Um
 * corpo fixo obriga a pessoa a escolher entre ler com dificuldade ou desistir
 * — e quem desiste some da funcionalidade inteira.
 *
 * O iOS e o Android já têm ajuste de fonte no sistema, e o React Native o
 * respeita. Mas quase ninguém sabe que existe, e quem sabe não quer aumentar
 * a fonte do aparelho INTEIRO só para ler o devocional da igreja. Um controle
 * na própria tela é o que essa pessoa acha.
 *
 * ═══ POR QUE FICA NO APARELHO ═══
 * É preferência de conforto visual, não dado da igreja. Guardar no servidor
 * custaria uma coluna, dois endpoints e uma requisição a cada toque, para
 * algo que ninguém precisa ver sincronizado entre celulares.
 *
 * Passa pelo TanStack Query mesmo sendo disco, pelo mesmo motivo do "marcar
 * como lido": é o que faz a tela reagir na hora, sem contexto próprio.
 */

const CHAVE = 'tamanho_leitura';

/** Multiplicadores, não tamanhos absolutos: o corpo base vive no componente. */
export const ESCALAS = [1, 1.15, 1.3] as const;
export type EscalaLeitura = (typeof ESCALAS)[number];

const PADRAO: EscalaLeitura = 1;

export const tamanhoLeituraKeys = {
  atual: ['tamanho-leitura'] as const,
};

async function ler(): Promise<EscalaLeitura> {
  const bruto = await AsyncStorage.getItem(CHAVE);
  const valor = Number(bruto);
  // Volta ao padrão se o valor gravado não for um dos três conhecidos — um
  // dado corrompido não deve deixar a tela com fonte de tamanho aleatório.
  return (ESCALAS as readonly number[]).includes(valor)
    ? (valor as EscalaLeitura)
    : PADRAO;
}

export function useTamanhoLeitura(): EscalaLeitura {
  const { data = PADRAO } = useQuery({
    queryKey: tamanhoLeituraKeys.atual,
    queryFn: ler,
    staleTime: Infinity,
  });
  return data;
}

export function useAlterarTamanhoLeitura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (escala: EscalaLeitura) => {
      await AsyncStorage.setItem(CHAVE, String(escala));
      return escala;
    },
    onSuccess: (escala) =>
      queryClient.setQueryData(tamanhoLeituraKeys.atual, escala),
  });
}
