import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: ButtonVariant;
  icon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-gold border border-gold',
    text: 'text-on-gold font-sans-semibold',
  },
  secondary: {
    container: 'bg-transparent border border-secondary',
    text: 'text-secondary font-sans-semibold',
  },
  ghost: {
    container: 'bg-transparent border border-transparent',
    text: 'text-primary font-sans-semibold',
  },
};

/**
 * Feedback de press feito com a função de `style` do próprio Pressable.
 *
 * A versão anterior usava `useAnimatedStyle` do Reanimated junto com
 * `className` do NativeWind. Como o NativeWind v4 já usa Reanimated por
 * baixo, as duas coisas competiam pelo mesmo `style` e o RN emitia o aviso
 * "you might be using shared value's .value inside reanimated inline style".
 * O ganho visual não compensava: o Pressable nativo entrega o mesmo efeito.
 */
export function Button({
  label,
  variant = 'primary',
  icon,
  loading = false,
  fullWidth = true,
  disabled,
  ...pressableProps
}: ButtonProps) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;
  const { container, text } = variantClasses[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled }}
      disabled={isDisabled}
      className={[
        'flex-row items-center justify-center gap-2 rounded px-6 py-4',
        container,
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-40' : '',
      ].join(' ')}
      style={({ pressed }) => (pressed && !isDisabled ? { transform: [{ scale: 0.97 }] } : null)}
      {...pressableProps}
    >
      <Text className={['text-base', text].join(' ')}>{label}</Text>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.onGold : colors.primary}
        />
      ) : (
        icon
      )}
    </Pressable>
  );
}
