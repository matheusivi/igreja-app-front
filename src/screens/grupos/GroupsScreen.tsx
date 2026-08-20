import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import {
  Button,
  ListaVazia,
  PilhaAvatares,
  ScreenHeader,
  TextField,
  TituloGrupo,
} from '../../components';
import { elevation, radius, spacing, tracking } from '../../constants/theme';
import {
  gruposKeys,
  useConvitesPendentes,
  useFamilias,
  useMeusGrupos,
  useResponderConvite,
} from '../../hooks/queries/useGrupos';
import { useThemeColors } from '../../hooks/useThemeColors';
import { EspacoTabBar } from '../../navigation/TabBar';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import { urlImagem } from '../../services/imagem';
import { useAtualizarPuxando } from '../../hooks/useAtualizarPuxando';
import {
  countMembrosAtivos,
  type ConvitePendente,
  type GrupoFamiliar,
} from '../../services/groups.service';

/**
 * Grupos familiares.
 *
 * ═══ O CONVITE SUBIU PARA O TOPO ═══
 * Era a última coisa da tela, abaixo dos grupos de que a pessoa já faz parte.
 * Isso invertia a urgência: o convite é o ÚNICO item aqui que tem prazo e que
 * exige uma decisão sua; o grupo de que você já participa não pede nada. E o
 * contador vermelho que anunciava "2 pendentes" ficava no rodapé — alarme
 * tocando no lugar onde ninguém rola.
 *
 * Agora ele abre a tela, sobre superfície dourada. O vermelho saiu junto: com
 * o convite em primeiro e numa cor própria, o badge de alerta virava aflição
 * sem função — ser convidado para uma família não é um erro a corrigir.
 *
 * ═══ ROSTOS NO LUGAR DE CONTABILIDADE ═══
 * O card dizia "Criado por Fulano" com avatar de 40px e "7 membros
 * participando". Quem abriu o registro é a informação menos relevante depois
 * do primeiro dia, e um número não faz ninguém reconhecer a própria família.
 * Quatro rostos fazem, na hora, sem ler nada.
 *
 * ═══ O CARD INTEIRO É O BOTÃO ═══
 * Dentro de cada card havia um "Ver membros da família" de largura cheia, que
 * levava exatamente para onde tocar no card levaria. Botão que duplica o
 * gesto do contêiner é mobília: ocupa 52px de altura por card e ainda ensina
 * errado, sugerindo que o resto do card não é tocável.
 */
export function GroupsScreen() {
  // Puxar para atualizar: dois celulares na mesma tela não se falavam.
  const { controle } = useAtualizarPuxando([gruposKeys.all]);

  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();

  const {
    data: grupos = [],
    isPending: isLoading,
    error: gruposError,
    refetch,
    isFetching,
  } = useMeusGrupos(user?.id);
  const { data: convites = [] } = useConvitesPendentes();
  const responderConvite = useResponderConvite();

  // O termo vive aqui, e não dentro da lista: quando há busca em curso, a
  // tela inteira muda de modo (a sua família some do topo).
  const [busca, setBusca] = useState('');
  const buscando = busca.trim().length > 0;

  /**
   * A lista de famílias da igreja, 15 em 15.
   *
   * Fica AQUI, e não dentro de `ListaFamilias`, porque quem detecta a rolagem
   * até o fim é o `ScrollView` desta tela — e ele precisa alcançar o
   * `carregarMais`. O bloco lá embaixo recebe o resultado pronto.
   */
  const listaFamilias = useFamilias(busca);

  const error = gruposError ? extractErrorMessage(gruposError) : null;

  /** Qual convite está em voo, e para qual lado — só esse botão gira. */
  const emVoo = responderConvite.isPending
    ? {
        id: responderConvite.variables?.membroId ?? null,
        status: responderConvite.variables?.status ?? null,
      }
    : { id: null, status: null };

  function responder(membroId: number, status: 'aceito' | 'recusado') {
    responderConvite.mutate(
      { membroId, status },
      {
        // Antes o erro era engolido em silêncio: o convite não sumia e a
        // pessoa não sabia por quê.
        onError: (e) =>
          Alert.alert(
            'Erro',
            extractErrorMessage(e, 'Não foi possível responder ao convite.'),
          ),
      },
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title="Grupos familiares"
        busy={isFetching && !isLoading}
        regua
      />

      <ScrollView
        className="flex-1 bg-background px-gutter"
        refreshControl={controle}
        // Pede as próximas 15 famílias 400px antes do fim, para elas já
        // estarem lá quando a pessoa chegar.
        scrollEventThrottle={400}
        onScroll={({ nativeEvent: e }) => {
          const chegouAoFim =
            e.layoutMeasurement.height + e.contentOffset.y >=
            e.contentSize.height - 400;
          if (chegouAoFim) listaFamilias.carregarMais();
        }}
        contentContainerClassName="pb-xl pt-lg"
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
        ) : (
          <>
            {/* ═══ 1. CONVITES — o que pede decisão ═══════════════════ */}
            {convites.length > 0 ? (
              <View className="gap-md">
                {convites.map((convite) => (
                  <CartaoConvite
                    key={convite.id}
                    convite={convite}
                    aceitando={emVoo.id === convite.id && emVoo.status === 'aceito'}
                    recusando={emVoo.id === convite.id && emVoo.status === 'recusado'}
                    onResponder={(status) => responder(convite.id, status)}
                  />
                ))}
              </View>
            ) : null}

            {/* ═══ 2. A SUA FAMÍLIA ═══════════════════════════════════
                Só aparece quando NÃO há busca em curso. Durante a busca a
                tela responde a uma pergunta, e manter a sua família fixa no
                topo faria ela parecer resultado de algo que não foi
                perguntado. */}
            {!buscando && grupos.length > 0 ? (
              <View className="gap-md">
                <TituloGrupo>
                  {grupos.length === 1 ? 'Sua família' : 'Suas famílias'}
                </TituloGrupo>

                {grupos.map((grupo) => (
                  <CartaoGrupo
                    key={grupo.id}
                    grupo={grupo}
                    onPress={() =>
                      navigation.navigate('GroupDetail', { id: String(grupo.id) })
                    }
                  />
                ))}
              </View>
            ) : null}

            {/* Convite para criar: só para quem não tem família e não está
                buscando. Uma pessoa, uma família — ver a trava no backend. */}
            {!buscando && grupos.length === 0 && convites.length === 0 ? (
              <ListaVazia
                icone="home-heart"
                titulo="Você ainda não tem uma família aqui"
                descricao="Grupo familiar é o núcleo em que a igreja se cuida de perto. Peça para o líder da sua te convidar, ou crie a sua."
                acao={
                  <Button
                    label="Criar minha família"
                    fullWidth={false}
                    icon={
                      <MaterialCommunityIcons
                        name="plus"
                        size={18}
                        color={colors.onPrimary}
                      />
                    }
                    onPress={() => navigation.navigate('CreateGroup')}
                  />
                }
              />
            ) : null}

            {/* ═══ 3. A IGREJA ════════════════════════════════════════ */}
            <ListaFamilias
              busca={busca}
              onBusca={setBusca}
              idsOcultos={buscando ? [] : grupos.map((g) => g.id)}
              onAbrir={(id) => navigation.navigate('GroupDetail', { id: String(id) })}
              lista={listaFamilias}
            />
          </>
        )}

        {/* A barra de abas flutua sobre o conteúdo, fora do fluxo do layout.
            Sem este espaço, o último item fica escondido atrás dela. */}
        <EspacoTabBar />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   A IGREJA INTEIRA
   ══════════════════════════════════════════════════════════════════════ */

/**
 * Busca e lista das demais famílias.
 *
 * ═══ POR QUE ISTO MORA AQUI ═══
 * A aba Grupos mostrava só a sua família e, para a maioria, uma tela vazia
 * com um botão de criar. Uma aba inteira do app para uma linha de conteúdo.
 *
 * A lista das outras famílias resolve isso e ainda responde a pergunta que
 * mais se faz numa igreja: "de que casa é essa pessoa?". Por isso a busca
 * casa o nome do INTEGRANTE além do nome da família — digitar "Maria"
 * devolve a casa da Maria, mesmo que a família se chame "Os Guerreiros".
 *
 * ═══ A SUA FAMÍLIA SAI DAQUI ═══
 * Ela já está acima, com destaque. Repeti-la no meio das outras faria a
 * pessoa procurar duas vezes a mesma coisa. Durante a busca, porém, ela
 * volta: quem digita o próprio sobrenome espera se encontrar no resultado.
 */
function ListaFamilias({
  busca,
  onBusca,
  idsOcultos,
  onAbrir,
  lista,
}: {
  busca: string;
  onBusca: (v: string) => void;
  idsOcultos: number[];
  onAbrir: (grupoId: number) => void;
  /**
   * O resultado do `useFamilias`, vindo do componente da TELA.
   *
   * ═══ POR QUE O HOOK SUBIU ═══
   * Este bloco é a terceira seção de uma tela composta, dentro do `ScrollView`
   * do pai. Para o gesto de rolar até o fim pedir a próxima página, quem
   * detecta a rolagem (o pai) precisa alcançar o `carregarMais` — e ele
   * nascia aqui dentro, fora do alcance.
   *
   * Passar o resultado pronto resolve sem inverter nada: o hook continua
   * sendo chamado uma vez só, e a busca continua sendo estado do pai, como
   * já era.
   */
  lista: ReturnType<typeof useFamilias>;
}) {
  const colors = useThemeColors();
  const { familias, total, carregando, erro, termoCurto, carregandoMais, temMais } =
    lista;

  const visiveis = familias.filter((f) => !idsOcultos.includes(f.id));
  const temBusca = busca.trim().length > 0;

  return (
    <View className="gap-md pt-lg">
      <TituloGrupo>{temBusca ? 'Resultados' : 'Famílias da igreja'}</TituloGrupo>

      <TextField
        label="Procurar"
        placeholder="Nome da pessoa ou da família"
        value={busca}
        onChangeText={onBusca}
        autoCorrect={false}
        returnKeyType="search"
      />

      {erro ? (
        <Text className="font-sans text-[14px] text-error">{extractErrorMessage(erro)}</Text>
      ) : termoCurto ? (
        <Text className="font-sans text-[13px] text-ink-muted">
          Digite pelo menos 2 letras.
        </Text>
      ) : carregando ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : visiveis.length === 0 ? (
        <Text className="font-sans text-[14px] leading-6 text-ink-muted">
          {temBusca
            ? 'Nenhuma família encontrada. A busca ignora acento, mas não adivinha apelido.'
            : 'Nenhuma outra família cadastrada ainda.'}
        </Text>
      ) : (
        <View className="gap-md">
          {visiveis.map((familia) => (
            <CartaoGrupo
              key={familia.id}
              grupo={familia}
              onPress={() => onAbrir(familia.id)}
            />
          ))}

          {carregandoMais ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : null}

          {/* Diz que acabou — senão quem chega ao fim não sabe se a lista
              terminou ou se o app parou de carregar. */}
          {!temMais && !temBusca ? (
            <Text className="py-sm text-center font-sans text-[13px] text-ink-muted">
              {total === 1 ? '1 família cadastrada' : `${total} famílias cadastradas`}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   CONVITE
   ══════════════════════════════════════════════════════════════════════ */

/**
 * O convite é o elemento ESCURO da tela.
 *
 * ═══ POR QUE NÃO DOURADO ═══
 * A primeira versão usou `gold-fixed` como fundo, para dar ao convite uma
 * cor própria. Medido, o cartão dava **1,08:1** contra o papel: existia no
 * código e não existia no olho. Toda a família de superfícies tingidas claras
 * desta paleta esbarra nisso — `gold-fixed`, `secondary-soft` e o papel
 * ficam dentro de 3% de luminância uns dos outros.
 *
 * Pior: dentro de um cartão tingido, os botões somem também. O "Recusar"
 * secundário é `surface-dim`, que sobre `gold-fixed` dá 1,03:1 — um botão
 * literalmente invisível.
 *
 * ═══ POR QUE ESCURO ═══
 * `inverse-surface` dá 13,10:1 contra o papel no tema claro e 14,31:1 no
 * escuro. E o significado já está estabelecido no app: nas listas de conteúdo
 * o cartão escuro é o item que se lê primeiro. Aqui o convite É o item que se
 * lê primeiro. Mesma cor, mesma frase — "comece por aqui".
 *
 * ═══ OS BOTÕES SÃO PRÓPRIOS ═══
 * O `<Button>` do sistema é construído contra o fundo da PÁGINA; sobre o
 * cartão escuro o primário dá 2,87:1 como forma e desaparece. Aqui "Aceitar"
 * inverte de novo — pastilha clara sobre o escuro, 12,23:1 — e "Recusar"
 * fica em texto. O que também é a hierarquia certa: recusar não merece o
 * mesmo peso visual de aceitar.
 */
function CartaoConvite({
  convite,
  aceitando,
  recusando,
  onResponder,
}: {
  convite: ConvitePendente;
  aceitando: boolean;
  recusando: boolean;
  onResponder: (status: 'aceito' | 'recusado') => void;
}) {
  const colors = useThemeColors();
  const ocupado = aceitando || recusando;

  return (
    <View
      style={[
        {
          alignSelf: 'stretch',
          gap: spacing.lg,
          padding: spacing.xl,
          borderRadius: radius.lg,
          backgroundColor: colors.inverseSurface,
        },
        elevation.raised,
      ]}
    >
      <View className="flex-row items-center gap-sm">
        <MaterialCommunityIcons
          name="email-heart-outline"
          size={17}
          // Acento que ACOMPANHA a inversão do cartão: dourado no tema
          // claro, terracota escura no escuro.  fixo dava 2,09:1
          // sobre o cartão claro do tema escuro — sumia.
          color={colors.onInverseAccent}
        />
        <Text className="font-sans-semibold text-[13px]" style={{ color: colors.onInverseAccent }}>
          Convite para você
        </Text>
      </View>

      <View className="gap-xs">
        <Text
          className="font-serif-bold text-[20px] leading-7"
          style={{ color: colors.inverseInk, letterSpacing: tracking.heading }}
        >
          {convite.nomeGrupo ?? 'Uma família'}
        </Text>
        <Text
          className="font-sans text-[14px] leading-6"
          style={{ color: colors.inverseInk, opacity: 0.78 }}
        >
          {convite.convidadoPor.nomeCompleto} convidou você
          {convite.parentesco ? ` como ${convite.parentesco.toLowerCase()}` : ''}.
        </Text>
      </View>

      <View className="flex-row items-center gap-md">
        {/* Só o botão pressionado gira. Antes os dois giravam juntos: a
            pessoa aceitava e via "Recusar" carregando também. */}
        {/* O `flex-1` vive no invólucro, não no `style` do Pressable: a
            regra do projeto é que o Pressable só mexa em opacidade. */}
        <View className="flex-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Aceitar o convite para ${convite.nomeGrupo ?? 'a família'}`}
          accessibilityState={{ busy: aceitando, disabled: ocupado }}
          disabled={ocupado}
          onPress={() => onResponder('aceito')}
          style={({ pressed }) => ({ opacity: pressed || ocupado ? 0.8 : 1 })}
        >
          <View
            style={{
              minHeight: 48,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              borderRadius: radius.button,
              backgroundColor: colors.inverseInk,
            }}
          >
            {aceitando ? (
              <ActivityIndicator size="small" color={colors.inverseSurface} />
            ) : (
              <Text
                className="font-sans-semibold text-[15px]"
                style={{ color: colors.inverseSurface }}
              >
                Aceitar
              </Text>
            )}
          </View>
        </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Recusar o convite para ${convite.nomeGrupo ?? 'a família'}`}
          accessibilityState={{ busy: recusando, disabled: ocupado }}
          disabled={ocupado}
          onPress={() => onResponder('recusado')}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed || ocupado ? 0.6 : 1 })}
        >
          <View
            style={{
              minHeight: 48,
              paddingHorizontal: spacing.lg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {recusando ? (
              <ActivityIndicator size="small" color={colors.inverseInk} />
            ) : (
              <Text
                className="font-sans-semibold text-[15px]"
                style={{ color: colors.inverseInk, opacity: 0.78 }}
              >
                Recusar
              </Text>
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   FAMÍLIA
   ══════════════════════════════════════════════════════════════════════ */

function CartaoGrupo({ grupo, onPress }: { grupo: GrupoFamiliar; onPress: () => void }) {
  const colors = useThemeColors();
  const ativos = grupo.membros.filter((m) => m.status === 'aceito');
  const total = countMembrosAtivos(grupo);
  const nome = grupo.nome ?? 'Grupo familiar';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${nome}, ${total} ${total === 1 ? 'membro' : 'membros'}`}
      onPress={onPress}
      // Nenhuma aparência no Pressable: o NativeWind escreve o `className` no
      // mesmo prop `style`, e o que perde o merge não existe. Já derrubou o
      // bloco de vídeo e o fundo do botão "+".
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <View
        style={[
          {
            alignSelf: 'stretch',
            borderRadius: radius.lg,
            overflow: 'hidden',
            backgroundColor: colors.surfaceBright,
          },
          elevation.subtle,
        ]}
      >
        {grupo.imagemUrl ? (
          // Sangra até a borda. Antes a foto vivia dentro do padding do card,
          // criando moldura dentro de moldura — card dentro de card.
          <Image
            source={{ uri: urlImagem(grupo.imagemUrl, { largura: 353, altura: 176 }) }}
            style={{ alignSelf: 'stretch', aspectRatio: 2 / 1 }}
            resizeMode="cover"
            accessible={false}
          />
        ) : null}

        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          {/* O rótulo "SUA FAMÍLIA" saiu: estava em todo card, dentro da tela
              de grupos familiares. Rótulo que aparece sempre não classifica. */}
          <Text
            className="font-serif-bold text-[20px] leading-7 text-ink"
            style={{ letterSpacing: tracking.heading }}
            numberOfLines={2}
          >
            {nome}
          </Text>

          <View className="flex-row items-center gap-md">
            <PilhaAvatares
              pessoas={ativos.map((m) => m.usuario)}
              tamanho={30}
              maximo={4}
            />
            <Text className="flex-1 font-sans text-[13px] text-ink-muted">
              {total} {total === 1 ? 'pessoa' : 'pessoas'}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={colors.inkMuted}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
