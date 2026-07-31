import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Card, TextField } from '../../components';
import {
  useAtualizarSala,
  useCancelarMatricula,
  useCurso,
  useExcluirCurso,
  useExcluirSala,
  useHistoricoMatriculas,
  useMatricular,
  useSalas,
} from '../../hooks/queries/useCursos';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import {
  agruparCapitulos,
  formatPeriodoSala,
  vagasRestantes,
} from '../../services/courses.service';

type Props = NativeStackScreenProps<AppStackParamList, 'CursoDetail'>;

export function CourseDetailScreen({ route, navigation }: Props) {
  const colors = useThemeColors();
  const { user } = useAuth();
  const isLeader = ['Líder', 'Pastor', 'Administrador'].includes(user?.perfil ?? '');
  const { data: curso, isPending: isLoadingCurso, error: cursoError } = useCurso(route.params.id);
  const { data: salas = [] } = useSalas(route.params.id);
  const { data: historico = [] } = useHistoricoMatriculas();

  const matricular = useMatricular();
  const cancelarMatricula = useCancelarMatricula();
  const excluirCurso = useExcluirCurso();

  const [actionError, setActionError] = useState<string | null>(null);
  const [buscaTurma, setBuscaTurma] = useState('');
  const atualizarSala = useAtualizarSala();
  const excluirSala = useExcluirSala();

  const canManage =
    curso?.criador.id === user?.id || ['Pastor', 'Administrador'].includes(user?.perfil ?? '');
  const isLoading = isLoadingCurso;
  const error = cursoError ? extractErrorMessage(cursoError) : null;

  const enrollingId =
    (matricular.isPending ? matricular.variables : null) ??
    (cancelarMatricula.isPending ? cancelarMatricula.variables : null) ??
    null;

  /**
   * Derivado do histórico, e não de um estado próprio.
   *
   * Antes esta tela mantinha a lista de turmas matriculadas num `useState`
   * paralelo. Ao cancelar, ela só apagava o item do próprio estado — o resto
   * do app (Perfil, por exemplo) continuava achando que a matrícula existia.
   * Agora existe uma fonte só: o histórico vindo do cache.
   */
  const enrolledSalaIds = useMemo(
    () =>
      new Set(
        historico
          .filter((m) => m.status === 'ativo' && String(m.cursoId) === route.params.id)
          .map((m) => m.salaId),
      ),
    [historico, route.params.id],
  );

  /**
   * A busca cobre o nome do líder e o nome da turma. Com várias turmas do
   * mesmo curso, procurar pelo líder é como a pessoa costuma se orientar
   * ("a turma do João"), então ele vem primeiro.
   */
  const salasFiltradas = useMemo(() => {
    const termo = buscaTurma.trim().toLowerCase();
    if (!termo) return salas;
    return salas.filter(
      (s) =>
        (s.lider?.nomeCompleto ?? '').toLowerCase().includes(termo) ||
        s.nomeSala.toLowerCase().includes(termo),
    );
  }, [salas, buscaTurma]);

  // `?? []` porque o backend só devolve `capitulos` depois da migration —
  // sem isso a tela quebraria com "cannot read length of undefined" em quem
  // ainda estiver com o servidor antigo.
  const capitulos = curso?.capitulos ?? [];

  const encerrandoId = atualizarSala.isPending
    ? atualizarSala.variables?.salaId
    : null;

  function confirmarEncerramento(sala: (typeof salas)[number]) {
    Alert.alert(
      'Encerrar turma',
      `Encerrar "${sala.nomeSala}"? Os ${sala.totalMatriculas} matriculados passam a constar como concluintes, e a turma sai desta lista — ela continua no histórico de quem participou.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          onPress: () =>
            atualizarSala.mutate(
              { salaId: sala.id, payload: { status: 'concluída' } },
              {
                onError: (e) =>
                  Alert.alert(
                    'Erro',
                    extractErrorMessage(e, 'Não foi possível encerrar a turma.'),
                  ),
              },
            ),
        },
      ],
    );
  }

  function confirmarExclusaoTurma(sala: (typeof salas)[number]) {
    const temGente = sala.totalMatriculas > 0;

    Alert.alert(
      'Excluir turma',
      temGente
        ? `"${sala.nomeSala}" tem ${sala.totalMatriculas} matriculado(s). Excluir apaga o registro de quem participou — só o administrador consegue. Para finalizá-la preservando o histórico, use "Encerrar turma".`
        : `Excluir "${sala.nomeSala}"? Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () =>
            excluirSala.mutate(sala.id, {
              onError: (e) =>
                Alert.alert(
                  'Não foi possível excluir',
                  extractErrorMessage(e, 'Tente novamente.'),
                ),
            }),
        },
      ],
    );
  }

  function handleEnroll(salaId: number) {
    setActionError(null);
    matricular.mutate(salaId, {
      onSuccess: () => navigation.navigate('Sala', { salaId, cursoNome: curso!.nome }),
      onError: (e) =>
        setActionError(extractErrorMessage(e, 'Não foi possível concluir a matrícula.')),
    });
  }

  function handleCancel(salaId: number) {
    setActionError(null);
    cancelarMatricula.mutate(salaId, {
      onError: (e) =>
        setActionError(extractErrorMessage(e, 'Não foi possível cancelar a matrícula.')),
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary" numberOfLines={1}>
          IBVI Nova Andradina
        </Text>
        {canManage ? (
          <Pressable
            onPress={() => navigation.navigate('EditCurso', { id: route.params.id })}
            hitSlop={8}
          >
            <Ionicons name="pencil-outline" size={20} color={colors.primary} />
          </Pressable>
        ) : (
          <View style={{ width: 20 }} />
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      ) : error || !curso ? (
        <View className="flex-1 items-center justify-center gap-3 px-gutter">
          <Text className="text-center font-sans text-sm text-ink-muted">
            {error ?? 'Curso não encontrado.'}
          </Text>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text className="font-sans-semibold text-sm text-secondary">Voltar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-md px-gutter py-lg">
          <View className="h-40 items-center justify-center rounded-lg bg-surface-container-high">
            <MaterialCommunityIcons name="book-open-page-variant" size={40} color={colors.gold} />
          </View>

          <View className="gap-2">
            <Text className="self-start rounded-full bg-success-soft px-3 py-1 font-sans-semibold text-xs text-on-success">
              {curso.categoria}
            </Text>
            <Text className="font-serif-bold text-2xl text-ink">{curso.nome}</Text>
            {curso.descricaoMaterial ? (
              <Text className="font-sans text-sm leading-6 text-ink-muted">{curso.descricaoMaterial}</Text>
            ) : null}

            {curso.duracao || curso.publicoAlvo ? (
              <View className="mt-1 gap-1">
                {curso.duracao ? (
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="time-outline" size={14} color={colors.outline} />
                    <Text className="font-sans text-xs text-ink-muted">{curso.duracao}</Text>
                  </View>
                ) : null}
                {curso.publicoAlvo ? (
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="people-outline" size={14} color={colors.outline} />
                    <Text className="flex-1 font-sans text-xs text-ink-muted">
                      {curso.publicoAlvo}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>

          {/* Ementa — o que a pessoa mais quer saber antes de se matricular:
              o que exatamente vai ser estudado. */}
          {capitulos.length > 0 ? (
            <View className="gap-3">
              <Text className="font-serif-bold text-lg text-ink">
                O que você vai estudar
              </Text>
              <Card contentClassName="gap-0" padded={false}>
                {agruparCapitulos(capitulos).map((grupo, gi) => (
                  <View key={grupo.secao ?? `grupo-${gi}`}>
                    {grupo.secao ? (
                      <View className="border-b border-outline-variant bg-surface-container-low px-4 py-2">
                        <Text className="font-sans-semibold text-xs uppercase tracking-wide text-secondary">
                          {grupo.secao}
                        </Text>
                      </View>
                    ) : null}
                    {grupo.itens.map((cap) => (
                      <View
                        key={cap.id}
                        className={[
                          'flex-row items-start gap-3 px-4 py-3',
                          // Só o último item da ementa inteira fica sem linha —
                          // senão sobraria uma borda solta no rodapé do card.
                          cap.ordem < capitulos.length
                            ? 'border-b border-outline-variant'
                            : '',
                        ].join(' ')}
                      >
                        <Text className="w-6 font-serif-bold text-sm text-gold">
                          {cap.ordem}
                        </Text>
                        <Text className="flex-1 font-sans text-sm leading-5 text-ink">
                          {cap.titulo}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </Card>
            </View>
          ) : null}

          {/* Turmas */}
          <View className="gap-3">
            <Text className="font-serif-bold text-lg text-ink">Turmas abertas</Text>

            {/* Busca só aparece quando há turmas o bastante para valer a pena
                procurar — com duas turmas o campo só ocupa espaço. */}
            {salas.length > 2 ? (
              <TextField
                label="Buscar por líder ou nome da turma"
                placeholder="Ex: João Silva ou Turma da manhã"
                value={buscaTurma}
                onChangeText={setBuscaTurma}
                autoCapitalize="none"
              />
            ) : null}

            {actionError ? (
              <Text className="font-sans text-xs text-error">{actionError}</Text>
            ) : null}

            {salasFiltradas.length === 0 ? (
              <Card contentClassName="items-center gap-2 py-4">
                <Ionicons name="school-outline" size={28} color={colors.outline} />
                <Text className="text-center font-sans text-sm text-ink-muted">
                  {buscaTurma.trim()
                    ? 'Nenhuma turma encontrada para essa busca.'
                    : 'Nenhuma turma aberta no momento.'}
                </Text>
              </Card>
            ) : (
              salasFiltradas.map((sala) => {
                const enrolled = enrolledSalaIds.has(sala.id);
                const processing = enrollingId === sala.id;
                const vagas = vagasRestantes(sala);
                const periodo = formatPeriodoSala(sala);
                const lotada = vagas === 0 && !enrolled;

                return (
                  <Card key={sala.id} contentClassName="gap-3">
                    {/* O nome da turma é o que distingue uma da outra. Antes
                        não era exibido, e várias turmas do mesmo curso ficavam
                        com cards idênticos — impossível escolher. */}
                    <View className="flex-row items-start justify-between gap-2">
                      <Text className="flex-1 font-serif-bold text-base text-ink">
                        {sala.nomeSala}
                      </Text>
                      {lotada ? (
                        <Text className="rounded-full bg-surface-container-high px-2 py-0.5 font-sans-semibold text-[11px] text-error">
                          Lotada
                        </Text>
                      ) : null}
                      {/* Fica no topo, junto do nome, porque a ação é sobre a
                          turma inteira — não sobre a matrícula da pessoa. */}
                      {isLeader ? (
                        <Pressable
                          onPress={() => confirmarExclusaoTurma(sala)}
                          hitSlop={8}
                          accessibilityLabel={`Excluir turma ${sala.nomeSala}`}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={17}
                            color={colors.error}
                          />
                        </Pressable>
                      ) : null}
                    </View>

                    {periodo ? (
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="calendar-outline" size={14} color={colors.outline} />
                        <Text className="font-sans text-xs text-ink-muted">{periodo}</Text>
                      </View>
                    ) : null}

                    {sala.lider ? (
                      <View className="flex-row items-center gap-3">
                        <Avatar
                          nome={sala.lider.nomeCompleto}
                          fotoUrl={sala.lider.fotoUrl}
                          size={36}
                        />
                        <View>
                          <Text className="font-sans-semibold text-sm text-ink">
                            {sala.lider.nomeCompleto}
                          </Text>
                          <Text className="font-sans text-xs text-ink-muted">Líder da turma</Text>
                        </View>
                      </View>
                    ) : null}

                    <View className="flex-row items-center gap-1">
                      <Ionicons name="people-outline" size={14} color={colors.outline} />
                      <Text className="font-sans text-xs text-ink-muted">
                        {sala.capacidade === null
                          ? `${sala.totalMatriculas} matriculados · sem limite de vagas`
                          : `${sala.totalMatriculas}/${sala.capacidade} matriculados`}
                      </Text>
                      {vagas !== null && vagas > 0 && vagas <= 3 ? (
                        <Text className="font-sans-semibold text-xs text-error">
                          · {vagas === 1 ? 'Última vaga' : `Últimas ${vagas} vagas`}
                        </Text>
                      ) : null}
                    </View>

                    {enrolled ? (
                      <>
                        <Button
                          label="Ver colegas da turma"
                          variant="secondary"
                          icon={<Ionicons name="people-outline" size={14} color={colors.secondary} />}
                          onPress={() =>
                            navigation.navigate('Sala', { salaId: sala.id, cursoNome: curso!.nome })
                          }
                        />
                        <Button
                          label="Cancelar matrícula"
                          variant="secondary"
                          loading={processing}
                          onPress={() => handleCancel(sala.id)}
                        />
                      </>
                    ) : (
                      <Button
                        label={lotada ? 'Turma lotada' : 'Matricular-se nesta turma'}
                        loading={processing}
                        disabled={lotada}
                        icon={<Ionicons name="checkmark" size={18} color={colors.onGold} />}
                        onPress={() => handleEnroll(sala.id)}
                      />
                    )}
                    {isLeader ? (
                      <>
                        <Button
                          label="Ver participantes"
                          variant="secondary"
                          icon={<Ionicons name="people-outline" size={14} color={colors.secondary} />}
                          onPress={() =>
                            navigation.navigate('SalaParticipantes', {
                              salaId: sala.id,
                              cursoTitulo: curso!.nome,
                            })
                          }
                        />
                        <Button
                          label="Encerrar turma"
                          variant="secondary"
                          loading={encerrandoId === sala.id}
                          icon={
                            <Ionicons
                              name="flag-outline"
                              size={14}
                              color={colors.secondary}
                            />
                          }
                          onPress={() => confirmarEncerramento(sala)}
                        />
                      </>
                    ) : null}
                  </Card>
                );
              })
            )}
          </View>

          {/* Turma encerrada não aparece aqui: a consulta pede só as ativas.
              O registro continua no banco e chega à pessoa pelo histórico do
              Perfil, que é por usuário e não cresce com o tempo da igreja. */}

          {isLeader ? (
            <Button
              label="Criar nova turma"
              variant="secondary"
              icon={<Ionicons name="add-circle-outline" size={16} color={colors.secondary} />}
              onPress={() =>
                navigation.navigate('CreateSala', {
                  cursoId: route.params.id,
                  cursoTitulo: curso!.nome,
                })
              }
            />
          ) : null}

{/* Aqui havia "Certificado incluso" e "Material didático digital" fixos
    no código, sem nada por trás. A ementa acima diz de verdade o que o
    curso entrega. */}
          {canManage ? (
            <Button
              label="Excluir curso"
              variant="secondary"
              icon={<Ionicons name="trash-outline" size={16} color={colors.error} />}
              onPress={() =>
                Alert.alert(
                  'Excluir curso',
                  'Tem certeza que deseja excluir este curso? Essa ação não pode ser desfeita.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Excluir',
                      style: 'destructive',
                      onPress: () =>
                        excluirCurso.mutate(Number(route.params.id), {
                          onSuccess: () => navigation.goBack(),
                          onError: (e) =>
                            Alert.alert(
                              'Erro',
                              extractErrorMessage(e, 'Não foi possível excluir.'),
                            ),
                        }),
                    },
                  ],
                )
              }
            />
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
