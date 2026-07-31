import { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { ambientGlow } from '../constants/theme';

/**
 * Card único do design system — substitui os três padrões que apareciam
 * nas 15 telas do Stitch (barra dourada no topo, faixa lateral colorida,
 * card sem nenhum acento).
 *
 * Regra fixa: acento sempre no TOPO, nunca lateral. Faixas laterais em
 * cards/list items são um padrão que a skill "impeccable" trata como erro
 * recorrente de UI genérica de IA — mesmo o `DESIGN.md` original sugerindo
 * isso para o componente de versículo, trocamos por fundo tingido
 * (ver `ScriptureQuote.tsx`).
 */

type CardProps = ViewProps & {
  children: ReactNode;
  accent?: boolean;
  padded?: boolean;
  /** className aplicada ao wrapper interno (onde o padding vive) — use para `gap-*` entre filhos. */
  contentClassName?: string;
};

export function Card({
  children,
  accent = false,
  padded = true,
  contentClassName,
  className,
  style,
  ...rest
}: CardProps) {
  return (
    <View
      className={[
        'overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest',
        className ?? '',
      ].join(' ')}
      style={[ambientGlow, style]}
      {...rest}
    >
      {accent ? <View className="h-1 w-full bg-gold" /> : null}
      <View className={[padded ? 'p-4' : '', contentClassName ?? ''].join(' ')}>{children}</View>
    </View>
  );
}
