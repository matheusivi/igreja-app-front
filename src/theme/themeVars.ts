import { vars } from 'nativewind';

/**
 * Valores das variáveis CSS por tema, no formato que o NativeWind aplica em
 * tempo de execução (`vars()` — é o caminho documentado para troca de tema
 * no React Native; o seletor `.dark:root` é padrão de web e não é garantido
 * aqui).
 *
 * Estes valores precisam bater com `global.css` (defaults do tema claro) e
 * com as paletas de `constants/theme.ts` (usadas em cores de ícone).
 */

const light = {
  '--color-background': '251 245 233',
  '--color-surface': '251 245 233',
  '--color-surface-bright': '254 251 243',
  '--color-surface-dim': '232 217 184',
  '--color-surface-container-lowest': '255 255 255',
  '--color-surface-container-low': '247 239 221',
  '--color-surface-container': '243 230 201',
  '--color-surface-container-high': '237 221 184',
  '--color-surface-container-highest': '230 211 168',

  '--color-ink': '20 27 43',
  '--color-ink-muted': '83 68 52',
  '--color-inverse-surface': '41 48 64',
  '--color-inverse-ink': '237 240 255',

  '--color-outline': '134 116 97',
  '--color-outline-variant': '216 195 173',

  '--color-primary': '133 83 0',
  '--color-on-primary': '255 255 255',
  '--color-gold': '245 158 11',
  '--color-on-gold': '97 59 0',
  '--color-gold-soft': '255 185 95',
  '--color-gold-fixed': '255 221 184',

  '--color-secondary': '30 64 175',
  '--color-on-secondary': '255 255 255',
  '--color-secondary-soft': '112 140 253',
  '--color-on-secondary-soft': '0 33 122',

  '--color-success': '0 108 73',
  '--color-on-success': '255 255 255',
  '--color-success-soft': '48 200 143',

  '--color-error': '186 26 26',
  '--color-on-error': '255 255 255',

  '--color-header': '17 24 39',
  '--color-on-header': '255 255 255',
};

const dark: typeof light = {
  '--color-background': '22 19 14',
  '--color-surface': '22 19 14',
  '--color-surface-bright': '34 29 22',
  '--color-surface-dim': '14 12 9',
  '--color-surface-container-lowest': '16 14 10',
  '--color-surface-container-low': '30 26 20',
  '--color-surface-container': '35 32 25',
  '--color-surface-container-high': '46 41 31',
  '--color-surface-container-highest': '57 50 38',

  '--color-ink': '242 233 218',
  '--color-ink-muted': '203 187 163',
  '--color-inverse-surface': '242 233 218',
  '--color-inverse-ink': '22 19 14',

  '--color-outline': '156 139 118',
  '--color-outline-variant': '76 67 54',

  '--color-primary': '255 185 95',
  '--color-on-primary': '69 43 0',
  '--color-gold': '245 158 11',
  '--color-on-gold': '69 43 0',
  '--color-gold-soft': '255 221 184',
  '--color-gold-fixed': '232 196 143',

  '--color-secondary': '184 196 255',
  '--color-on-secondary': '6 32 122',
  '--color-secondary-soft': '74 99 200',
  '--color-on-secondary-soft': '221 225 255',

  '--color-success': '78 222 163',
  '--color-on-success': '255 255 255',
  '--color-success-soft': '46 158 116',

  '--color-error': '255 180 171',
  '--color-on-error': '105 0 5',

  '--color-header': '16 14 10',
  '--color-on-header': '242 233 218',
};

export const themeVars = {
  light: vars(light),
  dark: vars(dark),
};
