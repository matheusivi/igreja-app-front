import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Chip } from '../../components';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { AppStackParamList } from '../../navigation/types';
import { useAuth } from '../../navigation/AuthContext';
import { extractErrorMessage } from '../../services/api';
import { urlImagem } from '../../services/imagem';
import {
  formatEventDate,
  formatEventTime,
  type EventoDetalhe,
} from '../../services/events.service';
import { useEvento } from '../../hooks/queries/useEventos';

type Props = NativeStackScreenProps<AppStackParamList, 'EventoDetail'>;

function recorrenciaLabel(evento: EventoDetalhe): string | null {
  if (evento.recorrencia === 'semanal') {
    const dias = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    const dia = evento.diaSemana !== null ? dias[evento.diaSemana] : null;
    return dia ? `Toda ${dia}-feira`.replace('domingo-feira', 'domingo').replace('sábado-feira', 'sábado') : 'Semanal';
  }
  if (evento.recorrencia === 'mensal') {
    return evento.diaDoMes ? `Todo dia ${evento.diaDoMes} do mês` : 'Mensal';
  }
  return null;
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-start gap-3">
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-surface-container-high">
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="font-sans text-xs uppercase tracking-wide text-ink-muted">{label}</Text>
        <Text className="font-sans-medium text-sm text-ink">{value}</Text>
      </View>
    </View>
  );
}

export function EventoDetailScreen({ route, navigation }: Props) {
  const colors = useThemeColors();
  const { user } = useAuth();
  // Do cache: editar o evento e voltar para cá mostra a versão nova. Antes
  // este `useEffect` carregava uma vez e o detalhe ficava desatualizado.
  const {
    data: evento,
    isPending: isLoading,
    error: queryError,
  } = useEvento(route.params.id);

  const error = queryError
    ? extractErrorMessage(queryError, 'Não foi possível carregar o evento.')
    : null;

  const podeEditar =
    !!evento &&
    (evento.criadorId === user?.id ||
      ['Pastor', 'Administrador'].includes(user?.perfil ?? ''));

  const recorrencia = evento ? recorrenciaLabel(evento) : null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary">Detalhes do evento</Text>
        {podeEditar ? (
          <Pressable
            onPress={() => navigation.navigate('CreateEvento', { id: String(evento!.id) })}
            hitSlop={8}
          >
            <Ionicons name="pencil-outline" size={20} color={colors.secondary} />
          </Pressable>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      ) : error || !evento ? (
        <View className="flex-1 items-center justify-center gap-3 px-gutter">
          <Text className="text-center font-sans text-sm text-ink-muted">
            {error ?? 'Evento não encontrado.'}
          </Text>
          <Button label="Voltar" variant="secondary" fullWidth={false} onPress={() => navigation.goBack()} />
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-xl px-gutter py-3xl">
          {evento.imagemUrl ? (
            <Image
              source={{ uri: urlImagem(evento.imagemUrl, { largura: 353, altura: 199 }) }}
              className="w-full rounded-xl"
              style={{ aspectRatio: 16 / 9 }}
              resizeMode="cover"
            />
          ) : null}

          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              {evento.cor ? (
                <View className="h-3 w-3 rounded-full" style={{ backgroundColor: evento.cor }} />
              ) : null}
              <Chip label={evento.tipo} active />
              {evento.destaqueHome ? <Chip label="Em destaque" tone="success" active /> : null}
            </View>
            <Text className="font-serif-bold text-2xl leading-8 text-ink">{evento.titulo}</Text>
          </View>

          <Card contentClassName="gap-4">
            <InfoRow
              icon="calendar-outline"
              label="Data"
              value={formatEventDate(evento.dataInicio)}
            />
            <InfoRow
              icon="time-outline"
              label="Horário"
              value={
                evento.dataFim
                  ? `${formatEventTime(evento.dataInicio)} às ${formatEventTime(evento.dataFim)}`
                  : formatEventTime(evento.dataInicio)
              }
            />
            {evento.local ? (
              <InfoRow icon="location-outline" label="Local" value={evento.local} />
            ) : null}
            {recorrencia ? (
              <InfoRow icon="repeat-outline" label="Acontece" value={recorrencia} />
            ) : null}
          </Card>

          {evento.descricao ? (
            <View className="gap-2">
              <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
                Sobre o evento
              </Text>
              <Text className="font-sans text-base leading-7 text-ink">{evento.descricao}</Text>
            </View>
          ) : (
            <Text className="font-sans text-sm italic text-ink-muted">
              Este evento ainda não tem uma descrição.
            </Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
