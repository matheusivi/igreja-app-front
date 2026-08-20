import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  coursesService,
  type CreateSalaPayload,
  type UpdateSalaPayload,
} from '../../services/courses.service';

/**
 * Chaves do cache de Ensino.
 *
 * A hierarquia importa: invalidar `['cursos','salas']` atinge as turmas de
 * todos os cursos, enquanto `['cursos','salas','7']` atinge só as do curso 7.
 * É essa diferença que permite recarregar exatamente o que mudou.
 */
export const cursosKeys = {
  all: ['cursos'] as const,
  listas: () => ['cursos', 'lista'] as const,
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

/**
 * Recarrega só as chaves informadas.
 *
 * Antes toda mutação invalidava a raiz `['cursos']`, o que recarregava seis
 * telas de uma vez — e cinco delas voltavam "nada mudou". Agora cada mutação
 * declara o que realmente afeta.
 *
 * O preço dessa precisão é ter que pensar caso a caso: esquecer uma chave faz
 * a tela mostrar dado velho, que é justamente o bug que a marreta evitava.
 */
function useInvalidar() {
  const queryClient = useQueryClient();
  return (chaves: readonly unknown[][]) =>
    Promise.all(
      chaves.map((queryKey) =>
        queryClient.invalidateQueries({ queryKey, refetchType: 'all' }),
      ),
    );
}

/** Toda mutação de turma precisa do curso para saber qual lista recarregar. */
type SalaVars = { salaId: number; cursoId: string | number };

/**
 * Matricular-se numa turma.
 *
 * Afeta as turmas do curso (a lotação muda), o histórico do Perfil (aparece
 * como "Em andamento") e a lista de colegas daquela turma.
 */
export function useMatricular() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ salaId }: SalaVars) => coursesService.enroll(salaId),
    onSuccess: (_data, { salaId, cursoId }) =>
      invalidar([
        cursosKeys.salas(cursoId),
        cursosKeys.historico(),
        cursosKeys.colegas(salaId),
      ]),
  });
}

/**
 * Sair da turma. Mesmas telas da matrícula: a vaga é liberada e o Perfil
 * deixa de mostrar o curso como em andamento.
 */
export function useCancelarMatricula() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ salaId }: SalaVars) => coursesService.cancelEnroll(salaId),
    onSuccess: (_data, { salaId, cursoId }) =>
      invalidar([
        cursosKeys.salas(cursoId),
        cursosKeys.historico(),
        cursosKeys.colegas(salaId),
      ]),
  });
}

/**
 * Líder marca um participante como concluído ou desistente.
 *
 * Afeta mais coisas do que parece: a lista de participantes, o histórico do
 * aluno (o Perfil dele deixa de dizer "Em andamento") e a lotação da turma,
 * já que quem concluiu ou desistiu libera vaga.
 *
 * Usa o prefixo `['cursos','salas']` porque a tela de participantes só recebe
 * o `salaId` — ela não sabe de qual curso a turma é.
 */
export function useAtualizarStatusParticipante() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({
      salaId,
      usuarioId,
      status,
    }: {
      salaId: number;
      usuarioId: number;
      status: 'concluido' | 'desistente';
    }) => coursesService.updateParticipanteStatus(salaId, usuarioId, status),
    onSuccess: (_data, { salaId }) =>
      invalidar([
        cursosKeys.participantes(salaId),
        cursosKeys.historico(),
        ['cursos', 'salas'],
      ]),
  });
}

/** Criar turma. Só a lista de turmas daquele curso muda. */
export function useCriarSala() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({
      cursoId,
      payload,
    }: {
      cursoId: string | number;
      payload: CreateSalaPayload;
    }) => coursesService.createSala(cursoId, payload),
    onSuccess: (_data, { cursoId }) => invalidar([cursosKeys.salas(cursoId)]),
  });
}

/**
 * Atualizar turma — inclusive encerrar.
 *
 * Encerrar é o caso que exige atenção: além de tirar a turma da lista, ele
 * marca todas as matrículas ativas como concluídas. Sem invalidar o histórico
 * e os participantes aqui, o Perfil continuaria dizendo "Em andamento" num
 * curso que já acabou.
 */
export function useAtualizarSala() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({
      salaId,
      payload,
    }: {
      salaId: number;
      cursoId: string | number;
      payload: UpdateSalaPayload;
    }) => coursesService.updateSala(salaId, payload),
    onSuccess: (_data, { salaId, cursoId, payload }) => {
      const chaves: readonly unknown[][] = [cursosKeys.salas(cursoId)];
      if (payload.status && payload.status !== 'ativa') {
        return invalidar([
          ...chaves,
          cursosKeys.historico(),
          cursosKeys.participantes(salaId),
        ]);
      }
      return invalidar(chaves);
    },
  });
}

/**
 * Excluir turma. O servidor só permite quando não há matrículas (exceto para
 * administrador), então o histórico de ninguém muda — basta recarregar a
 * lista de turmas do curso.
 */
export function useExcluirSala() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ salaId }: SalaVars) => coursesService.deleteSala(salaId),
    onSuccess: (_data, { cursoId }) => invalidar([cursosKeys.salas(cursoId)]),
  });
}

/**
 * Excluir curso.
 *
 * `listas()` sem categoria de propósito: a lista está cacheada por filtro
 * ("todas", "Homens", "Mulheres"...), e o curso excluído pode estar em
 * qualquer uma delas.
 *
 * O detalhe e as turmas são REMOVIDOS do cache, não invalidados. Invalidar
 * mandaria buscar de novo um curso que acabou de deixar de existir — um GET
 * garantido a 404, com erro aparecendo na tela que está saindo.
 */
export function useExcluirCurso() {
  const invalidar = useInvalidar();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cursoId: number) => coursesService.deleteCurso(cursoId),
    onSuccess: async (_data, cursoId) => {
      queryClient.removeQueries({ queryKey: cursosKeys.detalhe(cursoId) });
      queryClient.removeQueries({ queryKey: cursosKeys.salas(cursoId) });
      await invalidar([cursosKeys.listas()]);
    },
  });
}
