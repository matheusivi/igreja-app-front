import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

/**
 * Campo de texto único do design system — "Minimalist style. Underline focus
 * state em dourado" (DESIGN.md, seção Components). Label sempre em
 * `ink-muted` (marrom quente), nunca em azul — correção da auditoria (P1).
 */

type TextFieldProps = TextInputProps & {
  label: string;
  secureToggle?: boolean;
};

export function TextField({ label, secureToggle, secureTextEntry, ...rest }: TextFieldProps) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);

  // Campo de senha nunca deve autocapitalizar nem autocorrigir. O iOS respeita
  // isso sozinho enquanto o texto está mascarado, mas no instante em que a
  // pessoa toca no olhinho o campo vira texto comum e o teclado passa a
  // maiusculizar a primeira letra — a senha sai diferente do que aparece.
  const isSenha = secureToggle || secureTextEntry;

  return (
    <View className="gap-1.5">
      <Text className="font-sans-medium text-xs text-ink-muted">{label}</Text>
      <View
        className={[
          'flex-row items-center border-b pb-2',
          focused ? 'border-gold' : 'border-outline-variant',
        ].join(' ')}
      >
        <TextInput
          className="flex-1 font-sans text-base text-ink"
          placeholderTextColor={colors.outline}
          {...(isSenha ? { autoCapitalize: 'none' as const, autoCorrect: false } : {})}
          // `rest` vem antes dos handlers de propósito: assim quem usa o campo
          // pode sobrescrever autoCapitalize, mas não consegue derrubar o
          // sublinhado dourado do foco passando um onFocus próprio.
          {...rest}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          onFocus={(event) => {
            setFocused(true);
            rest.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            rest.onBlur?.(event);
          }}
        />
        {secureToggle ? (
          <Pressable onPress={() => setHidden((value) => !value)} hitSlop={8}>
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.outline}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
