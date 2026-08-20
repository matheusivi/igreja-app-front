import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { api } from './api';
import { Platform } from 'react-native';

export type PastaUpload =
  | 'perfis'
  | 'eventos'
  | 'conteudos'
  | 'familias'
  // Capa do topo da Home. Pasta própria porque é UMA imagem para a igreja
  // inteira — misturada às de evento, ninguém a acharia no painel depois.
  | 'hero';

export type ImagemEnviada = {
  url: string;
  publicId: string;
};

/**
 * Largura máxima depois da compressão.
 *
 * Uma foto de celular moderno sai com ~4000px e 4 MB. Nenhuma tela do app
 * mostra imagem maior que a largura do aparelho, então guardar o original só
 * queima cota do Cloudinary e deixa o upload lento no 4G da igreja.
 * 1080px cobre até capa de evento em tela cheia com folga.
 */
const LARGURA_MAXIMA = 1080;

/**
 * Foto de perfil também sobe em 1080.
 *
 * Este número era 400, com o comentário "avatares são exibidos em no máximo
 * 96px — 400px já é retina de sobra". Estava certo QUANDO foi escrito: a foto
 * de perfil só aparecia como bolinha pequena.
 *
 * Depois veio o card de aniversário, que mostra a mesma foto com 353pt de
 * largura. Num iPhone (densidade 3x) isso são 1059 pixels REAIS — a fonte de
 * 400px era ampliada 2,6 vezes, e nenhuma ampliação inventa detalhe. Era esse
 * o "borrado" que aparecia.
 *
 * A lição para depois: **teto de resolução amarrado ao uso ATUAL vira dívida
 * silenciosa.** Quando a tela muda, ninguém lembra de voltar aqui — o defeito
 * aparece como "a foto está feia", não como "o limite de upload está baixo".
 *
 * 1080 cobre o maior uso possível hoje (o card) com folga, e a entrega em
 * tamanho menor é resolvida na URL do Cloudinary (ver `imagem.ts`), não aqui.
 */
const LARGURA_MAXIMA_PERFIL = 1080;

function larguraAlvo(pasta: PastaUpload): number {
  return pasta === 'perfis' ? LARGURA_MAXIMA_PERFIL : LARGURA_MAXIMA;
}

/**
 * Distinguir "cancelou" de "sem permissão" é o que permite reagir certo a cada
 * caso: cancelar é normal e não merece aviso; permissão negada precisa de uma
 * mensagem com caminho de saída, senão o botão simplesmente não faz nada.
 */
export type ResultadoSelecao =
  | { status: 'ok'; uri: string }
  | { status: 'cancelado' }
  | { status: 'sem-permissao'; origem: 'camera' | 'galeria' };

function daPrimeiraFoto(
  resultado: ImagePicker.ImagePickerResult,
): ResultadoSelecao {
  const asset = resultado.canceled ? undefined : resultado.assets?.[0];
  return asset ? { status: 'ok', uri: asset.uri } : { status: 'cancelado' };
}


/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  O RECORTE MANUAL SÓ EXISTE NO iOS.                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * ═══ O QUE ACONTECIA NO ANDROID ═══
 * Com `allowsEditing: true`, o expo-image-picker delega o recorte para a
 * atividade de corte do SISTEMA. Em muitos aparelhos essa tela abre sem botão
 * de confirmar: a pessoa vê a imagem, mexe no enquadramento e não tem como
 * dizer "pronto". O fluxo simplesmente não termina.
 *
 * É defeito conhecido da biblioteca, reportado desde 2020 e ainda aberto
 * (expo/expo#10582 e #10583). Não é código nosso, e não há o que consertar
 * daqui — só contornar.
 *
 * ═══ POR QUE DESLIGAR NÃO CUSTA NADA ═══
 * O recorte de verdade já acontece na ENTREGA, não na escolha: `urlImagem`
 * pede ao Cloudinary `c_fill` (preenche o quadro cortando o excedente) com
 * `g_auto` (decide sozinho o que manter — na prática, o rosto).
 *
 * Ou seja, o corte manual era uma segunda chance de enquadrar, não o que faz
 * a foto caber. Sem ele no Android, a pessoa escolhe a foto e pronto; o
 * enquadramento sai igual.
 *
 * ═══ POR QUE MANTER NO iOS ═══
 * Lá a tela de corte funciona, e escolher o próprio enquadramento é melhor do
 * que deixar o automático decidir. Tirar dos dois seria pagar no iOS por um
 * problema que é só do Android.
 */
const RECORTE_MANUAL = Platform.OS === 'ios';

/**
 * Abre a galeria.
 *
 * A permissão é pedida mas NÃO bloqueia o fluxo: no iOS o seletor roda fora do
 * app (PHPicker) e a pessoa escolhe a foto sem o app nunca ganhar acesso à
 * biblioteca. O Android moderno funciona igual. Pedir antes serve só para o
 * sistema não interromper o fluxo depois da escolha.
 */
export async function escolherDaGaleria(
  quadrado = false,
): Promise<ResultadoSelecao> {
  await ImagePicker.requestMediaLibraryPermissionsAsync();

  try {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: RECORTE_MANUAL,
      // `aspect` só tem efeito quando há recorte; no Android ele é ignorado.
      aspect: quadrado ? [1, 1] : [16, 9],
      quality: 1,
    });
    return daPrimeiraFoto(resultado);
  } catch {
    // Android antigo ainda exige a permissão de leitura para abrir a galeria.
    return { status: 'sem-permissao', origem: 'galeria' };
  }
}

/**
 * Abre a câmera. Aqui a permissão é obrigatória de verdade — sem ela o sistema
 * não deixa nem abrir.
 */
export async function tirarFoto(quadrado = false): Promise<ResultadoSelecao> {
  const permissao = await ImagePicker.requestCameraPermissionsAsync();
  if (!permissao.granted) return { status: 'sem-permissao', origem: 'camera' };

  const resultado = await ImagePicker.launchCameraAsync({
    allowsEditing: RECORTE_MANUAL,
    aspect: quadrado ? [1, 1] : [16, 9],
    quality: 1,
  });

  return daPrimeiraFoto(resultado);
}

/**
 * Redimensiona e comprime antes de subir.
 *
 * Feito no aparelho de propósito: economiza banda do usuário, deixa o upload
 * bem mais rápido e evita que o servidor tenha que lidar com arquivo grande.
 */
async function comprimir(uri: string, largura: number): Promise<string> {
  const contexto = ImageManipulator.manipulate(uri);
  contexto.resize({ width: largura });

  const imagem = await contexto.renderAsync();
  const salva = await imagem.saveAsync({
    // 0,85 e não 0,75. Rosto é o conteúdo mais impiedoso para JPEG: o artefato
    // aparece justamente na pele lisa e no contorno do cabelo, que é onde o
    // olho está olhando. Os ~40% a mais de arquivo somem na entrega, porque
    // quem serve para a tela é a URL com `q_auto` do Cloudinary.
    compress: 0.85,
    format: SaveFormat.JPEG,
  });

  return salva.uri;
}

/**
 * Comprime e envia a imagem para o backend, que repassa ao Cloudinary.
 */
export async function enviarImagem(
  uri: string,
  pasta: PastaUpload,
): Promise<ImagemEnviada> {
  const uriComprimida = await comprimir(uri, larguraAlvo(pasta));

  const form = new FormData();
  form.append('imagem', {
    uri: uriComprimida,
    name: `${pasta}-${Date.now()}.jpg`,
    type: 'image/jpeg',
  } as unknown as Blob);
  form.append('pasta', pasta);

  const { data } = await api.post('/api/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    // Upload em rede lenta passa fácil dos 10s padrão do cliente.
    timeout: 60000,
  });

  return data.data as ImagemEnviada;
}
