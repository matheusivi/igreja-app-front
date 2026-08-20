/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  PLANOS DE LEITURA ANUAL                                              ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * ═══════════════════════════════════════════════════════════════════════
 *  COMO ACRESCENTAR O PLANO DO PRÓXIMO ANO
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  1. Copie o bloco de um ano existente e troque o número da chave:
 *
 *         2027: {
 *           1: ['Gênesis 1 a 3', ...],   // 31 itens
 *           2: [...],                     // 28 (ou 29 se bissexto)
 *           ...
 *           12: [...],                    // 31
 *         },
 *
 *  2. Cada mês é um ARRAY na ordem dos dias: o índice 0 é o dia 1º.
 *
 *  3. A soma tem que bater com o calendário daquele ano. `leiturasDoMes`
 *     confere e reclama no console se divergir — um mês com sobra ou falta
 *     desloca TODAS as leituras seguintes, e ninguém repara.
 *
 *  4. ⚠️  ANO BISSEXTO precisa de 29 entradas em fevereiro. 2028 é bissexto.
 *
 *  5. Publique a atualização com calma, em novembro ou dezembro. O app NÃO
 *     mostra ano futuro — ele aparece sozinho em 1º de janeiro. Ninguém
 *     precisa fazer nada na virada.
 *
 *  6. O ano ANTIGO pode ficar no arquivo. A tela mostra só os dois mais
 *     recentes; o retrasado some sozinho da lista. Não apague — o progresso
 *     daquele ano continua no banco, e um dia a janela pode aumentar.
 *
 *  ─── COMO CONFERIR DEPOIS DE COLAR ────────────────────────────────────
 *
 *  Abra a tela do plano e troque para o ano novo. Se algum mês estiver com
 *  a contagem errada, aparece um aviso no console do Metro dizendo qual é.
 *
 *  Confira também as BORDAS: o último dia de um mês e o primeiro do
 *  seguinte. É onde um item a mais ou a menos passa despercebido, e a
 *  partir dali tudo desanda um dia.
 *
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ═══ POR QUE NO CÓDIGO, E NÃO NO BANCO ═══
 * Um plano de leitura não muda no meio do ano — mudar seria quebrar o
 * compromisso de quem está no dia 200. É conteúdo fixo, como o texto de uma
 * tela, e não dado que a igreja administra.
 *
 * Estando aqui, a tela abre offline. O que vai ao servidor é só o PROGRESSO —
 * o que a pessoa já leu — porque isso é dela e precisa sobreviver a uma troca
 * de celular.
 *
 * ═══ A FONTE É O FOLDER IMPRESSO DA IGREJA ═══
 * Transcrito do calendário de leitura da IBVI Nova Andradina de 2026 — o
 * mesmo que a congregação recebe em papel. Antes daqui morava um plano
 * genérico, de outra fonte, e as duas coisas não batiam: quem seguisse o app
 * e quem seguisse o folder liam passagens diferentes no mesmo domingo.
 *
 * Duas coisas foram normalizadas em relação ao papel, e só duas:
 *
 * - As ABREVIAÇÕES viraram nome inteiro (`Dt` → Deuteronômio, `Jr` →
 *   Jeremias, `Lm`, `Ec`, `1 Cr`, `2 Cr`). No folder o espaço é escasso; na
 *   tela não é, e `Dt 28` não ajuda quem está começando a ler a Bíblia.
 * - O separador `|` virou `·`, que é o mesmo papel com menos peso visual.
 *
 * Os capítulos são exatamente os do folder. Nada foi reinterpretado.
 */

/**
 * Quantos anos ficam à mostra: o corrente e o anterior.
 *
 * ═══ POR QUE DOIS, E POR QUE O MAIS ANTIGO SAI SOZINHO ═══
 * O ano anterior serve para quem quer conferir o que leu, ou terminar o que
 * ficou pela metade. O retrasado não serve para nada — e uma lista de anos
 * que só cresce acaba virando um menu com seis opções que ninguém abre.
 *
 * Como o corte é por JANELA e não por remoção, o plano antigo pode continuar
 * no arquivo: ele simplesmente deixa de aparecer quando um ano novo entra.
 * Assim ninguém precisa lembrar de apagar nada, e o histórico no banco
 * continua intacto — se um dia a janela aumentar, os dados estão lá.
 */
const ANOS_VISIVEIS = 2;

/**
 * Os planos, por ano.
 *
 * Cada ano tem 12 meses; cada mês, um item por dia. Acrescentar um ano é
 * colar um bloco novo — ver o passo a passo no topo do arquivo.
 */
const PLANOS: Record<number, Record<number, string[]>> = {
  2026: {
    // ── JANEIRO ── 31 dias
    1: [
      'Gênesis 1-2 · João 1',
      'Gênesis 3-4 · João 2',
      'Gênesis 5-7 · João 3',
      'Gênesis 8-10 · João 4',
      'Gênesis 11-13 · João 5',
      'Gênesis 14-16 · João 6',
      'Gênesis 17-18 · João 7',
      'Gênesis 19-20 · João 8',
      'Gênesis 21-23 · João 9',
      'Gênesis 24-25 · João 10',
      'Gênesis 26-27 · João 11',
      'Gênesis 28-29 · João 12',
      'Gênesis 30-31 · João 13',
      'Gênesis 32-34 · João 14',
      'Gênesis 35-36 · João 15',
      'Gênesis 37-39 · João 16',
      'Gênesis 40-41 · João 17',
      'Gênesis 42-43 · João 18',
      'Gênesis 44-45 · João 19',
      'Gênesis 46-47 · João 20',
      'Gênesis 48-50 · João 21',
      'Êxodo 1-3 · Provérbios 1',
      'Êxodo 4-5 · Atos 1',
      'Êxodo 6-7 · Atos 2',
      'Êxodo 8-9 · Atos 3',
      'Êxodo 10-11 · Atos 4',
      'Êxodo 12-13 · Atos 5',
      'Êxodo 14-15 · Atos 6',
      'Êxodo 16-18 · Atos 7',
      'Êxodo 19-20 · Atos 8',
      'Êxodo 21-22 · Atos 9',
    ],
    // ── FEVEREIRO ── 28 dias
    2: [
      'Êxodo 23-24 · Atos 10',
      'Êxodo 25-26 · Atos 11',
      'Êxodo 27-28 · Atos 12',
      'Êxodo 29-30 · Atos 13',
      'Êxodo 31-32 · Atos 14',
      'Êxodo 33-34 · Atos 15',
      'Êxodo 35-36 · Atos 16',
      'Êxodo 37-38 · Atos 17',
      'Êxodo 39-40 · Atos 18',
      'Provérbios 2 · Atos 19',
      'Levítico 1-3 · Atos 20',
      'Levítico 4-5 · Atos 21',
      'Levítico 6-7 · Atos 22',
      'Levítico 8-9 · Atos 23',
      'Levítico 10-11 · Atos 24',
      'Levítico 12-13 · Atos 25',
      'Levítico 14 · Atos 26',
      'Levítico 15-16 · Atos 27',
      'Levítico 17-18 · Atos 28',
      'Levítico 19-20 · Salmos 1',
      'Levítico 21-22 · Salmos 2',
      'Levítico 23-24 · Salmos 3',
      'Levítico 25 · Salmos 4',
      'Levítico 26-27 · Salmos 5',
      'Provérbios 3 · Salmos 6',
      'Números 1 · Romanos 1',
      'Números 2 · Romanos 2',
      'Números 3-4 · Romanos 3',
    ],
    // ── MARÇO ── 31 dias
    3: [
      'Números 5-6 · Romanos 4',
      'Números 7 · Romanos 5',
      'Números 8-9 · Romanos 6',
      'Números 10-11 · Romanos 7',
      'Números 12-13 · Romanos 8',
      'Números 14-15 · Romanos 9',
      'Números 16-17 · Romanos 10',
      'Números 18-19 · Romanos 11',
      'Números 20-21 · Romanos 12',
      'Números 22-23 · Romanos 13',
      'Números 24-25 · Romanos 14',
      'Números 26 · Romanos 15',
      'Números 27-28 · Romanos 16',
      'Números 29-30 · Salmos 7',
      'Números 31 · Salmos 8',
      'Números 32 · Salmos 9',
      'Números 33 · Salmos 10',
      'Números 34-36 · Salmos 11',
      'Provérbios 4 · 1 Coríntios 1',
      'Deuteronômio 1-2 · 1 Coríntios 2',
      'Deuteronômio 3-4 · 1 Coríntios 3',
      'Deuteronômio 5-6 · 1 Coríntios 4',
      'Deuteronômio 7-8 · 1 Coríntios 5',
      'Deuteronômio 9-10 · 1 Coríntios 6',
      'Deuteronômio 11-12 · 1 Coríntios 7',
      'Deuteronômio 13-15 · 1 Coríntios 8',
      'Deuteronômio 16-18 · 1 Coríntios 9',
      'Deuteronômio 19-21 · 1 Coríntios 10',
      'Deuteronômio 22-23 · 1 Coríntios 11',
      'Deuteronômio 24-25 · 1 Coríntios 12',
      'Deuteronômio 26-27 · 1 Coríntios 13',
    ],
    // ── ABRIL ── 30 dias
    4: [
      'Deuteronômio 28 · 1 Coríntios 14',
      'Deuteronômio 29-31 · 1 Coríntios 15',
      'Deuteronômio 32 · 1 Coríntios 16',
      'Deuteronômio 33-34 · Provérbios 5',
      'Josué 1-3 · Salmos 12',
      'Josué 4-6 · Salmos 13',
      'Josué 7-9 · Salmos 14',
      'Josué 10 · Salmos 15',
      'Josué 11-13 · Salmos 16',
      'Josué 14-17 · Mateus 1',
      'Josué 18-20 · Mateus 2',
      'Josué 21-22 · Mateus 3',
      'Josué 23-24 · Mateus 4',
      'Provérbios 6 · Mateus 5',
      'Juízes 1-3 · Mateus 6',
      'Juízes 4-5 · Mateus 7',
      'Juízes 6-8 · Mateus 8',
      'Juízes 9-10 · Mateus 9',
      'Juízes 11-13 · Mateus 10',
      'Juízes 14-16 · Mateus 11',
      'Juízes 17-19 · Mateus 12',
      'Juízes 20-21 · Mateus 13',
      'Provérbios 7 · Mateus 14',
      'Rute 1-2 · Mateus 15',
      'Rute 3-4 · Mateus 16',
      '1 Samuel 1-2 · Mateus 17',
      '1 Samuel 3-5 · Mateus 18',
      '1 Samuel 6-8 · Mateus 19',
      '1 Samuel 9-11 · Mateus 20',
      '1 Samuel 12-13 · Mateus 21',
    ],
    // ── MAIO ── 31 dias
    5: [
      '1 Samuel 14 · Mateus 22',
      '1 Samuel 15-16 · Mateus 23',
      '1 Samuel 17-18 · Mateus 24',
      '1 Samuel 19-20 · Mateus 25',
      '1 Samuel 21-22 · Mateus 26',
      '1 Samuel 23-24 · Mateus 27',
      '1 Samuel 25 · Mateus 28',
      '1 Samuel 26-27 · Provérbios 8',
      '1 Samuel 28-29 · 2 Coríntios 1',
      '1 Samuel 30-31 · 2 Coríntios 2',
      '2 Samuel 1-2 · 2 Coríntios 3',
      '2 Samuel 3-4 · 2 Coríntios 4',
      '2 Samuel 5-7 · 2 Coríntios 5',
      '2 Samuel 8-10 · 2 Coríntios 6',
      '2 Samuel 11-12 · 2 Coríntios 7',
      '2 Samuel 13-14 · 2 Coríntios 8',
      '2 Samuel 15-16 · 2 Coríntios 9',
      '2 Samuel 17-18 · 2 Coríntios 10',
      '2 Samuel 19-20 · 2 Coríntios 11',
      '2 Samuel 21-22 · 2 Coríntios 12',
      '2 Samuel 23-24 · 2 Coríntios 13',
      'Provérbios 9 · Salmos 17',
      '1 Reis 1 · Salmos 18',
      '1 Reis 2-3 · Salmos 19',
      '1 Reis 4-5 · Salmos 20',
      '1 Reis 6-7 · Salmos 21',
      '1 Reis 8 · Salmos 22',
      '1 Reis 9-10 · Salmos 23',
      '1 Reis 11-12 · Salmos 24',
      '1 Reis 13-14 · Salmos 25',
      '1 Reis 15-16 · Salmos 26',
    ],
    // ── JUNHO ── 30 dias
    6: [
      '1 Reis 17-18 · Gálatas 1',
      '1 Reis 19-20 · Gálatas 2',
      '1 Reis 21-22 · Gálatas 3',
      'Provérbios 10 · Gálatas 4',
      '2 Reis 1-2 · Gálatas 5',
      '2 Reis 3-4 · Gálatas 6',
      '2 Reis 5-6 · Efésios 1',
      '2 Reis 7-8 · Efésios 2',
      '2 Reis 9-10 · Efésios 3',
      '2 Reis 11-12 · Efésios 4',
      '2 Reis 13-14 · Efésios 5',
      '2 Reis 15-16 · Efésios 6',
      '2 Reis 17-18 · Salmos 27',
      '2 Reis 19-20 · Salmos 28',
      '2 Reis 21-22 · Salmos 29',
      '2 Reis 23-25 · Salmos 30',
      'Provérbios 11 · Salmos 31',
      'Esdras 1-2 · Salmos 32',
      'Esdras 3-4 · Salmos 33',
      'Esdras 5-7 · Salmos 34',
      'Esdras 8-10 · Salmos 35',
      'Provérbios 12 · Salmos 36',
      'Neemias 1-3 · Salmos 37',
      'Neemias 4-6 · Salmos 38',
      'Neemias 7-8 · Salmos 39',
      'Neemias 9-10 · Salmos 40',
      'Neemias 11-13 · Salmos 41',
      'Ester 1-4 · Filipenses 1',
      'Ester 5-10 · Filipenses 2',
      'Provérbios 13 · Filipenses 3',
    ],
    // ── JULHO ── 31 dias
    7: [
      'Jó 1-4 · Filipenses 4',
      'Jó 5-7 · Colossenses 1',
      'Jó 8-11 · Colossenses 2',
      'Jó 12-15 · Colossenses 3',
      'Jó 16-19 · Colossenses 4',
      'Jó 20-22 · 1 Tessalonicenses 1',
      'Jó 23-27 · 1 Tessalonicenses 2',
      'Jó 28-30 · 1 Tessalonicenses 3',
      'Jó 31-33 · 1 Tessalonicenses 4',
      'Jó 34-36 · 1 Tessalonicenses 5',
      'Jó 37-39 · Salmos 42',
      'Jó 40-42 · Salmos 43',
      'Provérbios 14 · Salmos 44',
      'Eclesiastes 1-4 · 2 Tessalonicenses 1',
      'Eclesiastes 5-8 · 2 Tessalonicenses 2',
      'Eclesiastes 9-12 · 2 Tessalonicenses 3',
      'Cânticos 1-4 · Salmos 45-46',
      'Cânticos 5-8 · Salmos 47-48',
      'Provérbios 15 · Salmos 49-50',
      'Isaías 1-3 · Salmos 51-52',
      'Isaías 4-7 · Salmos 53-54',
      'Isaías 8-12 · Salmos 55',
      'Isaías 13-16 · Salmos 56-57',
      'Isaías 17-21 · Salmos 58',
      'Isaías 22-25 · Salmos 59',
      'Isaías 26-29 · Salmos 60-61',
      'Isaías 30-32 · Salmos 62-63',
      'Isaías 33-36 · Salmos 64-65',
      'Isaías 37-39 · Salmos 66-67',
      'Isaías 40-42 · Salmos 68',
      'Isaías 43-44 · Salmos 69',
    ],
    // ── AGOSTO ── 31 dias
    8: [
      'Isaías 45-47 · Marcos 1',
      'Isaías 48-50 · Marcos 2',
      'Isaías 51-53 · Marcos 3',
      'Isaías 54-57 · Marcos 4',
      'Isaías 58-60 · Marcos 5',
      'Isaías 61-64 · Marcos 6',
      'Isaías 65-66 · Marcos 7',
      'Provérbios 16 · Marcos 8',
      'Salmos 70-71 · Marcos 9',
      'Salmos 72-73 · Marcos 10',
      'Salmos 74-75 · Marcos 11',
      'Salmos 76-77 · Marcos 12',
      'Salmos 78 · Marcos 13',
      'Salmos 79 · Marcos 14',
      'Salmos 80-81 · Marcos 15',
      'Salmos 82-83 · Marcos 16',
      'Salmos 84-85 · 1 Timóteo 1',
      'Provérbios 17 · 1 Timóteo 2',
      'Jeremias 1-2 · 1 Timóteo 3',
      'Jeremias 3-4 · 1 Timóteo 4',
      'Jeremias 5-6 · 1 Timóteo 5',
      'Jeremias 7-9 · 1 Timóteo 6',
      'Jeremias 10-12 · Salmos 86-87',
      'Jeremias 13-15 · Salmos 88',
      'Jeremias 16-18 · Salmos 89',
      'Jeremias 19-21 · Salmos 90',
      'Jeremias 22-23 · Salmos 91',
      'Jeremias 24-26 · Salmos 92-93',
      'Jeremias 27-28 · Salmos 94',
      'Jeremias 29-30 · Salmos 95',
      'Jeremias 31 · Salmos 96',
    ],
    // ── SETEMBRO ── 30 dias
    9: [
      'Jeremias 32-33 · Salmos 97',
      'Jeremias 34-36 · Salmos 98',
      'Jeremias 37-39 · Salmos 99',
      'Jeremias 40-42 · Salmos 100-101',
      'Jeremias 43-44 · Provérbios 18',
      'Jeremias 45-46 · 2 Timóteo 1',
      'Jeremias 47-48 · 2 Timóteo 2',
      'Jeremias 49-50 · 2 Timóteo 3',
      'Jeremias 51-52 · 2 Timóteo 4',
      'Lamentações 1-2 · Provérbios 19',
      'Lamentações 3-5 · Tito 1',
      'Ezequiel 1-3 · Tito 2',
      'Ezequiel 4-6 · Tito 3',
      'Ezequiel 7-9 · Filemon 1',
      'Ezequiel 10-12 · Provérbios 20',
      'Ezequiel 13-14 · Hebreus 1',
      'Ezequiel 15-16 · Hebreus 2',
      'Ezequiel 17-18 · Hebreus 3',
      'Ezequiel 19-20 · Hebreus 4',
      'Ezequiel 21-22 · Hebreus 5',
      'Ezequiel 23-25 · Hebreus 6',
      'Ezequiel 26-28 · Hebreus 7',
      'Ezequiel 29-31 · Hebreus 8',
      'Ezequiel 32-33 · Hebreus 9',
      'Ezequiel 34-36 · Hebreus 10',
      'Ezequiel 37-38 · Hebreus 11',
      'Ezequiel 39-40 · Hebreus 12',
      'Ezequiel 41-43 · Hebreus 13',
      'Ezequiel 44-46 · Provérbios 21',
      'Ezequiel 47-48 · Provérbios 22',
    ],
    // ── OUTUBRO ── 31 dias
    10: [
      '1 Crônicas 1 · Provérbios 23',
      '1 Crônicas 2-3 · Tiago 1',
      '1 Crônicas 4-5 · Tiago 2',
      '1 Crônicas 6 · Tiago 3',
      '1 Crônicas 7-8 · Tiago 4',
      '1 Crônicas 9-10 · Tiago 5',
      '1 Crônicas 11-12 · Salmos 102',
      '1 Crônicas 13-14 · Salmos 103',
      '1 Crônicas 15-16 · Salmos 104',
      '1 Crônicas 17-18 · Salmos 105',
      '1 Crônicas 19-20 · Salmos 106',
      '1 Crônicas 21-22 · Salmos 107',
      '1 Crônicas 23-24 · Salmos 108',
      '1 Crônicas 25-26 · Salmos 109',
      '1 Crônicas 27-28 · Salmos 110-111',
      '1 Crônicas 29 · Salmos 112-113',
      'Provérbios 24 · Salmos 114-115',
      '2 Crônicas 1-2 · 1 Pedro 1',
      '2 Crônicas 3-5 · 1 Pedro 2',
      '2 Crônicas 6 · 1 Pedro 3',
      '2 Crônicas 7-8 · 1 Pedro 4',
      '2 Crônicas 9-10 · 1 Pedro 5',
      '2 Crônicas 11-12 · Salmos 116-117',
      '2 Crônicas 13-14 · Salmos 118',
      '2 Crônicas 15-16 · Provérbios 25',
      '2 Crônicas 17-18 · Provérbios 26',
      '2 Crônicas 19-20 · Provérbios 27',
      '2 Crônicas 21-22 · Provérbios 28',
      '2 Crônicas 23-24 · Provérbios 29',
      '2 Crônicas 25-26 · Provérbios 30',
      '2 Crônicas 27-28 · Provérbios 31',
    ],
    // ── NOVEMBRO ── 30 dias
    11: [
      'Salmos 119',
      '2 Crônicas 29-30 · Salmos 120-121',
      '2 Crônicas 31-32 · Salmos 122-123',
      '2 Crônicas 33-34 · Salmos 124-125',
      '2 Crônicas 35-36',
      'Daniel 1-2 · 2 Pedro 1',
      'Daniel 3-4 · 2 Pedro 2',
      'Daniel 5-6 · 2 Pedro 3',
      'Daniel 7-8 · Salmos 126-127',
      'Daniel 9-10 · Salmos 128-129',
      'Daniel 11-12 · Salmos 130-131',
      'Oséias 1-3 · Salmos 132',
      'Oséias 4-6 · Salmos 133',
      'Oséias 7-10 · Salmos 134',
      'Oséias 11-14 · Salmos 135',
      'Joel 1-3 · Salmos 136',
      'Amós 1-3 · Salmos 137',
      'Amós 4-6 · Salmos 138',
      'Amós 7-9 · Salmos 139',
      'Obadias 1 · Salmos 140',
      'Jonas 1-4 · Salmos 141',
      'Miquéias 1-4 · Salmos 142',
      'Miquéias 5-7 · Salmos 143',
      'Naum 1-3 · Salmos 144',
      'Habacuque 1-3 · Salmos 145',
      'Sofonias 1-3 · 1 João 1',
      'Ageu 1-2 · 1 João 2',
      'Zacarias 1-2 · 1 João 3',
      'Zacarias 3-5 · 1 João 4',
      'Zacarias 6-8 · 1 João 5',
    ],
    // ── DEZEMBRO ── 31 dias
    12: [
      'Zacarias 9-10 · Salmos 146',
      'Zacarias 11-12 · Salmos 147',
      'Zacarias 13-14 · Salmos 148',
      'Malaquias 1-2 · Salmos 149',
      'Malaquias 3-4 · Salmos 150',
      'Lucas 1',
      'Lucas 2 · 2 João 1',
      'Lucas 3 · 3 João 1',
      'Lucas 4 · Judas 1',
      'Lucas 5 · Apocalipse 1',
      'Lucas 6 · Apocalipse 2',
      'Lucas 7 · Apocalipse 3',
      'Lucas 8 · Apocalipse 4',
      'Lucas 9 · Apocalipse 5',
      'Lucas 10 · Apocalipse 6',
      'Lucas 11 · Apocalipse 7',
      'Lucas 12 · Apocalipse 8',
      'Lucas 13 · Apocalipse 9',
      'Lucas 14 · Apocalipse 10',
      'Lucas 15 · Apocalipse 11',
      'Lucas 16 · Apocalipse 12',
      'Lucas 17 · Apocalipse 13',
      'Lucas 18 · Apocalipse 14',
      'Lucas 19 · Apocalipse 15',
      'Lucas 20 · Apocalipse 16',
      'Lucas 21 · Apocalipse 17',
      'Lucas 22 · Apocalipse 18',
      'Lucas 23 · Apocalipse 19',
      'Lucas 24 · Apocalipse 20',
      'Apocalipse 21',
      'Apocalipse 22',
    ],
  },
};

export const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

export type DiaDoPlano = {
  /** Chave estável, no formato `YYYY-MM-DD`. É o que vai e volta do servidor. */
  chave: string;
  dia: number;
  mes: number;
  ano: number;
  leitura: string;
};

/**
 * Os anos que a tela deve oferecer, do mais recente para o mais antigo.
 *
 * ═══ ANO FUTURO NÃO APARECE ═══
 * É o que permite publicar o plano de 2027 em novembro de 2026 sem que ele
 * vaze na tela antes da hora. Em 1º de janeiro ele entra sozinho, e o de 2025
 * sai pela janela — sem ninguém mexer em nada na virada.
 */
export function anosDisponiveis(agora = new Date()): number[] {
  const anoAtual = agora.getFullYear();

  return Object.keys(PLANOS)
    .map(Number)
    .filter((ano) => ano <= anoAtual)
    .sort((a, b) => b - a)
    .slice(0, ANOS_VISIVEIS);
}

/**
 * O ano que a tela abre por padrão: o corrente, se houver plano para ele.
 *
 * Fora disso, o mais recente disponível — assim quem abrir o app em 2029 sem
 * plano novo cadastrado ainda vê o último que existe, em vez de tela vazia.
 */
export function anoPadrao(agora = new Date()): number | null {
  const anos = anosDisponiveis(agora);
  return anos[0] ?? null;
}

/** `2026-08-05`, com zero à esquerda — é a chave e a ordem ao mesmo tempo. */
export function chaveDoDia(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/**
 * As leituras de um mês.
 *
 * Confere a quantidade contra o calendário do ano de verdade. Um mês com
 * sobra ou falta não pode passar em silêncio: a partir do erro, TODAS as
 * leituras seguintes ficam no dia errado, e ninguém repara — só sente que o
 * plano "não bate".
 */
export function leiturasDoMes(ano: number, mes: number): DiaDoPlano[] {
  const leituras = PLANOS[ano]?.[mes] ?? [];
  const diasNoMes = new Date(ano, mes, 0).getDate();

  if (leituras.length > 0 && leituras.length !== diasNoMes) {
    console.warn(
      `[planoLeitura] ${MESES[mes - 1]} de ${ano} tem ${diasNoMes} dias, mas o plano traz ${leituras.length} leituras.`,
    );
  }

  return leituras.map((leitura, i) => ({
    chave: chaveDoDia(ano, mes, i + 1),
    dia: i + 1,
    mes,
    ano,
    leitura,
  }));
}

/** Quantas leituras o plano daquele ano tem — o denominador do progresso. */
export function totalDeLeituras(ano: number): number {
  const plano = PLANOS[ano];
  if (!plano) return 0;

  return Object.values(plano).reduce((soma, mes) => soma + mes.length, 0);
}

/**
 * A leitura de hoje, ou `null` se não houver plano para o ano corrente.
 *
 * Usa o relógio do aparelho de propósito: "hoje" aqui é o dia da PESSOA, não
 * o do servidor. Quem viaja lê a passagem do lugar onde acordou.
 */
export function leituraDeHoje(agora = new Date()): DiaDoPlano | null {
  const ano = agora.getFullYear();
  const mes = agora.getMonth() + 1;
  const dia = agora.getDate();

  const leitura = PLANOS[ano]?.[mes]?.[dia - 1];
  if (!leitura) return null;

  return { chave: chaveDoDia(ano, mes, dia), dia, mes, ano, leitura };
}
