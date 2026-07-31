import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { calcCountdown } from '../services/events.service';

/**
 * Contagem regressiva que realmente anda, agora com segundos.
 *
 * O tique é de 1 segundo porque a menor unidade exibida passou a ser o
 * segundo. Também recalcula ao voltar do segundo plano — senão o usuário
 * reabre o app e vê o valor congelado de minutos atrás.
 */
export function useCountdown(iso: string | null | undefined) {
  const [countdown, setCountdown] = useState(() => (iso ? calcCountdown(iso) : null));

  useEffect(() => {
    if (!iso) {
      setCountdown(null);
      return;
    }

    const update = () => setCountdown(calcCountdown(iso));
    update();

    const interval = setInterval(update, 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') update();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [iso]);

  return countdown;
}
