import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListaVazia, ScreenHeader } from '../../components';
import {
  useDenunciasPendentes,
  useResolverDenuncia,
} from '../../hooks/queries/useModeracao';
import { useExcluirPedido } from '../../hooks/queries/usePedidosOracao';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import type { Denuncia } from '../../services/moderacao.service';
import { formatRelativeTime } from '../../services/prayer.service';

type Props = NativeStackScreenProps<AppStackParamList, 'Denuncias'>;

/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  DENÚNCIAS — a fila da liderança                                      ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * ═══ POR QUE ESTA TELA PRECISOU EXISTIR ═══
 * Eu tinha construído o botão de denunciar e a rota que guarda a denúncia, e
 * parei aí. O resultado era o pior arranjo possível: o app prometia à pessoa
 * ofendida que "a liderança vai analisar", e não havia onde analisar. As
 * denúncias caíam num banco que ninguém abre.
 *
 * A Apple exige resposta em até 24 horas. Mas antes da exigência existe a
 * promessa feita na tela — e promessa que o app faz e não cumpre é pior do que
 * não ter o botão.
 *
 * ═══ DUAS SAÍDAS, PORQUE SÃO DOIS DESFECHOS ═══
 *   ARQUIVAR  → olhei, não é caso de remover. A denúncia sai da fila.
 *   EXCLUIR   → o pedido some do mural, e a denúncia sai junto.
 *
 * Não existe "banir a pessoa": rebaixar ou remover alguém da igreja não é
 * decisão de tela de celular. Quem denunciou já pode bloquear por conta
 * própria, que é a proteção individual; o resto é conversa pastoral.
 */
export function DenunciasScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const { user } = useAuth();
  const ehLideranca = ['Líder', 'Pastor', 'Administrador'].includes(
    user?.perfil ?? '',
  );

  const { denuncias, total, carregando, erro, recarregar } =
    useDenunciasPendentes(ehLideranca);
  const resolver = useResolverDenuncia();
  const excluirPedido = useExcluirPedido();

  function arquivar(denuncia: Denuncia) {
    Alert.alert(
      'Arquivar denúncia',
      'A denúncia sai da fila e o pedido continua no mural. Use quando não houver nada a remover.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Arquivar',
          onPress: () =>
            resolver.mutate(denuncia.id, {
              onError: (e) =>
                Alert.alert('Erro', extractErrorMessage(e, 'Não foi possível arquivar.')),
            }),
        },
      ],
    );
  }

  function excluirEArquivar(denuncia: Denuncia) {
    if (!denuncia.conteudo) return;

    Alert.alert(
      'Excluir o pedido',
      `O pedido de ${denuncia.conteudo.autor.nomeCompleto} some do mural para todos. A denúncia é arquivada junto.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () =>
            excluirPedido.mutate(denuncia.alvoId, {
              // Arquiva só depois de o pedido sumir de fato. Na ordem
              // inversa, uma falha na exclusão deixaria a denúncia fora da
              // fila e o conteúdo no ar — sem ninguém para reparar.
              onSuccess: () => resolver.mutate(denuncia.id),
              onError: (e) =>
                Alert.alert('Erro', extractErrorMessage(e, 'Não foi possível excluir.')),
            }),
        },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title="Denúncias"
        subtitle={
          total > 0
            ? `${total} ${total === 1 ? 'aguardando' : 'aguardando'}`
            : undefined
        }
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        className="flex-1 px-gutter"
        contentContainerClassName="gap-md pb-3xl pt-lg"
      >
        {!ehLideranca ? (
          <Text className="py-3xl text-center font-sans text-[14px] text-ink-muted">
            Esta área é da liderança da igreja.
          </Text>
        ) : carregando ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
        ) : erro ? (
          <View className="items-center gap-md py-3xl">
            <Text className="text-center font-sans text-[14px] text-ink-muted">
              {extractErrorMessage(erro, 'Não foi possível carregar.')}
            </Text>
            <Pressable onPress={() => recarregar()} hitSlop={12}>
              <Text className="font-sans-semibold text-[14px] text-secondary">
                Tentar novamente
              </Text>
            </Pressable>
          </View>
        ) : denuncias.length === 0 ? (
          <ListaVazia
            icone="check-circle-outline"
            titulo="Nada pendente"
            descricao="Quando alguém denunciar um pedido de oração, ele aparece aqui para a liderança analisar."
          />
        ) : (
          denuncias.map((d) => (
            <View
              key={d.id}
              className="gap-3 rounded-lg border border-outline-variant p-4"
            >
              {/* O motivo primeiro: é o que decide se vale ler o resto. */}
              <View className="flex-row items-start gap-2">
                <MaterialCommunityIcons
                  name="flag-outline"
                  size={16}
                  color={colors.error}
                />
                <Text className="flex-1 font-sans-semibold text-[14px] leading-5 text-ink">
                  {d.motivo}
                </Text>
              </View>

              {/* ── O texto denunciado ──────────────────────────────
                  Serifado como no mural: é a mesma coisa que a pessoa
                  escreveu, e ler no formato original ajuda a julgar. */}
              {d.conteudo ? (
                <View className="gap-1 rounded bg-surface-container-low p-3">
                  <Text className="font-serif text-[15px] leading-6 text-ink" selectable>
                    {d.conteudo.descricaoPedido}
                  </Text>
                  <Text className="font-sans text-[12px] text-ink-muted">
                    {d.conteudo.autor.nomeCompleto} ·{' '}
                    {formatRelativeTime(d.conteudo.dataEnvio)}
                  </Text>
                </View>
              ) : (
                <View className="rounded bg-surface-container-low p-3">
                  <Text className="font-sans text-[13px] leading-5 text-ink-muted">
                    O pedido já foi removido — pelo autor ou por outro líder.
                    Só falta arquivar esta denúncia.
                  </Text>
                </View>
              )}

              <Text className="font-sans text-[12px] text-ink-muted">
                Denunciado por {d.denunciante.nomeCompleto} ·{' '}
                {formatRelativeTime(d.criadaEm)}
              </Text>

              <View className="flex-row gap-2 pt-1">
                <Pressable
                  onPress={() => arquivar(d)}
                  hitSlop={8}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  className="flex-1 items-center rounded-full border border-outline py-2"
                >
                  <Text className="font-sans-semibold text-[13px] text-secondary">
                    Arquivar
                  </Text>
                </Pressable>

                {d.conteudo ? (
                  <Pressable
                    onPress={() => excluirEArquivar(d)}
                    hitSlop={8}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                    className="flex-1 items-center rounded-full border border-error py-2"
                  >
                    <Text className="font-sans-semibold text-[13px] text-error">
                      Excluir pedido
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
