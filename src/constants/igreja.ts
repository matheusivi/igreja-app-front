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
