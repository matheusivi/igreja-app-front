import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { groupsService, type UpdateGrupoPayload } from '../../services/groups.service';

export const gruposKeys = {
  all: ['grupos'] as const,
  doUsuario: (usuarioId: number) => ['grupos', 'usuario', usuarioId] as const,
  detalhe: (id: string | number) => ['grupos', 'detalhe', String(id)] as const,
  convites: () => ['grupos', 'convites'] as const,
};

export function useMeusGrupos(usuarioId: number | undefined) {
  return useQuery({
    queryKey: gruposKeys.doUsuario(usuarioId ?? 0),
    queryFn: () => groupsService.getUserGroups(usuarioId!),
    enabled: !!usuarioId,
  });
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

function useInvalidarGrupos() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: gruposKeys.all, refetchType: 'all' });
}

export function useResponderConvite() {
  const invalidar = useInvalidarGrupos();
  return useMutation({
    mutationFn: ({ membroId, status }: { membroId: number; status: 'aceito' | 'recusado' }) =>
      groupsService.respondInvite(membroId, status),
    onSuccess: invalidar,
  });
}

export function useCriarGrupo() {
  const invalidar = useInvalidarGrupos();
  return useMutation({
    mutationFn: (nome?: string) => groupsService.createGroup(nome),
    onSuccess: invalidar,
  });
}

/**
 * Atualiza nome ou foto do grupo.
 *
 * Invalida tudo porque a foto aparece em três telas (lista de grupos, detalhe
 * e card do Perfil) — sem isso, trocar a foto no detalhe deixaria a antiga
 * visível nas outras duas até o cache expirar.
 */
export function useAtualizarGrupo() {
  const invalidar = useInvalidarGrupos();
  return useMutation({
    mutationFn: ({ grupoId, payload }: { grupoId: number; payload: UpdateGrupoPayload }) =>
      groupsService.updateGroup(grupoId, payload),
    onSuccess: invalidar,
  });
}

/**
 * Sair (ou remover alguém) de um grupo familiar.
 *
 * O backend apaga o vínculo, e a listagem só traz grupos onde o vínculo está
 * "aceito" — então basta invalidar para o grupo sumir do Perfil e da aba
 * Grupos. Sem invalidar, a pessoa continuaria vendo um grupo do qual já saiu.
 */
export function useSairDoGrupo() {
  const invalidar = useInvalidarGrupos();
  return useMutation({
    mutationFn: ({ grupoId, usuarioId }: { grupoId: number; usuarioId: number }) =>
      groupsService.removeMember(grupoId, usuarioId),
    onSuccess: invalidar,
  });
}
