import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  moderacaoService,
  type MotivoDenuncia,
} from '../../services/moderacao.service';

export const moderacaoKeys = {
  bloqueados: ['moderacao', 'bloqueados'] as const,
  denuncias: ['moderacao', 'denuncias'] as const,
};

/**
 * Quem esta pessoa bloqueou.
 *
 * ═══ POR QUE VIRA CONSULTA COMPARTILHADA ═══
 * Dois lugares precisam disto: a tela de bloqueados, que mostra a lista, e o
 * Perfil, que só quer saber SE existe alguém — porque a entrada "Pessoas
 * bloqueadas" só aparece para quem já bloqueou alguém.
 *
 * Com o cache do TanStack Query, os dois compartilham UMA requisição. Feito
 * com `useState` em cada tela, seriam duas, e o Perfil pagaria uma ida ao
 * servidor a cada abertura para quase sempre receber lista vazia.
 *
 * ═══ `staleTime` LONGO ═══
 * Bloquear é raro, e as mutações abaixo já invalidam o cache quando acontece.
 * Buscar de novo a cada visita seria confirmar o que o app acabou de fazer.
 */
export function useBloqueados() {
  const query = useQuery({
    queryKey: moderacaoKeys.bloqueados,
    queryFn: () => moderacaoService.listarBloqueados(),
    staleTime: 10 * 60 * 1000,
  });

  return {
    bloqueados: query.data ?? [],
    quantidade: query.data?.length ?? 0,
    carregando: query.isPending,
    erro: query.error,
  };
}

export function useBloquear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (usuarioId: number) => moderacaoService.bloquear(usuarioId),
    onSuccess: () => {
      // O mural muda (some quem foi bloqueado) e a lista de bloqueados também.
      // Invalidar os dois é o que faz a entrada aparecer no Perfil na hora.
      void queryClient.invalidateQueries({ queryKey: moderacaoKeys.bloqueados });
      void queryClient.invalidateQueries({ queryKey: ['pedidos-oracao'] });
    },
  });
}

export function useDesbloquear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (usuarioId: number) => moderacaoService.desbloquear(usuarioId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: moderacaoKeys.bloqueados });
      void queryClient.invalidateQueries({ queryKey: ['pedidos-oracao'] });
    },
  });
}

export function useDenunciar() {
  return useMutation({
    mutationFn: ({
      alvoId,
      motivo,
    }: {
      alvoId: number;
      motivo: MotivoDenuncia;
    }) => moderacaoService.denunciarPedido(alvoId, motivo),
  });
}

/**
 * A fila de denúncias da liderança.
 *
 * ═══ `enabled` EM VEZ DE ESCONDER A TELA ═══
 * A consulta só dispara para quem tem cargo. Sem isso, todo membro faria uma
 * requisição a cada abertura do Perfil para receber 403 — barulho no log do
 * servidor e uma ida à rede sem propósito.
 *
 * A guarda de verdade continua no servidor: `exigirLideranca` no serviço.
 * Isto aqui é economia, não segurança.
 */
export function useDenunciasPendentes(ehLideranca: boolean) {
  const query = useQuery({
    queryKey: moderacaoKeys.denuncias,
    queryFn: () => moderacaoService.listarDenuncias(),
    enabled: ehLideranca,
    // Curto: a Apple exige resposta em 24h, e a liderança precisa ver o que
    // chegou enquanto a tela estava aberta.
    staleTime: 60 * 1000,
  });

  return {
    denuncias: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    carregando: query.isPending && ehLideranca,
    erro: query.error,
    recarregar: query.refetch,
  };
}

export function useResolverDenuncia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => moderacaoService.resolverDenuncia(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: moderacaoKeys.denuncias });
    },
  });
}
