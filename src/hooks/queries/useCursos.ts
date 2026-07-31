import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  coursesService,
  type CreateSalaPayload,
  type UpdateSalaPayload,
} from '../../services/courses.service';

/**
 * Tudo sob a raiz `['cursos']` de propósito: matricular ou sair de uma turma
 * invalida essa raiz e atualiza de uma vez a aba Cursos do Perfil, a lista de
 * cursos e a tela da sala — sem precisar lembrar de cada tela.
 */
export const cursosKeys = {
  all: ['cursos'] as const,
  lista: (categoria?: string) => ['cursos', 'lista', categoria ?? 'todas'] as const,
  detalhe: (id: string | number) => ['cursos', 'detalhe', String(id)] as const,
  salas: (cursoId: string | number) => ['cursos', 'salas', String(cursoId)] as const,
  historico: () => ['cursos', 'historico'] as const,
  colegas: (salaId: number) => ['cursos', 'colegas', salaId] as const,
  participantes: (salaId: number) => ['cursos', 'participantes', salaId] as const,
};

export function useCursos(categoria?: string) {
  return useQuery({
    queryKey: cursosKeys.lista(categoria),
    queryFn: () => coursesService.listCursos(categoria),
  });
}

export function useCurso(id: string) {
  return useQuery({
    queryKey: cursosKeys.detalhe(id),
    queryFn: () => coursesService.getCurso(id),
    enabled: !!id,
  });
}

export function useSalas(cursoId: string | number) {
  return useQuery({
    queryKey: cursosKeys.salas(cursoId),
    queryFn: () => coursesService.listSalas(cursoId),
    enabled: !!cursoId,
  });
}

/** Histórico de matrículas do usuário — alimenta a aba Cursos do Perfil. */
export function useHistoricoMatriculas() {
  return useQuery({
    queryKey: cursosKeys.historico(),
    queryFn: () => coursesService.getHistorico(),
  });
}

export function useColegasSala(salaId: number) {
  return useQuery({
    queryKey: cursosKeys.colegas(salaId),
    queryFn: () => coursesService.getColegas(salaId),
    enabled: !!salaId,
  });
}

export function useParticipantesSala(salaId: number) {
  return useQuery({
    queryKey: cursosKeys.participantes(salaId),
    queryFn: () => coursesService.getParticipantes(salaId),
    enabled: !!salaId,
  });
}

function useInvalidarCursos() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: cursosKeys.all, refetchType: 'all' });
}

export function useMatricular() {
  const invalidar = useInvalidarCursos();
  return useMutation({
    mutationFn: (salaId: number) => coursesService.enroll(salaId),
    onSuccess: invalidar,
  });
}

/**
 * Sair da turma. A invalidação é o que faz o "Em andamento" sumir do Perfil:
 * o backend marca a matrícula como cancelada, mas sem isto o app continuaria
 * mostrando a versão antiga da lista.
 */
export function useCancelarMatricula() {
  const invalidar = useInvalidarCursos();
  return useMutation({
    mutationFn: (salaId: number) => coursesService.cancelEnroll(salaId),
    onSuccess: invalidar,
  });
}

export function useCriarSala() {
  const invalidar = useInvalidarCursos();
  return useMutation({
    mutationFn: ({
      cursoId,
      payload,
    }: {
      cursoId: string | number;
      payload: CreateSalaPayload;
    }) => coursesService.createSala(cursoId, payload),
    onSuccess: invalidar,
  });
}

export function useAtualizarSala() {
  const invalidar = useInvalidarCursos();
  return useMutation({
    mutationFn: ({ salaId, payload }: { salaId: number; payload: UpdateSalaPayload }) =>
      coursesService.updateSala(salaId, payload),
    onSuccess: invalidar,
  });
}

export function useExcluirSala() {
  const invalidar = useInvalidarCursos();
  return useMutation({
    mutationFn: (salaId: number) => coursesService.deleteSala(salaId),
    onSuccess: invalidar,
  });
}

export function useExcluirCurso() {
  const invalidar = useInvalidarCursos();
  return useMutation({
    mutationFn: (cursoId: number) => coursesService.deleteCurso(cursoId),
    onSuccess: invalidar,
  });
}
