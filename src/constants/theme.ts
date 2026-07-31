/**
 * Tokens "crus" (fora do NativeWind) — para casos que não aceitam `className`:
 * cor de ícone (`@expo/vector-icons`), `StatusBar`, `ActivityIndicator`, etc.
 *
 * IMPORTANTE: estes valores espelham as variáveis CSS de `global.css`.
 * Se mudar uma cor lá, mude aqui também — não há geração automática.
 *
 * Nas telas, NÃO importe `colors` diretamente: use o hook `useThemeColors()`,
 * senão o ícone continua com a cor do tema claro quando o app estiver escuro.
 */

export const lightColors = {
  background: '#FBF5E9',
  surface: '#FBF5E9',
  surfaceBright: '#FEFBF3',
  surfaceDim: '#E8D9B8',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F7EFDD',
  surfaceContainer: '#F3E6C9',
  surfaceContainerHigh: '#EDDDB8',
  surfaceContainerHighest: '#E6D3A8',

  ink: '#141B2B',
  inkMuted: '#534434',
  inverseSurface: '#293040',
  inverseInk: '#EDF0FF',

  outline: '#867461',
  outlineVariant: '#D8C3AD',

  primary: '#855300',
  onPrimary: '#FFFFFF',
  gold: '#F59E0B',
  onGold: '#613B00',
  goldSoft: '#FFB95F',
  goldFixed: '#FFDDB8',

  secondary: '#1E40AF',
  onSecondary: '#FFFFFF',
  secondarySoft: '#708CFD',
  onSecondarySoft: '#00217A',

  success: '#006C49',
  onSuccess: '#FFFFFF',
  successSoft: '#30C88F',

  error: '#BA1A1A',
  onError: '#FFFFFF',

  header: '#111827',
  onHeader: '#FFFFFF',
} as const;

// Mesmas chaves da paleta clara, mas com valores como `string` — sem isso o
// `as const` acima transformaria cada cor num tipo literal e o tema escuro
// não poderia ter valores diferentes.
export type AppColors = { [K in keyof typeof lightColors]: string };

export const darkColors: AppColors = {
  background: '#16130E',
  surface: '#16130E',
  surfaceBright: '#221D16',
  surfaceDim: '#0E0C09',
  surfaceContainerLowest: '#100E0A',
  surfaceContainerLow: '#1E1A14',
  surfaceContainer: '#232019',
  surfaceContainerHigh: '#2E291F',
  surfaceContainerHighest: '#393226',

  ink: '#F2E9DA',
  inkMuted: '#CBBBA3',
  inverseSurface: '#F2E9DA',
  inverseInk: '#16130E',

  outline: '#9C8B76',
  outlineVariant: '#4C4336',

  primary: '#FFB95F',
  onPrimary: '#452B00',
  gold: '#F59E0B',
  onGold: '#452B00',
  goldSoft: '#FFDDB8',
  goldFixed: '#E8C48F',

  secondary: '#B8C4FF',
  onSecondary: '#06207A',
  secondarySoft: '#4A63C8',
  onSecondarySoft: '#DDE1FF',

  success: '#4EDEA3',
  onSuccess: '#FFFFFF',
  successSoft: '#2E9E74',

  error: '#FFB4AB',
  onError: '#690005',

  header: '#100E0A',
  onHeader: '#F2E9DA',
};

/** Paleta clara. Só use direto fora de componentes React. */
export const colors = lightColors;

export const fonts = {
  serifSemiBold: 'SourceSerif4_600SemiBold',
  serifBold: 'SourceSerif4_700Bold',
  sansRegular: 'PlusJakartaSans_400Regular',
  sansMedium: 'PlusJakartaSans_500Medium',
  sansSemiBold: 'PlusJakartaSans_600SemiBold',
} as const;

export const radius = {
  sm: 2,
  base: 4,
  button: 4,
  card: 8,
  xl: 12,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  base: 8,
  sm: 12,
  md: 24,
  lg: 48,
  xl: 80,
  gutter: 20,
} as const;

// Sombra única do sistema — "Ambient Glow" (DESIGN.md, seção Elevation & Depth).
// Usar só em cards de nível 1; nunca empilhar mais de uma sombra na mesma tela.
export const ambientGlow = {
  shadowColor: '#1E40AF',
  shadowOpacity: 0.04,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 10 },
  elevation: 3,
} as const;

export type AppFontKey = keyof typeof fonts;
