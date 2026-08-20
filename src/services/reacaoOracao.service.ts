import AsyncStorage from '@react-native-async-storage/async-storage';

export type TipoReacao = 'praying' | 'amen';

export type ReacaoPedido = { praying: boolean; amen: boolean };

export type MapaReacoes = Record<number, ReacaoPedido>;

export const REACAO_VAZIA: ReacaoPedido = { praying: false, amen: false };

/**
 * Como no `leitura.service`, a chave leva o id do usuário: em casa de família
 * é comum o mesmo celular passar de mão em mão, e as marcações de um não
 * podem aparecer para o outro.
 */
function chaveDe(usuarioId: number): string {
  return `reacoes_oracao:${usuarioId}`;
}

/**
 * "Vou orar" e "Amém" marcados pela pessoa, guardados no aparelho.
 *
 * Antes isso era `useState` na tela: a pessoa marcava, saía do mural e a
 * marcação sumia. Pior que sumir, ela dava a entender que algo tinha sido
 * registrado — e não tinha. Nenhum contador subia, o autor do pedido não
 * ficava sabendo, nada era enviado ao servidor.
 *
 * Agora a marcação é o que sempre foi de verdade: um lembrete pessoal, de quem
 * marcou para quem marcou. Ela sobrevive a sair da tela e a fechar o app, e
 * continua sem prometer nada a ninguém.
 *
 * O preço é o mesmo do "marcar como lido": trocar de celular ou reinstalar o
 * app zera as marcações. Se um dia isso virar contador compartilhado ("12
 * pessoas estão orando"), aí sim precisa de tabela e endpoint — mas aí é outra
 * funcionalidade, não esta.
 */
export const reacaoOracaoService = {
  async listar(usuarioId: number): Promise<MapaReacoes> {
    const bruto = await AsyncStorage.getItem(chaveDe(usuarioId));
    if (!bruto) return {};
    try {
      const mapa = JSON.parse(bruto);
      // `typeof null === 'object'`, então o teste de nulo vem antes.
      return mapa && typeof mapa === 'object' && !Array.isArray(mapa)
        ? (mapa as MapaReacoes)
        : {};
    } catch {
      // Dado corrompido não deve derrubar o mural inteiro.
      return {};
    }
  },

  async alternar(
    usuarioId: number,
    pedidoId: number,
    tipo: TipoReacao,
  ): Promise<MapaReacoes> {
    const atuais = await reacaoOracaoService.listar(usuarioId);
    const anterior = atuais[pedidoId] ?? REACAO_VAZIA;
    const nova: ReacaoPedido = { ...anterior, [tipo]: !anterior[tipo] };

    const novos: MapaReacoes = { ...atuais, [pedidoId]: nova };
    // Pedido desmarcado nos dois botões sai do mapa. Sem isso o armazenamento
    // cresceria para sempre guardando `{praying:false, amen:false}`.
    if (!nova.praying && !nova.amen) delete novos[pedidoId];

    await AsyncStorage.setItem(chaveDe(usuarioId), JSON.stringify(novos));
    return novos;
  },
};
