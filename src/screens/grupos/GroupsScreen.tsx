import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Card, SectionHeader } from '../../components';
import {
  useConvitesPendentes,
  useMeusGrupos,
  useResponderConvite,
} from '../../hooks/queries/useGrupos';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import { getCriador, countMembrosAtivos } from '../../services/groups.service';
import { extractErrorMessage } from '../../services/api';

export function GroupsScreen() {
  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();

  const {
    data: grupos = [],
    isPending: isLoading,
    error: gruposError,
    refetch,
  } = useMeusGrupos(user?.id);
  const { data: convitesPendentes = [] } = useConvitesPendentes();
  const responderConvite = useResponderConvite();

  const error = gruposError ? extractErrorMessage(gruposError) : null;
  const respondingId = responderConvite.isPending
    ? responderConvite.variables?.membroId ?? null
    : null;

  function handleRespond(membroId: number, status: 'aceito' | 'recusado') {
    responderConvite.mutate(
      { membroId, status },
      {
        // Antes o erro era engolido em silêncio: o convite não sumia e a
        // pessoa não sabia por quê.
        onError: (e) =>
          Alert.alert('Erro', extractErrorMessage(e, 'Não foi possível responder ao convite.')),
      },
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-gutter" contentContainerClassName="gap-md py-lg">
        <SectionHeader
          eyebrow="Unidade"
          title="Grupos Familiares"
          subtitle="Encontre a sua família aqui."
          actionLabel="Criar família"
          onActionPress={() => navigation.navigate('CreateGroup')}
        />

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.gold} style={{ marginTop: 32 }} />
        ) : error ? (
          <View className="items-center gap-3 py-8">
            <Text className="text-center font-sans text-sm text-ink-muted">{error}</Text>
            <Button label="Tentar novamente" variant="secondary" onPress={() => refetch()} />
          </View>
        ) : (
          <>
            {/* Meus grupos */}
            {grupos.length > 0 ? (
              <View className="gap-3">
                {grupos.map((grupo) => {
                  const criador = getCriador(grupo);
                  return (
                    <Card key={grupo.id} accent contentClassName="gap-3">
                      {grupo.imagemUrl ? (
                        <Image
                          source={{ uri: grupo.imagemUrl }}
                          className="w-full rounded-lg"
                          style={{ aspectRatio: 16 / 9 }}
                          resizeMode="cover"
                        />
                      ) : null}

                      <Text className="font-sans-semibold text-xs uppercase tracking-wide text-secondary">
                        Sua família
                      </Text>
                      <Text className="font-serif-bold text-xl text-ink">
                        {grupo.nome ?? 'Grupo familiar'}
                      </Text>

                      {criador ? (
                        <View className="flex-row items-center gap-3">
                          <Avatar
                            nome={criador.nomeCompleto}
                            fotoUrl={criador.fotoUrl}
                            size={40}
                          />
                          <View>
                            <Text className="font-sans-semibold text-sm text-ink">
                              Criado por {criador.nomeCompleto}
                            </Text>
                            <Text className="font-sans text-xs text-ink-muted">
                              {countMembrosAtivos(grupo)} membros participando
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <Text className="font-sans text-xs text-ink-muted">
                          {countMembrosAtivos(grupo)} membros participando
                        </Text>
                      )}

                      <Button
                        label="Ver membros da família"
                        variant="secondary"
                        onPress={() =>
                          navigation.navigate('GroupDetail', { id: String(grupo.id) })
                        }
                      />
                    </Card>
                  );
                })}
              </View>
            ) : (
              <Card contentClassName="items-center gap-3 py-6">
                <Ionicons name="people-outline" size={36} color={colors.outline} />
                <Text className="text-center font-sans-semibold text-base text-ink">
                  Você ainda não faz parte de nenhuma grupo familiar.  
                </Text>
                <Text className="text-center font-sans text-sm text-ink-muted">
                  Peça para o líder da família te convidar, ou crie a sua.
                </Text>
              </Card>
            )}

            {/* Convites pendentes */}
            {convitesPendentes.length > 0 ? (
              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="mail-outline" size={18} color={colors.primary} />
                  <Text className="font-serif-bold text-lg text-ink">Convites</Text>
                  <View className="h-5 min-w-5 items-center justify-center rounded-full bg-error px-1.5">
                    <Text className="font-sans-semibold text-xs text-on-error">
                      {convitesPendentes.length}
                    </Text>
                  </View>
                </View>
                {convitesPendentes.map((convite) => (
                  <Card key={convite.id} contentClassName="gap-2">
                    <Text className="font-sans text-sm text-ink">
                      Convite para{' '}
                      <Text className="font-sans-semibold">
                        {convite.nomeGrupo ?? 'uma família'}
                      </Text>
                    </Text>
                    <Text className="font-sans text-xs text-ink-muted">
                      Convidado por {convite.convidadoPor.nomeCompleto}
                    </Text>
                    <View className="flex-row gap-2">
                      <View className="flex-1">
                        <Button
                          label="Aceitar"
                          loading={respondingId === convite.id}
                          onPress={() => handleRespond(convite.id, 'aceito')}
                        />
                      </View>
                      <View className="flex-1">
                        <Button
                          label="Recusar"
                          variant="secondary"
                          loading={respondingId === convite.id}
                          onPress={() => handleRespond(convite.id, 'recusado')}
                        />
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
