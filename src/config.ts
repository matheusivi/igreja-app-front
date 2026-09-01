import Constants from 'expo-constants';

/** Porta em que o backend roda na máquina de desenvolvimento. */
const PORTA_BACKEND = 3000;

/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  ENDEREÇO DO SERVIDOR DA IGREJA                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * ⚠️  Para outra igreja, é AQUI que se troca. Junto com `constants/igreja.ts`,
 * é a segunda coisa específica desta congregação.
 *
 * ═══ POR QUE ESTE VALOR ESTÁ NO CÓDIGO, E NÃO SÓ NUMA VARIÁVEL ═══
 * Estava só em `eas.json` e depois em `.env.production`. As duas formas
 * funcionam — até o dia em que uma não funciona.
 *
 * E aconteceu: a documentação da Expo diz que variáveis do campo `env` dos
 * perfis de build NÃO valem no `eas update`. A atualização OTA saiu sem
 * endereço, caiu no valor de emergência — que era `255.255.255.0`, um endereço
 * inexistente — e o app inteiro parou de falar com o servidor. Telas novas
 * chegaram, dados não.
 *
 * A lição não é "arrume a variável". É que **o caminho de emergência precisa
 * ser o caminho certo**. Um valor padrão que garantidamente não funciona só
 * serve para transformar um esquecimento em pane silenciosa.
 *
 * Este endereço não é segredo: qualquer pessoa o descobre olhando o tráfego do
 * app. Não há nada a proteger deixando-o fora do código — só há o que perder.
 */
const SERVIDOR_DA_IGREJA = 'https://ibvi.novafeira.com.br';

/**
 * Em produção, só HTTPS.
 *
 * Se o endereço vier com `http://` — por variável mal preenchida, por
 * descuido —, o app publicado mandaria e-mail, senha e token de sessão em
 * texto puro. No Wi-Fi da igreja, qualquer aparelho na mesma rede leria.
 *
 * O perigo não é a chance de acontecer: é que, acontecendo, TUDO FUNCIONARIA.
 * Ninguém desconfiaria. Promover para `https` faz falhar fechado — se o
 * servidor tiver TLS, funciona; se não tiver, a conexão não completa e o erro
 * aparece no teste, não no vazamento.
 *
 * Desenvolvimento continua em HTTP: o Metro serve por IP local, sem
 * certificado. `__DEV__` é falso em qualquer build de release.
 */
function exigirHttpsEmProducao(url: string): string {
  if (__DEV__) return url;
  return url.replace(/^http:\/\//i, 'https://');
}

/**
 * Decide com qual servidor falar, em três degraus.
 *
 *   1. `EXPO_PUBLIC_API_URL`  — permite apontar para outro servidor sem mexer
 *                               no código (um ambiente de homologação, por
 *                               exemplo). Continua sendo o primeiro da fila.
 *   2. O IP do Metro          — só em desenvolvimento. Descobre sozinho o
 *                               endereço da sua máquina na rede, então trocar
 *                               de Wi-Fi não quebra mais nada.
 *   3. O servidor da igreja   — o padrão. Onde o app publicado sempre chega.
 */
function descobrirBaseUrl(): string {
  const daEnv = process.env.EXPO_PUBLIC_API_URL;
  if (daEnv) return daEnv;

  /**
   * `hostUri` é o endereço que o Expo Go usou para baixar o bundle — ou seja,
   * comprovadamente alcançável a partir do celular. Como o backend roda na
   * mesma máquina, basta trocar a porta.
   *
   * O `__DEV__` na condição é o que impede um build de produção de tentar
   * isso: lá `hostUri` normalmente não existe, mas se existisse, o app
   * apontaria para a máquina de alguém em vez do servidor da igreja.
   */
  if (__DEV__) {
    const host = Constants.expoConfig?.hostUri?.split(':')[0];
    if (host) return `http://${host}:${PORTA_BACKEND}`;
  }

  return SERVIDOR_DA_IGREJA;
}

export const API_BASE_URL = exigirHttpsEmProducao(descobrirBaseUrl());
