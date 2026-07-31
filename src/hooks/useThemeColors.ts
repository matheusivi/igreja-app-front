import { useTheme } from '../theme/ThemeContext';
import type { AppColors } from '../constants/theme';

/**
 * Cores do tema atual, para o que NÃO aceita `className`:
 * ícones, `ActivityIndicator`, `StatusBar`, sombras.
 *
 * Lê do `ThemeContext` (estado React), e não do `colorScheme` do NativeWind —
 * este último não re-renderiza os componentes ao mudar, o que deixava os
 * ícones presos na cor do tema claro.
 *
 * Classes do NativeWind (`bg-background`, `text-ink`...) trocam sozinhas via
 * variáveis CSS e não precisam deste hook.
 */
export function useThemeColors(): AppColors {
  return useTheme().colors;
}

/** true quando o app está no tema escuro (útil para `StatusBar`). */
export function useIsDarkTheme(): boolean {
  return useTheme().isDark;
}
