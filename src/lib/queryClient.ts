import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Cache central do app.
 *
 * Antes, cada tela guardava seus dados no próprio `useState`: ao sair da tela
 * o dado morria, e ao voltar tudo era buscado do zero mostrando a rodinha de
 * carregando no lugar do conteúdo. Aqui os dados passam a viver fora das
 * telas — quem volta vê o conteúdo na hora e a atualização acontece no fundo.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Por quanto tempo o dado é considerado "fresco". Dentro dessa janela,
      // voltar para a tela não dispara requisição nenhuma.
      staleTime: 30_000,
      // Quanto tempo o dado fica guardado depois que ninguém mais o usa.
      // É o que permite mostrar a lista instantaneamente ao voltar.
      gcTime: 5 * 60_000,
      // Em celular, tentar de novo eternamente só trava a interface.
      retry: 1,
      // Ao voltar para a tela, revalida em segundo plano — sem apagar o que
      // já está na tela.
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Liga o "foco" do React Query ao ciclo de vida do app.
 *
 * No navegador isso funciona sozinho (evento de foco da janela). No React
 * Native precisa ser conectado à mão ao AppState, senão o Query nunca sabe
 * que o usuário voltou de segundo plano.
 */
export function setupAppStateFocus() {
  const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
    focusManager.setFocused(status === 'active');
  });
  return () => subscription.remove();
}

export { onlineManager };
