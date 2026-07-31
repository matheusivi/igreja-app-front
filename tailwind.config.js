/** @type {import('tailwindcss').Config} */
// Paleta "Lumina Ecclesiastic" — recalibrada para tons quentes por causa da
// auditoria de UI/UX (IBVI_Auditoria_UIUX.md, seção 3): os tokens originais do
// DESIGN.md eram lavanda/azul-frio apesar do brief pedir "tons dourados
// quentes". Gold e verde do spec original foram mantidos como estavam.
module.exports = {
  content: [
    './App.tsx',
    './index.ts',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  // 'class' = quem manda é o colorScheme do NativeWind, não o tema do sistema.
  // Isso permite o usuário escolher no app, independente do celular.
  darkMode: 'class',
  theme: {
    extend: {
      // Todas as cores apontam para variáveis CSS definidas em `global.css`
      // (uma vez para o tema claro, outra para o escuro). O `<alpha-value>`
      // é o que faz `bg-gold/50` continuar funcionando.
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-bright': 'rgb(var(--color-surface-bright) / <alpha-value>)',
        'surface-dim': 'rgb(var(--color-surface-dim) / <alpha-value>)',
        'surface-container-lowest': 'rgb(var(--color-surface-container-lowest) / <alpha-value>)',
        'surface-container-low': 'rgb(var(--color-surface-container-low) / <alpha-value>)',
        'surface-container': 'rgb(var(--color-surface-container) / <alpha-value>)',
        'surface-container-high': 'rgb(var(--color-surface-container-high) / <alpha-value>)',
        'surface-container-highest': 'rgb(var(--color-surface-container-highest) / <alpha-value>)',

        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        'ink-muted': 'rgb(var(--color-ink-muted) / <alpha-value>)',
        'inverse-surface': 'rgb(var(--color-inverse-surface) / <alpha-value>)',
        'inverse-ink': 'rgb(var(--color-inverse-ink) / <alpha-value>)',

        outline: 'rgb(var(--color-outline) / <alpha-value>)',
        'outline-variant': 'rgb(var(--color-outline-variant) / <alpha-value>)',

        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'on-primary': 'rgb(var(--color-on-primary) / <alpha-value>)',
        gold: 'rgb(var(--color-gold) / <alpha-value>)',
        'on-gold': 'rgb(var(--color-on-gold) / <alpha-value>)',
        'gold-soft': 'rgb(var(--color-gold-soft) / <alpha-value>)',
        'gold-fixed': 'rgb(var(--color-gold-fixed) / <alpha-value>)',

        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        'on-secondary': 'rgb(var(--color-on-secondary) / <alpha-value>)',
        'secondary-soft': 'rgb(var(--color-secondary-soft) / <alpha-value>)',
        'on-secondary-soft': 'rgb(var(--color-on-secondary-soft) / <alpha-value>)',

        success: 'rgb(var(--color-success) / <alpha-value>)',
        'on-success': 'rgb(var(--color-on-success) / <alpha-value>)',
        'success-soft': 'rgb(var(--color-success-soft) / <alpha-value>)',

        error: 'rgb(var(--color-error) / <alpha-value>)',
        'on-error': 'rgb(var(--color-on-error) / <alpha-value>)',

        header: 'rgb(var(--color-header) / <alpha-value>)',
        'on-header': 'rgb(var(--color-on-header) / <alpha-value>)',
      },
      fontFamily: {
        // Headlines — Source Serif 4 (tom "Ancient-Future" do brand)
        serif: ['SourceSerif4_600SemiBold'],
        'serif-bold': ['SourceSerif4_700Bold'],
        'serif-medium': ['SourceSerif4_600SemiBold'],
        // Corpo/labels — Plus Jakarta Sans
        sans: ['PlusJakartaSans_400Regular'],
        'sans-medium': ['PlusJakartaSans_500Medium'],
        'sans-semibold': ['PlusJakartaSans_600SemiBold'],
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '4px',
        md: '4px', // botões — "crisp", conforme seção Components do DESIGN.md
        lg: '8px', // cards
        xl: '12px',
      },
      spacing: {
        xs: '4px',
        sm: '12px',
        md: '24px',
        lg: '48px',
        xl: '80px',
        gutter: '20px',
      },
    },
  },
  plugins: [],
};
