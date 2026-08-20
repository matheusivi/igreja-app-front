import { ReactNode } from 'react';
import { Image, Text, View, type ImageSourcePropType, type ViewProps } from 'react-native';
import { elevation, tracking } from '../constants/theme';

/**
 * Card — DESIGN.md §7.
 *
 * ═══ AS TRÊS VARIAÇÕES ═══
 *
 * Elas diferem em SUPERFÍCIE, ELEVAÇÃO e DENSIDADE ao mesmo tempo. Três
 * cards que só trocam de cor são o mesmo card pintado de três jeitos.
 *
 * ┌──────────┬───────────────┬───────────┬─────────┬────────────────────┐
 * │ variante │ superfície    │ elevação  │ padding │ quando             │
 * ├──────────┼───────────────┼───────────┼─────────┼────────────────────┤
 * │ raised   │ branco        │ 7% / 14px │ 20      │ o destaque da tela │
 * │          │               │           │         │ (UM por tela)      │
 * │ bordered │ branco        │ 3% / 4px  │ 16      │ card comum         │
 * │          │ + 1px aresta  │           │         │                    │
 * │ flat     │ transparente  │ nenhuma   │ 12      │ lista densa        │
 * │          │ + divisória   │           │         │                    │
 * └──────────┴───────────────┴───────────┴─────────┴────────────────────┘
 *
 * ═══ DECISÕES ═══
 *
 * **A densidade é o que separa de verdade.** Padding 20/16/12 não é
 * decoração: um card em destaque respira, um card de lista densa não pode
 * respirar, senão a lista não cabe na tela. Se os três tivessem 16, a
 * escolha da variante seria puramente estética — e escolha estética sem
 * consequência funcional é o que faz um design system virar paleta de cores.
 *
 * **A aresta do `bordered` dá 1,33:1 contra o branco.** É micro-contraste de
 * propósito: o olho lê a aresta, não a linha. Borda de 3:1 vira moldura, e
 * moldura em todo card é o que denuncia template.
 *
 * **A sombra é tingida de marrom (`#3D2317`), nunca preta.** Sombra preta
 * sobre superfície quente cria um halo acinzentado que suja a cor do papel.
 *
 * **O `flat` não tem superfície própria.** Ele separa por divisória e por
 * espaço. Numa lista de vinte pessoas, vinte caixas brancas empilhadas
 * criam vinte molduras — o olho conta molduras em vez de ler nomes.
 *
 * **Imagem no topo sangra até a borda** (`padded` não a alcança) e usa raio
 * `sm` (6) dentro de um card de raio `lg` (16). O canto de dentro sempre
 * mais fechado que o de fora — sem isso a imagem parece colada por cima.
 *
 * **Card dentro de card é sempre errado.** Se um card precisa agrupar
 * filhos, os filhos são `flat` com divisória.
 *
 * ═══ TOKENS ═══
 * cor      surface-bright · surface-dim · outline-variant · inverse-surface
 * raio     lg (16) para card · sm (6) para imagem · xl (24) para feature
 * elev.    elevation.raised · elevation.subtle
 * padding  20 (raised) · 16 (bordered) · 12 (flat)
 */

type CardVariant = 'raised' | 'bordered' | 'flat' | 'tinted' | 'feature';

type CardProps = ViewProps & {
  children?: ReactNode;
  variant?: CardVariant;
  /** Faixa dourada no topo. Reservada ao item em destaque de uma lista. */
  accent?: boolean;
  /** Imagem sangrada no topo do card. */
  imagem?: ImageSourcePropType;
  imagemAlt?: string;
  /** Proporção da imagem. 16/9 para capa larga, 21/9 para faixa. */
  imagemAspecto?: number;
  titulo?: string;
  subtitulo?: string;
  /** Rodapé de ação — normalmente um `<Button>`. */
  acao?: ReactNode;
  padded?: boolean;
  contentClassName?: string;
};

const superficie: Record<CardVariant, string> = {
  raised: 'rounded-lg bg-surface-bright',
  bordered: 'rounded-lg border border-outline-variant bg-surface-bright',
  flat: 'border-b border-outline-variant',
  tinted: 'rounded-lg bg-surface-dim',
  feature: 'rounded-xl bg-inverse-surface',
};

/** Padding interno por variante. O de baixo leva 2–4px a mais: correção óptica. */
const densidade: Record<CardVariant, string> = {
  raised: 'px-xl pb-xl pt-lg',
  bordered: 'px-lg pb-lg pt-md',
  flat: 'px-0 pb-md pt-md',
  tinted: 'px-lg pb-lg pt-md',
  feature: 'px-xl pb-xl pt-xl',
};

const elevacao = {
  raised: elevation.raised,
  bordered: elevation.subtle,
  flat: null,
  tinted: null,
  feature: null,
} as const;

export function Card({
  children,
  variant = 'bordered',
  accent = false,
  imagem,
  imagemAlt,
  imagemAspecto = 16 / 9,
  titulo,
  subtitulo,
  acao,
  padded = true,
  contentClassName,
  className,
  style,
  ...rest
}: CardProps) {
  const temCabecalho = Boolean(titulo || subtitulo);

  return (
    <View
      className={['overflow-hidden', superficie[variant], className ?? ''].join(' ')}
      style={[elevacao[variant], style]}
      {...rest}
    >
      {accent ? <View className="h-1 w-full bg-gold" /> : null}

      {/* Sangra de verdade. O comentário acima sempre prometeu isto, mas o
          código embrulhava a imagem em `px-lg pt-lg` e dava a moldura dentro
          da moldura — card dentro de card, que o próprio cabeçalho deste
          arquivo proíbe. Sem padding lateral, o `overflow-hidden` do card
          recorta os cantos de cima no raio `lg`, e a imagem não precisa de
          raio próprio. */}
      {imagem ? (
        <Image
          source={imagem}
          accessibilityLabel={imagemAlt}
          accessible={Boolean(imagemAlt)}
          style={{ alignSelf: 'stretch', aspectRatio: imagemAspecto }}
          resizeMode="cover"
        />
      ) : null}

      <View
        className={[
          padded ? densidade[variant] : '',
          imagem && padded ? 'pt-md' : '',
          contentClassName ?? '',
        ].join(' ')}
      >
        {temCabecalho ? (
          <View className="mb-md gap-xs">
            {titulo ? (
              <Text
                className={[
                  'font-serif-bold',
                  variant === 'raised' ? 'text-[20px] leading-7' : 'text-base leading-6',
                  variant === 'feature' ? 'text-inverse-ink' : 'text-ink',
                ].join(' ')}
                style={{ letterSpacing: tracking.heading }}
              >
                {titulo}
              </Text>
            ) : null}
            {subtitulo ? (
              <Text className="font-sans text-sm leading-5 text-ink-muted">{subtitulo}</Text>
            ) : null}
          </View>
        ) : null}

        {children}

        {acao ? <View className="mt-lg">{acao}</View> : null}
      </View>
    </View>
  );
}
