import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../hooks/useThemeColors';

/**
 * Barra de abas FLUTUANTE — componente próprio, animado.
 *
 * ═══ POR QUE FLUTUANTE ═══
 * Antes ela era uma faixa colada no rodapé, ocupando espaço no layout. Agora
 * é uma peça solta: margem dos dois lados, cantos totalmente arredondados,
 * sombra em volta. É o que dá a sensação de objeto vivo sobre a página em vez
 * de moldura do sistema.
 *
 * **O que isso custa, e por que não é de graça:** a barra saiu do fluxo. O
 * conteúdo agora rola POR BAIXO dela, e sem compensação o último item de cada
 * lista fica permanentemente escondido. Por isso existe o `EspacoTabBar` no
 * fim deste arquivo — toda tela de aba precisa dele como último filho da
 * rolagem. Tela nova que esquecer disso vai perder o último item, e o defeito
 * só aparece quando alguém reclama que "sumiu".
 *
 * **Optei por opaca, não por vidro.** Transparência de verdade exige desfoque
 * (`expo-blur`), e `BlurView` no Android degrada para cor chapada em aparelho
 * mais fraco — justamente o efeito que justifica a transparência é o que
 * quebra a paridade entre plataformas. Opaca com sombra entrega quase todo o
 * ganho visual, sem dependência nova e igual nos dois sistemas.
 *
 * ═══ O MOVIMENTO ═══
 * A pílula é UMA só, e ela desliza. Não são cinco pílulas aparecendo e
 * sumindo — é um objeto que se move de uma aba para outra.
 *
 * A diferença não é decorativa. Cinco elementos piscando obrigam o olho a
 * procurar onde o estado foi parar a cada toque; um objeto que percorre o
 * caminho carrega o olhar junto e diz de onde veio e para onde foi.
 *
 * **Mola, não duração fixa.** `withSpring` com amortecimento alto dá uma
 * parada com peso — a pílula desacelera como coisa que tem massa. Curva
 * linear de 250ms faz o mesmo trajeto parecendo régua correndo.
 *
 * **O glifo faz cruzamento de opacidade**, não troca seca. Contorno e
 * preenchido ficam empilhados, um some enquanto o outro aparece em 200ms. Sem
 * isso o ícone dá um estalo no meio de um movimento suave, e o estalo passa a
 * ser tudo que a pessoa percebe.
 *
 * **`useReducedMotion` é respeitado.** Quem ligou "reduzir movimento" no
 * sistema recebe a troca instantânea — para quem tem transtorno vestibular,
 * movimento na tela provoca náusea de verdade.
 *
 * ═══ SEM RÓTULO: O QUE ISSO CUSTA ═══
 * Ícone sem texto depende de a pessoa RECONHECER o glifo, e a congregação tem
 * idosos. `hand-heart` para oração não é convenção universal como a casinha.
 * O nome existe para o leitor de tela, o que atende a regra formal — mas quem
 * enxerga e não reconhece o desenho não tem a quem recorrer. Se aparecer
 * confusão no uso real, o meio-termo é mostrar o rótulo só na aba ativa.
 *
 * ═══ TOKENS ═══
 * cor      surface-bright (barra) · primary + on-primary (pílula) ·
 *          ink-muted (ícone inativo)
 * forma    barra 60 de altura, raio 30 · pílula 56×44, raio 22 · glifo 24
 * margem   16 nas laterais · 12 do rodapé (ou a safe area, o que for maior)
 * mola     damping 18 · stiffness 170 · mass 0.7
 */

type Glifo = keyof typeof MaterialCommunityIcons.glyphMap;

const icones: Record<string, { ativo: Glifo; inativo: Glifo }> = {
  Home: { ativo: 'home-variant', inativo: 'home-variant-outline' },
  Ensino: { ativo: 'book-open-page-variant', inativo: 'book-open-page-variant-outline' },
  Grupos: { ativo: 'account-group', inativo: 'account-group-outline' },
  Oracao: { ativo: 'hand-heart', inativo: 'hand-heart-outline' },
  Perfil: { ativo: 'account', inativo: 'account-outline' },
};

const MOLA = { damping: 18, stiffness: 170, mass: 0.7 } as const;

export const BARRA = {
  altura: 60,
  raio: 30,
  margemLateral: 16,
  margemInferior: 12,
} as const;

/** Pílula estádio: raio = metade da altura, extremidades semicirculares. */
const PILULA = { largura: 56, altura: 44, raio: 22 } as const;
const GLIFO = 24;

/**
 * Espaço que a rolagem precisa reservar no fim para o último item não ficar
 * embaixo da barra flutuante.
 *
 * Use o componente `EspacoTabBar` em vez de aplicar isto na mão: um `View`
 * como último filho é à prova de conflito, enquanto `paddingBottom` disputa a
 * mesma propriedade com o `contentContainerClassName` do NativeWind e o
 * vencedor depende da ordem de merge.
 */
export function useAlturaTabBar() {
  const insets = useSafeAreaInsets();
  return (
    BARRA.altura + Math.max(insets.bottom, BARRA.margemInferior) + BARRA.margemInferior
  );
}

/** Último filho da rolagem em toda tela de aba. */
export function EspacoTabBar() {
  const altura = useAlturaTabBar();
  return <View style={{ height: altura }} />;
}

type ItemProps = {
  ativo: boolean;
  glifos: { ativo: Glifo; inativo: Glifo };
  /** O nome da aba só existe para o leitor de tela agora. */
  rotuloA11y: string;
  semMovimento: boolean;
  onPress: () => void;
  onLongPress: () => void;
};

/**
 * Item isolado em componente próprio porque cada um precisa dos seus próprios
 * hooks de animação — chamar `useSharedValue` dentro de um `.map()` quebra a
 * regra dos hooks assim que a quantidade de abas mudar.
 */
function ItemAba({
  ativo,
  glifos,
  rotuloA11y,
  semMovimento,
  onPress,
  onLongPress,
}: ItemProps) {
  const colors = useThemeColors();
  const progresso = useSharedValue(ativo ? 1 : 0);

  useEffect(() => {
    const destino = ativo ? 1 : 0;
    progresso.value = semMovimento ? destino : withTiming(destino, { duration: 200 });
  }, [ativo, semMovimento, progresso]);

  const estiloPreenchido = useAnimatedStyle(() => ({ opacity: progresso.value }));
  const estiloContorno = useAnimatedStyle(() => ({ opacity: 1 - progresso.value }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={ativo ? { selected: true } : {}}
      accessibilityLabel={rotuloA11y}
      onPress={onPress}
      onLongPress={onLongPress}
      className="flex-1 items-center justify-center"
      style={({ pressed }) => [
        { height: BARRA.altura },
        // Sem escala no toque: numa barra de 5 itens colados, animação de
        // escala esbarra visualmente no vizinho. Opacidade não invade.
        pressed && !ativo ? { opacity: 0.5 } : null,
      ]}
    >
      <View
        style={{
          height: PILULA.altura,
          width: PILULA.largura,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/**
          * Quem recebe o estilo animado é o `Animated.View`, NÃO o ícone.
          *
          * A versão anterior usava `Animated.createAnimatedComponent` direto
          * no `MaterialCommunityIcons`, e isso não funciona: o `Icon` do
          * @expo/vector-icons é uma classe que CONSOME o próprio `ref`
          * internamente (`ref={(view) => { this._icon = view }}`) em vez de
          * repassá-lo. O Reanimated precisa de um ref até a view nativa para
          * dirigir o estilo; sem ele, o estilo animado é aplicado só na
          * primeira renderização e nunca mais atualiza.
          *
          * O defeito era silencioso e enganoso: cada ícone congelava no
          * estado em que nasceu. A Home nascia ativa, então o glifo branco
          * ficava preso em opacidade 1 e SUMIA no fundo branco da barra
          * quando ela deixava de ser a aba atual. As outras nasciam
          * inativas, então o glifo escuro ficava preso visível e virava
          * marrom sobre a pílula terracota quando eram selecionadas.
          *
          * `Animated.View` é componente animado de primeira classe do
          * Reanimated e não tem esse problema. O ícone volta a ser um ícone
          * comum dentro dele.
          */}
        <Animated.View style={estiloContorno}>
          <MaterialCommunityIcons
            name={glifos.inativo}
            size={GLIFO}
            color={colors.inkMuted}
          />
        </Animated.View>
        <Animated.View style={[{ position: 'absolute' }, estiloPreenchido]}>
          <MaterialCommunityIcons
            name={glifos.ativo}
            size={GLIFO}
            color={colors.onPrimary}
          />
        </Animated.View>
      </View>
    </Pressable>
  );
}

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const semMovimento = useReducedMotion();

  const [larguraItem, setLarguraItem] = useState(0);
  const posicao = useSharedValue(state.index);

  useEffect(() => {
    posicao.value = semMovimento ? state.index : withSpring(state.index, MOLA);
  }, [state.index, semMovimento, posicao]);

  function medir(evento: LayoutChangeEvent) {
    const total = evento.nativeEvent.layout.width;
    if (total > 0) setLarguraItem(total / state.routes.length);
  }

  const estiloPilula = useAnimatedStyle(() => ({
    // Enquanto a barra não foi medida a pílula fica invisível — melhor que
    // aparecer no canto esquerdo e saltar para o lugar no primeiro frame.
    opacity: larguraItem > 0 ? 1 : 0,
    transform: [{ translateX: posicao.value * larguraItem }],
  }));

  return (
    <View
      onLayout={medir}
      className="flex-row bg-surface-bright"
      style={{
        position: 'absolute',
        left: BARRA.margemLateral,
        right: BARRA.margemLateral,
        bottom: Math.max(insets.bottom, BARRA.margemInferior),
        height: BARRA.altura,
        borderRadius: BARRA.raio,
        // Sombra em VOLTA, e aqui isso é o correto: a peça flutua, então ela
        // projeta para todos os lados. Era o oposto na versão colada no
        // rodapé, onde a sombra por baixo caía dentro da safe area e sujava.
        // Por isso `elevation` do Android serve sem ressalva desta vez.
        shadowColor: '#3D2317',
        shadowOpacity: 0.16,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
      }}
    >
      {/* A pílula vem ANTES dos itens para ficar atrás deles na pintura. */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: (BARRA.altura - PILULA.altura) / 2,
            left: (larguraItem - PILULA.largura) / 2,
            width: PILULA.largura,
            height: PILULA.altura,
            borderRadius: PILULA.raio,
            backgroundColor: colors.primary,
          },
          estiloPilula,
        ]}
      />

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]!;
        const rotulo = typeof options.title === 'string' ? options.title : route.name;
        const ativo = state.index === index;

        return (
          <ItemAba
            key={route.key}
            ativo={ativo}
            glifos={icones[route.name] ?? icones.Home!}
            rotuloA11y={options.tabBarAccessibilityLabel ?? rotulo}
            semMovimento={semMovimento}
            onPress={() => {
              const evento = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!ativo && !evento.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
          />
        );
      })}
    </View>
  );
}
