import Constants from 'expo-constants';

/** Porta em que o backend (`igreja-app-backend`) está rodando. */
const PORTA_BACKEND = 3000;

/**
 * Usado quando não dá para descobrir o IP sozinho (build de produção, por
 * exemplo). Em desenvolvimento isso quase nunca é lido.
 */
const FALLBACK = `http://255.255.255.0:${PORTA_BACKEND}`;

/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  EM PRODUÇÃO, SÓ HTTPS. SEM EXCEÇÃO.                                  ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * ═══ O QUE ESTAVA ABERTO ═══
 * A URL vinha de `EXPO_PUBLIC_API_URL` e era usada como chegasse. Se no dia do
 * build essa variável saísse com `http://` — por pressa, por copiar do
 * ambiente local, por o certificado ainda não estar pronto —, o app publicado
 * mandaria E-MAIL, SENHA E O TOKEN DE SESSÃO em texto puro. No Wi-Fi da
 * igreja, qualquer aparelho na mesma rede lê isso sem esforço.
 *
 * O que torna isso perigoso não é a chance de acontecer: é que, se
 * acontecesse, TUDO FUNCIONARIA. A pessoa entra, o app abre, ninguém
 * desconfia. Um erro que não se manifesta é um erro que fica.
 *
 * ═══ POR QUE PROMOVER, E NÃO AVISAR ═══
 * Um aviso em log ninguém lê num app publicado. Derrubar o app com erro na
 * abertura puniria a congregação por um erro de configuração meu.
 *
 * Promover para `https://` faz o app FALHAR FECHADO: se o servidor tiver TLS,
 * funciona e o vazamento nunca existiu; se não tiver, a conexão não completa e
 * o erro aparece — no build do canal `teste`, antes de chegar em produção.
 * Entre "vaza em silêncio" e "não conecta com barulho", o segundo é sempre o
 * lado certo de errar.
 *
 * ═══ DESENVOLVIMENTO CONTINUA EM HTTP ═══
 * O Metro serve por IP de rede local, sem certificado. Exigir HTTPS aqui
 * inviabilizaria rodar o projeto. `__DEV__` é falso em qualquer build de
 * release, então a trava vale exatamente onde precisa valer.
 */
function exigirHttpsEmProducao(url: string): string {
  if (__DEV__) return url;
  return url.replace(/^http:\/\//i, 'https://');
}

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
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:${PORTA_BACKEND}`;

  return FALLBACK;
}

export const API_BASE_URL = exigirHttpsEmProducao(descobrirBaseUrl());
