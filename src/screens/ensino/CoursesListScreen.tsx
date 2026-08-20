import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip, ScreenHeader, TextField, TituloGrupo } from '../../components';
import { elevation, radius, spacing, tracking } from '../../constants/theme';
import {
  cursosKeys,
  useCursos,
  useHistoricoMatriculas,
} from '../../hooks/queries/useCursos';
import { useAtualizarPuxando } from '../../hooks/useAtualizarPuxando';
import { useThemeColors } from '../../hooks/useThemeColors';
import { EspacoTabBar } from '../../navigation/TabBar';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import type { Curso, MatriculaHistorico } from '../../services/courses.service';

type CategoriaFilter = Curso['categoria'] | 'todos';

const FILTROS: { key: CategoriaFilter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'Geral', label: 'Geral' },
  { key: 'Homens', label: 'Homens' },
  { key: 'Mulheres', label: 'Mulheres' },
  { key: 'Casais', label: 'Casais' },
  { key: 'Jovens', label: 'Jovens' },
  { key: 'Batismo', label: 'Batismo' },
];

/** Mesma normalização do resto do app: "batismo" encontra "Batismo". */
function semAcento(t: string) {
  return t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Cursos.
 *
 * ═══ O CURSO EM ANDAMENTO ESTAVA NA TELA ERRADA ═══
 * "Em andamento" só aparecia no Perfil. O Perfil é sobre VOCÊ — nome, foto,
 * conta; a aba Ensino é onde se estuda. Quem está no meio de um curso e abre
 * a aba de cursos encontrava o catálogo inteiro e nenhuma pista de onde
 * parou. A informação existia (`useHistoricoMatriculas`), só estava guardada
 * onde ninguém a procuraria.
 *
 * Agora ela abre a tela, no cartão escuro — a mesma cor que nas outras listas
 * significa "comece por aqui".
 *
 * ═══ CONCLUÍDO É INFORMAÇÃO, NÃO TROFÉU ═══
 * O catálogo marca o que a pessoa já concluiu. Sem isso ela abre um curso,
 * lê a ementa, tenta se matricular e descobre no erro que já fez aquilo. O
 * selo evita a viagem inteira.
 *
 * ═══ CATEGORIA DEIXOU DE SER VERDE ═══
 * Era `Chip tone="success"`. Verde é confirmação; "Homens" e "Casais" não são
 * confirmação de nada. Virou texto na linha de estado, junto com aulas e
 * duração, que é o peso que a categoria realmente tem na hora de escolher.
 */
export function CoursesListScreen() {
  /**
   * `cursosKeys.all` cobre tudo: lista, detalhe, turmas, histórico, colegas e
   * participantes são todos prefixados por `['cursos']`. Um curso publicado
   * noutro celular aparece ao puxar, sem esperar o cache vencer.
   */
  const { controle } = useAtualizarPuxando([cursosKeys.all]);

  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();
  const isLeader = ['Líder', 'Pastor', 'Administrador'].includes(user?.perfil ?? '');

  const [filtro, setFiltro] = useState<CategoriaFilter>('todos');
  const [busca, setBusca] = useState('');

  /**
   * Vem do cache compartilhado.
   *
   * Antes esta tela carregava uma vez num `useEffect` e nunca mais. Criar ou
   * excluir um curso em outra tela invalidava o cache, mas aqui não chegava
   * nada — um curso apagado continuava listado até o app ser reiniciado.
   */
  const {
    data: cursos = [],
    isPending: isLoading,
    error: queryError,
    refetch,
    isFetching,
  } = useCursos();

  const { data: historico = [] } = useHistoricoMatriculas();

  const error = queryError ? extractErrorMessage(queryError) : null;

  const emAndamento = historico.find((m) => m.status === 'ativo') ?? null;

  // `Set` e não `.some()` dentro do map: com 50 cursos e 20 matrículas, a
  // busca linear rodaria mil vezes a cada render.
  const concluidos = useMemo(
    () =>
      new Set(historico.filter((m) => m.status === 'concluido').map((m) => m.cursoId)),
    [historico],
  );

  const filtrados = useMemo(() => {
    let lista = filtro === 'todos' ? cursos : cursos.filter((c) => c.categoria === filtro);
    const termo = semAcento(busca.trim());
    if (termo) {
      // Busca também na descrição: quem procura "casamento" pode não saber
      // que o curso se chama "Alicerces do Lar".
      lista = lista.filter(
        (c) =>
          semAcento(c.nome).includes(termo) ||
          semAcento(c.descricaoMaterial ?? '').includes(termo),
      );
    }
    return lista;
  }, [cursos, filtro, busca]);

  const buscando = busca.trim().length > 0 || filtro !== 'todos';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title="Cursos"
        busy={isFetching && !isLoading}
        actionIcon="add"
        actionLabel={isLeader ? 'Criar curso' : undefined}
        onActionPress={isLeader ? () => navigation.navigate('CreateCurso') : undefined}
        acaoCompacta
        regua
      />

      <ScrollView
        className="flex-1 bg-background px-gutter"
        contentContainerClassName="pb-xl pt-lg"
        keyboardShouldPersistTaps="handled"
        refreshControl={controle}
      >
        {/* ═══ 1. ONDE VOCÊ PAROU ══════════════════════════════════ */}
        {emAndamento ? (
          <CartaoEmAndamento
            matricula={emAndamento}
            onPress={() =>
              navigation.navigate('Sala', {
                salaId: emAndamento.salaId,
                cursoNome: emAndamento.nomeCurso,
              })
            }
          />
        ) : null}

        {/* ═══ 2. O CATÁLOGO ═══════════════════════════════════════ */}
        <View className="gap-md pt-lg">
          <TextField
            label="Buscar curso"
            placeholder="Nome ou assunto — ex: batismo, casamento"
            value={busca}
            onChangeText={setBusca}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />

          <View className="flex-row flex-wrap gap-sm">
            {FILTROS.map((f) => (
              <Chip
                key={f.key}
                label={f.label}
                active={filtro === f.key}
                onPress={() => setFiltro(f.key)}
              />
            ))}
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
        ) : error ? (
          <View className="items-center gap-md py-3xl">
            <Text className="text-center font-sans text-[14px] text-ink-muted">{error}</Text>
            <Pressable onPress={() => refetch()} hitSlop={12}>
              <Text className="font-sans-semibold text-[14px] text-secondary">
                Tentar novamente
              </Text>
            </Pressable>
          </View>
        ) : filtrados.length === 0 ? (
          <View className="items-center gap-md px-lg py-3xl">
            <MaterialCommunityIcons
              name="school-outline"
              size={30}
              color={colors.inkMuted}
            />
            <Text className="text-center font-serif-bold text-[17px] text-ink">
              {buscando ? 'Nenhum curso com esse filtro' : 'Ainda não há cursos'}
            </Text>
            <Text className="max-w-[300px] text-center font-sans text-[14px] leading-6 text-ink-muted">
              {buscando
                ? 'Tente outra palavra ou volte para "Todos". A busca ignora acento e procura no nome e na descrição.'
                : 'Quando a liderança publicar um curso, ele aparece aqui.'}
            </Text>
          </View>
        ) : (
          <>
            {/* O rótulo só aparece quando há o cartão de "em andamento" acima —
                sozinho ele classificaria a única coisa da tela. */}
            {emAndamento ? (
              <TituloGrupo>{buscando ? 'Resultados' : 'Todos os cursos'}</TituloGrupo>
            ) : null}

            <View className="gap-md pt-md">
              {filtrados.map((curso) => (
                <CartaoCurso
                  key={curso.id}
                  curso={curso}
                  concluido={concluidos.has(curso.id)}
                  emAndamento={emAndamento?.cursoId === curso.id}
                  onPress={() =>
                    navigation.navigate('CursoDetail', { id: String(curso.id) })
                  }
                />
              ))}
            </View>
          </>
        )}

        {/* A barra de abas flutua sobre o conteúdo, fora do fluxo do layout.
            Sem este espaço, o último item fica escondido atrás dela. */}
        <EspacoTabBar />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   ONDE VOCÊ PAROU
   ══════════════════════════════════════════════════════════════════════ */

function CartaoEmAndamento({
  matricula,
  onPress,
}: {
  matricula: MatriculaHistorico;
  onPress: () => void;
}) {
  const colors = useThemeColors();

  const desde = new Date(matricula.dataAdicao).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Continuar o curso ${matricula.nomeCurso}`}
      onPress={onPress}
      // Nenhuma aparência no Pressable: o NativeWind escreve o `className` no
      // mesmo prop `style`, e o que perde o merge não existe.
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <View
        style={[
          {
            alignSelf: 'stretch',
            gap: spacing.lg,
            padding: spacing.xl,
            borderRadius: radius.lg,
            backgroundColor: colors.inverseSurface,
          },
          elevation.raised,
        ]}
      >
        <View className="flex-row items-center gap-sm">
          <MaterialCommunityIcons
            name="book-open-page-variant"
            size={16}
            // Acento que ACOMPANHA a inversão do cartão: dourado no tema
            // claro, terracota escura no escuro.  fixo dava 2,09:1
            // sobre o cartão claro do tema escuro — sumia.
            color={colors.onInverseAccent}
          />
          <Text className="font-sans-semibold text-[13px]" style={{ color: colors.onInverseAccent }}>
            Você está cursando
          </Text>
        </View>

        <View className="gap-xs">
          <Text
            className="font-serif-bold text-[21px] leading-7"
            style={{ color: colors.inverseInk, letterSpacing: tracking.heading }}
            numberOfLines={2}
          >
            {matricula.nomeCurso}
          </Text>
          <Text
            className="font-sans text-[14px]"
            // 78% da tinta invertida: 8,01:1 no claro, 7,60:1 no escuro.
            style={{ color: colors.inverseInk, opacity: 0.78 }}
          >
            {[matricula.nomeSala, `desde ${desde}`].filter(Boolean).join(' · ')}
          </Text>
        </View>

        <View className="flex-row items-center gap-sm">
          <Text
            className="font-sans-semibold text-[15px]"
            style={{ color: colors.inverseInk }}
          >
            Continuar
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={18}
            color={colors.inverseInk}
          />
        </View>
      </View>
    </Pressable>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   CATÁLOGO
   ══════════════════════════════════════════════════════════════════════ */

function CartaoCurso({
  curso,
  concluido,
  emAndamento,
  onPress,
}: {
  curso: Curso;
  concluido: boolean;
  emAndamento: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();

  const meta = [
    curso.categoria,
    curso.capitulos?.length ? `${curso.capitulos.length} aulas` : null,
    curso.duracao,
  ].filter(Boolean);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={curso.nome}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <View
        style={[
          {
            alignSelf: 'stretch',
            gap: spacing.sm,
            padding: spacing.lg,
            borderRadius: radius.lg,
            backgroundColor: colors.surfaceBright,
          },
          elevation.subtle,
        ]}
      >
        {/* Concluído e em andamento são estados do SEU histórico, não do
            curso. Por isso vêm antes do título: mudam a leitura de tudo o
            que vem depois — não adianta ler a ementa de algo que já se fez. */}
        {concluido || emAndamento ? (
          <View className="flex-row items-center gap-1">
            <MaterialCommunityIcons
              name={concluido ? 'check-circle' : 'progress-clock'}
              size={14}
              color={concluido ? colors.success : colors.secondary}
            />
            <Text
              className="font-sans-semibold text-[12px]"
              style={{ color: concluido ? colors.success : colors.secondary }}
            >
              {concluido ? 'Você concluiu' : 'Você está cursando'}
            </Text>
          </View>
        ) : null}

        <Text
          className="font-serif-bold text-[17px] leading-6 text-ink"
          style={{ letterSpacing: tracking.heading }}
          numberOfLines={2}
        >
          {curso.nome}
        </Text>

        {curso.descricaoMaterial ? (
          <Text className="font-sans text-[14px] leading-6 text-ink-muted" numberOfLines={2}>
            {curso.descricaoMaterial}
          </Text>
        ) : null}

        {/* A categoria vive aqui, em texto. Era um chip VERDE — e verde, nesta
            paleta, é confirmação. "Casais" não confirma nada.

            O "Ver turmas" que ficava nesta linha saiu: levava exatamente para
            onde tocar no card leva. Botão que duplica o gesto do contêiner
            ensina errado, sugerindo que o resto do card não é tocável. */}
        {meta.length > 0 ? (
          <View className="flex-row items-center gap-1 pt-xs">
            <MaterialCommunityIcons
              name="school-outline"
              size={13}
              color={colors.inkMuted}
            />
            <Text className="flex-1 font-sans text-[13px] text-ink-muted" numberOfLines={1}>
              {meta.join(' · ')}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
