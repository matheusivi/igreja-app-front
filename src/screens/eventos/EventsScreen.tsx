import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Chip } from '../../components';
import { spacing, tracking } from '../../constants/theme';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useDeleteEvento, useEventosMes } from '../../hooks/queries/useEventos';
import { useAuth } from '../../navigation/AuthContext';
import { EspacoTabBar } from '../../navigation/TabBar';
import type { AppStackParamList } from '../../navigation/types';
import { formatEventTime, type EventoItem } from '../../services/events.service';
import { extractErrorMessage } from '../../services/api';
import { urlImagem } from '../../services/imagem';

/**
 * Agenda da igreja.
 *
 * ═══ O CABEÇALHO ═══
 * Era sobretítulo "Comunidade e fé" + título "Eventos da Igreja" + subtítulo
 * "Cultos, encontros e datas especiais", e logo abaixo, num card separado, o
 * nome do mês com duas setas. Quatro blocos de texto empilhados para dizer
 * uma coisa só, e o CONTROLE (o mês) longe do título.
 *
 * Agora o mês é o título. Ele é o que muda, é o que a pessoa navega, e é o
 * contexto de tudo que está embaixo — então ele merece o corpo grande e as
 * setas ao lado, no mesmo bloco. "Agenda" vira sobretítulo pequeno, porque
 * repetir o nome da tela em 26px é gastar a área mais valiosa com informação
 * que a barra de abas já deu.
 *
 * ═══ NENHUM DIA VEM SELECIONADO ═══
 * A tela abria com o dia de hoje já filtrado, o que produzia duas coisas
 * ruins: a lista mostrava só os eventos de hoje (quase sempre nenhum), e
 * precisava daquela linha "Mostrando dia 7 · toque para ver todos" para
 * explicar o filtro que a própria tela tinha ligado sozinha.
 *
 * Abrir mostrando o MÊS INTEIRO é o comportamento certo: quem chega na agenda
 * quer saber o que vem, não o que tem hoje. O dia vira filtro só quando a
 * pessoa toca nele — e aí o próprio dia fica marcado no calendário, que já
 * comunica o estado sem precisar de legenda.
 *
 * ═══ CATEGORIA VALE O MÊS ═══
 * Consequência direta do item acima: com nenhum dia preso, escolher "Cultos"
 * mostra todos os cultos do mês. Antes o dia de hoje limitava tudo, e a
 * categoria parecia não funcionar.
 *
 * ═══ O CARD DE EVENTO ═══
 * Ganhou bloco de data à esquerda — dia grande, mês pequeno. É o padrão de
 * agenda que existe desde o papel: a data é a âncora que permite varrer a
 * lista verticalmente sem ler nada. Antes a data estava no rodapé do card,
 * junto do horário e do local, e era preciso ler para achar.
 */

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const MESES_CURTO = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

type TipoFilter = EventoItem['tipo'] | 'todos';

const categoryFilters: { key: TipoFilter; label: string }[] = [
  { key: 'todos', label: 'Tudo' },
  { key: 'Culto', label: 'Cultos' },
  { key: 'Reunião', label: 'Reuniões' },
  { key: 'Conferência', label: 'Conferências' },
  { key: 'Retiro', label: 'Retiros' },
];

function useMonthGrid(reference: Date) {
  return useMemo(() => {
    const year = reference.getFullYear();
    const month = reference.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return [
      ...Array(firstWeekday).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ] as (number | null)[];
  }, [reference]);
}

function canManageEvento(event: EventoItem, userId?: number, perfil?: string): boolean {
  return event.criadorId === userId || ['Pastor', 'Administrador'].includes(perfil ?? '');
}

export function EventsScreen() {
  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();
  const isLeader = ['Líder', 'Pastor', 'Administrador'].includes(user?.perfil ?? '');
  const realToday = useMemo(() => new Date(), []);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  // `null` de propósito: a agenda abre no mês inteiro. Ver o comentário do topo.
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<TipoFilter>('todos');

  const cells = useMonthGrid(currentDate);
  const mesLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long' });
  const anoLabel = currentDate.getFullYear();

  const { data: eventosMes, isPending, isFetching, error: queryError } = useEventosMes(
    currentDate.getMonth() + 1,
    currentDate.getFullYear(),
  );
  const deleteEvento = useDeleteEvento();
  const error = queryError ? extractErrorMessage(queryError) : null;

  function mudarMes(passo: number) {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + passo, 1));
    setSelectedDay(null);
  }

  function confirmDeleteEvento(event: EventoItem) {
    const isRecorrente = event.recorrencia !== 'nenhuma';
    Alert.alert(
      'Excluir evento',
      isRecorrente
        ? `"${event.titulo}" é um evento que se repete. Excluir vai remover TODAS as repetições dele no calendário, não só a deste dia. Essa ação não pode ser desfeita.`
        : `Excluir "${event.titulo}"? Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: isRecorrente ? 'Excluir todas' : 'Excluir',
          style: 'destructive',
          onPress: () =>
            deleteEvento.mutate(event.id, {
              onError: (e) =>
                Alert.alert('Erro', extractErrorMessage(e, 'Não foi possível excluir.')),
            }),
        },
      ],
    );
  }

  const allEvents = useMemo(
    () =>
      (eventosMes?.data ?? []).flatMap(({ dia, eventos }) =>
        eventos.map((e) => ({ ...e, dia })),
      ),
    [eventosMes],
  );

  /**
   * Dias com evento, JÁ considerando a categoria escolhida.
   *
   * Antes o ponto no calendário ignorava o filtro: com "Cultos" selecionado,
   * dias que só têm reunião continuavam marcados, e tocar neles trazia lista
   * vazia. O marcador precisa concordar com o que a lista vai mostrar.
   */
  const daysWithEvents = useMemo(() => {
    const lista =
      activeFilter === 'todos' ? allEvents : allEvents.filter((e) => e.tipo === activeFilter);
    return new Set(lista.map((e) => e.dia));
  }, [allEvents, activeFilter]);

  const filteredEvents = useMemo(() => {
    let list = allEvents;
    if (activeFilter !== 'todos') list = list.filter((e) => e.tipo === activeFilter);
    if (selectedDay !== null) list = list.filter((e) => e.dia === selectedDay);
    return [...list].sort((a, b) => a.dia - b.dia);
  }, [allEvents, selectedDay, activeFilter]);

  const isViewingCurrentMonth =
    currentDate.getMonth() === realToday.getMonth() &&
    currentDate.getFullYear() === realToday.getFullYear();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* ── Cabeçalho: o MÊS é o título ─────────────────────────────── */}
      <View className="bg-background px-gutter pb-lg pt-md">
        <View className="h-11 flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={({ pressed }) => pressed && { opacity: 0.6 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </Pressable>

          <View className="flex-row items-center gap-md">
            {isFetching && !isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : null}
            {isLeader ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Novo evento"
                onPress={() => navigation.navigate('CreateEvento')}
                hitSlop={12}
                style={({ pressed }) => pressed && { opacity: 0.6 }}
              >
                <Ionicons name="add" size={26} color={colors.primary} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <Text
          className="mt-sm font-sans-semibold text-[11px] uppercase text-secondary"
          style={{ letterSpacing: tracking.overline }}
        >
          Agenda da igreja
        </Text>

        {/* Título e navegação no MESMO bloco: o mês é o que muda, então o
            controle mora ao lado dele em vez de num card separado. */}
        <View className="mt-xs flex-row items-center justify-between">
          <Text
            className="flex-1 font-serif-bold text-[26px] capitalize leading-8 text-ink"
            style={{ letterSpacing: tracking.title }}
          >
            {mesLabel}{' '}
            <Text className="text-ink-muted">{anoLabel}</Text>
          </Text>

          <View className="flex-row items-center gap-xs">
            <SetaMes direcao="anterior" onPress={() => mudarMes(-1)} />
            <SetaMes direcao="proxima" onPress={() => mudarMes(1)} />
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-xl pb-xl"
      >
        {/* ── Calendário ──────────────────────────────────────────────── */}
        <View className="px-gutter">
          <Card variant="bordered" contentClassName="gap-md">
            <View className="flex-row">
              {WEEKDAYS.map((d, i) => (
                <Text
                  key={i}
                  className="flex-1 text-center font-sans-semibold text-[11px] uppercase text-ink-muted"
                  style={{ letterSpacing: tracking.overline }}
                >
                  {d}
                </Text>
              ))}
            </View>

            {isPending ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
            ) : (
              <View className="flex-row flex-wrap">
                {cells.map((day, index) => {
                  const isToday = isViewingCurrentMonth && day === realToday.getDate();
                  const isSelected = day !== null && day === selectedDay;
                  const hasEvent = day !== null && daysWithEvents.has(day);

                  return (
                    <Pressable
                      key={index}
                      disabled={day === null}
                      accessibilityRole={day ? 'button' : undefined}
                      accessibilityState={isSelected ? { selected: true } : {}}
                      accessibilityLabel={
                        day
                          ? `Dia ${day}${hasEvent ? ', tem evento' : ''}${isSelected ? ', filtrando' : ''}`
                          : undefined
                      }
                      onPress={() => day && setSelectedDay(day === selectedDay ? null : day)}
                      // 44 de altura: a célula é o alvo, e sete numa linha de
                      // 353 dão 50 de largura. Passa o mínimo com folga.
                      style={{ width: '14.28%', height: 44 }}
                      className="items-center justify-center"
                    >
                      {day ? (
                        <View className="items-center">
                          <View
                            className={[
                              'h-8 w-8 items-center justify-center rounded-full',
                              isSelected
                                ? 'bg-primary'
                                : isToday
                                  ? 'border border-primary'
                                  : '',
                            ].join(' ')}
                          >
                            <Text
                              className={[
                                'text-[15px]',
                                isSelected
                                  ? 'font-sans-semibold text-on-primary'
                                  : isToday
                                    ? 'font-sans-semibold text-primary'
                                    : 'font-sans-medium text-ink',
                              ].join(' ')}
                            >
                              {day}
                            </Text>
                          </View>
                          {/* O ponto vive FORA do círculo e sempre ocupa o
                              mesmo espaço, com ou sem evento — senão a linha
                              inteira sobe e desce conforme o mês. */}
                          <View
                            style={{
                              height: 4,
                              width: 4,
                              marginTop: 2,
                              borderRadius: 2,
                              backgroundColor:
                                hasEvent && !isSelected ? colors.gold : 'transparent',
                            }}
                          />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Card>
        </View>

        {/* ── Categorias ──────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.gutter, gap: spacing.sm }}
        >
          {categoryFilters.map((filter) => (
            <Chip
              key={filter.key}
              label={filter.label}
              active={activeFilter === filter.key}
              onPress={() => setActiveFilter(filter.key)}
            />
          ))}
        </ScrollView>

        {/* ── Lista ───────────────────────────────────────────────────── */}
        <View className="gap-md px-gutter">
          <View className="flex-row items-center justify-between">
            <Text className="font-serif-bold text-lg text-ink">
              {selectedDay !== null ? `Dia ${selectedDay}` : 'Neste mês'}
            </Text>

            {/* Sai o "toque para ver todos": quando um dia está preso, um
                botão NOMEADO desfaz o filtro. Instrução em texto solto
                explica a interface; botão é a interface. */}
            {selectedDay !== null ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ver o mês inteiro"
                onPress={() => setSelectedDay(null)}
                hitSlop={10}
                style={({ pressed }) => pressed && { opacity: 0.6 }}
                className="flex-row items-center gap-1"
              >
                <Ionicons name="close-circle" size={16} color={colors.secondary} />
                <Text className="font-sans-semibold text-[13px] text-secondary">
                  Ver o mês
                </Text>
              </Pressable>
            ) : null}
          </View>

          {error ? (
            <Text className="py-8 text-center font-sans text-sm text-ink-muted">{error}</Text>
          ) : filteredEvents.length === 0 && !isPending ? (
            <Card variant="tinted" contentClassName="items-center gap-sm py-xl">
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={26}
                color={colors.inkMuted}
              />
              <Text className="text-center font-sans text-sm text-ink-muted">
                {selectedDay !== null
                  ? `Nenhum evento no dia ${selectedDay}.`
                  : activeFilter !== 'todos'
                    ? `Nenhum evento desta categoria neste mês.`
                    : 'Nenhum evento neste mês.'}
              </Text>
            </Card>
          ) : (
            filteredEvents.map((event) => (
              <CardEvento
                key={`${event.id}-${event.dia}`}
                event={event}
                mes={currentDate.getMonth()}
                podeGerenciar={canManageEvento(event, user?.id, user?.perfil)}
                onAbrir={() =>
                  navigation.navigate('EventoDetail', { id: String(event.id) })
                }
                onEditar={() =>
                  navigation.navigate('CreateEvento', { id: String(event.id) })
                }
                onExcluir={() => confirmDeleteEvento(event)}
              />
            ))
          )}
        </View>

        <EspacoTabBar />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

function SetaMes({
  direcao,
  onPress,
}: {
  direcao: 'anterior' | 'proxima';
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={direcao === 'anterior' ? 'Mês anterior' : 'Próximo mês'}
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surfaceDim,
        },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Ionicons
        name={direcao === 'anterior' ? 'chevron-back' : 'chevron-forward'}
        size={19}
        color={colors.ink}
      />
    </Pressable>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

type CardEventoProps = {
  event: EventoItem & { dia: number };
  mes: number;
  podeGerenciar: boolean;
  onAbrir: () => void;
  onEditar: () => void;
  onExcluir: () => void;
};

/**
 * Card com bloco de data à esquerda.
 *
 * A data saiu do rodapé e virou âncora: dia em serifada grande, mês em
 * versalete. É o que permite varrer a lista verticalmente sem ler título
 * nenhum — os números formam uma coluna, e o olho acha "dia 17" na hora.
 *
 * O botão "Ver detalhes" saiu. O card inteiro abre o evento, e um botão de
 * largura total dentro de cada item de lista empurra o próximo card para
 * fora da tela sem acrescentar nada.
 */
function CardEvento({
  event,
  mes,
  podeGerenciar,
  onAbrir,
  onEditar,
  onExcluir,
}: CardEventoProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.titulo}, dia ${event.dia} de ${MESES_CURTO[mes]}, às ${formatEventTime(event.dataInicio)}`}
      onPress={onAbrir}
      style={({ pressed }) => pressed && { opacity: 0.7 }}
    >
      <Card variant="bordered" contentClassName="flex-row gap-lg">
        {/* Bloco de data */}
        <View className="items-center" style={{ width: 44 }}>
          <Text
            className="font-serif-bold text-[24px] leading-7 text-primary"
            style={{ letterSpacing: tracking.heading }}
          >
            {String(event.dia).padStart(2, '0')}
          </Text>
          <Text
            className="font-sans-semibold text-[11px] uppercase text-ink-muted"
            style={{ letterSpacing: tracking.overline }}
          >
            {MESES_CURTO[mes]}
          </Text>
        </View>

        <View className="flex-1 gap-xs">
          <View className="flex-row items-center gap-2">
            {event.cor ? (
              <View
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: event.cor }}
              />
            ) : null}
            <Text
              className="font-sans-semibold text-[11px] uppercase text-secondary"
              style={{ letterSpacing: tracking.overline }}
            >
              {event.tipo}
            </Text>
            {/* Deixa claro que é UM evento repetindo, não vários eventos
                iguais — era o que confundia na hora de excluir. */}
            {event.recorrencia !== 'nenhuma' ? (
              <MaterialCommunityIcons name="repeat" size={13} color={colors.inkMuted} />
            ) : null}
          </View>

          <Text numberOfLines={2} className="font-serif-bold text-base leading-6 text-ink">
            {event.titulo}
          </Text>

          <View className="flex-row flex-wrap items-center gap-md">
            <View className="flex-row items-center gap-1">
              <MaterialCommunityIcons
                name="clock-outline"
                size={13}
                color={colors.inkMuted}
              />
              <Text className="font-sans text-[13px] text-ink-muted">
                {formatEventTime(event.dataInicio)}
              </Text>
            </View>
            {event.local ? (
              <View className="flex-1 flex-row items-center gap-1">
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={13}
                  color={colors.inkMuted}
                />
                <Text numberOfLines={1} className="flex-1 font-sans text-[13px] text-ink-muted">
                  {event.local}
                </Text>
              </View>
            ) : null}
          </View>

          {event.imagemUrl ? (
            <Image
              source={{ uri: urlImagem(event.imagemUrl, { largura: 260, altura: 88 }) }}
              className="mt-xs w-full rounded-sm"
              style={{ height: 88 }}
              resizeMode="cover"
              accessible={false}
            />
          ) : null}
        </View>

        {podeGerenciar ? (
          <View className="gap-lg">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Editar ${event.titulo}`}
              onPress={onEditar}
              hitSlop={12}
              style={({ pressed }) => pressed && { opacity: 0.6 }}
            >
              <MaterialCommunityIcons name="pencil-outline" size={17} color={colors.secondary} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Excluir ${event.titulo}`}
              onPress={onExcluir}
              hitSlop={12}
              style={({ pressed }) => pressed && { opacity: 0.6 }}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={17} color={colors.error} />
            </Pressable>
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}
