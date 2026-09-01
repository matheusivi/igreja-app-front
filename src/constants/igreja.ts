/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  TUDO O QUE É ESPECÍFICO DESTA IGREJA MORA AQUI.                      ║
 * ║                                                                       ║
 * ║  Para adaptar o app a outra congregação, edite ESTE arquivo e o        ║
 * ║  equivalente no backend (`src/constants/igreja.ts`). Não há nada de   ║
 * ║  identidade espalhado pelas telas.                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * ═══ POR QUE UM ARQUIVO SÓ ═══
 * O nome da igreja estava escrito em SETE telas — login, cadastro,
 * recuperação de senha, hero da Home, aniversariantes, avisos e contribuição.
 * A chave PIX estava numa oitava. Trocar de igreja era uma caçada, e o custo
 * de esquecer um lugar variava muito:
 *
 * - Esquecer o NOME falha alto: alguém abre o app, vê o nome errado e avisa.
 * - Esquecer a CHAVE PIX falha em SILÊNCIO: a pessoa copia, transfere, o
 *   banco confirma, ela recebe o comprovante. Tudo parece ter funcionado — e
 *   o dinheiro está na conta de outra igreja. Ninguém descobre.
 *
 * É por causa do segundo caso que este arquivo existe. Com tudo à vista no
 * mesmo lugar, esquecer exige não ler a tela inteira.
 */

/** Nome da congregação, como aparece nas telas. */
export const NOME_IGREJA = 'Família IBVI';

/**
 * A frase da tela de abertura, revelada palavra por palavra.
 *
 * ═══ POR QUE UM ARRAY, E NÃO UMA STRING ═══
 * A animação entra uma palavra de cada vez, e o array é o que define o ritmo:
 * cada item é um tempo. Fosse uma string, a tela teria que decidir sozinha
 * onde quebrar — e "de" e "milagre" apareceriam separados por um espaço que
 * ninguém escolheu.
 *
 * Assim quem trocar a frase controla a cadência. Quatro ou cinco palavras é o
 * limite confortável: mais que isso, a abertura demora mais do que o app leva
 * para carregar, e o que era acolhida vira espera.
 */
export const FRASE_ABERTURA = [
  'Expectativa',
  'gera',
  'ambiente',
  'de',
  'milagre',
] as const;

/**
 * Chave PIX para onde vão as ofertas.
 *
 * ⚠️  CONFIRA ANTES DE PUBLICAR PARA OUTRA IGREJA.
 *
 * `valor` é o que o app copia para a área de transferência — só dígitos, sem
 * pontuação, que é o formato que os bancos aceitam. A formatação para leitura
 * acontece na tela.
 */
export const PIX = {
  tipo: 'CNPJ' as 'CNPJ' | 'CPF' | 'Telefone' | 'E-mail' | 'Aleatória',
  valor: '13479086000129',
} as const;

/**
 * Documentos públicos da igreja, servidos pelo mesmo servidor da API.
 *
 * ═══ POR QUE PÁGINAS NA WEB, E NÃO TELAS DO APP ═══
 * Precisam ter endereço próprio por três motivos que uma tela não atende:
 *
 * 1. A Play Console pede a URL da política num campo, e a da exclusão de conta
 *    em outro. Não há como colar uma tela num formulário.
 * 2. Quem já DESINSTALOU o app precisa poder pedir a exclusão da conta — e não
 *    tem mais tela nenhuma.
 * 3. Documento com endereço fixo pode ser corrigido sem publicar versão nova.
 *
 * ⚠️  Ao adaptar para outra igreja, estes três endereços mudam junto com o
 * servidor. Eles vivem aqui, e não espalhados pelas telas, pelo mesmo motivo
 * do nome e da chave PIX.
 */
export const PAGINAS = {
  privacidade: 'https://ibvi.novafeira.com.br/privacidade',
  termos: 'https://ibvi.novafeira.com.br/termos',
  excluirConta: 'https://ibvi.novafeira.com.br/excluir-conta',
} as const;
