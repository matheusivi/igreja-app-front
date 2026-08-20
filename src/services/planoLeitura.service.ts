import { api } from './api';

/**
 * O progresso da PESSOA LOGADA no plano de leitura.
 *
 * O plano em si não vem daqui — ele mora em `constants/planoLeitura.ts`, no
 * app. O servidor guarda só quais dias foram marcados, que é a parte que
 * precisa sobreviver a uma troca de celular.
 *
 * Nenhum método recebe `usuarioId`: o servidor tira do token. Não existe rota
 * para o progresso alheio, nem para a liderança.
 */
export const planoLeituraService = {
  /** Os dias marcados de um ano, no formato `YYYY-MM-DD`. */
  async listarDoAno(ano: number): Promise<string[]> {
    const { data } = await api.get('/api/plano-leitura', { params: { ano } });
    return (data.data ?? []) as string[];
  },

  /**
   * Marcar e desmarcar são idempotentes no servidor — repetir dá no mesmo.
   *
   * É o que permite a tela pintar o dia antes da resposta chegar: se a rede
   * repetir a requisição, a segunda não vira erro nem registro duplicado.
   */
  async definir(dia: string, concluido: boolean): Promise<void> {
    if (concluido) {
      await api.put(`/api/plano-leitura/${dia}`);
    } else {
      await api.delete(`/api/plano-leitura/${dia}`);
    }
  },
};
