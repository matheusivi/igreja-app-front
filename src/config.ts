import Constants from 'expo-constants';

/** Porta em que o backend roda na máquina de desenvolvimento. */
const PORTA_BACKEND = 3000;

/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  ENDEREÇO DO SERVIDOR                                                 ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * O valor de emergência. Se o `.env.production` não for lido — e já aconteceu,
 * porque `eas update` ignora o campo `env` dos perfis de build —, é este
 * endereço que mantém o app falando com o servidor.
 *
 * Não é segredo: qualquer pessoa descobre olhando o tráfego do app.
 */
const SERVIDOR_DA_IGREJA = 'https://api.ibvichurch.com.br';

/**
 * Em produção, `http://` vira `https://`. Em desenvolvimento o endereço é a sua
 * própria máquina na rede local, onde não há certificado — por isso a exceção.
 */
function exigirHttpsEmProducao(url: string): string {
  if (__DEV__) return url;
  return url.replace(/^http:\/\//i, 'https://');
}

function descobrirBaseUrl(): string {
  const daEnv = process.env.EXPO_PUBLIC_API_URL;
  if (daEnv) return daEnv;

  /**
   * ═══ DESENVOLVIMENTO: O SERVIDOR É A SUA MÁQUINA ═══
   * O `hostUri` é o endereço que o Metro anuncia para o celular — o IP do seu
   * computador na rede Wi-Fi. Trocamos a porta do Metro pela porta do backend
   * e chegamos no servidor local.
   *
   * Isto precisa continuar apontando para a sua máquina. Apontar para produção
   * aqui significaria gravar no banco da igreja enquanto você testa código
   * novo — e descobrir só depois, com dados errados no meio dos reais.
   */
  if (__DEV__) {
    const host = Constants.expoConfig?.hostUri?.split(':')[0];
    if (host) return `http://${host}:${PORTA_BACKEND}`;
  }

  return SERVIDOR_DA_IGREJA;
}

export const API_BASE_URL = exigirHttpsEmProducao(descobrirBaseUrl());
