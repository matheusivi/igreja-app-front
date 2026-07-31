import Constants from 'expo-constants';

/** Porta em que o backend (`igreja-app-backend`) está rodando. */
const PORTA_BACKEND = 3000;

/**
 * Usado quando não dá para descobrir o IP sozinho (build de produção, por
 * exemplo). Em desenvolvimento isso quase nunca é lido.
 */
const FALLBACK = `http://192.168.1.32:${PORTA_BACKEND}`;

/**
 * Descobre sozinho o IP da máquina que está rodando o Metro.
 *
 * O `hostUri` vem no formato "192.168.0.15:8081" — é o endereço que o próprio
 * Expo Go usou para baixar o bundle, ou seja, comprovadamente alcançável a
 * partir do celular. Como o backend roda na mesma máquina, basta trocar a porta.
 *
 * Antes o IP era uma constante escrita à mão: trocar de rede (casa, igreja,
 * roteador renovando DHCP) quebrava o app inteiro, e o sintoma que aparecia na
 * tela era "e-mail ou senha incorretos".
 */
function descobrirBaseUrl(): string {
  // Prioridade 1: variável de ambiente. Vai ser necessária quando o backend
  // subir para a VPS, já que aí ele não fica mais na máquina do Metro.
  const daEnv = process.env.EXPO_PUBLIC_API_URL;
  if (daEnv) return daEnv;

  // Prioridade 2: IP do servidor de desenvolvimento.
const host = Constants.expoConfig?.hostUri?.split(":")[0];
if (host) return `http://${host}:${PORTA_BACKEND}`;

  return FALLBACK;
}

export const API_BASE_URL = descobrirBaseUrl();
