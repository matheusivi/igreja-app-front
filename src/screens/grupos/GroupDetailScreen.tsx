import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Card, SeletorPapel, TopBar } from '../../components';
import { radius, spacing, tracking } from '../../constants/theme';
import {
  useAtualizarGrupo,
  useAtualizarPapel,
  useGrupo,
  useSairDoGrupo,
} from '../../hooks/queries/useGrupos';
import { useSeletorImagem } from '../../hooks/useSeletorImagem';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import {
  countMembrosAtivos,
  rotuloPapel,
  type PapelFamilia,
} from '../../services/groups.service';
import { extractErrorMessage } from '../../services/api';
import { urlImagem } from '../../services/imagem';

type Props = NativeStackScreenProps<AppStackParamList, 'GroupDetail'>;

/** Quem está com a folha de papel aberta. `null` = folha fechada. */
type EmEdicao = {
  usuarioId: number;
  nome: string;
  sexo: string | null;
  atual: PapelFamilia | null;
};

export function GroupDetailScreen({ route, navigation }: Props) {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { data: grupo, isPending: isLoading, error: queryError } = useGrupo(route.params.id);
  const sairDoGrupo = useSairDoGrupo();

  const atualizarGrupo = useAtualizarGrupo();
  const atualizarPapel = useAtualizarPapel();
  const [editando, setEditando] = useState<EmEdicao | null>(null);

  function salvarPapel(papel: PapelFamilia | null) {
    if (!grupo || !editando) return;
    atualizarPapel.mutate(
      { grupoId: grupo.id, usuarioId: editando.usuarioId, parentesco: papel },
      {
        onSuccess: () => setEditando(null),
        onError: (e) =>
          Alert.alert('Erro', extractErrorMessage(e, 'Não foi possível salvar o papel.')),
      },
    );
  }

  const error = queryError ? extractErrorMessage(queryError) : null;

  // Só o criador (e a liderança) muda a foto. Mostrar o botão para os demais
  // seria convidar para uma ação que o backend recusaria com 403.
  const podeEditar =
    !!grupo &&
    (grupo.criadorUsuarioId === user?.id ||
      ['Pastor', 'Administrador'].includes(user?.perfil ?? ''));

  /**
   * A pessoa faz parte DESTA família.
   *
   * ═══ POR QUE NÃO VALE A REGRA DO `podeEditar` ═══
   * Qualquer pessoa autenticada abre qualquer família por aqui, e dois botões
   * apareciam também nas famílias dos outros: "Convidar" e "Sair deste grupo".
   * Nenhum dos dois chegava a fazer estrago — o servidor responde "Você
   * precisa fazer parte do grupo" e "Membro não encontrado no grupo" — mas
   * eram botões que só sabiam dar erro, e botão assim ensina que o app é
   * instável, não que a ação era proibida.
   *
   * A condição copia a do servidor de propósito, e ela NÃO inclui
   * Pastor/Administrador: `convidar` e sair exigem vínculo aceito, sem exceção
   * de perfil. Liberar aqui para a liderança recriaria o mesmo beco sem saída,
   * só que para quem tem menos motivo para desconfiar de si mesmo.
   *
   * Convite pendente também não conta: quem ainda não aceitou não fala pela
   * família, e recusa pelo cartão de convite, não por aqui.
   */
  const ehDaFamilia =
    !!grupo &&
    grupo.membros.some((m) => m.usuario.id === user?.id && m.status === 'aceito');

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
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <TopBar
        title={grupo?.nome ? `Família ${grupo.nome}` : 'Detalhes da Família'}
        onBack={() => navigation.goBack()}
        {...(ehDaFamilia && grupo
          ? {
              actionIcon: 'person-add-outline' as const,
              actionLabel: 'Convidar membro para a família',
              onActionPress: () =>
                navigation.navigate('InviteMember', {
                  grupoId: grupo.id,
                  grupoNome: grupo.nome ?? '',
                }),
            }
          : {})}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      ) : error || !grupo ? (
        <View className="flex-1 items-center justify-center gap-3 bg-background px-gutter">
          <Text className="text-center font-sans text-sm text-ink-muted">
            {error ?? 'Família não encontrada.'}
          </Text>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text className="font-sans-semibold text-sm text-secondary">Voltar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-xl px-gutter py-3xl">
          {/* Mesma capa 16:9 da aba Famílias: a foto é a identidade do grupo,
              e um quadradinho de 80px não mostrava nada dela. */}
          <Card accent contentClassName="gap-3">
            <Pressable
              onPress={podeEditar ? abrirSeletorFoto : undefined}
              disabled={!podeEditar || isEnviandoFoto}
              accessibilityRole={podeEditar ? 'button' : 'image'}
              accessibilityLabel={podeEditar ? 'Alterar foto da família' : 'Foto da família'}
            >
              <View
                className="w-full items-center justify-center overflow-hidden rounded-lg bg-surface-container-high"
                style={{ aspectRatio: 16 / 9 }}
              >
                {isEnviandoFoto ? (
                  <ActivityIndicator color={colors.gold} />
                ) : grupo.imagemUrl ? (
                  <Image
                    source={{ uri: urlImagem(grupo.imagemUrl, { largura: 353, altura: 199 }) }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="items-center gap-1.5">
                    <MaterialCommunityIcons
                      name="family-tree"
                      size={34}
                      color={colors.gold}
                    />
                    {podeEditar ? (
                      <Text className="font-sans text-xs text-ink-muted">
                        Toque para adicionar uma foto
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>

              {/* O selo só aparece para quem realmente pode trocar a foto —
                  senão seria um convite a uma ação que resultaria em 403. */}
              {podeEditar && !isEnviandoFoto ? (
                <View className="absolute bottom-2 right-2 h-9 w-9 items-center justify-center rounded-full bg-gold">
                  <Ionicons name="camera" size={17} color={colors.onGold} />
                </View>
              ) : null}
            </Pressable>

            <View className="gap-0.5">
              <Text className="font-sans-semibold text-xs uppercase tracking-wide text-secondary">
                Sua família
              </Text>
              <Text className="font-serif-bold text-xl text-ink">
                {grupo.nome ?? 'Grupo familiar'}
              </Text>
              <Text className="font-sans text-xs text-ink-muted">
                {countMembrosAtivos(grupo)}{' '}
                {countMembrosAtivos(grupo) === 1 ? 'integrante' : 'integrantes'}
              </Text>
            </View>
          </Card>

          {grupo.membros.length > 0 ? (
            <View className="gap-2">
              <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
                Integrantes
              </Text>
              {grupo.membros.map((membro) => {
                const papel = rotuloPapel(membro.parentesco, membro.usuario.sexo);
                const ehCriador = membro.usuario.id === grupo.criadorUsuarioId;
                const podeDefinirPapel = podeEditar && membro.status === 'aceito';

                return (
                  <Card key={membro.id} contentClassName="flex-row items-center gap-3">
                    {/* Agora que a foto de perfil existe, faz sentido usá-la
                        aqui em vez da inicial solta. */}
                    <Avatar
                      nome={membro.usuario.nomeCompleto}
                      fotoUrl={membro.usuario.fotoUrl}
                      size={44}
                    />
                    <View className="flex-1 gap-0.5">
                      <Text className="font-sans-semibold text-sm text-ink">
                        {membro.usuario.nomeCompleto}
                      </Text>

                      {/* ═══ PAPEL, NÃO PERFIL DA IGREJA ═══
                          Antes caía em `membro.usuario.perfil` quando não
                          havia parentesco — e escrevia "Membro" onde deveria
                          estar "Filha". São dois vocabulários diferentes:
                          um diz o que a pessoa é na IGREJA, o outro o que ela
                          é na FAMÍLIA. Misturados, nenhum dos dois informa. */}
                      {papel ? (
                        <Text className="font-sans-semibold text-xs text-secondary">
                          {papel}
                        </Text>
                      ) : membro.status === 'aceito' ? (
                        <Text className="font-sans text-xs text-ink-muted">
                          {podeDefinirPapel ? 'Toque para definir o papel' : 'Sem papel definido'}
                        </Text>
                      ) : null}

                      {ehCriador ? (
                        <Text className="font-sans text-xs text-ink-muted">
                          Criou a família
                        </Text>
                      ) : null}
                    </View>

                    {/* Convite ainda não respondido: sem isso o card parecia
                        igual ao de quem já faz parte da família. */}
                    {membro.status === 'pendente' ? (
                      <Text className="rounded-full bg-surface-container-high px-2 py-0.5 font-sans-semibold text-[11px] text-ink-muted">
                        Convite pendente
                      </Text>
                    ) : podeDefinirPapel ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Definir o papel de ${membro.usuario.nomeCompleto} na família`}
                        hitSlop={12}
                        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                        onPress={() =>
                          setEditando({
                            usuarioId: membro.usuario.id,
                            nome: membro.usuario.nomeCompleto,
                            sexo: membro.usuario.sexo ?? null,
                            atual: (membro.parentesco as PapelFamilia | null) ?? null,
                          })
                        }
                      >
                        <MaterialCommunityIcons
                          name="pencil-outline"
                          size={18}
                          color={colors.inkMuted}
                        />
                      </Pressable>
                    ) : null}
                  </Card>
                );
              })}
            </View>
          ) : (
            <Card contentClassName="items-center py-6">
              <Text className="font-sans text-sm text-ink-muted">
                Nenhum membro encontrado.
              </Text>
            </Card>
          )}

          {/* Sair do grupo — a rota já existia no backend, mas não havia
              nenhum caminho no app para a pessoa se desvincular.

              Só para quem é da família: numa família alheia isto era um botão
              destrutivo, com confirmação e tudo, que terminava em erro. */}
          {ehDaFamilia ? (
            <View className="mt-2 gap-2">
              <Button
                label="Sair deste grupo"
                variant="secondary"
                loading={sairDoGrupo.isPending}
                onPress={confirmarSaida}
              />
              <Text className="text-center font-sans text-xs text-ink-muted">
                Você precisará de um novo convite para voltar.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      )}

      {/* ═══ FOLHA DE PAPEL ═══
          `Modal`, e não uma View posicionada dentro da lista: absoluto ali
          se ancoraria no card do integrante, não na tela. Foi exatamente o
          erro cometido antes na ficha do aniversariante. */}
      <Modal
        visible={editando !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditando(null)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          onPress={() => setEditando(null)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
        >
          {/* O toque no conteúdo não fecha: sem este Pressable interno, tocar
              numa pastilha fecharia a folha antes de registrar a escolha. */}
          <Pressable onPress={() => {}}>
            <View
              style={{
                gap: spacing.lg,
                padding: spacing.xl,
                paddingBottom: spacing['3xl'],
                borderTopLeftRadius: radius.xl,
                borderTopRightRadius: radius.xl,
                backgroundColor: colors.surfaceBright,
              }}
            >
              <View className="gap-xs">
                <Text
                  className="font-serif-bold text-[19px] text-ink"
                  style={{ letterSpacing: tracking.heading }}
                >
                  {editando?.nome.split(' ')[0]} é o quê na família?
                </Text>
                <Text className="font-sans text-[13px] leading-5 text-ink-muted">
                  Fica registrado na família e ajuda a liderança a saber quem responde por
                  quem — principalmente pelas crianças.
                </Text>
              </View>

              <SeletorPapel
                valor={editando?.atual ?? null}
                sexo={editando?.sexo}
                desabilitado={atualizarPapel.isPending}
                // Salva no toque, sem botão de confirmar: é uma escolha única
                // entre dez, e o próprio toque já é a confirmação. Tocar no
                // que já está marcado limpa o papel.
                onChange={salvarPapel}
              />

              {atualizarPapel.isPending ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Button
                  label="Fechar"
                  variant="secondary"
                  onPress={() => setEditando(null)}
                />
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
