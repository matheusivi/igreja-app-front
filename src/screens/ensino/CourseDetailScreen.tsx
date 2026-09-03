import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
  type AlertButton,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, TextField, TituloGrupo, TopBar } from '../../components';
import { elevation, tracking } from '../../constants/theme';
import {
  useAtualizarSala,
  useCancelarMatricula,
  useCurso,
  useExcluirCurso,
  useExcluirSala,
  useHistoricoMatriculas,
  useMatricular,
  useSalas,
  cursosKeys,
} from '../../hooks/queries/useCursos';
import { useAtualizarPuxando } from '../../hooks/useAtualizarPuxando';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import {
  agruparCapitulos,
  formatPeriodoSala,
  motivoSemAcesso,
  vagasRestantes,
  type Sala,
} from '../../services/courses.service';

type Props = NativeStackScreenProps<AppStackParamList, 'CursoDetail'>;

/** Acima disto a ementa começa recolhida. */
const AULAS_VISIVEIS = 5;

/**
 * Um curso e suas turmas.
 *
 * Três decisões que moldam esta tela:
 *
 * 1. **Uma ação por turma.** Para um líder matriculado, cada cartão trazia
 *    QUATRO botões de largura cheia, todos `secondary` — com três turmas,
 *    doze botões de peso idêntico, e nada sendo a ação principal. Agora é um
 *    botão primário e um "···" com o resto.
 *
 * 2. **A ementa recolhe em cinco aulas.** Ela vem antes das turmas porque é
 *    o que decide a matrícula, mas num curso de trinta aulas empurrava a
 *    ação para fora da tela.
 *
 * 3. **Saiu a caixa cinza de 160px no topo** — espaço reservado para uma
 *    imagem que não existe, acima da dobra, sem dizer nada.
 */
export function CourseDetailScreen({ route, navigation }: Props) {
  // Turma criada ou excluída noutro celular aparece ao puxar.
  const { controle } = useAtualizarPuxando([cursosKeys.all]);

  const colors = useThemeColors();
  const { user } = useAuth();
  const cursoId = route.params.id;

  const isLeader = ['Líder', 'Pastor', 'Administrador'].includes(user?.perfil ?? '');
  const { data: curso, isPending: isLoading, error: cursoError } = useCurso(cursoId);
  const { data: salas = [] } = useSalas(cursoId);
  const { data: historico = [] } = useHistoricoMatriculas();

  const matricular = useMatricular();
  const cancelarMatricula = useCancelarMatricula();
  const atualizarSala = useAtualizarSala();
  const excluirSala = useExcluirSala();
  const excluirCurso = useExcluirCurso();

  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [buscaTurma, setBuscaTurma] = useState('');
  const [ementaAberta, setEmentaAberta] = useState(false);

  const podeGerenciarCurso =
    curso?.criador.id === user?.id ||
    ['Pastor', 'Administrador'].includes(user?.perfil ?? '');
  const error = cursoError ? extractErrorMessage(cursoError) : null;

  /** Qual turma está com requisição em voo — só o botão dela gira. */
  const emVoo =
    (matricular.isPending ? matricular.variables?.salaId : null) ??
    (cancelarMatricula.isPending ? cancelarMatricula.variables?.salaId : null) ??
    (atualizarSala.isPending ? atualizarSala.variables?.salaId : null) ??
    null;

  /**
   * Derivado do histórico, e não de um estado próprio.
   *
   * Antes esta tela mantinha a lista de turmas matriculadas num `useState`
   * paralelo. Ao cancelar, ela só apagava o item do próprio estado — o resto
   * do app continuava achando que a matrícula existia. Uma fonte só.
   */
  const matriculadoEm = useMemo(
    () =>
      new Set(
        historico
          .filter((m) => m.status === 'ativo' && String(m.cursoId) === cursoId)
          .map((m) => m.salaId),
      ),
    [historico, cursoId],
  );

  /**
   * A busca cobre líder e nome da turma. Com várias turmas do mesmo curso,
   * procurar pelo líder é como a pessoa se orienta ("a turma do João").
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

  // `?? []` porque o backend só devolve `capitulos` depois da migration — sem
  // isso a tela quebraria em quem ainda estiver com o servidor antigo.
  const capitulos = curso?.capitulos ?? [];
  const aulasVisiveis =
    ementaAberta || capitulos.length <= AULAS_VISIVEIS + 1
      ? capitulos
      : capitulos.slice(0, AULAS_VISIVEIS);

  // O servidor já não devolve turmas para quem não tem acesso. A tela precisa
  // saber o motivo para dizer "é exclusivo para mulheres" em vez de deixar a
  // pessoa achando que o curso está sem turma e voltar todo mês.
  const semAcesso = curso ? motivoSemAcesso(curso.categoria, user?.sexo) : null;

  function matricularEm(salaId: number) {
    setErroAcao(null);
    matricular.mutate(
      { salaId, cursoId },
      {
        onSuccess: () => navigation.navigate('Sala', { salaId, cursoNome: curso!.nome }),
        onError: (e) =>
          setErroAcao(extractErrorMessage(e, 'Não foi possível concluir a matrícula.')),
      },
    );
  }

  function cancelar(sala: Sala) {
    Alert.alert(
      'Cancelar matrícula',
      `Sair de "${sala.nomeSala}"? Você pode se matricular de novo enquanto houver vaga.`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar matrícula',
          style: 'destructive',
          onPress: () => {
            setErroAcao(null);
            cancelarMatricula.mutate(
              { salaId: sala.id, cursoId },
              {
                onError: (e) =>
                  setErroAcao(
                    extractErrorMessage(e, 'Não foi possível cancelar a matrícula.'),
                  ),
              },
            );
          },
        },
      ],
    );
  }

  function encerrar(sala: Sala) {
    Alert.alert(
      'Encerrar turma',
      `Encerrar "${sala.nomeSala}"? Os ${sala.totalMatriculas} matriculados passam a constar como concluintes, e a turma sai desta lista — ela continua no histórico de quem participou.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          onPress: () =>
            atualizarSala.mutate(
              { salaId: sala.id, cursoId, payload: { status: 'concluída' } },
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

  function excluirTurma(sala: Sala) {
    Alert.alert(
      'Excluir turma',
      sala.totalMatriculas > 0
        ? `"${sala.nomeSala}" tem ${sala.totalMatriculas} matriculado(s). Excluir apaga o registro de quem participou — só o administrador consegue. Para finalizá-la preservando o histórico, use "Encerrar turma".`
        : `Excluir "${sala.nomeSala}"? Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () =>
            excluirSala.mutate(
              { salaId: sala.id, cursoId },
              {
                onError: (e) =>
                  Alert.alert(
                    'Não foi possível excluir',
                    extractErrorMessage(e, 'Tente novamente.'),
                  ),
              },
            ),
        },
      ],
    );
  }

  /**
   * Tudo o que não é a ação principal da turma.
   *
   * Um menu nativo em vez de três botões: quem se matricula não precisa
   * atravessar "Ver participantes" e "Encerrar turma" para chegar ao que veio
   * fazer. E as opções mudam com o papel, então uma pilha fixa de botões
   * mostraria coisas inúteis para a maioria.
   */
  function abrirMenuTurma(sala: Sala) {
    const opcoes: AlertButton[] = [];

    if (matriculadoEm.has(sala.id)) {
      opcoes.push({ text: 'Cancelar minha matrícula', onPress: () => cancelar(sala) });
    }
    if (isLeader) {
      opcoes.push({
        text: 'Ver participantes',
        onPress: () =>
          navigation.navigate('SalaParticipantes', {
            salaId: sala.id,
            cursoTitulo: curso!.nome,
          }),
      });
      opcoes.push({ text: 'Encerrar turma', onPress: () => encerrar(sala) });
      opcoes.push({
        text: 'Excluir turma',
        style: 'destructive',
        onPress: () => excluirTurma(sala),
      });
    }
    opcoes.push({ text: 'Fechar', style: 'cancel' });

    Alert.alert(sala.nomeSala, undefined, opcoes);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Barra sem título: o nome do curso abre o conteúdo em 30px, cem
          pixels abaixo. Repetir aqui era dizer a mesma coisa duas vezes — e
          a versão da barra ainda era a pior, truncada em uma linha. */}
      <TopBar
        title=""
        onBack={() => navigation.goBack()}
        {...(podeGerenciarCurso
          ? {
              actionIcon: 'pencil-outline' as const,
              actionLabel: 'Editar este curso',
              onActionPress: () => navigation.navigate('EditCurso', { id: cursoId }),
            }
          : {})}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error || !curso ? (
        <View className="flex-1 items-center justify-center gap-md bg-background px-gutter">
          <Text className="text-center font-sans text-[14px] text-ink-muted">
            {error ?? 'Curso não encontrado.'}
          </Text>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text className="font-sans-semibold text-[14px] text-secondary">Voltar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          className="flex-1 bg-background px-gutter"
          contentContainerClassName="pb-3xl pt-lg"
          keyboardShouldPersistTaps="handled"
          refreshControl={controle}
        >
          {/* ═══ IDENTIDADE ══════════════════════════════════════════
              Três blocos com pesos DIFERENTES, e não três parágrafos
              cinzentos empilhados.

              O que estava errado: título, meta e descrição tinham o mesmo
              `gap` de 8px e as duas últimas a mesma cor (`ink-muted`). Sem
              diferença de espaço nem de tinta, o olho lia um bloco só de
              texto — a queixa de "está tudo muito junto" é literalmente
              isso.

              Agora:
              · título e meta ficam COLADOS (4px) — são a mesma unidade, o
                nome e sua ficha técnica;
              · a descrição se afasta (24px) e vem em `ink`, não `ink-muted`.
                Ela é o texto principal desta tela, o que a pessoa lê para
                decidir; deixá-la cinza a rebaixava ao nível da meta.

              A hierarquia aparece sozinha, sem precisar de fio nem caixa. */}
          <View className="gap-xs">
            <Text
              accessibilityRole="header"
              className="font-serif-bold text-[28px] leading-9 text-ink"
              style={{ letterSpacing: tracking.title }}
            >
              {curso.nome}
            </Text>

            {/* A categoria era um comprimido `bg-success-soft` com
                `text-on-success`: verde claro com texto BRANCO, 1,30:1 — o
                mesmo par trocado que já apareceu em três lugares. E verde
                significa confirmação; "Casais" não confirma nada. */}
            <Text className="font-sans text-[13px] text-ink-muted">
              {[
                curso.categoria,
                capitulos.length > 0 ? `${capitulos.length} aulas` : null,
                curso.duracao,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>

          {curso.descricaoMaterial ? (
            /* `leading-6` e não `leading-7`: 28px de entrelinha é medida de
               LEITURA longa, do devocional. Aqui é um parágrafo de catálogo,
               que a pessoa varre para decidir. Entrelinha larga demais afasta
               as linhas e faz um texto de cinco parecer de dez. */
            <Text className="pt-lg font-sans text-[15px] leading-6 text-ink">
              {curso.descricaoMaterial}
            </Text>
          ) : null}

          {/* Público-alvo é ressalva, não descrição. Fica depois, menor e em
              cinza — é o que a pessoa checa DEPOIS de se interessar. */}
          {curso.publicoAlvo ? (
            <View className="flex-row items-start gap-sm pt-md">
              <MaterialCommunityIcons
                name="account-group-outline"
                size={15}
                color={colors.inkMuted}
                style={{ marginTop: 2 }}
              />
              <Text className="flex-1 font-sans text-[13px] leading-5 text-ink-muted">
                {curso.publicoAlvo}
              </Text>
            </View>
          ) : null}

          {/* ═══ EMENTA ══════════════════════════════════════════════ */}
          {capitulos.length > 0 ? (
            <View>
              <TituloGrupo>O que você vai estudar</TituloGrupo>

              <View
                className="mt-sm self-stretch overflow-hidden rounded-lg bg-surface-bright"
                style={elevation.subtle}
              >
                {agruparCapitulos(aulasVisiveis).map((grupo, gi) => (
                  <View key={grupo.secao ?? `grupo-${gi}`}>
                    {grupo.secao ? (
                      <View className="bg-surface-dim px-lg py-sm">
                        <Text className="font-sans-semibold text-[12px] text-ink-muted">
                          {grupo.secao}
                        </Text>
                      </View>
                    ) : null}

                    {grupo.itens.map((cap) => (
                      <View
                        key={cap.id}
                        className="flex-row items-start gap-md px-lg py-md"
                      >
                        {/* Era `text-gold` — 2,96:1 sobre branco, abaixo até
                            do piso de texto grande. O dourado desta paleta é
                            fundo, não tinta sobre claro. */}
                        <Text className="w-6 font-serif-bold text-[14px] text-secondary">
                          {cap.ordem}
                        </Text>
                        <Text className="flex-1 font-sans text-[14px] leading-6 text-ink">
                          {cap.titulo}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}

                {capitulos.length > aulasVisiveis.length ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setEmentaAberta(true)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  >
                    <View className="min-h-[48px] flex-row items-center justify-center gap-1.5 border-t border-outline-variant">
                      <Text className="font-sans-semibold text-[14px] text-secondary">
                        Ver as {capitulos.length} aulas
                      </Text>
                      <MaterialCommunityIcons
                        name="chevron-down"
                        size={18}
                        color={colors.secondary}
                      />
                    </View>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* ═══ TURMAS ══════════════════════════════════════════════ */}
          <View>
            <TituloGrupo>Turmas abertas</TituloGrupo>

            {/* A busca só aparece quando há turmas o bastante para valer a
                pena procurar — com duas, o campo só ocupa espaço. */}
            {!semAcesso && salas.length > 2 ? (
              <View className="pt-sm">
                <TextField
                  label="Buscar turma"
                  placeholder="Nome da turma ou do líder"
                  value={buscaTurma}
                  onChangeText={setBuscaTurma}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            ) : null}

            {erroAcao ? (
              <Text className="pt-sm font-sans text-[13px] text-error">{erroAcao}</Text>
            ) : null}

            <View className="gap-md pt-md">
              {semAcesso ? (
                <Aviso
                  icone="lock-outline"
                  titulo={semAcesso}
                  texto="Você pode ver o conteúdo, mas não participar das turmas."
                />
              ) : salasFiltradas.length === 0 ? (
                <Aviso
                  icone="school-outline"
                  titulo={
                    buscaTurma.trim()
                      ? 'Nenhuma turma com esse nome'
                      : 'Nenhuma turma aberta no momento'
                  }
                  texto={
                    buscaTurma.trim()
                      ? 'Tente o nome do líder, ou limpe a busca.'
                      : 'Quando a liderança abrir uma turma deste curso, ela aparece aqui.'
                  }
                />
              ) : (
                salasFiltradas.map((sala) => (
                  <CartaoTurma
                    key={sala.id}
                    sala={sala}
                    matriculado={matriculadoEm.has(sala.id)}
                    processando={emVoo === sala.id}
                    // O menu só existe quando há o que colocar nele.
                    temMenu={isLeader || matriculadoEm.has(sala.id)}
                    onMenu={() => abrirMenuTurma(sala)}
                    onEntrar={() =>
                      navigation.navigate('Sala', { salaId: sala.id, cursoNome: curso.nome })
                    }
                    onMatricular={() => matricularEm(sala.id)}
                  />
                ))
              )}
            </View>
          </View>

          {/* ═══ LIDERANÇA ═══════════════════════════════════════════
              Separado do resto: são ações sobre o CURSO, não sobre a
              participação de ninguém. Antes ficavam soltas no fim, com o
              mesmo peso dos botões de matrícula. */}
          {isLeader || podeGerenciarCurso ? (
            <View className="gap-sm pt-2xl">
              <TituloGrupo>Gestão</TituloGrupo>

              {isLeader ? (
                <Button
                  label="Criar nova turma"
                  variant="outline"
                  icon={
                    <MaterialCommunityIcons name="plus" size={17} color={colors.ink} />
                  }
                  onPress={() =>
                    navigation.navigate('CreateSala', {
                      cursoId,
                      cursoTitulo: curso.nome,
                    })
                  }
                />
              ) : null}

              {podeGerenciarCurso ? (
                <Button
                  label="Excluir curso"
                  variant="destructive"
                  onPress={() =>
                    Alert.alert(
                      'Excluir curso',
                      'Excluir este curso e todas as suas turmas? Essa ação não pode ser desfeita.',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Excluir',
                          style: 'destructive',
                          onPress: () =>
                            excluirCurso.mutate(Number(cursoId), {
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
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */

function Aviso({
  icone,
  titulo,
  texto,
}: {
  icone: keyof typeof MaterialCommunityIcons.glyphMap;
  titulo: string;
  texto: string;
}) {
  const colors = useThemeColors();
  return (
    <View className="items-center gap-sm px-lg py-2xl">
      <MaterialCommunityIcons name={icone} size={26} color={colors.inkMuted} />
      <Text className="text-center font-sans-semibold text-[15px] text-ink">{titulo}</Text>
      <Text className="max-w-[300px] text-center font-sans text-[13px] leading-5 text-ink-muted">
        {texto}
      </Text>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TURMA
   ══════════════════════════════════════════════════════════════════════ */

function CartaoTurma({
  sala,
  matriculado,
  processando,
  temMenu,
  onMenu,
  onEntrar,
  onMatricular,
}: {
  sala: Sala;
  matriculado: boolean;
  processando: boolean;
  temMenu: boolean;
  onMenu: () => void;
  onEntrar: () => void;
  onMatricular: () => void;
}) {
  const colors = useThemeColors();
  const vagas = vagasRestantes(sala);
  const periodo = formatPeriodoSala(sala);
  const lotada = vagas === 0 && !matriculado;

  return (
    <View
      className="gap-md self-stretch rounded-lg bg-surface-bright p-lg"
      style={elevation.subtle}
    >
      <View className="flex-row items-start gap-sm">
        <Text
          className="flex-1 font-serif-bold text-[17px] leading-6 text-ink"
          style={{ letterSpacing: tracking.heading }}
        >
          {sala.nomeSala}
        </Text>

        {sala.publico !== 'Todos' ? (
          <Text className="rounded-md bg-surface-dim px-2 py-0.5 font-sans-semibold text-[11px] text-secondary">
            Só {sala.publico.toLowerCase()}
          </Text>
        ) : null}

        {lotada ? (
          <Text className="rounded-md bg-surface-dim px-2 py-0.5 font-sans-semibold text-[11px] text-error">
            Lotada
          </Text>
        ) : null}
      </View>

      {sala.lider ? (
        <View className="flex-row items-center gap-sm">
          <Avatar nome={sala.lider.nomeCompleto} fotoUrl={sala.lider.fotoUrl} size={28} />
          <Text className="flex-1 font-sans text-[13px] text-ink-muted" numberOfLines={1}>
            <Text className="font-sans-medium text-ink">{sala.lider.nomeCompleto}</Text>
            {' · lidera'}
          </Text>
        </View>
      ) : null}

      {/* Período e vagas numa linha só. Eram duas linhas com ícone cada, e
          juntas ocupavam mais espaço que o nome da turma. */}
      <View className="flex-row items-center gap-1">
        <MaterialCommunityIcons name="calendar-blank-outline" size={13} color={colors.inkMuted} />
        <Text className="flex-1 font-sans text-[13px] text-ink-muted" numberOfLines={1}>
          {[
            periodo,
            sala.capacidade === null
              ? `${sala.totalMatriculas} matriculados`
              : `${sala.totalMatriculas}/${sala.capacidade} vagas`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        {vagas !== null && vagas > 0 && vagas <= 3 ? (
          <Text className="font-sans-semibold text-[13px] text-error">
            {vagas === 1 ? 'Última vaga' : `Últimas ${vagas}`}
          </Text>
        ) : null}
      </View>

      {/* ═══ UMA AÇÃO, E O RESTO NO MENU ═══
          O botão diz o que fazer agora; "···" guarda o que é raro (cancelar
          matrícula) ou de liderança (participantes, encerrar, excluir). */}
      <View className="flex-row items-center gap-sm">
        <View className="flex-1">
          <Button
            label={
              matriculado ? 'Entrar na turma' : lotada ? 'Turma lotada' : 'Matricular-se'
            }
            variant={matriculado ? 'secondary' : 'primary'}
            loading={processando}
            disabled={lotada && !matriculado}
            icon={
              <MaterialCommunityIcons
                name={matriculado ? 'arrow-right' : 'check'}
                size={17}
                // Era `colors.onGold` num botão TERRACOTA — marrom escuro
                // sobre terracota dá 2,5:1. O par do primário é `onPrimary`.
                color={matriculado ? colors.ink : colors.onPrimary}
              />
            }
            onPress={matriculado ? onEntrar : onMatricular}
          />
        </View>

        {temMenu ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Mais opções da turma ${sala.nomeSala}`}
            onPress={onMenu}
            // 20 de glifo + 12 de folga = 44 de alvo.
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <MaterialCommunityIcons
              name="dots-horizontal"
              size={20}
              color={colors.inkMuted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
