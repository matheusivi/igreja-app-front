import { Pressable, Text, type GestureResponderEvent } from 'react-native';

/**
 * Chip único para filtro e para badge de status — substitui os dois padrões
 * divergentes das telas originais (chips em "Devocionais"/"Cursos" vs.
 * checkboxes em "Eventos"; badges verdes soltos em "Aberto"/"Destaque").
 *
 * - Filtro: passe `active` + `onPress`.
 * - Badge de status (não clicável): passe só `tone`, sem `onPress`.
 */

type ChipTone = 'gold' | 'success' | 'secondary';

type ChipProps = {
  label: string;
  active?: boolean;
  tone?: ChipTone;
  onPress?: (event: GestureResponderEvent) => void;
};

const toneClasses: Record<ChipTone, { active: string; inactive: string; text: string; textInactive: string }> = {
  gold: {
    active: 'bg-gold border-gold',
    inactive: 'bg-surface-container-low border-outline-variant',
    text: 'text-on-gold',
    textInactive: 'text-ink-muted',
  },
  // `success` usa o verde FORTE, não o `success-soft`. Branco sobre
  // `success-soft` dava 2,15:1 — o selo "Administrador" ficava legível só
  // porque a fonte é grossa. Com `success` + `on-success` são 6,5:1 no claro
  // e 7,7:1 no escuro.
  success: {
    active: 'bg-success border-success',
    inactive: 'bg-surface-container-low border-outline-variant',
    text: 'text-on-success',
    textInactive: 'text-ink-muted',
  },
  // O par certo de `secondary-soft` é `on-secondary-soft`, não `on-secondary`.
  // Com o par errado o selo "Batizado" ficava claro sobre claro no tema claro
  // (apagado) e escuro sobre escuro no tema escuro (ilegível). A borda em
  // `secondary` dá o contorno que o fundo rosado sozinho não dá contra o
  // fundo da tela.
  secondary: {
    active: 'bg-secondary-soft border-secondary',
    inactive: 'bg-surface-container-low border-outline-variant',
    text: 'text-on-secondary-soft',
    textInactive: 'text-ink-muted',
  },
};

export function Chip({ label, active = false, tone = 'gold', onPress }: ChipProps) {
  const classes = toneClasses[tone];
  const isInteractive = typeof onPress === 'function';

  const content = (
    <Text
      className={[
        'font-sans-medium text-xs',
        active ? classes.text : classes.textInactive,
      ].join(' ')}
    >
      {label}
    </Text>
  );

  const containerClass = [
    'items-center justify-center rounded-full border px-4 py-2',
    active ? classes.active : classes.inactive,
  ].join(' ');

  if (!isInteractive) {
    return <Text className={[containerClass, 'overflow-hidden'].join(' ')}>{content}</Text>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={containerClass}
    >
      {content}
    </Pressable>
  );
}
