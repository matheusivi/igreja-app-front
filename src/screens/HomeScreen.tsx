import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  HeroInicio,
  ItemLista,
  SecaoAniversarios,
  SectionHeader,
  VersiculoDoDia,
} from '../components';
import { tracking } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';
import type { AppStackParamList } from '../navigation/types';
import {
  formatEventDate,
  formatEventTime,
  labelForTipo,
} from '../services/events.service';
import { useProximoEvento } from '../hooks/queries/useEventos';
import { useConfiguracao } from '../hooks/queries/useConfiguracao';
import { useConteudos } from '../hooks/queries/useConteudos';
import { urlImagem } from '../services/imagem';
import { useAniversarios } from '../hooks/queries/useAniversariantes';
import { useCountdown } from '../hooks/useCountdown';
import { useAuth } from '../navigation/AuthContext';
import { EspacoTabBar } from '../navigation/TabBar';
import { conteudosKeys } from '../hooks/queries/useConteudos';
import { eventosKeys } from '../hooks/queries/useEventos';
import { aniversariantesKeys } from '../hooks/queries/useAniversariantes';
import { useAtualizarPuxando } from '../hooks/useAtualizarPuxando';

type QuickAction = {
  label: string;
  /** MaterialCommunityIcons — o mesmo conjunto da barra de abas. */
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: (navigation: NativeStackNavigationProp<AppStackParamList>) => void;
};

/**
 * Atalho principal — o devocional é o único destes quatro que se abre TODO
 * dia. Tratá-lo como igual aos outros três, numa grade 2×2 de quadradinhos
 * iguais, era o erro: a grade dizia que tudo tem o mesmo peso, e não tem.
 */
const atalhoPrincipal: QuickAction = {
  label: 'Devocional de hoje',
  icon: 'book-open-page-variant-outline',
  onPress: (nav) => nav.navigate('Devocionais'),
};

/**
 * Rótulos curtos de propósito: "Pedidos de Oração" truncava para
 * "Pedidos de Ora…", e rótulo cortado é pior que rótulo curto.
 *
 * Cada um recebe um `tint` próprio, tirado da paleta — rosado, dourado e
 * musgo. Não é enfeite: com três ícones da mesma cor dentro de três caixas
 * iguais, a pessoa precisa LER os três rótulos toda vez. Com tintas
 * distintas ela reconhece a posição pela cor depois da terceira visita.
 *
 * Três tintas, e não cinco — passando disso vira arco-íris.
 */
const atalhosSecundarios: (QuickAction & { tint: string })[] = [
  {
    // ═══ SAIU ORAÇÃO, ENTROU LEITURA ═══
    // Oração já é uma ABA, sempre visível no rodapé. O atalho gastava um dos
    // três lugares desta fileira para levar a um destino que está a um toque
    // de distância em qualquer tela do app.
    //
    // O plano de leitura não tem aba e é diário — é exatamente o tipo de
    // destino que ganha com um atalho na tela que a pessoa abre primeiro.
    label: 'Leitura',
    icon: 'book-open-variant',
    tint: 'bg-secondary-soft',
    onPress: (nav) => nav.navigate('PlanoLeitura'),
  },
  {
    label: 'Agenda',
    icon: 'calendar-month',
    tint: 'bg-gold-fixed',
    onPress: (nav) => nav.navigate('Eventos'),
  },
  {
    // Duas trocas seguidas aqui. `gift` saiu porque presente sugere brinde
    // recebido, e ofertar é o contrário. `hand-coin` entrou e foi pior: em
    // 22px ele é uma mão com um disco, e `hand-heart` (Oração) é uma mão com
    // um coração — lado a lado, os dois viram a mesma silhueta. Ícone só
    // funciona se a SILHUETA distingue; detalhe interno some no tamanho real.
    label: 'Ofertar',
    icon: 'cash-multiple',
    tint: 'bg-success-soft',
    onPress: (nav) => nav.navigate('Contribuir'),
  },
];

export function HomeScreen() {
  /**
   * A Home junta quatro fontes: próximo evento, avisos, aniversariantes e a
   * configuração do topo. Puxar atualiza as três primeiras — a configuração
   * fica de fora porque muda algumas vezes por ANO e tem cache de 30 minutos
   * de propósito.
   */
  const { controle } = useAtualizarPuxando([
    eventosKeys.all,
    conteudosKeys.all,
    aniversariantesKeys.all,
  ]);

  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();

  // Próximo evento vem do cache compartilhado: criar ou excluir um evento
  // em qualquer tela atualiza este card sozinho.
  const { data: proximoEvento, isPending: isLoadingEvento } = useProximoEvento();

  const hojeDate = new Date();
  const hoje = hojeDate.getDate();
  const mesAtual = hojeDate.getMonth() + 1;

  // `hoje` e `proximos` vêm separados: cada um tem forma própria na tela.
  const {
    hoje: aniversariantesHoje,
    proximos: aniversariantesProximos,
    isPending: isLoadingAniversariantes,
  } = useAniversarios(mesAtual, hoje);
  const temAniversario =
    aniversariantesHoje.length > 0 || aniversariantesProximos.length > 0;

  // Do cache compartilhado: publicar ou excluir um aviso em outra tela
  // reflete aqui sozinho. Antes era um `useFocusEffect` que só recarregava
  // quando a Home voltava a receber foco — e engolia erros em silêncio.
  const { data: avisos = [], isPending: isLoading } = useConteudos({
    tipo: 'Aviso',
    limit: 3,
  });

  // Capa e versículo do topo, definidos pela liderança. `staleTime` de 30
  // minutos no hook: isto muda algumas vezes por ano e é lido a cada visita.
  const { data: configuracao } = useConfiguracao();

  const countdown = useCountdown(proximoEvento?.dataInicio);

  // A área segura acompanha o HERO, não a página: quando o hero ganhar foto
  // ele fica escuro, e a faixa acima dele precisa ser da mesma cor, senão
  // aparece uma tira clara entre o relógio do celular e a imagem.
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-xl pb-3xl"
        refreshControl={controle}
      >
        {/* ── Topo ────────────────────────────────────────────────────
            Dois modos, e o componente escolhe sozinho:

            COM CAPA  — a foto ocupa a faixa inteira sob um véu de 62%, que é
                        onde o texto claro passa 4,5:1 mesmo sobre céu.
            SEM CAPA  — emblema (glifo de igreja) sobre o marrom.

            A capa e a frase vêm do SERVIDOR, definidas pela liderança em
            Perfil → Aparência da tela inicial. Antes eram um `require` de
            arquivo em `assets/` e uma string escrita aqui: trocar qualquer
            um dos dois exigia publicar versão nova do app.

            O `??` mantém a frase antiga como padrão — assim a Home nunca
            aparece sem versículo enquanto a configuração carrega ou se a
            igreja apagar a frase. */}
        <HeroInicio
          nomeCompleto={user?.nomeCompleto}
          versiculo={
            configuracao?.versiculoHome ?? 'A expectativa gera o ambiente de milagres.'
          }
          imagem={configuracao?.heroImagemUrl ?? null}
        />

        {/* ── Versículo do dia ───────────────────────────────────────
            Logo abaixo do hero, e não dentro dele: são dois textos com
            funções diferentes. A frase do topo é a identidade da igreja,
            escolhida pela liderança e igual por meses. Este muda todo dia e
            pode ser fechado no X — some até amanhã.

            O componente decide sozinho se aparece: ele lê no aparelho o dia
            em que foi dispensado e se compara com hoje. Enquanto o disco não
            responde, não desenha nada, para não piscar. */}
        <VersiculoDoDia />

        {/* ── Próximo culto ──────────────────────────────────────────
            A regra de §10 é sobre REPETIÇÃO, não sobre proibir imagem: a foto
            do prédio aparecia no hero, aqui e no aviso — três vezes na mesma
            rolagem, e repetida ela deixa de comunicar nas três. O prédio é do
            hero; aqui entra a capa própria daquele culto, quando existe.

            Sem capa o card fica limpo, sem placeholder. Quem carrega a tela
            então é a contagem, que é a informação que a pessoa veio buscar.

            Saiu a centralização: texto à esquerda se lê mais rápido, e
            centralizar tudo é o que se faz quando ainda não se decidiu qual
            informação manda. */}
        <View className="px-gutter">
          <Card
            variant="raised"
            contentClassName="gap-lg"
            // Capa PRÓPRIA do culto, quando a liderança subiu uma. A regra de
            // §10 continua valendo: a foto do prédio é do hero; aqui só entra
            // a imagem daquele evento. Sem imagem, o card fica limpo — não há
            // placeholder nem foto genérica preenchendo buraco.
            {...(proximoEvento?.imagemUrl
              ? {
                  // Pelo `urlImagem`: era o original do Cloudinary — 1080px
                  // de largura para um card de 353. Custa 4G de quem abre a
                  // Home todo dia, e nem melhora a nitidez.
                  imagem: {
                    uri: urlImagem(proximoEvento.imagemUrl, {
                      largura: 353,
                      altura: 177,
                    }),
                  },
                  imagemAlt: `Capa de ${proximoEvento.titulo}`,
                  imagemAspecto: 2 / 1,
                }
              : {})}
          >
            <View className="flex-row items-center justify-between">
              <Text
                className="font-sans-semibold text-[11px] uppercase text-secondary"
                style={{ letterSpacing: tracking.overline }}
              >
                {proximoEvento ? labelForTipo(proximoEvento.tipo) : 'Próximo evento'}
              </Text>
              {proximoEvento?.destaqueHome ? (
                <View className="flex-row items-center gap-1 rounded-sm bg-gold-fixed px-2 py-1">
                  <Ionicons name="star" size={11} color={colors.onGoldFixed} />
                  <Text className="font-sans-semibold text-[11px] text-on-gold-fixed">
                    Em destaque
                  </Text>
                </View>
              ) : null}
            </View>

            {isLoadingEvento ? (
              <ActivityIndicator color={colors.primary} />
            ) : proximoEvento ? (
              <>
                <View className="gap-xs">
                  <Text
                    className="font-serif-bold text-[22px] leading-7 text-ink"
                    style={{ letterSpacing: tracking.heading }}
                  >
                    {proximoEvento.titulo}
                  </Text>
                  <Text className="font-sans text-sm text-ink-muted">
                    {formatEventDate(proximoEvento.dataInicio)} ·{' '}
                    {formatEventTime(proximoEvento.dataInicio)}
                    {proximoEvento.local ? ` · ${proximoEvento.local}` : ''}
                  </Text>
                </View>

                {/* ── Contagem regressiva ─────────────────────────────
                    O corte no topo era `leading-9` (36px) sob um serifado de
                    34px: a Source Serif tem ascendente alto e a caixa de
                    linha decepava o topo dos algarismos. Agora a entrelinha é
                    1,25× o corpo, que é o mínimo para serifada de display.

                    Os segundos voltaram. Eu os tirei alegando que puxavam o
                    olho — mas o argumento vale ao contrário: é o segundo
                    correndo que faz a contagem parecer viva em vez de um
                    número parado. Foi uma decisão minha, não do sistema.

                    As quatro unidades viram uma FAIXA com divisórias, sobre
                    superfície tingida. Quatro números soltos lado a lado se
                    leem como quatro coisas; com a moldura comum e o fio entre
                    eles, se leem como um relógio — que é o que são. */}
                {countdown ? (
                  <View className="flex-row overflow-hidden rounded-sm bg-surface-dim">
                    {[
                      { value: countdown.dias, label: 'dias', a11y: 'dias' },
                      { value: countdown.horas, label: 'hrs', a11y: 'horas' },
                      { value: countdown.mins, label: 'min', a11y: 'minutos' },
                      { value: countdown.segs, label: 'seg', a11y: 'segundos' },
                    ].map((item, i) => (
                      <View
                        key={item.label}
                        accessible
                        accessibilityLabel={`${item.value} ${item.a11y}`}
                        className={[
                          'flex-1 items-center py-md',
                          i > 0 ? 'border-l border-outline-variant' : '',
                        ].join(' ')}
                      >
                        <Text
                          className="font-serif-bold text-[32px] text-ink"
                          // 40 = 1,25 × 32. Abaixo disso o serifado corta.
                          style={{ lineHeight: 40, letterSpacing: tracking.display }}
                        >
                          {String(item.value).padStart(2, '0')}
                        </Text>
                        <Text
                          className="font-sans-medium text-[11px] uppercase text-ink-muted"
                          style={{ letterSpacing: tracking.overline }}
                        >
                          {item.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* `primary`, não `secondary`. Sobre card branco, o secundário
                    é `surface-dim` — um preenchimento de 1,1:1 que o olho lê
                    como botão apagado. Esta é A ação da Home; é ela que tem
                    direito ao único primário da tela. */}
                <Button
                  label="Ver na agenda"
                  icon={
                    <Ionicons name="calendar-outline" size={17} color={colors.onPrimary} />
                  }
                  onPress={() => navigation.navigate('Eventos')}
                />
              </>
            ) : (
              <View className="gap-sm py-2">
                <Text className="font-serif-bold text-lg text-ink">
                  Nenhum culto agendado
                </Text>
                <Text className="font-sans text-sm leading-5 text-ink-muted">
                  Assim que a liderança publicar a próxima data, ela aparece aqui.
                </Text>
              </View>
            )}
          </Card>
        </View>

        {/* ── Atalhos ────────────────────────────────────────────────
            Era uma grade 2×2 de quatro quadrados idênticos, cada um com um
            ícone dentro de um quadradinho arredondado. É o padrão de app mais
            copiado dos últimos anos, e ele afirma uma coisa falsa: que as
            quatro ações têm o mesmo peso. O devocional abre todo dia; ofertar,
            uma vez por mês.

            A grade virou assimétrica — um item largo em cima e três estreitos
            embaixo. A forma passou a dizer a verdade sobre a frequência. */}
        <View className="gap-md px-gutter">
          <Pressable
            onPress={() => atalhoPrincipal.onPress(navigation)}
            accessibilityRole="button"
            accessibilityLabel={atalhoPrincipal.label}
            style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
            className="flex-row items-center gap-md rounded-lg bg-secondary-soft px-lg py-lg"
          >
            <MaterialCommunityIcons
              name={atalhoPrincipal.icon}
              size={26}
              color={colors.primary}
            />
            <View className="flex-1">
              <Text className="font-serif-bold text-base text-ink">
                {atalhoPrincipal.label}
              </Text>
              <Text className="font-sans text-[13px] text-ink-muted">
                Uma palavra para começar o dia
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.inkMuted} />
          </Pressable>

          {/* ── Três atalhos, UM objeto ─────────────────────────────
              Eram três cards brancos idênticos lado a lado — o olho conta
              três molduras antes de ler qualquer rótulo. Agora é uma peça só
              com três compartimentos separados por fio: a divisória diz
              "partes do mesmo grupo", enquanto três caixas diziam "três
              coisas sem relação".

              O ícone ganhou uma pastilha tingida atrás. Ícone solto no
              branco é a composição mais neutra que existe; a pastilha dá
              massa ao alvo e é o que diferencia um atalho do outro à
              distância. Quadrado arredondado, não círculo — círculo atrás de
              ícone é o penúltimo clichê de app (o último é a pílula). */}
          <View className="flex-row overflow-hidden rounded-lg border border-outline-variant bg-surface-bright">
            {atalhosSecundarios.map((action, i) => (
              <Pressable
                key={action.label}
                onPress={() => action.onPress(navigation)}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                // Feedback de toque: sem isto o item não dá sinal nenhum de
                // que registrou o toque enquanto a próxima tela carrega.
                style={({ pressed }) => (pressed ? { opacity: 0.55 } : null)}
                className={[
                  'flex-1 items-center gap-sm py-lg',
                  i > 0 ? 'border-l border-outline-variant' : '',
                ].join(' ')}
              >
                <View
                  className={[
                    'h-11 w-11 items-center justify-center rounded-md',
                    action.tint,
                  ].join(' ')}
                >
                  <MaterialCommunityIcons name={action.icon} size={22} color={colors.ink} />
                </View>
                <Text numberOfLines={1} className="font-sans-medium text-[13px] text-ink">
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Aniversários ───────────────────────────────────────────
            A seção só existe quando há aniversário a acontecer no mês. Some
            por completo quando não há — e some com o cabeçalho junto, senão
            fica um título anunciando o vazio.

            Quem decide a FORMA é o `SecaoAniversarios`, porque ela depende da
            contagem: um card largo para uma pessoa, carrossel para várias, e
            os próximos numa linha discreta que não disputa com o card. */}
        {isLoadingAniversariantes ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
        ) : temAniversario ? (
          <View className="gap-lg">
            <View className="px-gutter">
              <SectionHeader
                title={
                  aniversariantesHoje.length > 0
                    ? 'Aniversário hoje'
                    : 'Aniversariantes do mês'
                }
                subtitle={
                  aniversariantesHoje.length > 1
                    ? `${aniversariantesHoje.length} pessoas da igreja`
                    : undefined
                }
              />
            </View>

            <SecaoAniversarios
              hoje={aniversariantesHoje}
              proximos={aniversariantesProximos}
              mes={mesAtual}
            />
          </View>
        ) : null}

        {/* Separador entre aniversariantes e avisos.
            As duas seções são cards claros sobre fundo claro, encostados por
            um `gap-xl` igual ao espaçamento interno delas — o olho lia tudo
            como uma lista só, e "Avisos recentes" parecia continuação dos
            aniversariantes. Uma régua fina com respiro maior dos dois lados
            é o corte editorial mais barato: separa sem inventar cor nem caixa
            nova. */}
        <View className="mx-gutter my-2 h-px bg-outline-variant" />

        {/* Avisos recentes */}
        <View className="px-gutter">
          <SectionHeader
            title="Avisos recentes"
            actionLabel="Ver tudo"
            onActionPress={() => navigation.navigate('Avisos')}
          />
          {isLoading ? (
            // Era `colors.gold` — 2,75:1 sobre o papel, um giro que quase não
            // se vê. O dourado desta paleta é fundo, não tinta sobre claro.
            <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
          ) : avisos.length > 0 ? (
            /* ── A MESMA GRAMÁTICA DA TELA DE AVISOS ─────────────────────
               Aqui havia uma segunda versão do card de aviso, escrita à mão:
               capa 21:9 dentro do padding do card (moldura dentro de moldura),
               rótulo "AVISO" em VERDE — cor que a paleta reserva para
               confirmação — e a imagem carregada em resolução cheia para um
               espaço de 48px.

               Ou seja: a mesma informação em duas línguas, em duas telas, e
               a daqui com três defeitos que a outra já não tinha.

               Agora reusa `ItemLista`. A Home é um RESUMO — três linhas
               compactas e "Ver tudo"; a tela de Avisos é o índice completo,
               com item de capa. Formas diferentes porque as funções são
               diferentes, mas o mesmo vocabulário. */
            <View>
              {avisos.map((aviso, i) => (
                <ItemLista
                  key={aviso.id}
                  conteudo={aviso}
                  icone="bullhorn-outline"
                  meta={[
                    new Date(aviso.dataPublicacao).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                    }),
                  ]}
                  onPress={() =>
                    navigation.navigate('DevocionalDetail', { id: String(aviso.id) })
                  }
                  ultimo={i === avisos.length - 1}
                />
              ))}
            </View>
          ) : (
            <Text className="pt-sm font-sans text-[14px] text-ink-muted">
              Nenhum aviso no momento.
            </Text>
          )}
        </View>
        {/* A barra de abas flutua sobre o conteúdo, fora do fluxo do layout.
            Sem este espaço, o último item da lista fica permanentemente
            escondido atrás dela. */}
        <EspacoTabBar />
      </ScrollView>
    </SafeAreaView>
  );
}
