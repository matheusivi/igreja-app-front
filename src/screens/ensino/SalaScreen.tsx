import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Card, TopBar } from '../../components';
import { cursosKeys, useColegasSala } from '../../hooks/queries/useCursos';
import { useAtualizarPuxando } from '../../hooks/useAtualizarPuxando';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';

type Props = NativeStackScreenProps<AppStackParamList, 'Sala'>;

export function SalaScreen({ route, navigation }: Props) {
  // Colega que entrou na turma agora aparece ao puxar.
  const { controle } = useAtualizarPuxando([cursosKeys.all]);

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
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <TopBar title={`Sala — ${cursoNome}`} onBack={() => navigation.goBack()} />

      {isLoading ? (
        <View className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center gap-3 bg-background px-gutter">
          <Text className="text-center font-sans text-sm text-ink-muted">{error}</Text>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text className="font-sans-semibold text-sm text-secondary">Voltar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          className="flex-1 bg-background"
          contentContainerClassName="gap-xl px-gutter py-3xl"
          refreshControl={controle}
        >
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
