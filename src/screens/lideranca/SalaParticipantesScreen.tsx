import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '../../components';
import type { AppColors } from '../../constants/theme';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import { coursesService, type ParticipanteSala } from '../../services/courses.service';

type Props = NativeStackScreenProps<AppStackParamList, 'SalaParticipantes'>;

const STATUS_LABEL: Record<ParticipanteSala['status'], string> = {
  ativo: 'Em andamento',
  concluido: 'Concluído',
  desistente: 'Desistente',
  cancelado_pelo_usuario: 'Cancelado',
};

// Precisa ser função, não objeto fixo: as cores mudam com o tema, e um
// objeto criado na carga do módulo ficaria congelado no tema claro.
function statusColor(
  status: ParticipanteSala['status'],
  colors: AppColors,
): string {
  switch (status) {
    case 'ativo':
      return colors.primary;
    case 'concluido':
      return colors.success;
    default:
      return colors.outline;
  }
}

export function SalaParticipantesScreen({ route, navigation }: Props) {
  const colors = useThemeColors();
  const { salaId, cursoTitulo } = route.params;

  const [participantes, setParticipantes] = useState<ParticipanteSala[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    load();
  }, [salaId]);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await coursesService.getParticipantes(salaId);
      setParticipantes(data);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateStatus(usuarioId: number, status: 'concluido' | 'desistente') {
    setUpdatingId(usuarioId);
    try {
      await coursesService.updateParticipanteStatus(salaId, usuarioId, status);
      setParticipantes((current) =>
        current.map((p) => (p.usuarioId === usuarioId ? { ...p, status } : p)),
      );
    } catch (e) {
      // fail silently — refresh on next load
    } finally {
      setUpdatingId(null);
    }
  }

  const ativos = participantes.filter((p) => p.status === 'ativo');
  const concluidos = participantes.filter((p) => p.status === 'concluido');
  const desistentes = participantes.filter((p) => p.status === 'desistente');

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary" numberOfLines={1}>
          Participantes
        </Text>
        <Pressable onPress={load} hitSlop={8}>
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center gap-3 px-gutter">
          <Text className="text-center font-sans text-sm text-ink-muted">{error}</Text>
          <Button label="Tentar novamente" variant="secondary" onPress={load} />
        </View>
      ) : (
        <ScrollView className="flex-1 px-gutter" contentContainerClassName="gap-md py-lg">
          <Card contentClassName="gap-1">
            <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
              Turma do curso
            </Text>
            <Text className="font-serif-bold text-base text-ink">{cursoTitulo}</Text>
            <Text className="font-sans text-xs text-ink-muted">
              {participantes.length} participante{participantes.length !== 1 ? 's' : ''}
            </Text>
          </Card>

          {/* Ativos */}
          {ativos.length > 0 ? (
            <View className="gap-2">
              <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
                Em andamento ({ativos.length})
              </Text>
              {ativos.map((p) => (
                <Card key={p.usuarioId} contentClassName="gap-3">
                  <View className="flex-row items-center gap-3">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container-high">
                      <Text className="font-sans-semibold text-sm text-ink">
                        {p.nomeCompleto.trim().charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-sans-semibold text-sm text-ink">{p.nomeCompleto}</Text>
                      <Text className="font-sans text-xs text-ink-muted">{p.email}</Text>
                    </View>
                  </View>
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Button
                        label="Concluído"
                        loading={updatingId === p.usuarioId}
                        icon={<Ionicons name="checkmark-circle-outline" size={14} color={colors.onGold} />}
                        onPress={() => handleUpdateStatus(p.usuarioId, 'concluido')}
                      />
                    </View>
                    <View className="flex-1">
                      <Button
                        label="Desistente"
                        variant="secondary"
                        loading={updatingId === p.usuarioId}
                        onPress={() => handleUpdateStatus(p.usuarioId, 'desistente')}
                      />
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ) : null}

          {/* Concluídos */}
          {concluidos.length > 0 ? (
            <View className="gap-2">
              <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
                Concluídos ({concluidos.length})
              </Text>
              {concluidos.map((p) => (
                <Card key={p.usuarioId} contentClassName="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container-high">
                    <Text className="font-sans-semibold text-sm text-ink">
                      {p.nomeCompleto.trim().charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans-semibold text-sm text-ink">{p.nomeCompleto}</Text>
                    <Text className="font-sans text-xs text-ink-muted">{p.email}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                </Card>
              ))}
            </View>
          ) : null}

          {/* Desistentes */}
          {desistentes.length > 0 ? (
            <View className="gap-2">
              <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
                Desistentes ({desistentes.length})
              </Text>
              {desistentes.map((p) => (
                <Card key={p.usuarioId} contentClassName="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container-high">
                    <Text className="font-sans-semibold text-sm text-ink">
                      {p.nomeCompleto.trim().charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans-semibold text-sm text-ink">{p.nomeCompleto}</Text>
                    <Text className="font-sans text-xs text-ink-muted">{p.email}</Text>
                  </View>
                  <Ionicons name="close-circle" size={18} color={colors.outline} />
                </Card>
              ))}
            </View>
          ) : null}

          {participantes.length === 0 ? (
            <Card contentClassName="items-center gap-2 py-6">
              <Ionicons name="people-outline" size={28} color={colors.outline} />
              <Text className="text-center font-sans text-sm text-ink-muted">
                Nenhum participante matriculado ainda.
              </Text>
            </Card>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
