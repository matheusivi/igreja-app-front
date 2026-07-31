import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Card } from '../../components';
import { useAtualizarGrupo, useGrupo, useSairDoGrupo } from '../../hooks/queries/useGrupos';
import { useSeletorImagem } from '../../hooks/useSeletorImagem';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import { countMembrosAtivos } from '../../services/groups.service';
import { extractErrorMessage } from '../../services/api';

type Props = NativeStackScreenProps<AppStackParamList, 'GroupDetail'>;

export function GroupDetailScreen({ route, navigation }: Props) {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { data: grupo, isPending: isLoading, error: queryError } = useGrupo(route.params.id);
  const sairDoGrupo = useSairDoGrupo();

  const atualizarGrupo = useAtualizarGrupo();

  const error = queryError ? extractErrorMessage(queryError) : null;

  // Só o criador (e a liderança) muda a foto. Mostrar o botão para os demais
  // seria convidar para uma ação que o backend recusaria com 403.
  const podeEditar =
    !!grupo &&
    (grupo.criadorUsuarioId === user?.id ||
      ['Pastor', 'Administrador'].includes(user?.perfil ?? ''));

  function salvarFoto(url: string | null) {
    if (!grupo) return;
    atualizarGrupo.mutate(
      { grupoId: grupo.id, payload: { imagemUrl: url } },
      {
        onError: (e) =>
          Alert.alert('Erro', extractErrorMessage(e, 'Não foi possível salvar a foto.')),
      },
    );
  }

  const { abrir: abrirSeletorFoto, isEnviando } = useSeletorImagem({
    pasta: 'familias',
    quadrado: true,
    onEnviada: salvarFoto,
    ...(grupo?.imagemUrl ? { onRemovida: () => salvarFoto(null) } : {}),
  });

  // O spinner cobre as duas etapas: subir para o Cloudinary e gravar no grupo.
  const isEnviandoFoto = isEnviando || atualizarGrupo.isPending;

  function confirmarSaida() {
    if (!grupo || !user) return;
    Alert.alert(
      'Sair do grupo familiar',
      `Deseja sair de "${grupo.nome ?? 'esta família'}"? Você deixará de ver as informações da família e precisará de um novo convite para voltar.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair da família',
          style: 'destructive',
          onPress: () =>
            sairDoGrupo.mutate(
              { grupoId: grupo.id, usuarioId: user.id },
              {
                onSuccess: () => navigation.goBack(),
                onError: (e) =>
                  Alert.alert('Erro', extractErrorMessage(e, 'Não foi possível sair da família.')),
              },
            ),
        },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary">Detalhes da Família</Text>
        {grupo ? (
          <Pressable
            onPress={() =>
              navigation.navigate('InviteMember', {
                grupoId: grupo.id,
                grupoNome: grupo.nome ?? '',
              })
            }
            hitSlop={8}
          >
            <Ionicons name="person-add-outline" size={20} color={colors.primary} />
          </Pressable>
        ) : (
          <View style={{ width: 20 }} />
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      ) : error || !grupo ? (
        <View className="flex-1 items-center justify-center gap-3 px-gutter">
          <Text className="text-center font-sans text-sm text-ink-muted">
            {error ?? 'Família não encontrada.'}
          </Text>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text className="font-sans-semibold text-sm text-secondary">Voltar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-md px-gutter py-lg">
          <Card accent contentClassName="items-center gap-2">
            <Pressable
              onPress={podeEditar ? abrirSeletorFoto : undefined}
              disabled={!podeEditar || isEnviandoFoto}
              hitSlop={8}
              accessibilityRole={podeEditar ? 'button' : 'image'}
              accessibilityLabel={podeEditar ? 'Alterar foto da família' : 'Foto da família'}
            >
              <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-lg bg-surface-container-high">
                {isEnviandoFoto ? (
                  <ActivityIndicator color={colors.gold} />
                ) : grupo.imagemUrl ? (
                  <Image
                    source={{ uri: grupo.imagemUrl }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialCommunityIcons name="family-tree" size={32} color={colors.gold} />
                )}
              </View>
              {/* O selo só aparece para quem realmente pode trocar a foto —
                  senão seria um convite a uma ação que resultaria em 403. */}
              {podeEditar && !isEnviandoFoto ? (
                <View className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-gold">
                  <Ionicons name="camera" size={13} color={colors.onGold} />
                </View>
              ) : null}
            </Pressable>
            <Text className="text-center font-serif-bold text-xl text-ink">
              {grupo.nome ?? 'Grupo familiar'}
            </Text>
            <View className="mt-2 items-center">
              <Text className="font-sans text-xs text-ink-muted">Integrantes</Text>
              <Text className="font-serif-bold text-lg text-primary">
                {countMembrosAtivos(grupo)}
              </Text>
            </View>
          </Card>

          {grupo.membros.length > 0 ? (
            <View className="gap-2">
              <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
                Integrantes
              </Text>
              {grupo.membros.map((membro) => (
                <Card key={membro.id} contentClassName="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    {/* Agora que a foto de perfil existe, faz sentido usá-la
                        aqui em vez da inicial solta. */}
                    <Avatar
                      nome={membro.usuario.nomeCompleto}
                      fotoUrl={membro.usuario.fotoUrl}
                      size={44}
                    />
                    <View>
                      <Text className="font-sans-semibold text-sm text-ink">
                        {membro.usuario.nomeCompleto}
                      </Text>
                      <Text className="font-sans text-xs text-ink-muted">
                        {membro.parentesco ?? membro.usuario.perfil}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="ellipsis-vertical" size={16} color={colors.outline} />
                </Card>
              ))}
            </View>
          ) : (
            <Card contentClassName="items-center py-6">
              <Text className="font-sans text-sm text-ink-muted">
                Nenhum membro encontrado.
              </Text>
            </Card>
          )}

          {/* Sair do grupo — a rota já existia no backend, mas não havia
              nenhum caminho no app para a pessoa se desvincular. */}
          <View className="mt-2 gap-2">
            <Button
              label="Sair deste grupo"
              variant="secondary"
              loading={sairDoGrupo.isPending}
              onPress={confirmarSaida}
            />
            <Text className="text-center font-sans text-xs text-outline">
              Você precisará de um novo convite para voltar.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
