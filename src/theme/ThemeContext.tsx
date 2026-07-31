import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme as nativewindColorScheme } from 'nativewind';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme as useSystemColorScheme, View } from 'react-native';
import { darkColors, lightColors, type AppColors } from '../constants/theme';
import { themeVars } from './themeVars';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme_preference';

type ThemeContextValue = {
  /** O que a pessoa escolheu (pode ser "system"). */
  preference: ThemePreference;
  /** O tema efetivamente aplicado agora. */
  isDark: boolean;
  /** Paleta do tema atual, para cores em JS (ícones, spinners). */
  colors: AppColors;
  setPreference: (preference: ThemePreference) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Dono do tema do app.
 *
 * O estado de verdade é o `preference` daqui — NÃO o `colorScheme` do
 * NativeWind. Numa primeira versão eu derivava `isDark` de
 * `useColorScheme()` do NativeWind, e o interruptor não mexia em nada:
 * chamar `setColorScheme` não fazia o componente re-renderizar. Mantendo o
 * estado em React, o toggle é garantido; o NativeWind é apenas avisado
 * depois, para o caso de alguém usar variantes `dark:` no futuro.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  const isDark =
    preference === 'dark' || (preference === 'system' && systemScheme === 'dark');

  // Restaura a escolha salva assim que o app abre.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setPreferenceState(saved);
      }
    });
  }, []);

  // Espelha no NativeWind (não é o que faz o tema funcionar, mas mantém as
  // duas fontes coerentes).
  useEffect(() => {
    nativewindColorScheme.set(isDark ? 'dark' : 'light');
  }, [isDark]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // Se falhar em salvar, o tema ainda vale para esta sessão.
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      isDark,
      colors: isDark ? darkColors : lightColors,
      setPreference,
      // Alternar grava sempre um valor explícito (nunca "system"), porque é
      // o que a pessoa acabou de pedir com o dedo.
      toggle: () => setPreference(isDark ? 'light' : 'dark'),
    }),
    [preference, isDark, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>
      {/* Este View aplica as variáveis de cor do tema ativo. Tudo que estiver
          dentro dele (o app inteiro) enxerga essas variáveis, e as classes do
          NativeWind — bg-background, text-ink... — trocam junto. */}
      <View style={isDark ? themeVars.dark : themeVars.light} className="flex-1">
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme precisa estar dentro de <ThemeProvider>.');
  return context;
}
