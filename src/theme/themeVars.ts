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
  '--color-background': '247 243 238',
  '--color-surface': '247 243 238',
  '--color-surface-bright': '255 255 255',
  '--color-surface-dim': '242 235 225',
  '--color-surface-container-lowest': '255 255 255',
  '--color-surface-container-low': '247 242 234',
  '--color-surface-container': '242 235 225',
  '--color-surface-container-high': '235 224 210',
  '--color-surface-container-highest': '225 211 192',

  '--color-ink': '61 35 23',
  '--color-ink-muted': '122 92 74',
  '--color-inverse-surface': '61 35 23',
  '--color-inverse-ink': '242 235 225',

  '--color-outline': '156 138 112',
  '--color-outline-variant': '232 222 209',

  '--color-primary': '168 90 44',
  '--color-primary-edge': '126 64 32',
  '--color-on-primary': '255 255 255',
  '--color-gold': '185 142 97',
  '--color-on-gold': '61 35 23',
  '--color-gold-soft': '205 176 161',
  '--color-gold-fixed': '247 233 220',
  '--color-on-gold-fixed': '61 35 23',

  '--color-secondary': '138 69 34',
  '--color-on-secondary': '255 255 255',
  '--color-secondary-soft': '247 233 220',
  '--color-on-secondary-soft': '61 35 23',

  '--color-success': '74 107 58',
  '--color-on-success': '255 255 255',
  '--color-success-soft': '220 229 206',

  '--color-error': '140 58 28',
  '--color-on-error': '255 255 255',

  '--color-header': '247 243 238',
  '--color-on-header': '61 35 23',
};

const dark: typeof light = {
  '--color-background': '36 23 16',
  '--color-surface': '36 23 16',
  '--color-surface-bright': '51 35 26',
  '--color-surface-dim': '27 16 11',
  '--color-surface-container-lowest': '27 16 11',
  '--color-surface-container-low': '44 29 20',
  '--color-surface-container': '51 35 26',
  '--color-surface-container-high': '62 44 33',
  '--color-surface-container-highest': '74 53 39',

  '--color-ink': '242 231 220',
  '--color-ink-muted': '201 180 164',
  '--color-inverse-surface': '242 231 220',
  '--color-inverse-ink': '36 23 16',

  '--color-outline': '148 121 95',
  '--color-outline-variant': '74 53 39',

  '--color-primary': '224 164 112',
  '--color-primary-edge': '176 123 76',
  '--color-on-primary': '36 23 16',
  '--color-gold': '199 154 108',
  '--color-on-gold': '36 23 16',
  '--color-gold-soft': '199 154 108',
  '--color-gold-fixed': '74 48 33',
  '--color-on-gold-fixed': '242 231 220',

  '--color-secondary': '224 164 112',
  '--color-on-secondary': '36 23 16',
  '--color-secondary-soft': '74 48 33',
  '--color-on-secondary-soft': '242 231 220',

  '--color-success': '156 193 126',
  '--color-on-success': '36 23 16',
  '--color-success-soft': '51 66 31',

  '--color-error': '240 164 138',
  '--color-on-error': '58 20 9',

  '--color-header': '36 23 16',
  '--color-on-header': '242 231 220',
};

export const themeVars = {
  light: vars(light),
  dark: vars(dark),
};
