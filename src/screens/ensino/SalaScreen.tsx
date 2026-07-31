import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Card } from '../../components';
import { useColegasSala } from '../../hooks/queries/useCursos';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';

type Props = NativeStackScreenProps<AppStackParamList, 'Sala'>;

export function SalaScreen({ route, navigation }: Props) {
  const colors = useThemeColors();
  const { salaId, cursoNome } = route.params;

  // Do cache: quando alguém entra ou sai da turma em outra tela, esta lista
  // acompanha sozinha.
  const {
    data: colegas = [],
    isPending: isLoading,
    error: queryError,
  } = useColegasSala(salaId);

  const error = queryError ? extractErrorMessage(queryError) : null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary" numberOfLines={1}>
          Sala — {cursoNome}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center gap-3 px-gutter">
          <Text className="text-center font-sans text-sm text-ink-muted">{error}</Text>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text className="font-sans-semibold text-sm text-secondary">Voltar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-md px-gutter py-lg">
          <Text className="font-sans text-sm text-ink-muted">
            {colegas.length} colega{colegas.length !== 1 ? 's' : ''} nesta turma
          </Text>

          {colegas.length > 0 ? (
            <View className="gap-2">
              {colegas.map((colega) => (
                <Card key={colega.usuarioId} contentClassName="flex-row items-center gap-3">
                  <Avatar nome={colega.nomeCompleto} size={44} />
                  <View>
                    <Text className="font-sans-semibold text-sm text-ink">
                      {colega.nomeCompleto}
                    </Text>
                    <Text className="font-sans text-xs text-ink-muted">{colega.perfil}</Text>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <Card contentClassName="items-center py-6">
              <Text className="font-sans text-sm text-ink-muted">
                Nenhum colega matriculado ainda.
              </Text>
            </Card>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
