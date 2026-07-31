import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Card, SectionHeader } from '../components';
import { useThemeColors } from '../hooks/useThemeColors';
import type { AppStackParamList } from '../navigation/types';
import {
  formatEventDate,
  formatEventTime,
  labelForTipo,
} from '../services/events.service';
import { useProximoEvento } from '../hooks/queries/useEventos';
import { contentService, makeExcerpt, type Conteudo } from '../services/content.service';
import { useAniversariantesDoMes } from '../hooks/queries/useAniversariantes';
import { useCountdown } from '../hooks/useCountdown';

type QuickAction = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: (navigation: NativeStackNavigationProp<AppStackParamList>) => void;
};

const quickActions: QuickAction[] = [
  { label: 'Devocional', icon: 'book-outline', onPress: (nav) => nav.navigate('Devocionais') },
  {
    label: 'Pedidos de Oração',
    icon: 'heart-outline',
    onPress: (nav) => nav.navigate('MainTabs', { screen: 'Oracao' } as never),
  },
  { label: 'Eventos', icon: 'calendar-outline', onPress: (nav) => nav.navigate('Eventos') },
  { label: 'Dízimos', icon: 'cash-outline', onPress: () => {} },
];

export function HomeScreen() {
  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  // Próximo evento vem do cache compartilhado: criar ou excluir um evento
  // em qualquer tela atualiza este card sozinho.
  const { data: proximoEvento, isPending: isLoadingEvento } = useProximoEvento();

  const hojeDate = new Date();
  const hoje = hojeDate.getDate();
  const mesAtual = hojeDate.getMonth() + 1;

  const { data: flatAniversariantes = [], isPending: isLoadingAniversariantes } =
    useAniversariantesDoMes(mesAtual, hoje);

  const [avisos, setAvisos] = useState<Conteudo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Avisos ainda no padrão antigo — serão convertidos depois.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadData() {
        try {
          const lista = await contentService.list({
            tipo: 'Aviso',
            limit: 3,
            orderBy: 'recent',
          });
          if (!cancelled) setAvisos(lista);
        } catch {
          // silencioso: a seção mostra estado vazio
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      }

      loadData();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const countdown = useCountdown(proximoEvento?.dataInicio);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="gap-md pb-xl">
        {/* Hero */}
        <View className="items-center gap-3 bg-header px-gutter pb-6 pt-4">
          <MaterialCommunityIcons name="church" size={40} color={colors.gold} />
          <Text className="text-center font-serif-bold text-2xl text-on-header">
            Bem-vindo à Família IBVI!
          </Text>
          <Text className="text-center font-sans text-sm text-inverse-ink">
            A expectativa gera o ambiente de milagres.
          </Text>
        </View>

        {/* Próximo evento em destaque */}
        <View className="px-gutter">
          <Card accent contentClassName="items-center gap-3">
            <Text className="text-center font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
              {proximoEvento ? labelForTipo(proximoEvento.tipo) : 'Próximo evento'}
            </Text>

            {isLoadingEvento ? (
              <ActivityIndicator color={colors.gold} />
            ) : proximoEvento ? (
              <>
                {proximoEvento.imagemUrl ? (
                  <Image
                    source={{ uri: proximoEvento.imagemUrl }}
                    className="w-full rounded-lg"
                    style={{ aspectRatio: 16 / 9 }}
                    resizeMode="cover"
                  />
                ) : null}

                {/* Torna visível quando o card está aqui por escolha da
                    liderança, e não apenas por ser o próximo da agenda. */}
                {proximoEvento.destaqueHome ? (
                  <View className="flex-row items-center gap-1 rounded-full bg-gold-fixed px-3 py-1">
                    <Ionicons name="star" size={12} color={colors.onGold} />
                    <Text className="font-sans-semibold text-[11px] text-on-gold">
                      Em destaque
                    </Text>
                  </View>
                ) : null}

                <Text className="text-center font-serif-bold text-lg text-ink">
                  {proximoEvento.titulo}
                </Text>

                {countdown ? (
                  <View className="flex-row gap-4">
                    {[
                      { value: countdown.dias, label: 'dias' },
                      { value: countdown.horas, label: 'horas' },
                      { value: countdown.mins, label: 'min' },
                      { value: countdown.segs, label: 'seg' },
                    ].map((item) => (
                      <View key={item.label} className="items-center">
                        <Text className="font-serif-bold text-2xl text-primary">{item.value}</Text>
                        <Text className="font-sans text-[10px] uppercase text-ink-muted">
                          {item.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View className="items-center gap-0.5">
                  <Text className="font-sans-medium text-sm text-ink">
                    {formatEventDate(proximoEvento.dataInicio)} ·{' '}
                    {formatEventTime(proximoEvento.dataInicio)}
                  </Text>
                  {proximoEvento.local ? (
                    <Text className="font-sans text-xs text-ink-muted">
                      {proximoEvento.local}
                    </Text>
                  ) : null}
                </View>

                <Button
                  label="Ver na agenda"
                  onPress={() => navigation.navigate('Eventos')}
                />
              </>
            ) : (
              <View className="items-center gap-2 py-2">
                <Ionicons name="calendar-outline" size={24} color={colors.outline} />
                <Text className="text-center font-sans text-sm text-ink-muted">
                  Nenhum evento agendado por enquanto.
                </Text>
              </View>
            )}
          </Card>
        </View>

        {/* Acesso rápido */}
        <View className="flex-row flex-wrap gap-3 px-gutter">
          {quickActions.map((action) => (
            <Pressable
              key={action.label}
              className="basis-[47%]"
              onPress={() => action.onPress(navigation)}
            >
              <Card padded={false} contentClassName="h-[124px] items-center justify-center gap-2 p-4">
                <View className="h-11 w-11 items-center justify-center rounded-lg bg-surface-container-high">
                  <Ionicons name={action.icon} size={22} color={colors.primary} />
                </View>
                <View className="h-9 items-center justify-center">
                  <Text
                    numberOfLines={2}
                    className="text-center font-sans-medium text-sm leading-[18px] text-ink"
                  >
                    {action.label}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>

        {/* Aniversariantes — a seção fica sempre visível (antes sumia da Home
            quando a lista vinha vazia, dando impressão de que quebrou) */}
        <View className="px-gutter">
          <SectionHeader
            title="Aniversariantes do mês"
            subtitle={
              flatAniversariantes.length > 0
                ? `${flatAniversariantes.length} ${
                    flatAniversariantes.length === 1 ? 'pessoa' : 'pessoas'
                  } fazem aniversário este mês`
                : undefined
            }
          />
          {isLoadingAniversariantes ? (
            <ActivityIndicator color={colors.gold} style={{ marginTop: 8 }} />
          ) : flatAniversariantes.length === 0 ? (
            <Card contentClassName="items-center gap-2 py-6">
              <Ionicons name="gift-outline" size={24} color={colors.outline} />
              <Text className="text-center font-sans text-sm text-ink-muted">
                Nenhum aniversariante neste mês.
              </Text>
              <Text className="text-center font-sans text-xs text-outline">
                Só aparecem aqui quem cadastrou a data e permitiu exibi-la.
              </Text>
            </Card>
          ) : (
            <Card contentClassName="gap-1">
              {flatAniversariantes.map((a) => {
                const isToday = a.dia === hoje;
                // Mostra o status de todos, inclusive "Membro" — pedido do
                // usuário para dar pra saber quem é quem de bate-pronto.
                const perfilLabel = a.perfil ?? 'Membro';
                const isLideranca = perfilLabel !== 'Membro';
                const dataLabel = `${String(a.dia).padStart(2, '0')}/${String(mesAtual).padStart(2, '0')}`;
                return (
                  <View
                    key={a.id}
                    className={[
                      'flex-row items-center gap-3 rounded px-2 py-2',
                      isToday ? 'bg-gold-fixed' : '',
                    ].join(' ')}
                  >
                    {/* Foto de perfil quando existe, iniciais quando não.
                        Antes era um ícone fixo: a foto chegava do backend e
                        simplesmente não era usada. */}
                    <View>
                      <Avatar nome={a.nomeCompleto} fotoUrl={a.fotoUrl} size={38} />
                      {/* O presente vira um selo por cima, para não competir
                          com a foto nem perder o destaque de "é hoje". */}
                      {isToday ? (
                        <View className="absolute -bottom-0.5 -right-0.5 h-4 w-4 items-center justify-center rounded-full bg-gold">
                          <Ionicons name="gift" size={9} color={colors.onGold} />
                        </View>
                      ) : null}
                    </View>

                    <View className="flex-1">
                      <Text
                        className={[
                          'text-sm',
                          isToday
                            ? 'font-sans-semibold text-on-gold'
                            : 'font-sans-medium text-ink',
                        ].join(' ')}
                      >
                        {a.nomeCompleto}
                      </Text>
                      {/* Liderança em azul e negrito; membro em cinza discreto,
                          para o olho achar quem é liderança rapidamente. */}
                      <Text
                        className={[
                          'text-[11px]',
                          isToday
                            ? 'font-sans-semibold text-on-gold'
                            : isLideranca
                              ? 'font-sans-semibold text-secondary'
                              : 'font-sans text-outline',
                        ].join(' ')}
                      >
                        {perfilLabel}
                      </Text>
                    </View>

                    <View className="items-end">
                      <Text
                        className={[
                          'text-sm',
                          isToday
                            ? 'font-sans-semibold text-on-gold'
                            : 'font-sans-medium text-ink',
                        ].join(' ')}
                      >
                        {dataLabel}
                      </Text>
                      {isToday ? (
                        <Text className="font-sans-semibold text-[10px] uppercase text-on-gold">
                          Hoje
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </Card>
          )}
        </View>

        {/* Avisos recentes */}
        <View className="px-gutter">
          <SectionHeader title="Avisos recentes" actionLabel="Ver tudo" onActionPress={() => {}} />
          {isLoading ? (
            <ActivityIndicator color={colors.gold} style={{ marginTop: 8 }} />
          ) : avisos.length > 0 ? (
            <View className="gap-3">
              {avisos.map((aviso) => (
                <Card key={aviso.id} contentClassName="gap-1">
                  <Text className="font-sans-semibold text-xs uppercase text-success">Aviso</Text>
                  <Text className="font-serif-bold text-lg text-ink">{aviso.titulo}</Text>
                  <Text className="font-sans text-sm leading-5 text-ink-muted">
                    {makeExcerpt(aviso.texto)}
                  </Text>
                  <Text className="mt-1 font-sans text-xs text-outline">
                    {new Date(aviso.dataPublicacao).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </Card>
              ))}
            </View>
          ) : (
            <Text className="font-sans text-sm text-ink-muted">Nenhum aviso no momento.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
