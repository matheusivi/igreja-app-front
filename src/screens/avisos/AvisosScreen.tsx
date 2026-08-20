import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ItemDestaque,
  ItemLista,
  ListaVazia,
  ScreenHeader,
  TileCriar,
  TituloGrupo,
} from '../../components';
import {
  conteudosKeys,
  useConteudosInfinitos,
  useExcluirConteudo,
} from '../../hooks/queries/useConteudos';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import type { Conteudo } from '../../services/content.service';
import { useAtualizarPuxando } from '../../hooks/useAtualizarPuxando';

type Props = NativeStackScreenProps<AppStackParamList, 'Avisos'>;

/**
 * Todos os avisos da igreja.
 *
 * ═══ O CABEÇALHO DEVOLVEU MEIA TELA ═══
 * Antes vinham, empilhados: sobretítulo em versalete ("COMUNICAÇÃO"), título
 * de 26px, duas linhas de subtítulo e um bloco sólido de "Novo aviso" —
 * cerca de 380px de moldura antes do primeiro aviso, num aparelho de 852.
 * Cabia UM aviso e meio na primeira tela.
 *
 * Do que saiu:
 *
 * - **O sobretítulo.** Ele estava em todas as telas de lista do app. Rótulo
 *   que aparece sempre não classifica nada: vira decoração, e é justamente o
 *   maquinário que faz uma interface parecer gerada.
 *
 * - **O subtítulo.** "Comunicados e informações importantes para a família
 *   IBVI" é dito para quem acabou de tocar em "Avisos". Ele foi para o estado
 *   vazio, onde é a única coisa que explica o lugar.
 *
 * - **O bloco do botão.** Virou um círculo de 40px na linha do voltar. Ver
 *   `acaoCompacta` no ScreenHeader.
 *
 * No lugar do subtítulo entrou uma linha de ESTADO — "4 avisos · 1 vencido".
 * Ocupa o mesmo espaço, mas muda conforme a igreja publica, e diz à liderança
 * uma coisa que ela precisa saber sem rolar até o fim.
 */
export function AvisosScreen({ navigation }: Props) {
  // Puxar para atualizar: dois celulares na mesma tela não se falavam.
  const { controle } = useAtualizarPuxando([conteudosKeys.all]);

  const colors = useThemeColors();
  const { user } = useAuth();
  const isLeader = ['Líder', 'Pastor', 'Administrador'].includes(user?.perfil ?? '');

  const {
    conteudos: avisos,
    total,
    isPending: isLoading,
    error: queryError,
    refetch,
    isFetching,
    carregandoMais,
    temMais,
    carregarMais,
    // Liderança precisa ver os vencidos para poder excluí-los ou renovar a
    // data. Para o membro, aviso vencido é ruído.
  } = useConteudosInfinitos({ tipo: 'Aviso', incluirVencidos: isLeader });

  const excluirConteudo = useExcluirConteudo();
  const error = queryError ? extractErrorMessage(queryError) : null;

  /** Um aviso está vencido quando a validade já passou. */
  function estaVencido(aviso: Conteudo): boolean {
    if (!aviso.dataValidade) return false;
    const inicioDeHoje = new Date();
    inicioDeHoje.setHours(0, 0, 0, 0);
    return new Date(aviso.dataValidade) < inicioDeHoje;
  }

  function podeGerenciar(aviso: Conteudo): boolean {
    return (
      aviso.autor.id === user?.id ||
      ['Pastor', 'Administrador'].includes(user?.perfil ?? '')
    );
  }

  /**
   * A capa é o aviso em destaque; sem destaque, o mais recente.
   *
   * A lista já chega ordenada do servidor, então "o primeiro" é "o mais
   * recente". A posição faz o trabalho que o selo escrito "Destaque" fazia
   * antes — e faz melhor, porque não gasta uma linha para dizê-lo.
   */
  const { capa, restante, resumo } = useMemo(() => {
    const destaque = avisos.find((a) => a.principal) ?? avisos[0] ?? null;
    const vencidos = avisos.filter(estaVencido).length;

    const partes = [
      `${avisos.length} ${avisos.length === 1 ? 'aviso' : 'avisos'}`,
      vencidos > 0 ? `${vencidos} ${vencidos === 1 ? 'vencido' : 'vencidos'}` : null,
    ].filter(Boolean);

    return {
      capa: destaque,
      restante: destaque ? avisos.filter((a) => a.id !== destaque.id) : [],
      resumo: avisos.length > 0 ? partes.join(' · ') : undefined,
    };
  }, [avisos]);

  function confirmarExclusao(aviso: Conteudo) {
    Alert.alert(
      'Excluir aviso',
      `Excluir "${aviso.titulo}"? Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () =>
            excluirConteudo.mutate(aviso.id, {
              onError: (e) =>
                Alert.alert('Erro', extractErrorMessage(e, 'Não foi possível excluir.')),
            }),
        },
      ],
    );
  }

  /** Tudo o que um item precisa saber, montado uma vez só. */
  function propsDoItem(aviso: Conteudo) {
    const vencido = estaVencido(aviso);
    const gerencia = podeGerenciar(aviso);

    return {
      conteudo: aviso,
      icone: 'bullhorn-outline' as const,
      alerta: vencido ? 'Vencido' : null,
      meta: [
        new Date(aviso.dataPublicacao).toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'long',
        }),
        // A validade só entra quando ainda vale — depois de vencido, quem
        // informa é o marcador vermelho, e repetir a data seria ruído.
        aviso.dataValidade && !vencido
          ? `até ${new Date(aviso.dataValidade).toLocaleDateString('pt-BR', {
              day: 'numeric',
              month: 'short',
            })}`
          : null,
      ].filter((p): p is string => Boolean(p)),
      onPress: () =>
        navigation.navigate('DevocionalDetail', { id: String(aviso.id) }),
      onEditar: gerencia
        ? () => navigation.navigate('CreateConteudo', { id: String(aviso.id) })
        : undefined,
      onExcluir: gerencia ? () => confirmarExclusao(aviso) : undefined,
    };
  }

  const criar = () => navigation.navigate('CreateConteudo', { tipo: 'Aviso' });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title="Avisos da igreja"
        subtitle={resumo}
        onBack={() => navigation.goBack()}
        actionLabel={isLeader ? 'Novo aviso' : undefined}
        onActionPress={isLeader ? criar : undefined}
        acaoCompacta
        // Recarga em segundo plano: aparece na primeira linha, sem tapar a
        // lista que já está em tela.
        busy={isFetching && !isLoading}
      />

      <ScrollView
        className="flex-1 bg-background px-gutter"
        refreshControl={controle}
        // Pede a próxima página 400px antes do fim, para os itens já estarem
        // lá quando a pessoa chegar.
        scrollEventThrottle={400}
        onScroll={({ nativeEvent: e }) => {
          const chegouAoFim =
            e.layoutMeasurement.height + e.contentOffset.y >=
            e.contentSize.height - 400;
          if (chegouAoFim) carregarMais();
        }}
        contentContainerClassName="pb-3xl"
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
        ) : error ? (
          <View className="items-center gap-md py-3xl">
            <Text className="text-center font-sans text-[14px] text-ink-muted">{error}</Text>
            <Pressable onPress={() => refetch()} hitSlop={12}>
              <Text className="font-sans-semibold text-[14px] text-secondary">
                Tentar novamente
              </Text>
            </Pressable>
          </View>
        ) : !capa ? (
          <ListaVazia
            icone="bullhorn-outline"
            titulo="Nenhum aviso por aqui"
            descricao="É onde a liderança publica comunicados: mudanças de horário, convocações e recados para a congregação."
            acao={
              isLeader ? (
                <TileCriar rotulo="Publicar o primeiro aviso" onPress={criar} />
              ) : undefined
            }
          />
        ) : (
          <View className="pt-lg">
            <ItemDestaque {...propsDoItem(capa)} />

            {restante.length > 0 ? (
              <>
                <TituloGrupo>Anteriores</TituloGrupo>
                {restante.map((aviso, i) => (
                  <ItemLista
                    key={aviso.id}
                    {...propsDoItem(aviso)}
                    ultimo={i === restante.length - 1}
                  />
                ))}
              </>
            ) : null}

            {carregandoMais ? (
              <View className="items-center py-lg">
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null}

            {/* Diz que acabou. Sem isso, quem chega ao fim não sabe se a lista
                terminou ou se o app parou de carregar. */}
            {!temMais && avisos.length > 0 ? (
              <Text className="py-lg text-center font-sans text-[13px] text-ink-muted">
                {total === 1 ? '1 aviso no total' : `${total} avisos no total`}
              </Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
