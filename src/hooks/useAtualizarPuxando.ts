import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';
import { createElement } from 'react';
import { useAuth } from '../navigation/AuthContext';
import { useThemeColors } from './useThemeColors';

/**
 * O gesto de puxar para atualizar, pronto para entregar a uma lista.
 *
 * ═══ POR QUE ISTO PRECISOU EXISTIR ═══
 * Dois celulares abertos na mesma tela não se falavam. O cache guarda o dado
 * por 30 segundos, o app revalida ao voltar do segundo plano — mas se ninguém
 * sai do app, nada dispara busca nova. Quem publicava um pedido de oração no
 * Android via a tela do iPhone parada, e a única saída era fechar e abrir.
 *
 * Puxar é o gesto que todo mundo já conhece e que devolve o controle: a pessoa
 * atualiza quando QUER, sem o app gastar bateria e dados adivinhando quando
 * ela quer.
 *
 * ═══ POR QUE NÃO BUSCAR SOZINHO A CADA X SEGUNDOS ═══
 * Um temporizador roda o tempo todo para atender os poucos minutos em que
 * alguém está de fato olhando. Numa congregação inteira isso vira muita
 * requisição para pouquíssimo ganho — e não resolve o caso do celular no
 * bolso, que é a maioria do tempo.
 *
 * Se um dia o mural de oração precisar ser "ao vivo" durante o culto, o certo
 * é notificação push, não polling.
 *
 * ═══ POR QUE UM HOOK, E NÃO CÓPIA EM CADA TELA ═══
 * Cinco telas precisam do mesmo gesto, da mesma cor e do mesmo estado de "já
 * estou atualizando". Duplicar isso é como as telas ficam com comportamentos
 * levemente diferentes — uma que trava o indicador, outra que atualiza a
 * chave errada.
 */
export function useAtualizarPuxando(chaves: readonly unknown[][]) {
  const queryClient = useQueryClient();
  const colors = useThemeColors();
  const { refreshUser } = useAuth();
  const [atualizando, setAtualizando] = useState(false);

  const atualizar = useCallback(async () => {
    setAtualizando(true);
    try {
      /**
       * `refetchType: 'active'` busca só o que está montado na tela.
       *
       * Sem isso, invalidar também dispararia as consultas de telas que estão
       * no cache mas fora de vista — a pessoa puxa a lista de oração e o app
       * baixa eventos, cursos e aniversariantes junto, no 4G dela.
       *
       * ═══ O PRÓPRIO PERFIL VAI JUNTO ═══
       * Ele não é uma consulta do React Query — vive no `AuthContext` —, mas
       * é o que decide quais BOTÕES a tela mostra. Sem atualizá-lo aqui, quem
       * foi rebaixado de líder a membro continuava vendo "criar curso" e
       * "criar turma" até fechar e abrir o app, e o servidor recusava o toque
       * com 403.
       *
       * Puxar significa "me dá o estado atual". O cargo da pessoa faz parte
       * desse estado tanto quanto a lista.
       */
      await Promise.all([
        ...chaves.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey, refetchType: 'active' }),
        ),
        refreshUser(),
      ]);
    } finally {
      // Sempre desliga o indicador, inclusive quando a rede falha. Um indicador
      // girando para sempre é pior que uma lista desatualizada: parece travado.
      setAtualizando(false);
    }
  }, [chaves, queryClient, refreshUser]);

  /**
   * Pronto para `<ScrollView refreshControl={controle} />`.
   *
   * Devolvido montado, e não como props soltas, porque a cor do indicador
   * precisa do tema — e essa é justamente a parte que cada tela esqueceria de
   * passar, deixando um círculo cinza padrão no meio da identidade da igreja.
   */
  const controle = createElement(RefreshControl, {
    refreshing: atualizando,
    onRefresh: atualizar,
    tintColor: colors.primary,
    colors: [colors.primary],
  });

  return { controle, atualizando, atualizar };
}
