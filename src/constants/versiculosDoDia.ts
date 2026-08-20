/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  VERSÍCULO DO DIA — lista fixa, embarcada no app.                     ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * ═══ POR QUE NÃO BUSCAR NA INTERNET ═══
 * Uma API de Bíblia resolveria a variedade e criaria dois problemas piores.
 *
 * 1. LICENÇA. O texto das traduções modernas é de editoras, e "a API me
 *    devolveu" não é autorização para redistribuir.
 * 2. O VERSÍCULO SUMIRIA SEM REDE. É a primeira coisa da Home. Depender de
 *    uma chamada externa significa Home vazia no 4G ruim.
 *
 * ═══ DUAS FONTES, NESTA ORDEM ═══
 * 1. `POR_DIA` — o calendário do ano, dia a dia, em NVI. É o que a igreja
 *    escolheu, com versículos temáticos nas datas comemorativas.
 * 2. `RESERVA` — uma lista em Almeida de domínio público que gira pelo dia do
 *    ano. Só entra em datas que o calendário não cobre.
 *
 * A reserva existe para o card nunca aparecer vazio. Sem ela, os dias fora do
 * calendário deixariam um buraco no topo da Home — e o buraco é pior que uma
 * tradução diferente por um dia.
 *
 * ⚠️  A NVI é da Biblica / Editora Vida, e o PDF de origem diz "uso devocional
 * pessoal". Um app publicado para a congregação vai além disso. Não sou
 * advogado, mas vale confirmar com a editora antes de publicar nas lojas —
 * trocar o texto depois é fácil, o pedido de remoção é que não é.
 *
 * ═══ COMO ACRESCENTAR O PRÓXIMO ANO ═══
 * As chaves são `MM-DD`, sem ano — o calendário vale para qualquer ano, e o
 * PDF de 2027 entra preenchendo as datas que hoje caem na reserva. Chave
 * repetida é erro de digitação: o TypeScript não avisa, então confira as
 * bordas ao colar (o último dia de um mês e o primeiro do seguinte).
 */

export type Versiculo = {
  /** O texto, já com a pontuação final. */
  texto: string;
  /** Livro, capítulo e verso — o que a pessoa usa para conferir na Bíblia. */
  referencia: string;
  /**
   * Data comemorativa, quando houver.
   *
   * O card troca o rótulo "Versículo do dia" por este — em 25 de dezembro
   * dizer "Natal do Senhor" é mais informativo do que repetir o óbvio.
   */
  ocasiao?: string;
};

/**
 * O calendário, por `MM-DD`.
 *
 * Sem o ano na chave de propósito: um versículo de Natal serve para todo 25
 * de dezembro. Amarrar ao ano obrigaria a refazer o arquivo todo janeiro.
 */
const POR_DIA: Record<string, Versiculo> = {

  // ── Agosto ──────────────────────────────────────────────────
  '08-13': { referencia: 'João 3:16', texto: 'Porque Deus tanto amou o mundo que deu o seu Filho Unigênito, para que todo aquele que nele crer não pereça, mas tenha a vida eterna.' },
  '08-14': { referencia: 'Salmos 23:1', texto: 'O Senhor é o meu pastor; de nada terei falta.' },
  '08-15': { referencia: 'Filipenses 4:13', texto: 'Tudo posso naquele que me fortalece.' },
  '08-16': { referencia: 'Jeremias 29:11', texto: 'Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de causar dano, planos de dar-lhes esperança e um futuro.' },
  '08-17': { referencia: 'Romanos 8:28', texto: 'Sabemos que Deus age em todas as coisas para o bem daqueles que o amam, dos que foram chamados de acordo com o seu propósito.' },
  '08-18': { referencia: 'Provérbios 3:5-6', texto: 'Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento; reconheça o Senhor em todos os seus caminhos, e ele endireitará as suas veredas.' },
  '08-19': { referencia: 'Isaías 40:31', texto: 'Mas aqueles que esperam no Senhor renovam as suas forças. Voam alto como águias; correm e não ficam exaustos, andam e não se cansam.' },
  '08-20': { referencia: 'Mateus 11:28', texto: 'Venham a mim, todos os que estão cansados e sobrecarregados, e eu lhes darei descanso.' },
  '08-21': { referencia: 'Salmos 46:1', texto: 'Deus é o nosso refúgio e a nossa fortaleza, auxílio sempre presente na adversidade.' },
  '08-22': { referencia: '2 Coríntios 5:17', texto: 'Portanto, se alguém está em Cristo, é nova criação. As coisas antigas já passaram; eis que surgiram coisas novas!' },
  '08-23': { referencia: 'Salmos 119:105', texto: 'A tua palavra é lâmpada que ilumina os meus passos e luz que clareia o meu caminho.' },
  '08-24': { referencia: 'Josué 1:9', texto: 'Não fui eu que ordenei a você? Seja forte e corajoso! Não se apavore, nem desanime, pois o Senhor, o seu Deus, estará com você por onde você andar.' },
  '08-25': { referencia: '1 Pedro 5:7', texto: 'Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês.' },
  '08-26': { referencia: 'Salmos 37:5', texto: 'Entregue o seu caminho ao Senhor; confie nele, e ele agirá.' },
  '08-27': { referencia: 'Mateus 6:33', texto: 'Busquem, pois, em primeiro lugar o Reino de Deus e a sua justiça, e todas essas coisas lhes serão acrescentadas.' },
  '08-28': { referencia: 'Hebreus 13:8', texto: 'Jesus Cristo é o mesmo ontem e hoje e para sempre.' },
  '08-29': { referencia: 'Salmos 121:1-2', texto: 'Ergo os olhos para os montes e pergunto: De onde me vem o socorro? O meu socorro vem do Senhor, que fez os céus e a terra.' },
  '08-30': { referencia: 'Isaías 41:10', texto: 'Por isso não tema, pois estou com você; não tenha medo, pois sou o seu Deus. Eu o fortalecerei e o ajudarei; eu o segurarei com a minha mão direita vitoriosa.' },
  '08-31': { referencia: 'João 14:6', texto: 'Respondeu Jesus: Eu sou o caminho, a verdade e a vida. Ninguém vem ao Pai, a não ser por mim.' },

  // ── Setembro ──────────────────────────────────────────────────
  '09-01': { referencia: 'Romanos 12:2', texto: 'Não se amoldem ao padrão deste mundo, mas transformem-se pela renovação da sua mente, para que sejam capazes de experimentar e comprovar a boa, agradável e perfeita vontade de Deus.' },
  '09-02': { referencia: 'Salmos 27:1', texto: 'O Senhor é a minha luz e a minha salvação; de quem terei temor? O Senhor é o meu forte refúgio; de quem terei medo?' },
  '09-03': { referencia: 'Filipenses 4:6-7', texto: 'Não andem ansiosos por coisa alguma, mas em tudo, pela oração e súplicas, e com ação de graças, apresentem seus pedidos a Deus. E a paz de Deus, que excede todo o entendimento, guardará o coração e a mente de vocês em Cristo Jesus.' },
  '09-04': { referencia: 'Provérbios 16:3', texto: 'Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos.' },
  '09-05': { referencia: 'Salmos 91:1-2', texto: 'Aquele que habita no esconderijo do Altíssimo e descansa à sombra do Todo-poderoso pode dizer ao Senhor: Tu és o meu refúgio e a minha fortaleza, o meu Deus, em quem confio.' },
  '09-06': { referencia: '1 Tessalonicenses 5:16-18', texto: 'Alegrem-se sempre. Orem continuamente. Deem graças em todas as circunstâncias, pois esta é a vontade de Deus para vocês em Cristo Jesus.' },
  '09-07': { referencia: 'Gálatas 5:1', texto: 'Foi para a liberdade que Cristo nos libertou. Portanto, permaneçam firmes e não se submetam novamente a um jugo de escravidão.', ocasiao: 'Independência do Brasil' },
  '09-08': { referencia: 'Efésios 2:8-9', texto: 'Pois vocês são salvos pela graça, por meio da fé, e isto não vem de vocês, é dom de Deus; não por obras, para que ninguém se glorie.' },
  '09-09': { referencia: 'Salmos 34:8', texto: 'Provem e vejam como o Senhor é bom. Como é feliz o homem que nele se refugia!' },
  '09-10': { referencia: 'Mateus 5:16', texto: 'Assim brilhe a luz de vocês diante dos homens, para que vejam as suas boas obras e glorifiquem ao Pai de vocês, que está nos céus.' },
  '09-11': { referencia: 'João 15:5', texto: 'Eu sou a videira; vocês são os ramos. Se alguém permanecer em mim e eu nele, esse dá muito fruto; pois sem mim vocês não podem fazer coisa alguma.' },
  '09-12': { referencia: 'Romanos 5:8', texto: 'Mas Deus demonstra seu amor por nós: Cristo morreu em nosso favor quando ainda éramos pecadores.' },
  '09-13': { referencia: 'Salmos 139:14', texto: 'Eu te louvo porque me fizeste de modo especial e admirável. Tuas obras são maravilhosas! Disso tenho plena certeza.' },
  '09-14': { referencia: '2 Timóteo 1:7', texto: 'Pois Deus não nos deu espírito de covardia, mas de poder, de amor e de equilíbrio.' },
  '09-15': { referencia: 'Provérbios 18:10', texto: 'O nome do Senhor é uma torre forte; os justos correm para ela e estão seguros.' },
  '09-16': { referencia: 'Salmos 103:1-2', texto: 'Bendiga o Senhor a minha alma! Bendiga o Senhor todo o meu ser! Bendiga o Senhor a minha alma! Não esqueça nenhuma de suas bênçãos!' },
  '09-17': { referencia: 'Hebreus 11:1', texto: 'Ora, a fé é a certeza daquilo que esperamos e a prova das coisas que não vemos.' },
  '09-18': { referencia: 'João 8:12', texto: 'Falando novamente ao povo, Jesus disse: Eu sou a luz do mundo. Quem me segue, nunca andará em trevas, mas terá a luz da vida.' },
  '09-19': { referencia: 'Salmos 16:11', texto: 'Tu me farás conhecer a vereda da vida; a tua presença me enche de alegria; à tua direita, delícias eternamente.' },
  '09-20': { referencia: '1 João 4:19', texto: 'Nós amamos porque ele nos amou primeiro.' },
  '09-21': { referencia: 'Mateus 28:20', texto: 'ensinando-os a obedecer a tudo o que eu lhes ordenei. E eu estarei sempre com vocês, até o fim dos tempos.' },
  '09-22': { referencia: 'Salmos 118:24', texto: 'Este é o dia que o Senhor fez; regozijemo-nos e alegremo-nos nele.' },
  '09-23': { referencia: 'Isaías 26:3', texto: 'Tu, Senhor, darás perfeita paz àquele cujo propósito está firme, porque em ti confia.' },
  '09-24': { referencia: 'Gálatas 2:20', texto: 'Fui crucificado com Cristo. Assim, já não sou eu quem vive, mas Cristo vive em mim. A vida que agora vivo no corpo, vivo-a pela fé no Filho de Deus, que me amou e se entregou por mim.' },
  '09-25': { referencia: 'Salmos 55:22', texto: 'Entregue suas preocupações ao Senhor, e ele o susterá; jamais permitirá que o justo venha a cair.' },
  '09-26': { referencia: 'Romanos 15:13', texto: 'Que o Deus da esperança os encha de toda alegria e paz, por sua confiança nele, para que vocês transbordem de esperança, pelo poder do Espírito Santo.' },
  '09-27': { referencia: 'Efésios 6:10', texto: 'Finalmente, fortaleçam-se no Senhor e no seu poderoso vigor.' },
  '09-28': { referencia: 'João 16:33', texto: 'Eu lhes disse essas coisas para que em mim vocês tenham paz. Neste mundo vocês terão aflições; contudo, tenham ânimo! Eu venci o mundo.' },
  '09-29': { referencia: 'Salmos 62:5-6', texto: 'Somente em Deus encontro paz; dele vem a minha esperança. Somente ele é a minha rocha e a minha salvação; ele é a minha fortaleza, não serei abalado.' },
  '09-30': { referencia: '1 Coríntios 13:13', texto: 'Assim, permanecem agora estes três: a fé, a esperança e o amor. O maior deles, porém, é o amor.' },

  // ── Outubro ──────────────────────────────────────────────────
  '10-01': { referencia: 'Salmos 145:18', texto: 'O Senhor está perto de todos os que o invocam, de todos os que o invocam de verdade.' },
  '10-02': { referencia: 'Mateus 22:37-39', texto: 'Respondeu Jesus: Ame o Senhor, o seu Deus de todo o seu coração, de toda a sua alma e de todo o seu entendimento. Este é o primeiro e maior mandamento. E o segundo é semelhante a ele: Ame o seu próximo como a si mesmo.' },
  '10-03': { referencia: 'Isaías 55:8-9', texto: 'Pois os meus pensamentos não são os pensamentos de vocês, nem os seus caminhos são os meus caminhos, declara o Senhor. Assim como os céus são mais altos do que a terra, também os meus caminhos são mais altos do que os seus caminhos, e os meus pensamentos, mais altos do que os seus pensamentos.' },
  '10-04': { referencia: 'Salmos 34:18', texto: 'O Senhor está perto dos que têm o coração quebrantado e salva os de espírito abatido.' },
  '10-05': { referencia: '2 Coríntios 12:9', texto: 'Mas ele me disse: Minha graça é suficiente para você, pois o meu poder se aperfeiçoa na fraqueza. Portanto, eu me gloriarei ainda mais alegremente em minhas fraquezas, para que o poder de Cristo repouse sobre mim.' },
  '10-06': { referencia: 'Salmos 100:4-5', texto: 'Entrai por suas portas com ações de graças e em seus átrios, com louvor; deem-lhe graças e bendigam o seu nome. Porque o Senhor é bom e o seu amor dura para sempre; a sua fidelidade permanece por todas as gerações.' },
  '10-07': { referencia: 'João 10:10', texto: 'O ladrão vem apenas para roubar, matar e destruir; eu vim para que tenham vida, e a tenham plenamente.' },
  '10-08': { referencia: 'Romanos 8:38-39', texto: 'Pois estou convencido de que nem morte nem vida, nem anjos nem demônios, nem o presente nem o futuro, nem quaisquer poderes, nem altura nem profundidade, nem qualquer outra coisa na criação será capaz de nos separar do amor de Deus que está em Cristo Jesus, nosso Senhor.' },
  '10-09': { referencia: 'Provérbios 4:23', texto: 'Acima de tudo, guarde o seu coração, pois dele procede a vida.' },
  '10-10': { referencia: 'Hebreus 4:16', texto: 'Portanto, aproximemo-nos do trono da graça com toda a confiança, a fim de recebermos misericórdia e encontrarmos graça que nos ajude no momento da necessidade.' },
  '10-11': { referencia: 'Salmos 23:4', texto: 'Mesmo quando eu andar por um vale de trevas e morte, não temerei perigo algum, pois tu estás comigo; a tua vara e o teu cajado me protegem.' },
  '10-12': { referencia: 'Lucas 1:46-47', texto: 'Então disse Maria: Minha alma engrandece ao Senhor e o meu espírito se alegra em Deus, meu Salvador.', ocasiao: 'Nossa Senhora Aparecida (Padroeira do Brasil)' },
  '10-13': { referencia: '1 João 1:9', texto: 'Se confessarmos os nossos pecados, ele é fiel e justo para perdoar os nossos pecados e nos purificar de toda injustiça.' },
  '10-14': { referencia: 'Mateus 7:7', texto: 'Peçam, e lhes será dado; busquem, e encontrarão; batam, e a porta lhes será aberta.' },
  '10-15': { referencia: 'Salmos 37:4', texto: 'Deleite-se no Senhor, e ele atenderá aos desejos do seu coração.' },
  '10-16': { referencia: 'Isaías 43:1-2', texto: 'Mas agora, assim diz o Senhor, aquele que o criou, ó Jacó, aquele que o formou, ó Israel: Não tema, pois eu o resgatei; eu o chamei pelo nome; você é meu. Quando você atravessar as águas, eu estarei com você; e quando atravessar os rios, eles não o encobrirão.' },
  '10-17': { referencia: 'Colossenses 3:16', texto: 'Habite ricamente em vocês a palavra de Cristo; ensinem e aconselhem-se uns aos outros com toda a sabedoria e cantem salmos, hinos e cânticos espirituais com gratidão a Deus em seu coração.' },
  '10-18': { referencia: 'Salmos 46:10', texto: 'Aquietem-se e saibam que eu sou Deus; serei exaltado entre as nações, serei exaltado na terra.' },
  '10-19': { referencia: 'João 1:12', texto: 'Contudo, aos que o receberam, aos que creram em seu nome, deu-lhes o direito de se tornarem filhos de Deus.' },
  '10-20': { referencia: 'Salmos 119:11', texto: 'Guardei no coração a tua palavra para não pecar contra ti.' },
  '10-21': { referencia: 'Efésios 3:20', texto: 'Àquele que é capaz de fazer infinitamente mais do que tudo o que pedimos ou pensamos, de acordo com o seu poder que atua em nós,' },
  '10-22': { referencia: 'Salmos 27:14', texto: 'Espere no Senhor. Seja forte! Coragem! Espere no Senhor!' },
  '10-23': { referencia: '1 Pedro 2:9', texto: 'Vocês, porém, são geração eleita, sacerdócio real, nação santa, povo exclusivo de Deus, para anunciar as grandezas daquele que os chamou das trevas para a sua maravilhosa luz.' },
  '10-24': { referencia: 'Romanos 10:9', texto: 'Se você confessar com a sua boca que Jesus é Senhor e crer em seu coração que Deus o ressuscitou dentre os mortos, será salvo.' },
  '10-25': { referencia: 'Gálatas 5:22-23', texto: 'Mas o fruto do Espírito é amor, alegria, paz, paciência, amabilidade, bondade, fidelidade, mansidão e domínio próprio. Contra essas coisas não há lei.' },
  '10-26': { referencia: 'Mateus 5:9', texto: 'Bem-aventurados os pacificadores, pois serão chamados filhos de Deus.' },
  '10-27': { referencia: 'Salmos 147:3', texto: 'Ele cura os de coração quebrantado e cuida das suas feridas.' },
  '10-28': { referencia: '2 Coríntios 4:16-18', texto: 'Por isso não desanimamos. Embora exteriormente estejamos a desgastar-nos, interiormente estamos sendo renovados dia após dia, pois os nossos sofrimentos leves e momentâneos estão produzindo para nós uma glória eterna que pesa mais do que todos eles.' },
  '10-29': { referencia: 'João 14:27', texto: 'Deixo-lhes a paz; a minha paz lhes dou. Não a dou como o mundo a dá. Não se perturbe o seu coração, nem tenham medo.' },
  '10-30': { referencia: 'Salmos 18:2', texto: 'O Senhor é a minha rocha, a minha fortaleza e o meu libertador; o meu Deus é o meu rochedo, em quem me refugio. Ele é o meu escudo e o poder que me salva, a minha torre alta.' },
  '10-31': { referencia: 'Hebreus 12:1-2', texto: 'Portanto, também nós, uma vez que estamos rodeados por tão grande nuvem de testemunhas, livremo-nos de tudo o que nos atrapalha e do pecado que nos envolve, e corramos com perseverança a corrida que nos é proposta, tendo os olhos fitos em Jesus, autor e consumador da nossa fé.' },

  // ── Novembro ──────────────────────────────────────────────────
  '11-01': { referencia: 'Apocalipse 21:4', texto: 'Ele enxugará dos seus olhos toda lágrima. Não haverá mais morte, nem tristeza, nem choro, nem dor, pois a antiga ordem já passou.' },
  '11-02': { referencia: 'João 11:25-26', texto: 'Disse-lhe Jesus: Eu sou a ressurreição e a vida. Aquele que crê em mim, ainda que morra, viverá; e quem vive e crê em mim nunca morrerá. Você crê nisso?', ocasiao: 'Dia de Finados' },
  '11-03': { referencia: '1 Coríntios 15:58', texto: 'Portanto, meus amados irmãos, mantenham-se firmes, e que nada os abale. Sejam sempre dedicados à obra do Senhor, pois vocês sabem que, no Senhor, o trabalho de vocês não será inútil.' },
  '11-04': { referencia: 'João 3:16', texto: 'Porque Deus tanto amou o mundo que deu o seu Filho Unigênito, para que todo aquele que nele crer não pereça, mas tenha a vida eterna.' },
  '11-05': { referencia: 'Salmos 23:1', texto: 'O Senhor é o meu pastor; de nada terei falta.' },
  '11-06': { referencia: 'Filipenses 4:13', texto: 'Tudo posso naquele que me fortalece.' },
  '11-07': { referencia: 'Jeremias 29:11', texto: 'Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de causar dano, planos de dar-lhes esperança e um futuro.' },
  '11-08': { referencia: 'Romanos 8:28', texto: 'Sabemos que Deus age em todas as coisas para o bem daqueles que o amam, dos que foram chamados de acordo com o seu propósito.' },
  '11-09': { referencia: 'Provérbios 3:5-6', texto: 'Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento; reconheça o Senhor em todos os seus caminhos, e ele endireitará as suas veredas.' },
  '11-10': { referencia: 'Isaías 40:31', texto: 'Mas aqueles que esperam no Senhor renovam as suas forças. Voam alto como águias; correm e não ficam exaustos, andam e não se cansam.' },
  '11-11': { referencia: 'Mateus 11:28', texto: 'Venham a mim, todos os que estão cansados e sobrecarregados, e eu lhes darei descanso.' },
  '11-12': { referencia: 'Salmos 46:1', texto: 'Deus é o nosso refúgio e a nossa fortaleza, auxílio sempre presente na adversidade.' },
  '11-13': { referencia: '2 Coríntios 5:17', texto: 'Portanto, se alguém está em Cristo, é nova criação. As coisas antigas já passaram; eis que surgiram coisas novas!' },
  '11-14': { referencia: 'Salmos 119:105', texto: 'A tua palavra é lâmpada que ilumina os meus passos e luz que clareia o meu caminho.' },
  '11-15': { referencia: 'Romanos 13:1', texto: 'Todos devem sujeitar-se às autoridades governamentais, pois não há autoridade que não venha de Deus; as autoridades que existem foram por ele estabelecidas.', ocasiao: 'Proclamação da República' },
  '11-16': { referencia: 'Josué 1:9', texto: 'Não fui eu que ordenei a você? Seja forte e corajoso! Não se apavore, nem desanime, pois o Senhor, o seu Deus, estará com você por onde você andar.' },
  '11-17': { referencia: '1 Pedro 5:7', texto: 'Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês.' },
  '11-18': { referencia: 'Salmos 37:5', texto: 'Entregue o seu caminho ao Senhor; confie nele, e ele agirá.' },
  '11-19': { referencia: 'Mateus 6:33', texto: 'Busquem, pois, em primeiro lugar o Reino de Deus e a sua justiça, e todas essas coisas lhes serão acrescentadas.' },
  '11-20': { referencia: 'Gálatas 3:28', texto: 'Não há judeu nem grego, escravo nem livre, homem nem mulher; pois todos vocês são um em Cristo Jesus.', ocasiao: 'Dia da Consciência Negra' },
  '11-21': { referencia: 'Hebreus 13:8', texto: 'Jesus Cristo é o mesmo ontem e hoje e para sempre.' },
  '11-22': { referencia: 'Salmos 121:1-2', texto: 'Ergo os olhos para os montes e pergunto: De onde me vem o socorro? O meu socorro vem do Senhor, que fez os céus e a terra.' },
  '11-23': { referencia: 'Isaías 41:10', texto: 'Por isso não tema, pois estou com você; não tenha medo, pois sou o seu Deus. Eu o fortalecerei e o ajudarei; eu o segurarei com a minha mão direita vitoriosa.' },
  '11-24': { referencia: 'João 14:6', texto: 'Respondeu Jesus: Eu sou o caminho, a verdade e a vida. Ninguém vem ao Pai, a não ser por mim.' },
  '11-25': { referencia: 'Romanos 12:2', texto: 'Não se amoldem ao padrão deste mundo, mas transformem-se pela renovação da sua mente, para que sejam capazes de experimentar e comprovar a boa, agradável e perfeita vontade de Deus.' },
  '11-26': { referencia: 'Salmos 27:1', texto: 'O Senhor é a minha luz e a minha salvação; de quem terei temor? O Senhor é o meu forte refúgio; de quem terei medo?' },
  '11-27': { referencia: 'Filipenses 4:6-7', texto: 'Não andem ansiosos por coisa alguma, mas em tudo, pela oração e súplicas, e com ação de graças, apresentem seus pedidos a Deus. E a paz de Deus, que excede todo o entendimento, guardará o coração e a mente de vocês em Cristo Jesus.' },
  '11-28': { referencia: 'Provérbios 16:3', texto: 'Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos.' },
  '11-29': { referencia: 'Salmos 91:1-2', texto: 'Aquele que habita no esconderijo do Altíssimo e descansa à sombra do Todo-poderoso pode dizer ao Senhor: Tu és o meu refúgio e a minha fortaleza, o meu Deus, em quem confio.' },
  '11-30': { referencia: '1 Tessalonicenses 5:16-18', texto: 'Alegrem-se sempre. Orem continuamente. Deem graças em todas as circunstâncias, pois esta é a vontade de Deus para vocês em Cristo Jesus.' },

  // ── Dezembro ──────────────────────────────────────────────────
  '12-01': { referencia: 'Efésios 2:8-9', texto: 'Pois vocês são salvos pela graça, por meio da fé, e isto não vem de vocês, é dom de Deus; não por obras, para que ninguém se glorie.' },
  '12-02': { referencia: 'Salmos 34:8', texto: 'Provem e vejam como o Senhor é bom. Como é feliz o homem que nele se refugia!' },
  '12-03': { referencia: 'Mateus 5:16', texto: 'Assim brilhe a luz de vocês diante dos homens, para que vejam as suas boas obras e glorifiquem ao Pai de vocês, que está nos céus.' },
  '12-04': { referencia: 'João 15:5', texto: 'Eu sou a videira; vocês são os ramos. Se alguém permanecer em mim e eu nele, esse dá muito fruto; pois sem mim vocês não podem fazer coisa alguma.' },
  '12-05': { referencia: 'Romanos 5:8', texto: 'Mas Deus demonstra seu amor por nós: Cristo morreu em nosso favor quando ainda éramos pecadores.' },
  '12-06': { referencia: 'Salmos 139:14', texto: 'Eu te louvo porque me fizeste de modo especial e admirável. Tuas obras são maravilhosas! Disso tenho plena certeza.' },
  '12-07': { referencia: '2 Timóteo 1:7', texto: 'Pois Deus não nos deu espírito de covardia, mas de poder, de amor e de equilíbrio.' },
  '12-08': { referencia: 'Provérbios 18:10', texto: 'O nome do Senhor é uma torre forte; os justos correm para ela e estão seguros.' },
  '12-09': { referencia: 'Salmos 103:1-2', texto: 'Bendiga o Senhor a minha alma! Bendiga o Senhor todo o meu ser! Bendiga o Senhor a minha alma! Não esqueça nenhuma de suas bênçãos!' },
  '12-10': { referencia: 'Hebreus 11:1', texto: 'Ora, a fé é a certeza daquilo que esperamos e a prova das coisas que não vemos.' },
  '12-11': { referencia: 'João 8:12', texto: 'Falando novamente ao povo, Jesus disse: Eu sou a luz do mundo. Quem me segue, nunca andará em trevas, mas terá a luz da vida.' },
  '12-12': { referencia: 'Salmos 16:11', texto: 'Tu me farás conhecer a vereda da vida; a tua presença me enche de alegria; à tua direita, delícias eternamente.' },
  '12-13': { referencia: '1 João 4:19', texto: 'Nós amamos porque ele nos amou primeiro.' },
  '12-14': { referencia: 'Mateus 28:20', texto: 'ensinando-os a obedecer a tudo o que eu lhes ordenei. E eu estarei sempre com vocês, até o fim dos tempos.' },
  '12-15': { referencia: 'Salmos 118:24', texto: 'Este é o dia que o Senhor fez; regozijemo-nos e alegremo-nos nele.' },
  '12-16': { referencia: 'Isaías 26:3', texto: 'Tu, Senhor, darás perfeita paz àquele cujo propósito está firme, porque em ti confia.' },
  '12-17': { referencia: 'Gálatas 2:20', texto: 'Fui crucificado com Cristo. Assim, já não sou eu quem vive, mas Cristo vive em mim. A vida que agora vivo no corpo, vivo-a pela fé no Filho de Deus, que me amou e se entregou por mim.' },
  '12-18': { referencia: 'Salmos 55:22', texto: 'Entregue suas preocupações ao Senhor, e ele o susterá; jamais permitirá que o justo venha a cair.' },
  '12-19': { referencia: 'Romanos 15:13', texto: 'Que o Deus da esperança os encha de toda alegria e paz, por sua confiança nele, para que vocês transbordem de esperança, pelo poder do Espírito Santo.' },
  '12-20': { referencia: 'Efésios 6:10', texto: 'Finalmente, fortaleçam-se no Senhor e no seu poderoso vigor.' },
  '12-21': { referencia: 'João 16:33', texto: 'Eu lhes disse essas coisas para que em mim vocês tenham paz. Neste mundo vocês terão aflições; contudo, tenham ânimo! Eu venci o mundo.' },
  '12-22': { referencia: 'Salmos 62:5-6', texto: 'Somente em Deus encontro paz; dele vem a minha esperança. Somente ele é a minha rocha e a minha salvação; ele é a minha fortaleza, não serei abalado.' },
  '12-23': { referencia: '1 Coríntios 13:13', texto: 'Assim, permanecem agora estes três: a fé, a esperança e o amor. O maior deles, porém, é o amor.' },
  '12-24': { referencia: 'Salmos 145:18', texto: 'O Senhor está perto de todos os que o invocam, de todos os que o invocam de verdade.' },
  '12-25': { referencia: 'Lucas 2:11', texto: 'Hoje, na cidade de Davi, lhes nasceu o Salvador, que é Cristo, o Senhor.', ocasiao: 'Natal do Senhor' },
  '12-26': { referencia: 'Mateus 22:37-39', texto: 'Respondeu Jesus: Ame o Senhor, o seu Deus de todo o seu coração, de toda a sua alma e de todo o seu entendimento. Este é o primeiro e maior mandamento. E o segundo é semelhante a ele: Ame o seu próximo como a si mesmo.' },
  '12-27': { referencia: 'Isaías 55:8-9', texto: 'Pois os meus pensamentos não são os pensamentos de vocês, nem os seus caminhos são os meus caminhos, declara o Senhor. Assim como os céus são mais altos do que a terra, também os meus caminhos são mais altos do que os seus caminhos, e os meus pensamentos, mais altos do que os seus pensamentos.' },
  '12-28': { referencia: 'Salmos 34:18', texto: 'O Senhor está perto dos que têm o coração quebrantado e salva os de espírito abatido.' },
  '12-29': { referencia: '2 Coríntios 12:9', texto: 'Mas ele me disse: Minha graça é suficiente para você, pois o meu poder se aperfeiçoa na fraqueza. Portanto, eu me gloriarei ainda mais alegremente em minhas fraquezas, para que o poder de Cristo repouse sobre mim.' },
  '12-30': { referencia: 'Salmos 100:4-5', texto: 'Entrai por suas portas com ações de graças e em seus átrios, com louvor; deem-lhe graças e bendigam o seu nome. Porque o Senhor é bom e o seu amor dura para sempre; a sua fidelidade permanece por todas as gerações.' },
  '12-31': { referencia: 'Lamentações 3:22-23', texto: 'As misericórdias do Senhor são a razão de não sermos consumidos, pois as suas misericórdias não têm fim; renovam-se cada manhã. Grande é a sua fidelidade!', ocasiao: 'Véspera de Ano Novo' },
};

/**
 * Reserva, em Almeida de domínio público.
 *
 * Só é usada nos dias que `POR_DIA` ainda não cobre. Conforme os calendários
 * dos próximos anos forem entrando, ela vai sendo cada vez menos acionada —
 * mas fica, porque garante que o card nunca apareça vazio.
 */
const RESERVA: Versiculo[] = [
  { texto: 'No princípio criou Deus os céus e a terra.', referencia: 'Gênesis 1:1' },
  { texto: 'O Senhor é o meu pastor; nada me faltará.', referencia: 'Salmos 23:1' },
  { texto: 'Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.', referencia: 'Salmos 46:1' },
  { texto: 'Aquietai-vos, e sabei que eu sou Deus.', referencia: 'Salmos 46:10' },
  { texto: 'Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.', referencia: 'Salmos 119:105' },
  { texto: 'Esta é a palavra que o Senhor fez; regozijemo-nos, e alegremo-nos nela.', referencia: 'Salmos 118:24' },
  { texto: 'Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento.', referencia: 'Provérbios 3:5' },
  { texto: 'Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.', referencia: 'Provérbios 3:6' },
  { texto: 'O temor do Senhor é o princípio da sabedoria.', referencia: 'Provérbios 9:10' },
  { texto: 'A resposta branda desvia o furor, mas a palavra dura suscita a ira.', referencia: 'Provérbios 15:1' },
  { texto: 'Melhor é o fim das coisas do que o princípio delas.', referencia: 'Eclesiastes 7:8' },
  { texto: 'Tudo tem o seu tempo determinado, e há tempo para todo o propósito debaixo do céu.', referencia: 'Eclesiastes 3:1' },
  { texto: 'Mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias.', referencia: 'Isaías 40:31' },
  { texto: 'Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus.', referencia: 'Isaías 41:10' },
  { texto: 'Ainda que passes pelas águas, estarei contigo, e ainda que pelos rios, eles não te submergirão.', referencia: 'Isaías 43:2' },
  { texto: 'Eis que faço uma coisa nova; agora sairá à luz; porventura não a sabereis?', referencia: 'Isaías 43:19' },
  { texto: 'Buscai ao Senhor enquanto se pode achar, invocai-o enquanto está perto.', referencia: 'Isaías 55:6' },
  { texto: 'Porque eu bem sei os pensamentos que penso de vós, pensamentos de paz e não de mal.', referencia: 'Jeremias 29:11' },
  { texto: 'Clama a mim, e responder-te-ei, e anunciar-te-ei coisas grandes e firmes que não sabes.', referencia: 'Jeremias 33:3' },
  { texto: 'As misericórdias do Senhor são a causa de não sermos consumidos; renovam-se cada manhã.', referencia: 'Lamentações 3:22-23' },
  { texto: 'Bem-aventurados os limpos de coração, porque eles verão a Deus.', referencia: 'Mateus 5:8' },
  { texto: 'Vós sois a luz do mundo; não se pode esconder uma cidade edificada sobre um monte.', referencia: 'Mateus 5:14' },
  { texto: 'Mas buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.', referencia: 'Mateus 6:33' },
  { texto: 'Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.', referencia: 'Mateus 11:28' },
  { texto: 'Porque onde estiverem dois ou três reunidos em meu nome, aí estou eu no meio deles.', referencia: 'Mateus 18:20' },
  { texto: 'O céu e a terra passarão, mas as minhas palavras não hão de passar.', referencia: 'Mateus 24:35' },
  { texto: 'Eis que estou convosco todos os dias, até à consumação dos séculos.', referencia: 'Mateus 28:20' },
  { texto: 'Porque, que aproveitaria ao homem ganhar todo o mundo e perder a sua alma?', referencia: 'Marcos 8:36' },
  { texto: 'Tudo é possível ao que crê.', referencia: 'Marcos 9:23' },
  { texto: 'Porque para Deus nada é impossível.', referencia: 'Lucas 1:37' },
  { texto: 'Dai, e ser-vos-á dado; boa medida, recalcada, sacudida e transbordando.', referencia: 'Lucas 6:38' },
  { texto: 'No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.', referencia: 'João 1:1' },
  { texto: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.', referencia: 'João 3:16' },
  { texto: 'Eu sou o pão da vida; aquele que vem a mim não terá fome.', referencia: 'João 6:35' },
  { texto: 'E conhecereis a verdade, e a verdade vos libertará.', referencia: 'João 8:32' },
  { texto: 'Eu sou o bom pastor; o bom pastor dá a sua vida pelas ovelhas.', referencia: 'João 10:11' },
  { texto: 'Eu sou o caminho, e a verdade, e a vida; ninguém vem ao Pai senão por mim.', referencia: 'João 14:6' },
  { texto: 'Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá.', referencia: 'João 14:27' },
  { texto: 'Eu sou a videira, vós as varas; quem está em mim, e eu nele, esse dá muito fruto.', referencia: 'João 15:5' },
  { texto: 'No mundo tereis aflições, mas tende bom ânimo; eu venci o mundo.', referencia: 'João 16:33' },
  { texto: 'Recebereis a virtude do Espírito Santo, que há de vir sobre vós.', referencia: 'Atos 1:8' },
  { texto: 'Crê no Senhor Jesus Cristo e serás salvo, tu e a tua casa.', referencia: 'Atos 16:31' },
  { texto: 'Sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.', referencia: 'Romanos 8:28' },
  { texto: 'Se Deus é por nós, quem será contra nós?', referencia: 'Romanos 8:31' },
  { texto: 'Nem a morte, nem a vida poderá separar-nos do amor de Deus, que está em Cristo Jesus.', referencia: 'Romanos 8:38-39' },
  { texto: 'Não vos conformeis com este mundo, mas transformai-vos pela renovação do vosso entendimento.', referencia: 'Romanos 12:2' },
  { texto: 'A fé é pelo ouvir, e o ouvir pela palavra de Deus.', referencia: 'Romanos 10:17' },
  { texto: 'O amor é sofredor, é benigno; o amor não é invejoso.', referencia: '1 Coríntios 13:4' },
  { texto: 'Agora, pois, permanecem a fé, a esperança e o amor; mas o maior destes é o amor.', referencia: '1 Coríntios 13:13' },
  { texto: 'Assim que, se alguém está em Cristo, nova criatura é; as coisas velhas já passaram.', referencia: '2 Coríntios 5:17' },
  { texto: 'A minha graça te basta, porque o meu poder se aperfeiçoa na fraqueza.', referencia: '2 Coríntios 12:9' },
  { texto: 'Já estou crucificado com Cristo; e vivo, não mais eu, mas Cristo vive em mim.', referencia: 'Gálatas 2:20' },
  { texto: 'Mas o fruto do Espírito é: amor, gozo, paz, longanimidade, benignidade.', referencia: 'Gálatas 5:22' },
  { texto: 'E não nos cansemos de fazer o bem, porque a seu tempo ceifaremos, se não houvermos desfalecido.', referencia: 'Gálatas 6:9' },
  { texto: 'Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus.', referencia: 'Efésios 2:8' },
  { texto: 'Revesti-vos de toda a armadura de Deus, para que possais estar firmes.', referencia: 'Efésios 6:11' },
  { texto: 'Posso todas as coisas naquele que me fortalece.', referencia: 'Filipenses 4:13' },
  { texto: 'Não estejais inquietos por coisa alguma; antes, as vossas petições sejam conhecidas diante de Deus.', referencia: 'Filipenses 4:6' },
  { texto: 'E a paz de Deus, que excede todo o entendimento, guardará os vossos corações.', referencia: 'Filipenses 4:7' },
  { texto: 'E tudo quanto fizerdes, fazei-o de todo o coração, como ao Senhor.', referencia: 'Colossenses 3:23' },
  { texto: 'Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco.', referencia: '1 Tessalonicenses 5:18' },
  { texto: 'Porque Deus não nos deu o espírito de temor, mas de fortaleza, e de amor, e de moderação.', referencia: '2 Timóteo 1:7' },
  { texto: 'Toda a Escritura é divinamente inspirada e proveitosa para ensinar.', referencia: '2 Timóteo 3:16' },
  { texto: 'Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das que se não veem.', referencia: 'Hebreus 11:1' },
  { texto: 'Jesus Cristo é o mesmo ontem, e hoje, e eternamente.', referencia: 'Hebreus 13:8' },
  { texto: 'E, se algum de vós tem falta de sabedoria, peça-a a Deus, que a todos dá liberalmente.', referencia: 'Tiago 1:5' },
  { texto: 'Sede cumpridores da palavra, e não somente ouvintes, enganando-vos a vós mesmos.', referencia: 'Tiago 1:22' },
  { texto: 'Chegai-vos a Deus, e ele se chegará a vós.', referencia: 'Tiago 4:8' },
  { texto: 'Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.', referencia: '1 Pedro 5:7' },
  { texto: 'Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar.', referencia: '1 João 1:9' },
  { texto: 'Maior é o que está em vós do que o que está no mundo.', referencia: '1 João 4:4' },
  { texto: 'Nisto conhecemos o amor: que ele deu a sua vida por nós.', referencia: '1 João 3:16' },
  { texto: 'No amor não há temor; antes o perfeito amor lança fora o temor.', referencia: '1 João 4:18' },
  { texto: 'Eis que estou à porta e bato; se alguém ouvir a minha voz e abrir a porta, entrarei.', referencia: 'Apocalipse 3:20' },
  { texto: 'E Deus limpará de seus olhos toda a lágrima.', referencia: 'Apocalipse 21:4' },
  { texto: 'Sê forte e corajoso; não temas, nem te espantes, porque o Senhor teu Deus é contigo.', referencia: 'Josué 1:9' },
  { texto: 'Eu e a minha casa serviremos ao Senhor.', referencia: 'Josué 24:15' },
  { texto: 'O Senhor não vê como vê o homem; o homem vê o que está diante dos olhos, mas o Senhor olha para o coração.', referencia: '1 Samuel 16:7' },
  { texto: 'O Senhor é a minha rocha, e o meu lugar forte, e o meu libertador.', referencia: 'Salmos 18:2' },
  { texto: 'Deleita-te também no Senhor, e ele te concederá os desejos do teu coração.', referencia: 'Salmos 37:4' },
  { texto: 'Entrega o teu caminho ao Senhor; confia nele, e ele o fará.', referencia: 'Salmos 37:5' },
  { texto: 'Cria em mim, ó Deus, um coração puro, e renova em mim um espírito reto.', referencia: 'Salmos 51:10' },
  { texto: 'Bendize, ó minha alma, ao Senhor, e não te esqueças de nenhum de seus benefícios.', referencia: 'Salmos 103:2' },
  { texto: 'Se o Senhor não edificar a casa, em vão trabalham os que a edificam.', referencia: 'Salmos 127:1' },
  { texto: 'Eu te louvarei, porque de um modo assombroso e tão maravilhoso fui feito.', referencia: 'Salmos 139:14' },
  { texto: 'Perto está o Senhor de todos os que o invocam, de todos os que o invocam em verdade.', referencia: 'Salmos 145:18' },
  { texto: 'Ensina a criança no caminho em que deve andar, e até quando envelhecer não se desviará dele.', referencia: 'Provérbios 22:6' },
  { texto: 'O nome do Senhor é torre forte; para ela corre o justo, e está seguro.', referencia: 'Provérbios 18:10' },
  { texto: 'Como o ferro com o ferro se afia, assim o homem afia o rosto do seu amigo.', referencia: 'Provérbios 27:17' },
  { texto: 'Que é o que o Senhor pede de ti, senão que pratiques a justiça, e ames a beneficência, e andes humildemente com o teu Deus?', referencia: 'Miquéias 6:8' },
  { texto: 'Não por força nem por violência, mas pelo meu Espírito, diz o Senhor dos Exércitos.', referencia: 'Zacarias 4:6' },
  { texto: 'Trazei todos os dízimos à casa do tesouro, e provai-me nisto, diz o Senhor.', referencia: 'Malaquias 3:10' },
];

/**
 * O dia do ano, de 1 a 366.
 *
 * Calculado por diferença entre duas datas do MESMO fuso — o do aparelho.
 * Somar milissegundos de fusos diferentes é o erro clássico aqui, e ele só
 * aparece em quem viaja ou em horário de verão.
 */
function diaDoAno(data: Date): number {
  const inicio = new Date(data.getFullYear(), 0, 1);
  const hoje = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  return Math.floor((hoje.getTime() - inicio.getTime()) / 86_400_000) + 1;
}

/** `08-12` — a chave do calendário, sem ano. */
function chaveDoCalendario(agora: Date): string {
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${mes}-${dia}`;
}

/**
 * O versículo de um dia. O mesmo dia devolve sempre o mesmo versículo.
 *
 * ═══ POR QUE NÃO SORTEAR ═══
 * `Math.random()` daria um versículo diferente a cada vez que a Home fosse
 * aberta — e a promessa aqui é "o versículo DE HOJE", uma coisa só, que a
 * pessoa pode comentar com alguém. Sorteio também quebraria o botão de
 * fechar: reabrir traria outro texto, e o que foi dispensado voltaria com
 * outra roupa.
 *
 * O calendário responde primeiro; a reserva só entra no que sobrar, indexada
 * pelo dia do ano — determinística, sem estado guardado, igual para a igreja
 * inteira no mesmo dia.
 */
export function versiculoDoDia(agora = new Date()): Versiculo {
  const doCalendario = POR_DIA[chaveDoCalendario(agora)];
  if (doCalendario) return doCalendario;

  return RESERVA[(diaDoAno(agora) - 1) % RESERVA.length]!;
}

/** `2026-08-12` no fuso do aparelho — a chave de "já dispensei hoje". */
export function chaveDeHoje(agora = new Date()): string {
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

/** Quantos dias o calendário cobre. Usado só em verificação. */
export const DIAS_NO_CALENDARIO = Object.keys(POR_DIA).length;
