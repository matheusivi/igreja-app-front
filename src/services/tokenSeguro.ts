import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  O TOKEN DE SESSÃO, GUARDADO NO COFRE DO SISTEMA.                     ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * ═══ POR QUE SAIU DO AsyncStorage ═══
 * O `AsyncStorage` grava em texto puro. No Android é um arquivo XML dentro da
 * pasta do app; no iOS, um plist. Enquanto o aparelho estiver intacto ninguém
 * alcança aquilo — mas num aparelho com root, num backup extraído ou numa
 * análise forense, o token sai legível.
 *
 * E esse token não é pouca coisa: vale 24 horas e dá acesso TOTAL à conta,
 * incluindo a do administrador.
 *
 * O `expo-secure-store` usa o Keychain no iOS e o Keystore no Android — o
 * mesmo lugar onde o sistema guarda senhas de Wi-Fi e cartões. A chave de
 * criptografia fica no hardware, fora do alcance de quem só copiou arquivos.
 *
 * ═══ POR QUE SÓ O TOKEN, E NÃO TUDO ═══
 * O perfil guardado (`auth_user`) e o e-mail lembrado continuam no
 * `AsyncStorage`. Não são segredo — são dados que a própria pessoa vê na tela
 * a qualquer momento — e o cofre tem limite de tamanho por valor no Android,
 * além de ser mais lento. Cofre é para credencial; cache é cache.
 *
 * ═══ POR QUE UM MÓDULO SÓ ═══
 * O token era lido em dois lugares, cada um com a string `'auth_token'`
 * escrita à mão: no `api.ts` (para montar o cabeçalho) e no `auth.service.ts`.
 * Duas cópias da mesma chave é como uma migração deste tipo esquece metade do
 * app — e o sintoma seria todo mundo deslogado sem explicação.
 */

const CHAVE = 'auth_token';

/**
 * O cofre não existe no navegador.
 *
 * O app tem alvo `web` no `app.json`. Sem esta checagem, qualquer chamada lá
 * estouraria erro e a tela de login ficaria quebrada — trocar uma falha de
 * segurança por uma falha de funcionamento não é troca.
 */
const TEM_COFRE = Platform.OS !== 'web';

export const tokenSeguro = {
  /**
   * Lê o token, migrando do armazenamento antigo na primeira vez.
   *
   * ═══ POR QUE A MIGRAÇÃO PRECISA EXISTIR ═══
   * Quem já usa o app tem o token no `AsyncStorage`. Se a versão nova
   * simplesmente passasse a ler do cofre, encontraria vazio — e a congregação
   * INTEIRA seria deslogada na atualização, sem aviso e sem motivo aparente.
   *
   * Aqui, na primeira leitura, o token velho é copiado para o cofre e apagado
   * de onde estava. A pessoa não percebe nada; o token só muda de lugar.
   *
   * A limpeza acontece DEPOIS de gravar no cofre. Se falhar no meio, o token
   * antigo continua onde estava e a tentativa se repete na próxima abertura —
   * o contrário perderia a sessão de quem ficou sem espaço em disco.
   */
  async obter(): Promise<string | null> {
    if (!TEM_COFRE) return AsyncStorage.getItem(CHAVE);

    try {
      const doCofre = await SecureStore.getItemAsync(CHAVE);
      if (doCofre) return doCofre;

      const antigo = await AsyncStorage.getItem(CHAVE);
      if (!antigo) return null;

      await SecureStore.setItemAsync(CHAVE, antigo);
      await AsyncStorage.removeItem(CHAVE);
      return antigo;
    } catch {
      // Cofre indisponível (aparelho sem tela de bloqueio em versões antigas
      // do Android, por exemplo). Cair para o armazenamento comum mantém a
      // pessoa dentro do app — menos seguro, mas funcionando.
      return AsyncStorage.getItem(CHAVE);
    }
  },

  async guardar(token: string): Promise<void> {
    if (!TEM_COFRE) {
      await AsyncStorage.setItem(CHAVE, token);
      return;
    }

    try {
      await SecureStore.setItemAsync(CHAVE, token);
    } catch {
      await AsyncStorage.setItem(CHAVE, token);
    }
  },

  /**
   * Apaga dos DOIS lugares.
   *
   * Sair da conta não pode deixar rastro em nenhum deles — inclusive no
   * antigo, para o caso de a migração não ter chegado a rodar naquele
   * aparelho. Um token esquecido no `AsyncStorage` depois do logout é
   * exatamente o cenário que esta mudança veio impedir.
   */
  async limpar(): Promise<void> {
    await AsyncStorage.removeItem(CHAVE).catch(() => {});
    if (TEM_COFRE) {
      await SecureStore.deleteItemAsync(CHAVE).catch(() => {});
    }
  },
};
