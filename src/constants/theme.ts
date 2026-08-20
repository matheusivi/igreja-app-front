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
  background: '#F7F3EE',
  surface: '#F7F3EE',
  surfaceBright: '#FFFFFF',
  surfaceDim: '#F2EBE1',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F7F2EA',
  surfaceContainer: '#F2EBE1',
  surfaceContainerHigh: '#EBE0D2',
  surfaceContainerHighest: '#E1D3C0',

  ink: '#3D2317',
  inkMuted: '#7A5C4A',
  inverseSurface: '#3D2317',
  inverseInk: '#F2EBE1',
  /**
   * Acento quente PARA USAR SOBRE `inverseSurface`.
   *
   * ═══ POR QUE NÃO DÁ PARA USAR `gold` LÁ ═══
   * `inverseSurface` inverte entre os temas: é marrom escuro no claro e creme
   * no escuro. Um acento fixo só funciona num dos dois. `gold` dá 4,90:1
   * sobre o cartão escuro do tema claro e **2,09:1** sobre o cartão claro do
   * tema escuro — some.
   *
   * Este token acompanha a inversão: dourado no claro, terracota escura no
   * escuro. 4,90:1 e 5,83:1.
   *
   * Não tem espelho em CSS/Tailwind de propósito — é lido só por JS, nos dois
   * cartões escuros do app (convite de família e curso em andamento). Criar a
   * variável CSS seria fabricar uma classe que ninguém usa.
   */
  onInverseAccent: '#B98E61',

  outline: '#9C8A70',
  outlineVariant: '#E8DED1',

  primary: '#A85A2C',
  primaryEdge: '#7E4020',
  onPrimary: '#FFFFFF',
  gold: '#B98E61',
  onGold: '#3D2317',
  goldSoft: '#CDB0A1',
  // `goldFixed` é fundo tingido (versículo, selo "Destaque", linha do
  // aniversariante do dia). Ele TROCA entre os temas, então precisa do seu
  // próprio par de texto: `onGold` servia só no claro — no escuro dava 2,34:1.
  goldFixed: '#F7E9DC',
  onGoldFixed: '#3D2317',

  secondary: '#8A4522',
  onSecondary: '#FFFFFF',
  secondarySoft: '#F7E9DC',
  onSecondarySoft: '#3D2317',

  success: '#4A6B3A',
  onSuccess: '#FFFFFF',
  successSoft: '#DCE5CE',

  error: '#8C3A1C',
  onError: '#FFFFFF',

  header: '#F7F3EE',
  onHeader: '#3D2317',
} as const;

// Mesmas chaves da paleta clara, mas com valores como `string` — sem isso o
// `as const` acima transformaria cada cor num tipo literal e o tema escuro
// não poderia ter valores diferentes.
export type AppColors = { [K in keyof typeof lightColors]: string };

export const darkColors: AppColors = {
  background: '#241710',
  surface: '#241710',
  surfaceBright: '#33231A',
  surfaceDim: '#1B100B',
  surfaceContainerLowest: '#1B100B',
  surfaceContainerLow: '#2C1D14',
  surfaceContainer: '#33231A',
  surfaceContainerHigh: '#3E2C21',
  surfaceContainerHighest: '#4A3527',

  ink: '#F2E7DC',
  inkMuted: '#C9B4A4',
  inverseSurface: '#F2E7DC',
  inverseInk: '#241710',
  // Ver o comentário no tema claro: aqui o cartão invertido é CLARO, então o
  // acento tem que escurecer. 5,83:1 sobre #F2E7DC.
  onInverseAccent: '#8A4522',

  outline: '#94795F',
  outlineVariant: '#4A3527',

  primary: '#E0A470',
  primaryEdge: '#B07B4C',
  onPrimary: '#241710',
  gold: '#C79A6C',
  onGold: '#241710',
  goldSoft: '#C79A6C',
  goldFixed: '#4A3021',
  onGoldFixed: '#F2E7DC',

  secondary: '#E0A470',
  onSecondary: '#241710',
  secondarySoft: '#4A3021',
  onSecondarySoft: '#F2E7DC',

  success: '#9CC17E',
  onSuccess: '#241710',
  successSoft: '#33421F',

  error: '#F0A48A',
  onError: '#3A1409',

  header: '#241710',
  onHeader: '#F2E7DC',
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

/**
 * Escala ANINHADA de raio (DESIGN.md §4).
 *
 * A regra é relativa, não absoluta: o que está dentro tem canto mais fechado
 * que o que o contém. Uma imagem (`sm`) dentro de um card (`lg`) parece
 * encaixada; com o mesmo raio nos dois, parece colada por cima.
 *
 * `full` é só para avatar de PESSOA. Foto de evento, de família ou de curso em
 * círculo é o que faz todo app parecer o mesmo app.
 */
export const radius = {
  sm: 6, // dentro de um card: imagem, campo, mini-selo
  button: 5, // aresta viva — ver Button.tsx
  md: 10, // chip, selo
  lg: 16, // card
  xl: 24, // superfície imersiva, hero, folha
  full: 9999, // avatar de pessoa, e só

  // Nomes antigos, mantidos para as telas que ainda não migraram.
  base: 6,
  card: 16,
} as const;

/**
 * Escala de espaçamento (DESIGN.md §3).
 *
 * A anterior pulava de 12 para 24 e de 24 para 48 — sem degraus no meio, toda
 * tela acabava usando 24 para tudo, e espaçamento uniforme é a assinatura
 * visual de interface montada por template. O ritmo é o ponto:
 *
 *   4–8    partes da mesma coisa
 *   12–16  irmãos de uma lista
 *   24     blocos distintos
 *   32–48  entre seções
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  gutter: 20,

  // Nome antigo: `base` valia 8.
  base: 8,
} as const;

/**
 * Elevação (DESIGN.md §5). Três níveis, e o padrão é o ZERO.
 *
 * A sombra é tingida de marrom, não preta e não azul. A anterior era
 * `#1E40AF` — azul, numa paleta inteiramente quente. Sombra preta ou fria
 * sobre superfície quente cria um halo acinzentado que suja a cor.
 *
 * Um card se separa da página pela LUMINOSIDADE da superfície
 * (`surface-bright` sobre `background`). Sombra é para o único card em
 * destaque da tela — não para todos.
 */
export const elevation = {
  /**
   * Nível 0,5. Quase nada — 3% de opacidade, 4px de raio, deslocamento 1px.
   *
   * Não é para "dar profundidade": é para o card branco não ficar boiando
   * sem peso sobre o papel. A separação entre `#FFFFFF` e `#F7F3EE` é de
   * 1,1:1 — de propósito, é micro-contraste. Uma sombra desta escala é o que
   * ancora a borda inferior sem virar moldura.
   */
  subtle: {
    shadowColor: '#3D2317',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  raised: {
    shadowColor: '#3D2317',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  floating: {
    shadowColor: '#3D2317',
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
} as const;

/**
 * Tipografia com ajuste ÓPTICO, não só tamanho e peso.
 *
 * Serifada grande precisa de tracking negativo — nos tamanhos de display, o
 * espaçamento desenhado para 16px vira buraco entre as letras. E versalete
 * pequeno precisa do contrário: sem tracking positivo, `text-[11px]` em caixa
 * alta vira um borrão.
 *
 * É esse par de correções que separa "título grande" de "título desenhado".
 * O piso de -0,04em existe porque abaixo disso as serifas se tocam.
 */
export const tracking = {
  display: -1.1, // 32-34px serifado
  title: -0.7, // 26px serifado
  heading: -0.3, // 18-22px serifado
  body: 0,
  overline: 1.4, // 11px caixa alta
} as const;

/** @deprecated Use `elevation.raised`. Mantido só para não quebrar imports. */
export const ambientGlow = elevation.raised;

export type AppFontKey = keyof typeof fonts;
