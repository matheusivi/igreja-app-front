import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Chip, SectionHeader } from '../../components';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useDeleteEvento, useEventosMes } from '../../hooks/queries/useEventos';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import {
  formatEventDate,
  formatEventTime,
  type EventoItem,
} from '../../services/events.service';
import { extractErrorMessage } from '../../services/api';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

type TipoFilter = EventoItem['tipo'] | 'todos';

const categoryFilters: { key: TipoFilter; label: string }[] = [
  { key: 'todos', label: 'Todos os eventos' },
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
    const cells: (number | null)[] = [
      ...Array(firstWeekday).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    return cells;
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
  const [selectedDay, setSelectedDay] = useState<number | null>(realToday.getDate());
  const [activeFilter, setActiveFilter] = useState<TipoFilter>('todos');

  const cells = useMonthGrid(currentDate);
  const monthLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  /**
   * Todo o carregamento cabe nesta linha.
   *
   * O cache mantém os eventos do mês vivos fora da tela: ao voltar de "Novo
   * evento", a lista aparece na hora e a revalidação acontece em segundo
   * plano. `isPending` só é verdadeiro na primeiríssima carga (quando não há
   * nada em cache) — depois disso usamos `isFetching`, que atualiza sem
   * apagar o conteúdo da tela.
   */
  const { data: eventosMes, isPending, isFetching, error: queryError } = useEventosMes(
    currentDate.getMonth() + 1,
    currentDate.getFullYear(),
  );
  const deleteEvento = useDeleteEvento();

  const error = queryError ? extractErrorMessage(queryError) : null;

  function goToPreviousMonth() {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setSelectedDay(null);
  }

  function goToNextMonth() {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
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
          onPress: () => {
            deleteEvento.mutate(event.id, {
              onError: (e) =>
                Alert.alert('Erro', extractErrorMessage(e, 'Não foi possível excluir.')),
            });
          },
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

  const daysWithEvents = useMemo(() => new Set(allEvents.map((e) => e.dia)), [allEvents]);

  const filteredEvents = useMemo(() => {
    let list = allEvents;
    if (selectedDay !== null) list = list.filter((e) => e.dia === selectedDay);
    if (activeFilter !== 'todos') list = list.filter((e) => e.tipo === activeFilter);
    return list;
  }, [allEvents, selectedDay, activeFilter]);

  const isViewingCurrentMonth =
    currentDate.getMonth() === realToday.getMonth() &&
    currentDate.getFullYear() === realToday.getFullYear();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <View className="flex-row items-center gap-2">
          <Text className="font-serif-bold text-base text-primary">Eventos da Igreja</Text>
          {/* Atualização em segundo plano: avisa que está sincronizando sem
              tirar o conteúdo da tela. */}
          {isFetching && !isPending ? (
            <ActivityIndicator size="small" color={colors.gold} />
          ) : null}
        </View>
        {isLeader ? (
          <Pressable onPress={() => navigation.navigate('CreateEvento')} hitSlop={8}>
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          </Pressable>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      <ScrollView className="flex-1 px-gutter" contentContainerClassName="gap-md py-lg">
        <SectionHeader eyebrow="Comunidade e fé" title="Eventos da Igreja" />

        {/* Calendário */}
        <Card contentClassName="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="font-serif-bold text-base capitalize text-ink">{monthLabel}</Text>
            <View className="flex-row gap-4">
              <Pressable onPress={goToPreviousMonth} hitSlop={8}>
                <Ionicons name="chevron-back" size={18} color={colors.primary} />
              </Pressable>
              <Pressable onPress={goToNextMonth} hitSlop={8}>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </Pressable>
            </View>
          </View>

          <View className="flex-row justify-between">
            {WEEKDAYS.map((day, index) => (
              <Text key={index} className="w-9 text-center font-sans-semibold text-xs text-ink-muted">
                {day}
              </Text>
            ))}
          </View>

          {/* Só a primeira carga esconde o calendário. Nas seguintes, os dias
              continuam na tela enquanto os novos chegam. */}
          {isPending ? (
            <ActivityIndicator color={colors.gold} style={{ marginVertical: 16 }} />
          ) : (
            <View className="flex-row flex-wrap">
              {cells.map((day, index) => {
                const isToday = isViewingCurrentMonth && day === realToday.getDate();
                const isSelected = day === selectedDay;
                const hasEvent = day !== null && daysWithEvents.has(day);
                return (
                  <Pressable
                    key={index}
                    disabled={day === null}
                    onPress={() => day && setSelectedDay(day === selectedDay ? null : day)}
                    className="mb-1 w-[14.28%] items-center py-1.5"
                  >
                    {day ? (
                      <View className="items-center gap-0.5">
                        <View
                          className={[
                            'h-8 w-8 items-center justify-center rounded-full',
                            isToday ? 'bg-gold' : isSelected ? 'bg-surface-container-high' : '',
                          ].join(' ')}
                        >
                          <Text
                            className={[
                              'font-sans-medium text-sm',
                              isToday ? 'text-on-gold' : 'text-ink',
                            ].join(' ')}
                          >
                            {day}
                          </Text>
                        </View>
                        {hasEvent && !isToday && (
                          <View className="h-1 w-1 rounded-full bg-primary" />
                        )}
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </Card>

        {selectedDay !== null && (
          <Pressable onPress={() => setSelectedDay(null)} hitSlop={8}>
            <Text className="text-center font-sans text-xs text-secondary">
              Mostrando dia {selectedDay} · toque para ver todos
            </Text>
          </Pressable>
        )}

        {/* Filtro de categoria */}
        <View className="gap-2">
          <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
            Categorias
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {categoryFilters.map((filter) => (
              <Chip
                key={filter.key}
                label={filter.label}
                active={activeFilter === filter.key}
                onPress={() => setActiveFilter(filter.key)}
              />
            ))}
          </View>
        </View>

        {/* Lista de eventos */}
        {error ? (
          <View className="items-center gap-3 py-8">
            <Text className="text-center font-sans text-sm text-ink-muted">{error}</Text>
          </View>
        ) : filteredEvents.length === 0 && !isPending ? (
          <Text className="py-4 text-center font-sans text-sm text-ink-muted">
            {selectedDay
              ? `Nenhum evento no dia ${selectedDay}.`
              : 'Nenhum evento neste mês.'}
          </Text>
        ) : (
          <View className="gap-3">
            {filteredEvents.map((event) => (
              <Card key={`${event.id}-${event.dia}`} contentClassName="gap-2">
                {event.imagemUrl ? (
                  <Image
                    source={{ uri: event.imagemUrl }}
                    className="w-full rounded-lg"
                    style={{ aspectRatio: 21 / 9 }}
                    resizeMode="cover"
                  />
                ) : null}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    {event.cor ? (
                      <View
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: event.cor }}
                      />
                    ) : null}
                    <Text className="font-sans-semibold text-xs uppercase tracking-wide text-secondary">
                      {event.tipo}
                    </Text>
                    {/* Deixa claro que é UM evento repetindo, não vários
                        eventos iguais — era o que confundia ao excluir */}
                    {event.recorrencia !== 'nenhuma' ? (
                      <View className="flex-row items-center gap-1 rounded-full bg-surface-container-high px-2 py-0.5">
                        <Ionicons name="repeat" size={11} color={colors.primary} />
                        <Text className="font-sans-medium text-[10px] text-primary">
                          {event.recorrencia === 'semanal' ? 'Semanal' : 'Mensal'}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {canManageEvento(event, user?.id, user?.perfil) ? (
                    <View className="flex-row gap-3">
                      <Pressable
                        onPress={() => navigation.navigate('CreateEvento', { id: String(event.id) })}
                        hitSlop={8}
                      >
                        <Ionicons name="pencil-outline" size={14} color={colors.secondary} />
                      </Pressable>
                      <Pressable onPress={() => confirmDeleteEvento(event)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={14} color={colors.error} />
                      </Pressable>
                    </View>
                  ) : null}
                </View>
                <Text className="font-serif-bold text-lg text-ink">{event.titulo}</Text>
                {event.descricao ? (
                  <Text className="font-sans text-sm leading-5 text-ink-muted">
                    {event.descricao}
                  </Text>
                ) : null}
                <View className="flex-row flex-wrap gap-4">
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="calendar-outline" size={14} color={colors.outline} />
                    <Text className="font-sans text-xs text-ink-muted">
                      {formatEventDate(event.dataInicio)}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="time-outline" size={14} color={colors.outline} />
                    <Text className="font-sans text-xs text-ink-muted">
                      {formatEventTime(event.dataInicio)}
                    </Text>
                  </View>
                  {event.local ? (
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="location-outline" size={14} color={colors.outline} />
                      <Text className="font-sans text-xs text-ink-muted">{event.local}</Text>
                    </View>
                  ) : null}
                </View>
                {/* Sem inscrição/confirmação de presença: a igreja divulga o
                    evento, quem quiser participar simplesmente vai. */}
                <Button
                  label="Ver detalhes"
                  variant="secondary"
                  onPress={() => navigation.navigate('EventoDetail', { id: String(event.id) })}
                />
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
