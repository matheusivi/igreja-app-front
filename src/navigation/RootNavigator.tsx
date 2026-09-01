import { useCallback, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { TelaDeAbertura } from '../components/TelaDeAbertura';
import { AppStack } from './AppStack';
import { AuthProvider, useAuth } from './AuthContext';
import { AuthStack } from './AuthStack';

function RootSwitch() {
  const { isAuthenticated, isLoading } = useAuth();

  /**
   * ═══ A ABERTURA ESPERA DUAS COISAS ═══
   * Que o app tenha carregado E que a animação tenha terminado.
   *
   * Só o carregamento não basta: quem já entrou uma vez tem a sessão guardada
   * no aparelho, e isso resolve em milissegundos. A frase seria cortada na
   * segunda palavra — pior do que não existir, porque piscaria.
   *
   * E só a animação também não: numa rede ruim, o carregamento pode passar do
   * tempo dela, e aí a tela precisa continuar até haver o que mostrar.
   *
   * Quem terminar por último manda. Na prática, quase sempre é a animação —
   * que é exatamente o objetivo: transformar a espera técnica em algo com
   * intenção, em vez de disfarçá-la.
   */
  const [aberturaConcluida, setAberturaConcluida] = useState(false);

  // `useCallback` porque a `TelaDeAbertura` usa esta função dentro de um
  // `useEffect`. Recriada a cada render, ela reiniciaria o cronômetro sem
  // parar, e a animação nunca chegaria ao fim.
  const concluirAbertura = useCallback(() => setAberturaConcluida(true), []);

  if (isLoading || !aberturaConcluida) {
    return <TelaDeAbertura aoTerminar={concluirAbertura} />;
  }

  return isAuthenticated ? <AppStack /> : <AuthStack />;
}

export function RootNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootSwitch />
      </NavigationContainer>
    </AuthProvider>
  );
}
