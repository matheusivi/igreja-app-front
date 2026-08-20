import { api } from './api';

/**
 * O que a liderança pode mudar na cara do app sem publicar versão nova.
 *
 * Os dois campos estavam no CÓDIGO: a frase escrita no `HomeScreen`, a capa
 * como `require` de um arquivo em `assets/`. Trocar qualquer um dos dois
 * exigia um deploy — e nenhum pastor faz deploy.
 *
 * O NOME da igreja não entra aqui de propósito: ele vive em
 * `constants/igreja.ts`, junto com a chave PIX. Ele muda uma vez na vida do
 * app — quando o código é adaptado para outra congregação — e nesse momento
 * quem edita já está no código. Dar tela para isso seria construir um painel
 * para um botão que ninguém aperta.
 */
export type ConfiguracaoIgreja = {
  /** `null` = sem capa; o hero volta ao layout de emblema. */
  heroImagemUrl: string | null;
  versiculoHome: string | null;
};

export const configuracaoService = {
  async obter(): Promise<ConfiguracaoIgreja> {
    const { data } = await api.get('/api/configuracao');
    return data.data as ConfiguracaoIgreja;
  },

  /**
   * Campo ausente significa "não mexer"; `null` REMOVE.
   *
   * A distinção importa: sem ela, salvar só a frase apagaria a foto.
   */
  async atualizar(payload: Partial<ConfiguracaoIgreja>): Promise<ConfiguracaoIgreja> {
    const { data } = await api.patch('/api/configuracao', payload);
    return data.data as ConfiguracaoIgreja;
  },
};
