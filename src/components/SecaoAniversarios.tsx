import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Dimensions, Image, Modal, Pressable, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { elevation, spacing, tracking } from '../constants/theme';
import type { AniversarianteDoMes } from '../hooks/queries/useAniversariantes';
import { useThemeColors } from '../hooks/useThemeColors';
import { urlImagem } from '../services/imagem';
import { rotuloProfissao } from '../services/profissoes';
import { Button } from './Button';
import { Monograma } from './Monograma';

/**
 * Aniversários na Home — quatro estados, quatro formas.
 *
 * ═══ POR QUE QUATRO FORMAS ═══
 * A distribuição real manda no desenho. Com 150 membros, a média é 0,41
 * aniversariante por dia: o caso COMUM não é carrossel, é uma pessoa só — e
 * em dois terços dos dias não é ninguém.
 *
 *   1 pessoa hoje   → card ÚNICO, largura cheia, foto 3:2
 *   2+ pessoas hoje → carrossel de cards retrato
 *   ninguém hoje    → só a linha discreta dos próximos
 *   nada no mês     → a seção some (quem decide é o HomeScreen)
 *
 * Card estreito de 220px sobrando espaço dos dois lados, para UM item, fica
 * esquisito — e carrossel com um item só não é carrossel: não deve encaixar
 * nem mostrar vizinho espiando. Por isso o caso de 1 tem forma própria.
 *
 * ═══ O CARD ═══
 * A foto domina, e uma faixa escura na base carrega nome e família. Essa
 * estrutura é o que resolve a desproporção da versão anterior: a proporção do
 * card passa a ser definida pela IMAGEM, não pela quantidade de texto. Um
 * nome ou um nome comprido não mudam a moldura.
 *
 * **Faixa sólida a 78%, não degradê.** Degradê exigiria `expo-linear-gradient`.
 * Mais importante: sobre foto que a igreja sobe e eu não controlo, o degradê
 * só garante contraste na parte de baixo. Medi o pior caso — texto branco
 * sobre foto totalmente branca — e a opacidade mínima para passar 4,5:1 é
 * 0,70. Uso 0,78, que dá ~7:1 e sobra margem para traço fino de fonte.
 *
 * **Sem foto vira monograma**, não retângulo cinza. Como o app ainda não está
 * em produção, esse é o estado que mais vai aparecer no começo — ele precisa
 * aguentar ser o padrão, não o de exceção.
 *
 * ═══ SEM AÇÃO NO CARD ═══
 * Não há botão. O card inteiro é o toque e abre a folha. Botão de
 * "parabenizar" que publica no mural foi removido de propósito: 200 membros
 * tocando geram 200 pedidos idênticos no mural de oração. Ação que aparece
 * para todo mundo precisa agregar num objeto só ou ser apenas contada — e
 * isso é decisão de produto com backend, não de tela.
 */

const { width: LARGURA_TELA } = Dimensions.get('window');

/**
 * Medidas em NÚMERO PURO, calculadas uma vez.
 *
 * A versão anterior usava um getter (`get altura() { return this.largura *
 * 0.75 }`) e o card estourou a tela: sem altura válida no contêiner, a
 * `<Image>` com `height: '100%'` cai para o tamanho nativo do arquivo, e uma
 * foto de 1200px vira um card de 600pt de altura que engole a Home inteira e
 * fica borrado por estar ampliado.
 *
 * Não fui atrás da causa exata do getter — esperteza em constante de layout
 * não vale o risco. Número calculado uma vez não tem como falhar.
 *
 * ── Sobre a proporção ────────────────────────────────────────────────
 * 3:2 e não 4:3. A foto de perfil é subida QUADRADA (o seletor recorta em
 * `quadrado: true`). Num quadro mais alto, `cover` amplia para preencher a
 * altura e sobra só o topo da cabeça — foi exatamente o que apareceu na
 * tela. Quanto mais deitado o quadro, menos a foto quadrada precisa ser
 * ampliada, e melhor o enquadramento do rosto.
 *
 * O teto de 240 existe para tablet e telefone grande: sem ele, a largura
 * cresce, a altura acompanha, e o card sozinho ocupa meia tela.
 */
const LARGURA_UNICO = LARGURA_TELA - spacing.gutter * 2;
const ALTURA_UNICO = Math.min(240, Math.round(LARGURA_UNICO / 1.5)); // 3:2

const RETRATO = { largura: 220, altura: 260, gap: spacing.md } as const;
const PASSO = RETRATO.largura + RETRATO.gap;
const RECUO = (LARGURA_TELA - RETRATO.largura) / 2;

/** Ver o cálculo no comentário do componente. Abaixo de 0,70 reprova. */
const OPACIDADE_VEU = 0.78;

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** Quantos próximos cabem na linha antes de virar "+N". */
const MAX_PROXIMOS = 3;

type Props = {
  hoje: AniversarianteDoMes[];
  proximos: AniversarianteDoMes[];
  mes: number;
};

export function SecaoAniversarios({ hoje, proximos, mes }: Props) {
  const [selecionado, setSelecionado] = useState<AniversarianteDoMes | null>(null);
  const semMovimento = useReducedMotion();
  const deslocamento = useSharedValue(0);

  const aoRolar = useAnimatedScrollHandler((e) => {
    deslocamento.value = e.contentOffset.x;
  });

  return (
    <View className="gap-lg">
      {hoje.length === 1 ? (
        <View className="px-gutter">
          <CardPessoa
            pessoa={hoje[0]!}
            largura={LARGURA_UNICO}
            altura={ALTURA_UNICO}
            corpoInicial={64}
            onPress={() => setSelecionado(hoje[0]!)}
          />
        </View>
      ) : null}

      {hoje.length > 1 ? (
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={aoRolar}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={PASSO}
          snapToAlignment="start"
          contentContainerStyle={{ paddingHorizontal: RECUO, gap: RETRATO.gap }}
        >
          {hoje.map((pessoa, indice) => (
            <CardRetrato
              key={pessoa.id}
              pessoa={pessoa}
              indice={indice}
              deslocamento={deslocamento}
              semMovimento={semMovimento}
              onPress={() => setSelecionado(pessoa)}
            />
          ))}
        </Animated.ScrollView>
      ) : null}

      {proximos.length > 0 ? (
        <LinhaProximos proximos={proximos} temHoje={hoje.length > 0} />
      ) : null}

      <FolhaPessoa
        pessoa={selecionado}
        mes={mes}
        onFechar={() => setSelecionado(null)}
      />
    </View>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

type CardProps = {
  pessoa: AniversarianteDoMes;
  largura: number;
  altura: number;
  corpoInicial: number;
  onPress: () => void;
};

function CardPessoa({ pessoa, largura, altura, corpoInicial, onPress }: CardProps) {
  const colors = useThemeColors();
  const [erroFoto, setErroFoto] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        pessoa.nomeCompleto,
        pessoa.familia ? `Família ${pessoa.familia}` : null,
        'faz aniversário hoje. Toque para ver mais.',
      ]
        .filter(Boolean)
        .join(', ')}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: largura,
          height: altura,
          // `maxHeight` além de `height`: trava redundante de propósito. Se
          // algum dia `altura` vier inválida, o card para de crescer aqui em
          // vez de empurrar a tela inteira para baixo.
          maxHeight: altura,
          borderRadius: 20,
          overflow: 'hidden',
        },
        elevation.raised,
        pressed && { opacity: 0.85 },
      ]}
    >
      {/* Altura e largura em PIXEL, não em porcentagem. Porcentagem depende
          do pai ter medida válida; se ele falhar, a imagem assume o tamanho
          nativo do arquivo e estoura a tela — foi o bug da versão anterior.
          Com número fixo, o pior caso é um card do tamanho certo. */}
      {pessoa.fotoUrl && !erroFoto ? (
        <Image
          // Pede ao Cloudinary o tamanho exato do quadro, já multiplicado pela
          // densidade da tela. Sem isso, ou vem pequena e borra, ou vem em
          // 1080 e desperdiça banda num avatar de 44.
          source={{ uri: urlImagem(pessoa.fotoUrl, { largura, altura }) }}
          style={{ width: largura, height: altura }}
          resizeMode="cover"
          onError={() => setErroFoto(true)}
          accessible={false}
        />
      ) : (
        // Cai aqui também quando a URL existe mas a imagem não carrega —
        // link quebrado no Cloudinary deixava um retângulo vazio antes.
        <View style={{ width: largura, height: altura }}>
          <Monograma nome={pessoa.nomeCompleto} tamanho={corpoInicial} />
        </View>
      )}

      {/* Selo de hoje: canto superior, discreto. A informação principal é a
          pessoa; "hoje" é contexto, não manchete. */}
      <View
        className="absolute left-lg top-lg flex-row items-center gap-1 rounded-md px-md py-1"
        style={{ backgroundColor: colors.inverseSurface, opacity: 0.92 }}
      >
        <MaterialCommunityIcons name="party-popper" size={13} color={colors.inverseInk} />
        <Text
          className="font-sans-semibold text-[11px] uppercase"
          style={{ color: colors.inverseInk, letterSpacing: tracking.overline }}
        >
          Hoje
        </Text>
      </View>

      {/* Faixa da base. Ver o cálculo de opacidade no topo do arquivo. */}
      <View className="absolute bottom-0 left-0 right-0">
        <View
          style={{
            ...StyleSheetAbsolute,
            backgroundColor: colors.inverseSurface,
            opacity: OPACIDADE_VEU,
          }}
        />
        <View className="px-lg pb-lg pt-md">
          <Text
            numberOfLines={2}
            className="font-serif-bold text-[20px] leading-6"
            style={{ color: '#FFFFFF', letterSpacing: tracking.heading }}
          >
            {pessoa.nomeCompleto}
          </Text>
          {pessoa.familia ? (
            <Text
              numberOfLines={1}
              className="mt-0.5 font-sans text-[13px]"
              style={{ color: '#FFFFFF', opacity: 0.85 }}
            >
              Família {pessoa.familia}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

/** `StyleSheet.absoluteFillObject` escrito à mão para não importar o módulo só por isso. */
const StyleSheetAbsolute = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

/* ────────────────────────────────────────────────────────────────────── */

type RetratoProps = {
  pessoa: AniversarianteDoMes;
  indice: number;
  deslocamento: { value: number };
  semMovimento: boolean;
  onPress: () => void;
};

/**
 * Card do carrossel. Isolado em componente próprio porque cada um precisa do
 * seu `useAnimatedStyle` — hook dentro de `.map()` quebra quando a quantidade
 * de itens muda, e ela muda todo dia.
 */
function CardRetrato({ pessoa, indice, deslocamento, semMovimento, onPress }: RetratoProps) {
  const estiloFoco = useAnimatedStyle(() => {
    if (semMovimento) return {};
    const entrada = [(indice - 1) * PASSO, indice * PASSO, (indice + 1) * PASSO];
    return {
      transform: [
        { scale: interpolate(deslocamento.value, entrada, [0.93, 1, 0.93], Extrapolation.CLAMP) },
      ],
      opacity: interpolate(deslocamento.value, entrada, [0.6, 1, 0.6], Extrapolation.CLAMP),
    };
  });

  return (
    <Animated.View style={estiloFoco}>
      <CardPessoa
        pessoa={pessoa}
        largura={RETRATO.largura}
        altura={RETRATO.altura}
        corpoInicial={60}
        onPress={onPress}
      />
    </Animated.View>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

/**
 * Os próximos do mês, em UMA linha.
 *
 * Deliberadamente sem card, sem foto e sem toque. Se eles ganhassem card,
 * competiriam com o de hoje pelo mesmo peso — que foi exatamente o problema
 * da versão anterior. Aqui eles existem para quem quer se preparar (ligar,
 * levar um cartão) e passam despercebidos para quem não quer.
 */
function LinhaProximos({
  proximos,
  temHoje,
}: {
  proximos: AniversarianteDoMes[];
  temHoje: boolean;
}) {
  const colors = useThemeColors();
  const visiveis = proximos.slice(0, MAX_PROXIMOS);
  const ocultos = proximos.length - visiveis.length;

  return (
    <View className="mx-gutter flex-row items-start gap-md rounded-lg bg-surface-dim px-lg py-md">
      <MaterialCommunityIcons
        name="calendar-heart"
        size={17}
        color={colors.inkMuted}
        style={{ marginTop: 1 }}
      />
      <Text className="flex-1 font-sans text-[13px] leading-5 text-ink-muted">
        {temHoje ? 'Também neste mês: ' : 'Próximos: '}
        {visiveis.map((p, i) => (
          <Text key={p.id}>
            <Text className="font-sans-medium text-ink">{primeiroENome(p.nomeCompleto)}</Text>
            <Text> dia {p.dia}</Text>
            {i < visiveis.length - 1 ? <Text> · </Text> : null}
          </Text>
        ))}
        {ocultos > 0 ? <Text> · e mais {ocultos}</Text> : null}
      </Text>
    </View>
  );
}

/** "João Marcos Ferreira" → "João Marcos". Dois nomes bastam para identificar. */
function primeiroENome(nomeCompleto: string): string {
  return nomeCompleto.trim().split(/\s+/).slice(0, 2).join(' ');
}

/* ────────────────────────────────────────────────────────────────────── */

/**
 * Ficha do aniversariante.
 *
 * ═══ POR QUE LINHAS DE DADO, E NÃO TEXTO EMPILHADO ═══
 * A versão anterior jogava nome, família, cargo e data um embaixo do outro,
 * cada um com tamanho e cor diferentes. Funciona com dois campos; com quatro
 * vira uma pilha sem ordem, e o olho não sabe o que é rótulo e o que é valor.
 *
 * Agora existe uma REGIÃO DE IDENTIDADE (foto, nome, cargo) e uma REGIÃO DE
 * DADOS: linhas de altura uniforme, cada uma com visual à esquerda, rótulo
 * em versalete e valor em corpo. Estrutura fixa é o que permite acrescentar
 * ou remover um campo sem redesenhar nada.
 *
 * ═══ AS LINHAS APARECEM SÓ QUANDO HÁ DADO ═══
 * Ninguém vê "Profissão — não informada". Linha vazia é ruído que ensina a
 * pessoa a ignorar a área inteira. Com uma linha só a ficha continua certa,
 * porque a altura da linha não depende de quantas existem.
 *
 * ═══ A FOTO DA FAMÍLIA NO LUGAR DO ÍCONE ═══
 * Quando o grupo tem foto, ela substitui o ícone na linha da família. É o
 * detalhe que faz a ficha parecer feita à mão em vez de gerada: o mesmo
 * espaço, ocupado por algo específico daquela família. Sem foto, cai no
 * glifo — a linha não muda de tamanho.
 */
function FolhaPessoa({
  pessoa,
  mes,
  onFechar,
}: {
  pessoa: AniversarianteDoMes | null;
  mes: number;
  onFechar: () => void;
}) {
  const colors = useThemeColors();
  if (!pessoa) return null;

  const perfil = pessoa.perfil ?? 'Membro';
  // "Membro" é o valor padrão de quase todo mundo — anunciar isso embaixo do
  // nome é ruído. O selo só existe para quem tem função na igreja.
  const temCargo = perfil !== 'Membro';

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onFechar} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          onPress={onFechar}
          style={{ flex: 1, backgroundColor: 'rgba(61,35,23,0.45)' }}
        />

        <View
          className="bg-surface-bright px-gutter pb-3xl pt-lg"
          style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.outlineVariant,
              marginBottom: spacing.xl,
            }}
          />

          {/* ── Identidade ──────────────────────────────────────────── */}
          <View className="items-center">
            <View
              style={{
                width: 104,
                height: 104,
                borderRadius: 52,
                overflow: 'hidden',
                backgroundColor: colors.surfaceDim,
              }}
            >
              {pessoa.fotoUrl ? (
                <Image
                  source={{ uri: urlImagem(pessoa.fotoUrl, { largura: 104, altura: 104 }) }}
                  style={{ width: 104, height: 104 }}
                  resizeMode="cover"
                  accessible={false}
                />
              ) : (
                <Monograma nome={pessoa.nomeCompleto} tamanho={38} />
              )}
            </View>

            <Text
              className="mt-lg text-center font-serif-bold text-[24px] leading-8 text-ink"
              style={{ letterSpacing: tracking.heading }}
            >
              {pessoa.nomeCompleto}
            </Text>

            {temCargo ? (
              <View className="mt-md rounded-md bg-secondary-soft px-md py-1">
                <Text
                  className="font-sans-semibold text-[11px] uppercase text-on-secondary-soft"
                  style={{ letterSpacing: tracking.overline }}
                >
                  {perfil}
                </Text>
              </View>
            ) : null}
          </View>

          {/* ── Dados ───────────────────────────────────────────────── */}
          <View className="mt-xl overflow-hidden rounded-lg border border-outline-variant">
            <LinhaDado
              icone="cake-variant-outline"
              rotulo="Aniversário"
              valor={`${pessoa.dia} de ${MESES[mes - 1]}`}
              primeira
            />

            {pessoa.familia ? (
              <LinhaDado
                icone="account-group-outline"
                foto={pessoa.familiaFoto}
                rotulo="Família"
                valor={pessoa.familia}
              />
            ) : null}

            {pessoa.profissao ? (
              <LinhaDado
                icone="briefcase-outline"
                rotulo="Profissão"
                valor={rotuloProfissao(pessoa.profissao)!}
              />
            ) : null}
          </View>

          <View className="mt-xl">
            <Button label="Fechar" variant="secondary" onPress={onFechar} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Uma linha da ficha: visual, rótulo e valor.
 *
 * Altura fixa de 64 vindo do padding, e não do conteúdo — é isso que faz três
 * linhas parecerem uma tabela e uma linha sozinha parecer intencional.
 */
function LinhaDado({
  icone,
  foto,
  rotulo,
  valor,
  primeira = false,
}: {
  icone: keyof typeof MaterialCommunityIcons.glyphMap;
  foto?: string | null;
  rotulo: string;
  valor: string;
  primeira?: boolean;
}) {
  const colors = useThemeColors();

  return (
    <View
      accessible
      accessibilityLabel={`${rotulo}: ${valor}`}
      className={[
        'flex-row items-center gap-md px-lg py-md',
        primeira ? '' : 'border-t border-outline-variant',
      ].join(' ')}
    >
      {/* A caixa tem SEMPRE 40×40, com foto ou com ícone. Se ela mudasse de
          tamanho, o texto de cada linha começaria numa coluna diferente. */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surfaceDim,
        }}
      >
        {foto ? (
          <Image
            source={{ uri: urlImagem(foto, { largura: 40, altura: 40 }) }}
            style={{ width: 40, height: 40 }}
            resizeMode="cover"
            accessible={false}
          />
        ) : (
          <MaterialCommunityIcons name={icone} size={20} color={colors.inkMuted} />
        )}
      </View>

      <View className="flex-1">
        <Text
          className="font-sans-semibold text-[11px] uppercase text-ink-muted"
          style={{ letterSpacing: tracking.overline }}
        >
          {rotulo}
        </Text>
        <Text numberOfLines={1} className="mt-0.5 font-sans-medium text-[15px] text-ink">
          {valor}
        </Text>
      </View>
    </View>
  );
}