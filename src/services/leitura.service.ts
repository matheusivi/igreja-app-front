import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A chave leva o id do usuário porque em casa de família é comum o mesmo
 * celular ser usado por mais de uma pessoa. Com uma chave única, os
 * devocionais que a mãe leu apareceriam como lidos para o filho.
 */
function chaveDe(usuarioId: number): string {
  return `conteudos_lidos:${usuarioId}`;
}

/**
 * Quais conteúdos a pessoa já marcou como lidos.
 *
 * Fica no aparelho, e não no servidor, de propósito: é uma marcação pessoal
 * de leitura, sem valor para mais ninguém. Guardar no banco custaria uma
 * tabela, dois endpoints e uma requisição a cada toque — para um selo de
 * check que só quem marcou vê.
 *
 * O preço é que a marcação não acompanha a pessoa se ela trocar de celular
 * ou reinstalar o app. Para um "já li este devocional", é um preço justo.
 */
export const leituraService = {
  async listar(usuarioId: number): Promise<number[]> {
    const bruto = await AsyncStorage.getItem(chaveDe(usuarioId));
    if (!bruto) return [];
    try {
      const lista = JSON.parse(bruto);
      return Array.isArray(lista) ? (lista as number[]) : [];
    } catch {
      // Dado corrompido não deve derrubar a tela de devocionais.
      return [];
    }
  },

  async alternar(usuarioId: number, conteudoId: number): Promise<number[]> {
    const atuais = await leituraService.listar(usuarioId);
    const novos = atuais.includes(conteudoId)
      ? atuais.filter((id) => id !== conteudoId)
      : [...atuais, conteudoId];

    await AsyncStorage.setItem(chaveDe(usuarioId), JSON.stringify(novos));
    return novos;
  },
};
